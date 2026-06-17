from __future__ import annotations

import argparse
import json
from typing import Any

from xgboost import XGBRegressor

from app.models.category_opportunity_score.features import FEATURES, TARGET, build_frame
from app.models.common_tabular import metadata_base, regression_metrics, save_model_artifacts, time_or_random_split

MODEL_ID = "category_opportunity_score"
EXPERIMENT_NUMBER = "03-category-opportunity-score"


def train_and_save(data_mode: str = "sample") -> dict[str, Any]:
    frame = build_frame(data_mode)
    train_df, valid_df = time_or_random_split(frame, data_mode)
    model = XGBRegressor(
        objective="reg:squarederror",
        n_estimators=80,
        max_depth=2,
        learning_rate=0.08,
        subsample=0.9,
        colsample_bytree=0.9,
        random_state=42,
        n_jobs=1,
    )
    model.fit(train_df[FEATURES], train_df[TARGET])
    predictions = model.predict(valid_df[FEATURES])
    metadata = metadata_base(MODEL_ID, "xgboost.XGBRegressor", data_mode, FEATURES, TARGET, len(frame))
    metadata["status"] = "trained_on_sample_smoke_data" if data_mode == "sample" else "trained_on_raw_baseline_data"
    metadata["metrics"] = {
        **regression_metrics(valid_df[TARGET], predictions),
        "train_rows": int(len(train_df)),
        "valid_rows": int(len(valid_df)),
    }
    metadata["limitations"] = [
        "sample mode uses pseudo opportunity target",
        "raw mode ranks categories from next-quarter relative growth",
        "XGBRanker is deferred until more grouped training data is available",
    ]
    save_model_artifacts(model, MODEL_ID, metadata, EXPERIMENT_NUMBER)
    return metadata


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-mode", choices=["sample", "raw"], default="sample")
    args = parser.parse_args()
    print(json.dumps(train_and_save(args.data_mode), ensure_ascii=False, indent=2))

