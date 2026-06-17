from __future__ import annotations

import argparse
import json
from typing import Any

from xgboost import XGBClassifier

from app.models.common_tabular import classification_metrics, metadata_base, save_model_artifacts, time_or_random_split
from app.models.sales_momentum_forecast.features import FEATURES, TARGET, build_frame

MODEL_ID = "sales_momentum_forecast"
EXPERIMENT_NUMBER = "02-sales-momentum-forecast"


def train_and_save(data_mode: str = "sample") -> dict[str, Any]:
    frame = build_frame(data_mode)
    train_df, valid_df = time_or_random_split(frame, data_mode)
    model = XGBClassifier(
        objective="multi:softprob",
        num_class=3,
        n_estimators=80,
        max_depth=2,
        learning_rate=0.08,
        subsample=0.9,
        colsample_bytree=0.9,
        random_state=42,
        n_jobs=1,
        eval_metric="mlogloss",
    )
    model.fit(train_df[FEATURES], train_df[TARGET])
    predictions = model.predict(valid_df[FEATURES])
    metadata = metadata_base(MODEL_ID, "xgboost.XGBClassifier", data_mode, FEATURES, TARGET, len(frame))
    metadata["status"] = "trained_on_sample_smoke_data" if data_mode == "sample" else "trained_on_raw_baseline_data"
    metadata["metrics"] = {
        **classification_metrics(valid_df[TARGET], predictions),
        "train_rows": int(len(train_df)),
        "valid_rows": int(len(valid_df)),
        "labels": {"0": "down", "1": "flat", "2": "up"},
    }
    metadata["limitations"] = [
        "sample mode uses pseudo labels from tiny sample rows",
        "raw mode uses next-quarter sales growth labels",
        "subway feature is citywide baseline until station_area_weights.csv exists",
    ]
    save_model_artifacts(model, MODEL_ID, metadata, EXPERIMENT_NUMBER)
    return metadata


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-mode", choices=["sample", "raw"], default="sample")
    args = parser.parse_args()
    print(json.dumps(train_and_save(args.data_mode), ensure_ascii=False, indent=2))

