from __future__ import annotations

import os
from typing import Any

os.environ.setdefault("TF_USE_LEGACY_KERAS", "1")
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

import numpy as np
import tensorflow as tf
from fastapi import FastAPI
from pydantic import BaseModel, Field

from app.train import USER_FIELDS, items_to_tensors, load_model, survey_to_tensors, train_and_save

app = FastAPI(title="survey-category-fit-service", version="1.0.0")
_model, _metadata = load_model()


class TrainRequest(BaseModel):
    epochs: int = Field(default=18, ge=1, le=80)


class SurveyCategoryRequest(BaseModel):
    survey_id: str = "survey-000"
    top_k: int = Field(default=5, ge=1, le=20)
    primary_goal: str | None = None
    risk_tolerance: str | None = None
    preferred_time_band: str | None = None
    budget_million_krw: float | None = None
    owner_operation_hours: float | None = None
    food_interest: float | None = None
    service_interest: float | None = None
    retail_interest: float | None = None
    growth_preference: float | None = None


@app.get("/health")
def health() -> dict[str, Any]:
    return {"ok": True, "trained_at": _metadata["trained_at"]}


@app.post("/train")
def train(request: TrainRequest) -> dict[str, Any]:
    global _model, _metadata
    _metadata = train_and_save(request.epochs)
    _model, _metadata = load_model()
    return {"status": "trained", "evaluation": _metadata["metrics"]}


@app.get("/evaluation")
def evaluation() -> dict[str, Any]:
    return {k: _metadata[k] for k in ["model_type", "trained_at", "mock_rows", "metrics", "source_field_map"]}


@app.get("/catalog")
def catalog() -> dict[str, Any]:
    return {"surveys": _metadata["surveys"], "category_items": _metadata["category_items"]}


def _survey(request: SurveyCategoryRequest) -> dict[str, Any]:
    base = dict({row["survey_id"]: row for row in _metadata["surveys"]}.get(request.survey_id, _metadata["surveys"][0]))
    base["survey_id"] = request.survey_id
    for field in USER_FIELDS:
        value = getattr(request, field, None)
        if value is not None:
            base[field] = value
    return base


@app.post("/predict")
def predict(request: SurveyCategoryRequest) -> dict[str, Any]:
    survey = _survey(request)
    items = _metadata["category_items"]
    scores = tf.linalg.matmul(_model.survey_model(survey_to_tensors(survey)), _model.item_model(items_to_tensors(items)), transpose_b=True)[0].numpy()
    ranked = np.argsort(scores)[::-1][: request.top_k]
    recommendations = []
    for rank, idx in enumerate(ranked, start=1):
        recommendations.append({"rank": rank, "score": round(float(scores[int(idx)]), 4), **items[int(idx)]})
    return {"survey_id": request.survey_id, "resolved_survey": survey, "recommendations": recommendations}
