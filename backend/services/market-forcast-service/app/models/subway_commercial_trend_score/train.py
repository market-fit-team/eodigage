from __future__ import annotations

import json
import argparse
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from xgboost import XGBRegressor

from app.models.subway_commercial_trend_score.features import STATION_AREA_WEIGHTS, build_training_frame

SERVICE_ROOT = Path(__file__).resolve().parents[3]
ARTIFACT_DIR = SERVICE_ROOT / ".artifacts" / "subway_commercial_trend_score"
EXPERIMENT_DIR = SERVICE_ROOT / "experiments" / "01-subway-commercial-trend-score"
MODEL_PATH = ARTIFACT_DIR / "model.joblib"
METADATA_PATH = ARTIFACT_DIR / "metadata.json"
TRAIN_RESULT_PATH = EXPERIMENT_DIR / "train-result.json"
SEED = 42

FEATURES = [
    "boarding_total",
    "alighting_total",
    "lunch_alighting",
    "evening_alighting",
    "commute_alighting",
    "night_alighting",
    "alighting_boarding_ratio",
    "lunch_alighting_ratio",
    "evening_alighting_ratio",
    "commute_alighting_ratio",
    "night_alighting_ratio",
    "station_area_weight",
    "weighted_alighting_total",
    "weighted_lunch_alighting",
    "weighted_evening_alighting",
    "sales_amount",
    "sales_count",
    "sales_per_count",
    "weekend_sales_ratio",
    "evening_sales_ratio",
]
TARGET = "target_score"


def train_and_save(data_mode: str = "sample") -> dict[str, Any]:
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    EXPERIMENT_DIR.mkdir(parents=True, exist_ok=True)

    frame = build_training_frame(data_mode=data_mode)
    if data_mode == "raw" and "quarter_code" in frame.columns and frame["quarter_code"].nunique() > 1:
        valid_quarter = int(frame["quarter_code"].max())
        train_df = frame[frame["quarter_code"] < valid_quarter]
        valid_df = frame[frame["quarter_code"] == valid_quarter]
    else:
        train_df, valid_df = train_test_split(frame, test_size=0.28, random_state=SEED)

    model = XGBRegressor(
        objective="reg:squarederror",
        n_estimators=80,
        max_depth=2,
        learning_rate=0.08,
        subsample=0.9,
        colsample_bytree=0.9,
        random_state=SEED,
        n_jobs=1,
    )
    model.fit(train_df[FEATURES], train_df[TARGET])

    predictions = model.predict(valid_df[FEATURES])
    rmse = float(np.sqrt(mean_squared_error(valid_df[TARGET], predictions)))
    metrics = {
        "rmse": round(rmse, 6),
        "mae": round(float(mean_absolute_error(valid_df[TARGET], predictions)), 6),
        "r2": round(float(r2_score(valid_df[TARGET], predictions)), 6),
        "valid_rows": int(len(valid_df)),
        "train_rows": int(len(train_df)),
        "total_rows": int(len(frame)),
    }
    metadata = {
        "model_id": "subway_commercial_trend_score",
        "model_type": "xgboost.XGBRegressor",
        "status": "trained_on_sample_smoke_data" if data_mode == "sample" else "trained_on_raw_baseline_data",
        "data_mode": data_mode,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "features": FEATURES,
        "target": TARGET,
        "metrics": metrics,
        "artifact_path": str(MODEL_PATH.relative_to(SERVICE_ROOT)),
        "rows": int(len(frame)),
        "quarters": sorted([int(value) for value in frame["quarter_code"].unique()]) if "quarter_code" in frame.columns else [],
        "join_strategy": str(frame["join_strategy"].iloc[0]) if "join_strategy" in frame.columns and len(frame) else "sample_surrogate_join",
        "station_area_weights_path": str(STATION_AREA_WEIGHTS.relative_to(SERVICE_ROOT)),
        "limitations": [
            "sample mode uses only 5 subway rows and 5 sales rows",
            "raw mode uses real next-quarter sales growth as target",
            "raw mode uses citywide subway signal until data/external/station_area_weights.csv exists",
            "citywide signal validates ingestion and temporal target construction but is not a real station-area model",
        ],
    }
    joblib.dump(model, MODEL_PATH)
    METADATA_PATH.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    TRAIN_RESULT_PATH.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    return metadata


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-mode", choices=["sample", "raw"], default="sample")
    args = parser.parse_args()
    result = train_and_save(data_mode=args.data_mode)
    print(json.dumps(result, ensure_ascii=False, indent=2))
