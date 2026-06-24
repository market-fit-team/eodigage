from __future__ import annotations

import argparse
import json
from datetime import UTC, datetime

import lightgbm as lgb
import numpy as np

from app.models.commercial_trend.features import (
    FEATURE_NAMES,
    META_FILE,
    MODEL_FILE,
    THEME_CODES,
    build_training_samples,
)

# 모델 입력 컬럼 = 행정동 피처 + theme_code(범주형). theme_code는 마지막 열.
MODEL_FEATURE_NAMES = [*FEATURE_NAMES, "theme_code"]

# 마지막 일정 비율을 '미래' 검증셋으로 떼어 시간순 홀드아웃을 만든다(룩어헤드 방지).
VALID_FRACTION = 0.2
# 검증 분할을 적용할 최소 표본 수. 이보다 적으면(샘플 데이터 등) 분할 없이 보수적으로 학습한다.
MIN_SAMPLES_FOR_VALID = 80

# 트리 부스팅 하이퍼파라미터. 표본이 많지 않을 수 있어 규제를 보수적으로 둔다.
LGB_PARAMS: dict[str, object] = {
    "objective": "regression",
    "metric": "l1",  # MAE 기준으로 학습/조기종료
    "num_leaves": 15,
    "learning_rate": 0.05,
    "min_child_samples": 20,
    "feature_fraction": 0.8,
    "bagging_fraction": 0.8,
    "bagging_freq": 1,
    "verbosity": -1,
}
NUM_BOOST_ROUND = 1000
EARLY_STOPPING_ROUNDS = 50
# 검증셋이 없을 때 쓰는 고정 라운드(과적합 방지로 짧게).
FALLBACK_ROUNDS = 200


def _chronological_split(
    features: np.ndarray, target: np.ndarray, dates: np.ndarray, valid_fraction: float
) -> tuple[np.ndarray, np.ndarray, np.ndarray | None, np.ndarray | None]:
    """기준 시점 오름차순으로 정렬해 뒤쪽 valid_fraction을 검증셋으로 분리한다."""
    order = np.argsort(dates)
    features, target = features[order], target[order]
    n_valid = int(len(target) * valid_fraction)
    if n_valid < 1:
        return features, target, None, None
    return features[:-n_valid], target[:-n_valid], features[-n_valid:], target[-n_valid:]


def _metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict[str, float]:
    """검증 지표. 나이브(변화 없음=0) 베이스라인 대비 개선도까지 함께 본다."""
    mae = float(np.mean(np.abs(y_true - y_pred)))
    direction_accuracy = float(np.mean(np.sign(y_true) == np.sign(y_pred)))
    naive_mae = float(np.mean(np.abs(y_true)))  # 다음 주도 직전과 같다고 보는 베이스라인
    skill_vs_naive = float(1.0 - mae / naive_mae) if naive_mae else 0.0
    return {
        "mae": mae,
        "direction_accuracy": direction_accuracy,
        "naive_mae": naive_mae,
        "skill_vs_naive": skill_vs_naive,
    }


def train(data_mode: str = "sample") -> dict[str, object]:
    """LightGBM으로 향후 7일 증감을 회귀 학습하고 부스터+메타를 저장한다."""
    features, target, dates, theme_codes = build_training_samples(data_mode)
    if len(features) == 0:
        raise ValueError("학습 샘플이 비어 있다. 데이터 일수가 윈도우/지평보다 충분한지 확인한다.")

    # theme_code를 마지막 열로 붙여 단일 모델에 함께 학습한다.
    matrix = np.column_stack([features, theme_codes.astype(float)])
    x_train, y_train, x_valid, y_valid = _chronological_split(matrix, target, dates, VALID_FRACTION)
    use_valid = x_valid is not None and len(target) >= MIN_SAMPLES_FOR_VALID

    dataset_kwargs = {"feature_name": MODEL_FEATURE_NAMES, "categorical_feature": ["theme_code"]}
    train_set = lgb.Dataset(x_train, label=y_train, **dataset_kwargs)
    callbacks = [lgb.log_evaluation(period=0)]

    if use_valid:
        assert x_valid is not None and y_valid is not None
        valid_set = lgb.Dataset(x_valid, label=y_valid, reference=train_set)
        callbacks.append(lgb.early_stopping(EARLY_STOPPING_ROUNDS, verbose=False))
        booster = lgb.train(
            LGB_PARAMS,
            train_set,
            num_boost_round=NUM_BOOST_ROUND,
            valid_sets=[valid_set],
            callbacks=callbacks,
        )
        best_iteration = int(booster.best_iteration or booster.num_trees())
        validation = _metrics(y_valid, booster.predict(x_valid, num_iteration=best_iteration))
        # 최적 라운드까지만 저장해 추론 시 그대로 사용한다.
        booster.save_model(str(MODEL_FILE), num_iteration=best_iteration)
    else:
        booster = lgb.train(LGB_PARAMS, train_set, num_boost_round=FALLBACK_ROUNDS, callbacks=callbacks)
        validation = None
        best_iteration = int(booster.num_trees())
        booster.save_model(str(MODEL_FILE))

    importance = booster.feature_importance(importance_type="gain")
    meta: dict[str, object] = {
        "model_id": "commercial-trend-lgbm",
        "data_mode": data_mode,
        "target": "log_uplift",  # log(향후+1) - log(기준+1)
        "feature_names": list(FEATURE_NAMES),  # 행정동 피처(추론 시 theme_code는 별도로 덧붙임)
        "theme_codes": THEME_CODES,
        "n_samples": int(len(target)),
        "n_train": int(len(y_train)),
        "best_iteration": best_iteration,
        "validation": validation,
        "feature_importance_gain": {
            name: float(score) for name, score in zip(MODEL_FEATURE_NAMES, importance, strict=False)
        },
        "trained_at": datetime.now(UTC).isoformat(),
    }
    META_FILE.parent.mkdir(parents=True, exist_ok=True)
    META_FILE.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    return meta


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="상권 트렌드 점수 모델 학습(LightGBM)")
    parser.add_argument("--data-mode", default="sample", choices=["sample", "raw", "db"])
    args = parser.parse_args()
    result = train(args.data_mode)
    print(json.dumps(result, ensure_ascii=False, indent=2))
