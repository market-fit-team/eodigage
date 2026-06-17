from __future__ import annotations

import os
from typing import Any

os.environ.setdefault("TF_USE_LEGACY_KERAS", "1")
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

import numpy as np
import tensorflow as tf
from fastapi import FastAPI
from pydantic import BaseModel, Field

from app.train import (
    FRANCHISE_FEATURE_FIELDS,
    USER_FEATURE_FIELDS,
    franchises_to_tensors,
    load_model,
    train_and_save,
    user_to_tensors,
)

app = FastAPI(
    title="two-tower-recommender-service",
    version="1.0.0",
    description="TFRS two-tower franchise recommendation service trained on deterministic mock data.",
)

_model, _metadata = load_model()


class TrainRequest(BaseModel):
    epochs: int = Field(default=18, ge=1, le=80)


class RecommendationRequest(BaseModel):
    user_id: str = Field(default="user-000")
    top_k: int = Field(default=5, ge=1, le=20)
    preferred_category: str | None = None
    preferred_district_code: str | None = None
    investment_budget_million_krw: float | None = None
    risk_tolerance: str | None = None
    target_age_group: str | None = None
    preferred_food_spend_ratio: float | None = None
    preferred_weekend_ratio: float | None = None
    target_resident_population: int | None = None
    target_worker_population: int | None = None


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "ok": True,
        "model_type": _metadata["model_type"],
        "trained_at": _metadata["trained_at"],
    }


@app.post("/train")
def train(request: TrainRequest) -> dict[str, Any]:
    global _model, _metadata
    _metadata = train_and_save(epochs=request.epochs)
    _model, _metadata = load_model()
    return {"status": "trained", "evaluation": _metadata["metrics"], "trained_at": _metadata["trained_at"]}


@app.get("/evaluation")
def evaluation() -> dict[str, Any]:
    return {
        "model_type": _metadata["model_type"],
        "trained_at": _metadata["trained_at"],
        "train_interactions": _metadata["train_interactions"],
        "mock_rows": _metadata.get("mock_rows"),
        "metrics": _metadata["metrics"],
        "source_field_map": _metadata.get("source_field_map", {}),
    }


@app.get("/catalog")
def catalog() -> dict[str, Any]:
    return {"users": _metadata["users"], "franchises": _metadata["franchises"]}


def _resolve_user(request: RecommendationRequest) -> dict[str, Any]:
    users_by_id = {row["user_id"]: row for row in _metadata["users"]}
    user = dict(users_by_id.get(request.user_id, _metadata["users"][0]))
    user["user_id"] = request.user_id
    for field in USER_FEATURE_FIELDS:
        override = getattr(request, field, None)
        if override is not None:
            user[field] = override
    return user


@app.post("/predict")
def recommend(request: RecommendationRequest) -> dict[str, Any]:
    user = _resolve_user(request)
    franchise_ids = [row["franchise_id"] for row in _metadata["franchises"]]
    franchise_by_id = {row["franchise_id"]: row for row in _metadata["franchises"]}
    candidate_tensors = {
        field: tensor for field, tensor in franchises_to_tensors(_metadata["franchises"]).items()
        if field in FRANCHISE_FEATURE_FIELDS
    }
    candidate_embeddings = _model.franchise_model(candidate_tensors)
    user_embedding = _model.user_model(user_to_tensors(user))
    scores = tf.linalg.matmul(user_embedding, candidate_embeddings, transpose_b=True)[0].numpy()
    ranked_indices = np.argsort(scores)[::-1][: request.top_k]

    recommendations = []
    for rank, idx in enumerate(ranked_indices, start=1):
        franchise_id = franchise_ids[int(idx)]
        item = franchise_by_id[franchise_id]
        recommendations.append(
            {
                "rank": rank,
                "score": round(float(scores[int(idx)]), 4),
                "franchise_id": franchise_id,
                "brand_name": item["brand_name"],
                "company_name": item["company_name"],
                "category": item["category"],
                "district_code": item["district_code"],
                "district_name": item["district_name"],
                "borough": item["borough"],
                "startup_cost_million_krw": item["startup_cost_million_krw"],
                "avg_sales_million_krw": item["avg_sales_million_krw"],
                "avg_sales_per_area_million_krw": item["avg_sales_per_area_million_krw"],
                "franchise_store_count": item["franchise_store_count"],
                "closure_rate": item["closure_rate"],
                "subway_peak_ride_count": item["subway_peak_ride_count"],
                "living_population_total": item["living_population_total"],
                "facility_total_count": item["facility_total_count"],
                "rent_per_sqm_thousand_krw": item["rent_per_sqm_thousand_krw"],
                "brand_power": item["brand_power"],
            }
        )

    return {
        "user_id": request.user_id,
        "resolved_user_profile": {field: user[field] for field in USER_FEATURE_FIELDS},
        "top_k": request.top_k,
        "recommendations": recommendations,
        "trained_at": _metadata["trained_at"],
    }
