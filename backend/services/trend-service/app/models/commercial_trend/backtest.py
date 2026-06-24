"""검증 게이트: 통합 LightGBM이 단순 기준모델을 실제로 이기는지 시간순 홀드아웃으로 판정한다.

배너는 상위만 노출하므로 회귀지표(MAE/방향/Spearman)와 함께 Top-K(P@K)를 본다.
- MAE는 학습 타깃과 같은 log-uplift '로그 공간' 값이다(증감률 % 가 아님).
- 분할은 as-of '일자' 기준 + HORIZON_DAYS purge gap(타깃 겹침 방지).
- 방향 정확도는 '항상 상승' 다수클래스 기준과 함께 봐야 한다.

    python -m app.models.commercial_trend.backtest --data-mode db
"""

from __future__ import annotations

import argparse
from collections import defaultdict

import lightgbm as lgb
import numpy as np

from app.models.commercial_trend.features import (
    FEATURE_NAMES,
    HORIZON_DAYS,
    THEME_CODES,
    build_training_samples,
)
from app.models.commercial_trend.train import LGB_PARAMS, MODEL_FEATURE_NAMES

TEST_FRACTION = 0.25  # 가장 최근 25% as-of일을 테스트로
TOP_K = 3
FALLBACK_ROUNDS = 200


def _time_split(features: np.ndarray, target: np.ndarray, dates: np.ndarray, test_fraction: float):
    """as-of '일자' 기준 시간순 분리 + 학습/테스트 사이 HORIZON_DAYS purge gap."""
    unique_dates = np.unique(dates)
    n_test = max(1, int(len(unique_dates) * test_fraction))
    test_start = unique_dates[-n_test]
    train_cutoff = test_start - np.timedelta64(HORIZON_DAYS, "D")
    train_mask = dates < train_cutoff
    test_mask = dates >= test_start
    return features[train_mask], target[train_mask], features[test_mask], target[test_mask], dates[test_mask]


def _ranks(values: np.ndarray) -> np.ndarray:
    order = np.argsort(values)
    ranks = np.empty(len(values), dtype=float)
    ranks[order] = np.arange(len(values), dtype=float)
    return ranks


def _reg_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> tuple[float, float, float]:
    mae = float(np.mean(np.abs(y_true - y_pred)))
    direction = float(np.mean(np.sign(y_true) == np.sign(y_pred)))
    spearman = float(np.corrcoef(_ranks(y_true), _ranks(y_pred))[0, 1]) if len(y_true) > 1 else 0.0
    if np.isnan(spearman):  # 상수 예측 등으로 분산이 0이면 정의 불가 → 0 처리
        spearman = 0.0
    return mae, direction, spearman


def _precision_at_k(keys: object, y_true: np.ndarray, y_pred: np.ndarray, k: int) -> float:
    """그룹(as-of일×주제)별로 예측 상위 k와 실제 상위 k의 겹침 비율 평균.

    정의: P@k = |예측 상위 k ∩ 실제(향후 7일 증감) 상위 k| / k, 그룹 평균.
    랜덤 기대값 ≈ k / (그룹당 후보 수).
    """
    groups: dict[object, list[int]] = defaultdict(list)
    for idx, key in enumerate(keys):  # type: ignore[call-overload]
        groups[key].append(idx)

    scores: list[float] = []
    for indices in groups.values():
        if len(indices) < k:
            continue
        idx = np.asarray(indices)
        top_pred = set(idx[np.argsort(y_pred[idx])[-k:]].tolist())
        top_true = set(idx[np.argsort(y_true[idx])[-k:]].tolist())
        scores.append(len(top_pred & top_true) / k)
    return float(np.mean(scores)) if scores else 0.0


