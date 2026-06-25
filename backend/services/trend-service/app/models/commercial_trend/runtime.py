from __future__ import annotations

import time
from datetime import UTC, datetime

from app.models.commercial_trend.features import FEATURE_NAMES, MODEL_FILE, THEME_CODES
from app.models.commercial_trend.predict import load_meta
from app.models.commercial_trend.train import train

# 주제별 추론 결과 캐시. 배너는 자주 안 바뀌어도 되므로 일정 시간 재사용한다.
_CACHE_TTL_SECONDS = 60 * 60
_theme_cache: dict[str, object] = {"at": 0.0, "rankings": None}
# 배너 섹션(예측='곧 뜰' + 인기='요즘 뜨는') 캐시. 학습이 끼어 즉석 계산이 느려 캐시한다.
_banner_cache: dict[str, object] = {"at": 0.0, "data": None}


def _attach_names(rankings: dict[str, list[dict[str, object]]], names: dict[str, str]) -> dict[str, list[dict[str, object]]]:
    for picks in rankings.values():
        for pick in picks:
            pick["area_name"] = names.get(str(pick["area_code"]), str(pick["area_code"]))
    return rankings


def get_banner_sections(data_mode: str = "db", use_cache: bool = True) -> dict[str, dict[str, list[dict[str, object]]]]:
    """배너용 두 섹션을 함께 만든다.

    - forecast: 검증된 주별 forward-slope 모델의 '곧 뜰 동네(다음 8주)' 예측.
    - popular: 최근 실측 증가 기준 '요즘 뜨는 동네'(모델 아님, 서술).
    학습이 끼어 즉석 계산이 느리므로 결과를 일정 시간 캐시한다.
    """
    now = time.time()
    if use_cache and _banner_cache["data"] is not None and now - float(_banner_cache["at"]) < _CACHE_TTL_SECONDS:
        return _banner_cache["data"]  # type: ignore[return-value]

    from app.models.commercial_trend.features import load_hdong_names
    from app.models.commercial_trend.popularity import compute_popularity
    from app.models.commercial_trend.weekly_forecast import compute_forecast_rankings

    names = load_hdong_names(data_mode)
    data = {
        "forecast": _attach_names(compute_forecast_rankings(data_mode), names),
        "popular": _attach_names(compute_popularity(data_mode), names),
    }
    _banner_cache["data"] = data
    _banner_cache["at"] = now
    return data


def ensure_model(data_mode: str = "sample") -> None:
    """부스터가 없거나 피처 스키마가 바뀌었으면 학습한다. 서비스 부팅 시 호출한다."""
    if not MODEL_FILE.exists():
        train(data_mode)
        return
    try:
        meta = load_meta()
    except FileNotFoundError:
        train(data_mode)
        return
    if meta.get("feature_names") != FEATURE_NAMES or meta.get("theme_codes") != THEME_CODES:
        train(data_mode)


def _compute_theme_rankings(data_mode: str) -> dict[str, list[dict[str, object]]]:
    """CSV 한 번 읽어 통합/남성/여성/20·30대 세그먼트별 예측 랭킹을 만든다."""
    ensure_model(data_mode)
    from app.models.commercial_trend.features import load_hdong_names, load_segment_dailies
    from app.models.commercial_trend.predict import predict_trend_scores_for

    names = load_hdong_names(data_mode)
    dailies = load_segment_dailies(data_mode)
    return {segment: predict_trend_scores_for(daily, names, segment) for segment, daily in dailies.items()}


def refresh_theme_rankings(data_mode: str = "sample") -> dict[str, list[dict[str, object]]]:
    """주제별 예측을 다시 계산한다. db 모드면 trend_score에 저장한다(배치/최초 채움용)."""
    rankings = _compute_theme_rankings(data_mode)
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
        if not rankings:  # 최초 부팅 등 비어 있으면 계산+저장
            rankings = refresh_theme_rankings(data_mode)
    else:
        rankings = _compute_theme_rankings(data_mode)

    _theme_cache["rankings"] = rankings
    _theme_cache["at"] = now
    return rankings


def evaluation_payload() -> dict[str, object]:
    """헬스체크용 모델 적재 상태."""
    if not MODEL_FILE.exists():
        return {"model_id": "commercial-trend-lgbm", "loaded": False}
    meta = load_meta()
    return {
        "model_id": meta.get("model_id"),
        "loaded": True,
        "n_samples": meta.get("n_samples"),
        "validation": meta.get("validation"),
        "trained_at": meta.get("trained_at"),
    }
