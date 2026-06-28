from __future__ import annotations

import time
from datetime import UTC, datetime

# 주제별 추론 결과 캐시. 배너는 자주 안 바뀌어도 되므로 일정 시간 재사용한다.
_CACHE_TTL_SECONDS = 60 * 60
_theme_cache: dict[str, object] = {"at": 0.0, "rankings": None}
# 배너 섹션(예측='곧 뜰' + 인기='요즘 뜨는') 캐시. 학습이 끼어 즉석 계산이 느려 캐시한다.
_banner_cache: dict[str, object] = {"at": 0.0, "data": None}


def _attach_names(
    rankings: dict[str, list[dict[str, object]]], names: dict[str, str]
) -> dict[str, list[dict[str, object]]]:
    for picks in rankings.values():
        for pick in picks:
            pick["area_name"] = names.get(str(pick["area_code"]), str(pick["area_code"]))
    return rankings


def _compute_banner_sections(data_mode: str) -> dict[str, dict[str, list[dict[str, object]]]]:
    """검증 모델 예측 랭킹과 실측 인기 집계로 배너 섹션을 새로 계산한다."""
    return build_banner_sections_from_rankings(data_mode, compute_theme_rankings(data_mode))


def build_banner_sections_from_rankings(
    data_mode: str, rankings: dict[str, list[dict[str, object]]]
) -> dict[str, dict[str, list[dict[str, object]]]]:
    """예측 랭킹과 실측 인기 집계를 API 스냅샷 shape로 묶는다."""
    from app.models.commercial_trend.features import load_hdong_names
    from app.models.commercial_trend.popularity import compute_popularity

    names = load_hdong_names(data_mode)
    return {
        "forecast": _attach_names(rankings, names),
        "popular": _attach_names(compute_popularity(data_mode), names),
    }


def get_banner_sections(data_mode: str = "db", use_cache: bool = True) -> dict[str, dict[str, list[dict[str, object]]]]:
    """배너용 두 섹션을 함께 만든다.

    - forecast: 학습 완료 LightGBM 모델의 세그먼트별 예측 랭킹.
    - popular: 최근 상업시간대 실측 규모 기준 '지금 인기 상권'(모델 아님, 서술).
    학습이 끼어 즉석 계산이 느리므로 결과를 일정 시간 캐시한다.
    """
    now = time.time()
    if use_cache and _banner_cache["data"] is not None and now - float(_banner_cache["at"]) < _CACHE_TTL_SECONDS:
        return _banner_cache["data"]  # type: ignore[return-value]

    from app.core.config import settings

    data = None
    if data_mode == "db" and settings.serve_banner_snapshot_from_db:
        from app.trend.repository import load_latest_banner_snapshot

        data = load_latest_banner_snapshot()
    if data is None and (settings.allow_runtime_banner_compute or data_mode != "db"):
        data = _compute_banner_sections(data_mode)
    if data is None:
        data = {"forecast": {}, "popular": {}}
    _banner_cache["data"] = data
    _banner_cache["at"] = now
    return data


def refresh_banner_sections(data_mode: str = "db") -> dict[str, dict[str, list[dict[str, object]]]]:
    """원천 데이터가 있는 환경에서 배너 섹션을 재계산하고 결과 스냅샷으로 저장한다."""
    data = _compute_banner_sections(data_mode)
    if data_mode == "db":
        from app.trend.repository import save_banner_snapshot

        save_banner_snapshot(data, datetime.now(UTC), data_mode)
    _banner_cache["data"] = data
    _banner_cache["at"] = time.time()
    return data


def require_model_artifacts() -> dict[str, object]:
    """배치/배너 예측 전에 학습 완료 forward-slope 모델과 메타 스키마를 확인한다."""
    from app.models.commercial_trend.forecast_predict import require_forecast_artifacts

    return require_forecast_artifacts()


def compute_theme_rankings(data_mode: str) -> dict[str, list[dict[str, object]]]:
    """검증된 forward-slope 모델로 세그먼트별 '곧 뜰 동네' 예측 랭킹을 만든다."""
    require_model_artifacts()
    from app.models.commercial_trend.features import load_hdong_names
    from app.models.commercial_trend.forecast_predict import compute_forecast_rankings

    names = load_hdong_names(data_mode)
    return _attach_names(compute_forecast_rankings(data_mode), names)


def refresh_theme_rankings(data_mode: str = "sample") -> dict[str, list[dict[str, object]]]:
    """주제별 예측을 다시 계산한다. db 모드면 trend_score에 저장한다(배치/최초 채움용)."""
    rankings = compute_theme_rankings(data_mode)
    if data_mode == "db":
        from app.models.commercial_trend.features import latest_source_stat_date
        from app.trend.repository import save_theme_scores

        save_theme_scores(rankings, datetime.now(UTC), latest_source_stat_date(data_mode))
    _theme_cache["rankings"] = rankings
    _theme_cache["at"] = time.time()
    return rankings


def get_theme_rankings(data_mode: str = "sample", use_cache: bool = True) -> dict[str, list[dict[str, object]]]:
    """주제별 예측 랭킹. db 모드는 배치가 저장한 최신 결과를 읽고, 비적재 모드는 즉석 계산한다."""
    now = time.time()
    if use_cache and _theme_cache["rankings"] is not None and now - float(_theme_cache["at"]) < _CACHE_TTL_SECONDS:
        return _theme_cache["rankings"]  # type: ignore[return-value]

    if data_mode == "db":
        from app.trend.repository import load_latest_theme_scores

        rankings = load_latest_theme_scores()
    else:
        rankings = compute_theme_rankings(data_mode)

    _theme_cache["rankings"] = rankings
    _theme_cache["at"] = now
    return rankings


def evaluation_payload() -> dict[str, object]:
    """헬스체크용 모델 적재 상태.

    banner_forecast는 DB 스냅샷 상태이고, model은 배치 예측에 쓰는 학습 완료 모델 상태다.
    """
    snapshot: dict[str, object]
    try:
        from app.trend.repository import latest_banner_snapshot_run_at

        snapshot_at = latest_banner_snapshot_run_at()
        snapshot = {
            "available": snapshot_at is not None,
            "run_at": None if snapshot_at is None else snapshot_at.isoformat(),
        }
    except Exception as exc:  # noqa: BLE001
        snapshot = {"available": False, "error": exc.__class__.__name__}

    payload: dict[str, object] = {
        "banner_forecast": {
            "model_id": "commercial-trend-forecast",
            "loaded": True,
            "snapshot": snapshot,
            "source": "trend_banner_snapshot",
        }
    }
    import json

    from app.models.commercial_trend.paths import forecast_meta_file

    meta_path = forecast_meta_file()
    if not meta_path.exists():
        payload["model"] = {"model_id": "commercial-trend-forecast", "loaded": False}
        return payload
    meta = json.loads(meta_path.read_text(encoding="utf-8"))
    payload["model"] = {
        "model_id": meta.get("model_id"),
        "loaded": True,
        "target": meta.get("target"),
        "feature_names": meta.get("feature_names"),
        "forward_weeks": meta.get("forward_weeks"),
        "validation": meta.get("validation"),
        "trained_at": meta.get("trained_at"),
    }
    return payload