def run_backtest(data_mode: str = "db") -> dict[str, object]:
    features, target, dates, theme_codes = build_training_samples(data_mode)
    if len(features) == 0:
        raise ValueError("학습 샘플이 비어 있다.")

    fi = {name: i for i, name in enumerate(FEATURE_NAMES)}
    matrix = np.column_stack([features, theme_codes.astype(float)])  # 마지막 열 = theme_code
    x_train, y_train, x_test, y_test, d_test = _time_split(matrix, target, dates, TEST_FRACTION)

    booster = lgb.train(
        LGB_PARAMS,
        lgb.Dataset(x_train, label=y_train, feature_name=MODEL_FEATURE_NAMES, categorical_feature=["theme_code"]),
        num_boost_round=FALLBACK_ROUNDS,
        callbacks=[lgb.log_evaluation(period=0)],
    )

    theme_test = x_test[:, len(FEATURE_NAMES)]
    keys = list(zip(d_test.tolist(), theme_test.tolist(), strict=False))
    lgbm_pred = np.asarray(booster.predict(x_test), dtype=float)
    up_ratio = float(np.mean(y_test > 0))  # 실제 상승 비율(다수클래스 방향 기준)
    recovered_mae = float(np.mean(np.abs(np.expm1(lgbm_pred) - np.expm1(y_test))))  # 복원 증감률 공간 MAE

    # 기준모델: 무변화 / 평균회귀 / 모멘텀 지속 / 항상 상승(방향 다수클래스)
    predictions = {
        "LightGBM(통합)": lgbm_pred,
        "기준0(무변화)": np.zeros(len(y_test)),
        "기준1(평균회귀)": -x_test[:, fi["recent_vs_prior"]],
        "기준2(모멘텀지속)": x_test[:, fi["wow_change"]],
        "기준3(항상상승)": np.ones(len(y_test)),  # 방향만 의미(=상승비율)
    }
    rows = [
        {
            "name": name,
            "mae": _reg_metrics(y_test, pred)[0],
            "direction": _reg_metrics(y_test, pred)[1],
            "spearman": _reg_metrics(y_test, pred)[2],
            "precision_at_k": _precision_at_k(keys, y_test, pred, TOP_K),
        }
        for name, pred in predictions.items()
    ]

    # 주제별 성능(LightGBM) — 전체 평균이 좋아도 특정 주제가 약할 수 있어 따로 본다.
    code_to_label = {code: name for name, code in THEME_CODES.items()}
    per_theme = []
    for code in sorted(set(theme_test.tolist())):
        mask = theme_test == code
        if mask.sum() < TOP_K:
            continue
        mae, direction, spearman = _reg_metrics(y_test[mask], lgbm_pred[mask])
        pk = _precision_at_k(d_test[mask].tolist(), y_test[mask], lgbm_pred[mask], TOP_K)
        per_theme.append(
            {
                "theme": code_to_label[int(code)],
                "n": int(mask.sum()),
                "mae": mae,
                "direction": direction,
                "spearman": spearman,
                "precision_at_k": pk,
            }
        )

    return {
        "n_train": int(len(y_train)),
        "n_test": int(len(y_test)),
        "test_asof_days": int(len(np.unique(d_test))),
        "up_ratio": up_ratio,
        "lgbm_recovered_mae": recovered_mae,
        "rows": rows,
        "per_theme": per_theme,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="트렌드 모델 백테스트(기준모델 대비)")
    parser.add_argument("--data-mode", default="db", choices=["db", "sample", "raw"])
    args = parser.parse_args()
    result = run_backtest(args.data_mode)

    print(
        f"학습 {result['n_train']} / 테스트 {result['n_test']} "
        f"({result['test_asof_days']} as-of일) | 실제 상승비율 {result['up_ratio']:.1%}"
    )
    print(f"MAE는 log-uplift 공간 / LightGBM 복원 증감률 MAE = {result['lgbm_recovered_mae']:.4f}\n")
    print(f"{'방법':18s} {'MAE(log)':>9s} {'방향':>7s} {'Spearman':>9s} {'P@3':>7s}")
    for row in result["rows"]:
        print(
            f"{row['name']:18s} {row['mae']:9.4f} {row['direction']:7.1%} "
            f"{row['spearman']:9.3f} {row['precision_at_k']:7.1%}"
        )
    print(f"\n[주제별 LightGBM] {'주제':10s} {'MAE(log)':>9s} {'방향':>7s} {'Spearman':>9s} {'P@3':>7s}")
    for row in result["per_theme"]:
        print(
            f"  {row['theme']:14s} {row['mae']:9.4f} {row['direction']:7.1%} "
            f"{row['spearman']:9.3f} {row['precision_at_k']:7.1%}"
        )
