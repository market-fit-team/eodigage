from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel, Field

from app.train import FEATURES, load_artifacts, train_and_save

app = FastAPI(title="district-embedding-service", version="1.0.0")
_artifacts, _metadata = load_artifacts()


class SimilarDistrictRequest(BaseModel):
    district_item_id: str = "1168064000-00"
    top_k: int = Field(default=5, ge=1, le=20)


class EmbedDistrictRequest(BaseModel):
    avg_sales_million_krw: float = 75
    food_spend_ratio: float = 0.3
    resident_population_total: int = 32000
    worker_population_total: int = 42000
    living_population_total: int = 92000
    subway_peak_boarding: int = 48000
    subway_peak_alighting: int = 45000
    facility_total_count: int = 82
    hospital_count: int = 9
    school_count: int = 5
    apartment_household_count: int = 6200
    apartment_avg_price_million_krw: float = 1400
    store_count: int = 58
    franchise_store_count: int = 16
    opening_store_count: int = 6
    closing_store_count: int = 4
    rent_per_sqm_thousand_krw: float = 82
    vacancy_rate: float = 6.1
    top_k: int = Field(default=5, ge=1, le=20)


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
    return {k: _metadata[k] for k in ["model_type", "trained_at", "rows", "embedding_dimensions", "metrics", "source_field_map"]}


@app.get("/catalog")
def catalog() -> dict[str, Any]:
    return {"districts": _metadata["districts"]}


def _neighbors(vector: np.ndarray, top_k: int) -> list[dict[str, Any]]:
    distances, indices = _artifacts["index"].kneighbors(vector, n_neighbors=top_k)
    return [
        {"rank": rank, "cosine_distance": round(float(distances[0][pos]), 4), **_artifacts["districts"][int(idx)]}
        for rank, (pos, idx) in enumerate(enumerate(indices[0]), start=1)
    ]


@app.post("/similar")
def similar(request: SimilarDistrictRequest) -> dict[str, Any]:
    ids = [row["district_item_id"] for row in _artifacts["districts"]]
    idx = ids.index(request.district_item_id) if request.district_item_id in ids else 0
    vector = _artifacts["embeddings"][idx : idx + 1]
    return {"district_item_id": ids[idx], "neighbors": _neighbors(vector, request.top_k)}


@app.post("/predict")
def predict(request: EmbedDistrictRequest) -> dict[str, Any]:
    row = pd.DataFrame([request.model_dump(exclude={"top_k"})])
    vector = _artifacts["pipeline"].transform(row[FEATURES])
    return {"embedding": [round(float(v), 6) for v in vector[0]], "neighbors": _neighbors(vector, request.top_k)}
