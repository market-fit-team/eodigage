from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

from app.models.survey_market_fit_two_tower.features import build_item_features

SERVICE_ROOT = Path(__file__).resolve().parents[3]
ARTIFACT_DIR = SERVICE_ROOT / ".artifacts" / "trend_ensemble_calibrator"
EXPERIMENT_DIR = SERVICE_ROOT / "experiments" / "08-trend-ensemble-calibrator"
FEATURES = [
    "target_score",
    "sales_momentum_proxy",
    "category_opportunity_score",
    "demand_gap_score",
    "weekend_sales_ratio",
    "evening_sales_ratio",
]
TARGET = "ensemble_target"


def build_frame(data_mode: str) -> Any:
    frame = build_item_features(data_mode).copy()
    frame["sales_momentum_proxy"] = frame["sales_momentum_up_probability"]
    frame[TARGET] = (
        0.30 * frame["subway_commercial_trend_score"]
        + 0.25 * frame["sales_momentum_proxy"]
        + 0.25 * frame["category_opportunity_score"]
        + 0.20 * (1.0 - frame["demand_gap_score"])
    )
    frame["target_score"] = frame["subway_commercial_trend_score"]
    return frame.fillna(0)


def train_and_save(data_mode: str = "sample") -> dict[str, Any]:
    frame = build_frame(data_mode)
    train_df, valid_df = train_test_split(frame, test_size=0.28, random_state=42)
    model = GradientBoostingRegressor(random_state=42)
    model.fit(train_df[FEATURES], train_df[TARGET])
    preds = model.predict(valid_df[FEATURES])
    rmse = float(np.sqrt(mean_squared_error(valid_df[TARGET], preds)))

    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    EXPERIMENT_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump({"model": model, "features": FEATURES}, ARTIFACT_DIR / "model.joblib")
    metadata = {
        "model_id": "trend_ensemble_calibrator",
        "model_type": "sklearn.GradientBoostingRegressor",
        "status": "sample_trained" if data_mode == "sample" else "raw_trained",
        "data_mode": data_mode,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "rows": int(len(frame)),
        "features": FEATURES,
        "target": TARGET,
        "metrics": {
            "rmse": round(rmse, 6),
            "mae": round(float(mean_absolute_error(valid_df[TARGET], preds)), 6),
            "r2": round(float(r2_score(valid_df[TARGET], preds)), 6),
            "train_rows": int(len(train_df)),
            "valid_rows": int(len(valid_df)),
        },
        "artifact_path": ".artifacts/trend_ensemble_calibrator/model.joblib",
    }
    (ARTIFACT_DIR / "metadata.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    (EXPERIMENT_DIR / "train-result.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    return metadata


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-mode", choices=["sample", "raw"], default="sample")
    args = parser.parse_args()
    print(json.dumps(train_and_save(args.data_mode), ensure_ascii=False, indent=2))
