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

app = FastAPI(title="survey-franchise-fit-service", version="1.0.0")
_model, _metadata = load_model()


class TrainRequest(BaseModel):
    epochs: int = Field(default=18, ge=1, le=80)


class SurveyFranchiseRequest(BaseModel):
    survey_id: str = "survey-000"
    top_k: int = Field(default=5, ge=1, le=20)
    preferred_category: str | None = None
    preferred_district_code: str | None = None
    risk_tolerance: str | None = None
    preferred_time_band: str | None = None
    budget_million_krw: float | None = None
    min_monthly_sales_million_krw: float | None = None
    max_rent_million_krw: float | None = None
    food_spend_preference: float | None = None
    footfall_preference: float | None = None
    brand_preference: float | None = None


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
    return {"surveys": _metadata["surveys"], "franchises": _metadata["franchises"]}


def _survey(request: SurveyFranchiseRequest) -> dict[str, Any]:
    base = dict({row["survey_id"]: row for row in _metadata["surveys"]}.get(request.survey_id, _metadata["surveys"][0]))
    base["survey_id"] = request.survey_id
    for field in USER_FIELDS:
        value = getattr(request, field, None)
        if value is not None:
            base[field] = value
    return base


@app.post("/predict")
def predict(request: SurveyFranchiseRequest) -> dict[str, Any]:
    survey = _survey(request)
    items = _metadata["franchises"]
    embeddings = _model.item_model(items_to_tensors(items))
    scores = tf.linalg.matmul(_model.survey_model(survey_to_tensors(survey)), embeddings, transpose_b=True)[0].numpy()
    ranked = np.argsort(scores)[::-1][: request.top_k]
    recommendations = []
    for rank, idx in enumerate(ranked, start=1):
        item = items[int(idx)]
        recommendations.append({"rank": rank, "score": round(float(scores[int(idx)]), 4), **item})
    return {"survey_id": request.survey_id, "resolved_survey": survey, "recommendations": recommendations}
