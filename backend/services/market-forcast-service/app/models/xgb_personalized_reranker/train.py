from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
import pandas as pd
from sklearn.metrics import ndcg_score
from xgboost import XGBRanker

from app.models.survey_market_fit_two_tower.features import SAMPLE_LABELS, build_l0_labels, build_item_features, load_survey_responses

SERVICE_ROOT = Path(__file__).resolve().parents[3]
ARTIFACT_DIR = SERVICE_ROOT / ".artifacts" / "xgb_personalized_reranker"
EXPERIMENT_DIR = SERVICE_ROOT / "experiments" / "10-xgb-personalized-reranker"
FEATURES = [
    "match_score",
    "subway_dependency",
    "rent_sensitivity",
    "competition_tolerance",
    "sales_amount",
    "sales_per_count",
    "weekend_sales_ratio",
    "evening_sales_ratio",
    "subway_commercial_trend_score",
    "sales_momentum_up_probability",
    "category_opportunity_score",
    "demand_gap_score",
    "startup_cost_million_krw_proxy",
]


def build_frame(data_mode: str) -> pd.DataFrame:
    labels = build_l0_labels(data_mode)
    surveys = load_survey_responses()[["survey_response_id", "subway_dependency", "rent_sensitivity", "competition_tolerance"]]
    items = build_item_features(data_mode)
    frame = labels.merge(surveys, on="survey_response_id", how="left").merge(
        items,
        on=["item_id", "area_code", "area_name", "service_category_code", "service_category_name"],
        how="left",
    )
    return frame.sort_values(["survey_response_id", "match_score"], ascending=[True, False]).fillna(0)


def train_and_save(data_mode: str = "sample") -> dict[str, Any]:
    frame = build_frame(data_mode)
    groups = frame.groupby("survey_response_id").size().tolist()
    model = XGBRanker(
        objective="rank:pairwise",
        n_estimators=60,
        max_depth=2,
        learning_rate=0.08,
        random_state=42,
        n_jobs=1,
    )
    model.fit(frame[FEATURES], frame["label"], group=groups)
    predictions = model.predict(frame[FEATURES])
    ndcg_values = []
    cursor = 0
    for group_size in groups:
        y_true = frame["label"].iloc[cursor : cursor + group_size].to_numpy()[None, :]
        y_score = predictions[cursor : cursor + group_size][None, :]
        ndcg_values.append(float(ndcg_score(y_true, y_score, k=min(3, group_size))))
        cursor += group_size

    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    EXPERIMENT_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump({"model": model, "features": FEATURES}, ARTIFACT_DIR / "model.joblib")
    metadata = {
        "model_id": "xgb_personalized_reranker",
        "model_type": "xgboost.XGBRanker",
        "status": "sample_trained" if data_mode == "sample" else "raw_trained",
        "data_mode": data_mode,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "rows": int(len(frame)),
        "groups": int(len(groups)),
        "features": FEATURES,
        "metrics": {
            "mean_ndcg_at_3": round(sum(ndcg_values) / len(ndcg_values), 6),
            "positive_pairs": int(frame["label"].sum()),
        },
        "artifact_path": ".artifacts/xgb_personalized_reranker/model.joblib",
    }
    (ARTIFACT_DIR / "metadata.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    (EXPERIMENT_DIR / "train-result.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    return metadata


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-mode", choices=["sample", "raw"], default="sample")
    args = parser.parse_args()
    print(json.dumps(train_and_save(args.data_mode), ensure_ascii=False, indent=2))

