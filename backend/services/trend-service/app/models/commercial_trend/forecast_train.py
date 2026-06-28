"""forward-slope 예측 모델 오프라인 학습. 세그먼트별 부스터 + 공통 메타를 저장한다.

API 서버와 배치 예측은 이 모듈을 호출하지 않는다(학습/추론 분리). 데이터가 월 단위라
새 달치 CSV를 넣은 뒤에만 1회 학습한다:
    docker exec trend-service python -m app.models.commercial_trend.forecast_train --data-mode db
"""

from __future__ import annotations

import argparse
import json
from datetime import UTC, datetime
from pathlib import Path

import numpy as np

from app.models.commercial_trend.forecast_features import (
    FORECAST_FEATURES,
    FORWARD_WEEKS,
    SCALE_FILTER_Q,
    TREND_WEEKS,
    build_panels,
    build_segment_samples,
    enough_history,
)
from app.models.commercial_trend.paths import forecast_meta_file, forecast_model_file

_LGB_PARAMS: dict[str, object] = {
    "objective": "regression",
    "metric": "l2",
    "num_leaves": 15,
    "learning_rate": 0.05,
    "min_child_samples": 20,
    "feature_fraction": 0.8,
    "bagging_fraction": 0.8,
    "bagging_freq": 1,
    "verbosity": -1,
}
_NUM_BOOST_ROUND = 200
# 검증용 시간순 홀드아웃 비율(마지막 결정주들). 게이트(rank_ic) 계산에만 쓴다.
_VALID_FRACTION = 0.2


def _spearman(pred: np.ndarray, target: np.ndarray) -> float:
    """순위상관(Spearman). 라벨이 결정주별 횡단면 z라 풀링해도 무방하다."""
    if len(pred) < 3:
        return 0.0
    pr = np.argsort(np.argsort(pred))
    tr = np.argsort(np.argsort(target))
    if np.std(pr) == 0 or np.std(tr) == 0:
        return 0.0
    return float(np.corrcoef(pr, tr)[0, 1])


def _holdout_rank_ic(x: np.ndarray, y: np.ndarray, weeks: np.ndarray) -> float | None:
    """마지막 결정주들을 떼어 학습→검증 순위상관(rank IC)을 잰다. 표본 부족 시 None."""
    import lightgbm as lgb

    unique_weeks = np.unique(weeks)
    if len(unique_weeks) < 5:
        return None
    n_valid = max(1, int(len(unique_weeks) * _VALID_FRACTION))
    valid_weeks = set(unique_weeks[-n_valid:].tolist())
    valid_mask = np.array([w in valid_weeks for w in weeks])
    train_mask = ~valid_mask
    if not train_mask.any() or not valid_mask.any():
        return None
    booster = lgb.train(
        _LGB_PARAMS,
        lgb.Dataset(x[train_mask], label=y[train_mask], feature_name=FORECAST_FEATURES),
        num_boost_round=_NUM_BOOST_ROUND,
        callbacks=[lgb.log_evaluation(period=0)],
    )
    pred = np.asarray(booster.predict(x[valid_mask]), dtype=float)
    return _spearman(pred, y[valid_mask])


def train_forecast(data_mode: str = "db", suffix: str = "") -> dict[str, object]:
    """세그먼트별 forward-slope 부스터를 학습·저장하고 메타를 반환한다.

    suffix를 주면 챌린저 임시 경로(forecast_{segment}{suffix}.lgb)로 저장한다.
    """
    import lightgbm as lgb

    panels = build_panels(data_mode)
    segments_meta: dict[str, dict[str, object]] = {}
    rank_ics: list[float] = []

    for segment, (weekly, ratio) in panels.items():
        if not enough_history(weekly, segment):
            segments_meta[segment] = {"trained": False, "reason": "데이터 주 수 부족"}
            continue
        x, y, weeks = build_segment_samples(weekly, TREND_WEEKS[segment], ratio)
        if len(x) == 0:
            segments_meta[segment] = {"trained": False, "reason": "학습 표본 없음"}
            continue

        rank_ic = _holdout_rank_ic(x, y, weeks)
        if rank_ic is not None:
            rank_ics.append(rank_ic)

        # 게이트용 검증과 별개로, 운영 모델은 전체 표본으로 학습한다.
        booster = lgb.train(
            _LGB_PARAMS,
            lgb.Dataset(x, label=y, feature_name=FORECAST_FEATURES),
            num_boost_round=_NUM_BOOST_ROUND,
            callbacks=[lgb.log_evaluation(period=0)],
        )
        model_path = forecast_model_file(segment, suffix)
        model_path.parent.mkdir(parents=True, exist_ok=True)
        booster.save_model(str(model_path))
        segments_meta[segment] = {
            "trained": True,
            "n_samples": int(len(x)),
            "n_weeks": int(len(np.unique(weeks))),
            "rank_ic": rank_ic,
        }

    meta: dict[str, object] = {
        "model_id": "commercial-trend-forecast",
        "data_mode": data_mode,
        "target": "forward_slope_z",  # 전방 8주 (서울초과 기울기 z - 변동성 z)
        "feature_names": list(FORECAST_FEATURES),
        "trend_weeks": TREND_WEEKS,
        "forward_weeks": FORWARD_WEEKS,
        "scale_filter_q": SCALE_FILTER_Q,
        "segments": segments_meta,
        # 게이트 지표: 세그먼트 평균 rank IC(시간순 홀드아웃). 높을수록 좋다.
        "validation": {"rank_ic": float(np.mean(rank_ics)) if rank_ics else None},
        "trained_at": datetime.now(UTC).isoformat(),
    }
    meta_path: Path = forecast_meta_file(suffix)
    meta_path.parent.mkdir(parents=True, exist_ok=True)
    meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    return meta


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="forward-slope 예측 모델 학습")
    parser.add_argument("--data-mode", default="db", choices=["db", "raw", "sample"])
    args = parser.parse_args()
    result = train_forecast(args.data_mode)
    print(json.dumps(result, ensure_ascii=False, indent=2))
