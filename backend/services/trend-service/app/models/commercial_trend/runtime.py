from __future__ import annotations

import time
from datetime import datetime, timezone

from app.models.commercial_trend.features import MODEL_FILE
from app.models.commercial_trend.predict import load_meta, predict_trend_scores
from app.models.commercial_trend.train import train

# 추론 결과 캐시. 배너는 자주 안 바뀌어도 되므로 일정 시간 재사용한다.
_CACHE_TTL_SECONDS = 60 * 60
_cache: dict[str, object] = {"at": 0.0, "ranking": None}
_theme_cache: dict[str, object] = {"at": 0.0, "rankings": None}


def ensure_model(data_mode: str = "sample") -> None:
    """부스터가 없으면 학습한다. 서비스 부팅 시 호출한다."""
    if not MODEL_FILE.exists():
        train(data_mode)


def refresh_ranking(data_mode: str = "sample") -> list[dict[str, object]]:
    """예측을 다시 계산한다. db 모드면 결과를 trend_score에 저장한다(배치/최초 채움용)."""
    ensure_model(data_mode)
    ranking = predict_trend_scores(data_mode)
    if data_mode == "db":
        from app.trend.repository import latest_stat_date, save_trend_scores

        save_trend_scores(ranking, datetime.now(timezone.utc), latest_stat_date())
    _cache["ranking"] = ranking
    _cache["at"] = time.time()
    return ranking


def get_trend_ranking(data_mode: str = "sample", use_cache: bool = True) -> list[dict[str, object]]:
    now = time.time()
    if use_cache and _cache["ranking"] is not None and now - float(_cache["at"]) < _CACHE_TTL_SECONDS:
        return _cache["ranking"]  # type: ignore[return-value]

    if data_mode == "db":
        # 적재 모드: 배치가 저장해 둔 최신 결과를 읽는다. 비어 있으면(최초) 계산+저장.
        from app.trend.repository import load_latest_trend_scores

        ranking = load_latest_trend_scores()
        if not ranking:
            ranking = refresh_ranking(data_mode)
    else:
        # 비적재 모드: DB가 없으므로 즉석 계산.
        ensure_model(data_mode)
        ranking = predict_trend_scores(data_mode)

    _cache["ranking"] = ranking
    _cache["at"] = now
    return ranking


def get_theme_rankings(data_mode: str = "sample", use_cache: bool = True) -> dict[str, list[dict[str, object]]]:
    """주제(세그먼트)별 예측 랭킹. CSV 한 번 읽어 전체/남성/여성/청년을 함께 계산하고 캐시한다."""
    now = time.time()
    if use_cache and _theme_cache["rankings"] is not None and now - float(_theme_cache["at"]) < _CACHE_TTL_SECONDS:
        return _theme_cache["rankings"]  # type: ignore[return-value]

    ensure_model(data_mode)
    from app.models.commercial_trend.features import load_hdong_names, load_segment_dailies
    from app.models.commercial_trend.predict import predict_trend_scores_for

    names = load_hdong_names(data_mode)
    dailies = load_segment_dailies(data_mode)
    rankings = {segment: predict_trend_scores_for(daily, names) for segment, daily in dailies.items()}

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
