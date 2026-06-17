from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler

from app.models.survey_market_fit_two_tower.features import build_item_features

SERVICE_ROOT = Path(__file__).resolve().parents[3]
ARTIFACT_DIR = SERVICE_ROOT / ".artifacts" / "market_segment_clusterer"
EXPERIMENT_DIR = SERVICE_ROOT / "experiments" / "06-market-segment-clusterer"
FEATURES = [
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


def train_and_save(data_mode: str = "sample") -> dict[str, Any]:
    frame = build_item_features(data_mode)
    n_clusters = min(3, max(2, len(frame) - 1))
    scaler = StandardScaler()
    x = scaler.fit_transform(frame[FEATURES])
    model = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    labels = model.fit_predict(x)
    score = float(silhouette_score(x, labels)) if len(set(labels)) > 1 and len(frame) > n_clusters else 0.0
    frame["cluster_id"] = labels
    output = frame[["item_id", "area_name", "service_category_name", "cluster_id"]].copy()

    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    EXPERIMENT_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump({"scaler": scaler, "model": model, "features": FEATURES}, ARTIFACT_DIR / "model.joblib")
    output.to_csv(ARTIFACT_DIR / "cluster_assignments.csv", index=False)
    metadata = {
        "model_id": "market_segment_clusterer",
        "model_type": "sklearn.KMeans",
        "status": "sample_trained" if data_mode == "sample" else "raw_trained",
        "data_mode": data_mode,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "rows": int(len(frame)),
        "n_clusters": int(n_clusters),
        "features": FEATURES,
        "metrics": {"silhouette_score": round(score, 6)},
        "artifact_path": ".artifacts/market_segment_clusterer/model.joblib",
        "assignments_path": ".artifacts/market_segment_clusterer/cluster_assignments.csv",
    }
    (ARTIFACT_DIR / "metadata.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    (EXPERIMENT_DIR / "train-result.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    return metadata


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-mode", choices=["sample", "raw"], default="sample")
    args = parser.parse_args()
    print(json.dumps(train_and_save(args.data_mode), ensure_ascii=False, indent=2))

