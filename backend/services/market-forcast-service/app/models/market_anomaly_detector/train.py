from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

from app.models.common_tabular import base_frame

SERVICE_ROOT = Path(__file__).resolve().parents[3]
ARTIFACT_DIR = SERVICE_ROOT / ".artifacts" / "market_anomaly_detector"
EXPERIMENT_DIR = SERVICE_ROOT / "experiments" / "07-market-anomaly-detector"
FEATURES = [
    "sales_amount",
    "sales_count",
    "sales_per_count",
    "weekend_sales_ratio",
    "evening_sales_ratio",
    "target_score",
    "alighting_total",
    "lunch_alighting",
    "evening_alighting",
    "night_alighting",
]


def train_and_save(data_mode: str = "sample") -> dict[str, Any]:
    frame = base_frame(data_mode).copy()
    scaler = StandardScaler()
    x = scaler.fit_transform(frame[FEATURES])
    contamination = min(0.2, max(0.05, 1 / max(len(frame), 1)))
    model = IsolationForest(contamination=contamination, random_state=42)
    labels = model.fit_predict(x)
    scores = -model.decision_function(x)
    output = frame[["area_code", "area_name", "service_category_code", "service_category_name"]].copy()
    output["anomaly_score"] = scores
    output["is_anomaly"] = labels == -1

    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    EXPERIMENT_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump({"scaler": scaler, "model": model, "features": FEATURES}, ARTIFACT_DIR / "model.joblib")
    output.to_csv(ARTIFACT_DIR / "anomaly_scores.csv", index=False)
    metadata = {
        "model_id": "market_anomaly_detector",
        "model_type": "sklearn.IsolationForest",
        "status": "sample_trained" if data_mode == "sample" else "raw_trained",
        "data_mode": data_mode,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "rows": int(len(frame)),
        "features": FEATURES,
        "metrics": {
            "anomaly_count": int(output["is_anomaly"].sum()),
            "anomaly_rate": round(float(output["is_anomaly"].mean()), 6),
        },
        "artifact_path": ".artifacts/market_anomaly_detector/model.joblib",
        "scores_path": ".artifacts/market_anomaly_detector/anomaly_scores.csv",
    }
    (ARTIFACT_DIR / "metadata.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    (EXPERIMENT_DIR / "train-result.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    return metadata


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-mode", choices=["sample", "raw"], default="sample")
    args = parser.parse_args()
    print(json.dumps(train_and_save(args.data_mode), ensure_ascii=False, indent=2))

