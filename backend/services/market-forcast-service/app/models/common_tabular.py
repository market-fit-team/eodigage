from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, f1_score, mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

from app.models.subway_commercial_trend_score.features import (
    build_raw_training_frame,
    build_sample_training_frame,
    read_csv_auto,
)

SERVICE_ROOT = Path(__file__).resolve().parents[2]
SEED = 42


def minmax(values: pd.Series) -> pd.Series:
    minimum = values.min()
    maximum = values.max()
    if maximum == minimum:
        return pd.Series(0.0, index=values.index)
    return (values - minimum) / (maximum - minimum)


def base_frame(data_mode: str) -> pd.DataFrame:
    if data_mode == "sample":
        return build_sample_training_frame().copy()
    if data_mode == "raw":
        return build_raw_training_frame().copy()
    raise ValueError("data_mode must be 'sample' or 'raw'")


def time_or_random_split(frame: pd.DataFrame, data_mode: str) -> tuple[pd.DataFrame, pd.DataFrame]:
    if data_mode == "raw" and "quarter_code" in frame.columns and frame["quarter_code"].nunique() > 1:
        valid_quarter = int(frame["quarter_code"].max())
        return frame[frame["quarter_code"] < valid_quarter], frame[frame["quarter_code"] == valid_quarter]
    return train_test_split(frame, test_size=0.28, random_state=SEED)


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def save_model_artifacts(model: Any, model_id: str, metadata: dict[str, Any], experiment_number: str) -> None:
    artifact_dir = SERVICE_ROOT / ".artifacts" / model_id
    experiment_dir = SERVICE_ROOT / "experiments" / experiment_number
    artifact_dir.mkdir(parents=True, exist_ok=True)
    experiment_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, artifact_dir / "model.joblib")
    metadata["artifact_path"] = str((artifact_dir / "model.joblib").relative_to(SERVICE_ROOT))
    write_json(artifact_dir / "metadata.json", metadata)
    write_json(experiment_dir / "train-result.json", metadata)


def regression_metrics(y_true: pd.Series, y_pred: np.ndarray) -> dict[str, Any]:
    return {
        "rmse": round(float(np.sqrt(mean_squared_error(y_true, y_pred))), 6),
        "mae": round(float(mean_absolute_error(y_true, y_pred)), 6),
        "r2": round(float(r2_score(y_true, y_pred)), 6),
    }


def classification_metrics(y_true: pd.Series, y_pred: np.ndarray) -> dict[str, Any]:
    return {
        "accuracy": round(float(accuracy_score(y_true, y_pred)), 6),
        "macro_f1": round(float(f1_score(y_true, y_pred, average="macro", zero_division=0)), 6),
    }


def metadata_base(model_id: str, model_type: str, data_mode: str, features: list[str], target: str, rows: int) -> dict[str, Any]:
    return {
        "model_id": model_id,
        "model_type": model_type,
        "data_mode": data_mode,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "features": features,
        "target": target,
        "rows": rows,
    }
