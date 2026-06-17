from __future__ import annotations

from typing import Any

import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel, Field

from app.train import FEATURES, load_artifacts, train_and_save

app = FastAPI(title="franchise-reranker-service", version="1.0.0")
_artifacts, _metadata = load_artifacts()


class Candidate(BaseModel):
    franchise_id: str
    service_category: str = "coffee"
    district_code: str = "1168064000"
    risk_tolerance: str = "medium"
    two_tower_score: float = 0.5
    budget_gap_million_krw: float = 40
    avg_sales_million_krw: float = 75
    avg_sales_per_area_million_krw: float = 6.5
    startup_cost_million_krw: float = 160
    rent_million_krw: float = 6.5
    closure_rate: float = 0.08
    franchise_store_count: int = 12
    footfall_index: float = 90
    facility_total_count: int = 60
    brand_power: float = 0.65
    survey_brand_preference: float = 0.55
    survey_footfall_preference: float = 0.6


class RerankRequest(BaseModel):
    candidates: list[Candidate] = Field(default_factory=lambda: [Candidate(franchise_id=f"candidate-{i}") for i in range(5)])


@app.get("/health")
def health() -> dict[str, Any]:
    return {"ok": True, "trained_at": _metadata["trained_at"]}


@app.post("/train")
def train() -> dict[str, Any]:
    global _artifacts, _metadata
    _metadata = train_and_save()
    _artifacts, _metadata = load_artifacts()
    return {"status": "trained", "evaluation": _metadata["metrics"]}


@app.get("/evaluation")
def evaluation() -> dict[str, Any]:
    return _metadata


@app.post("/rerank")
@app.post("/predict")
def rerank(request: RerankRequest) -> dict[str, Any]:
    rows = [candidate.model_dump() for candidate in request.candidates]
    df = pd.DataFrame(rows)
    scores = _artifacts["model"].predict(_artifacts["preprocessor"].transform(df[FEATURES]))
    ranked = sorted(zip(rows, scores), key=lambda pair: pair[1], reverse=True)
    return {
        "ranked_candidates": [
            {"rank": rank, "rerank_score": round(float(score), 4), **candidate}
            for rank, (candidate, score) in enumerate(ranked, start=1)
        ]
    }
