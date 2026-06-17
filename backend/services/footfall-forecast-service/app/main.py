from __future__ import annotations

from typing import Any

import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel, Field

from app.train import load_artifacts, train_and_save

app = FastAPI(
    title="footfall-forecast-service",
    version="1.0.0",
    description="XGBoost regression service for next-week commercial footfall forecasts.",
)

_model, _metadata = load_artifacts()


class FootfallForecastRequest(BaseModel):
    district_code: str = Field(default="1120069000")
    district_name: str = Field(default="성동구 성수동")
    borough: str = Field(default="성동구")
    service_category: str = Field(default="dessert")
    weekday_group: str = Field(default="weekend")
    date_index: int = Field(default=48, ge=0)
    hour: int = Field(default=18, ge=0, le=23)
    month: int = Field(default=7, ge=1, le=12)
    holiday_count: int = Field(default=1, ge=0)
    subway_boarding: int = Field(default=42800, ge=0)
    subway_alighting: int = Field(default=45100, ge=0)
    living_population_total: int = Field(default=92000, ge=0)
    living_population_male_ratio: float = Field(default=0.51, ge=0, le=1)
    living_population_age_20_30_ratio: float = Field(default=0.34, ge=0, le=1)
    living_population_age_40_60_ratio: float = Field(default=0.36, ge=0, le=1)
    resident_population_total: int = Field(default=29000, ge=0)
    worker_population_total: int = Field(default=23000, ge=0)
    office_worker_ratio: float = Field(default=0.28, ge=0, le=1)
    facility_total_count: int = Field(default=76, ge=0)
    government_office_count: int = Field(default=3, ge=0)
    hospital_count: int = Field(default=9, ge=0)
    school_count: int = Field(default=6, ge=0)
    apartment_household_count: int = Field(default=5800, ge=0)
    apartment_avg_price_million_krw: float = Field(default=920.0, ge=0)
    store_count: int = Field(default=52, ge=0)
    franchise_store_count: int = Field(default=14, ge=0)
    rent_per_sqm_thousand_krw: float = Field(default=57.0, ge=0)
    vacancy_rate: float = Field(default=5.7, ge=0)
    lag_1_hour_footfall: float = Field(default=8100.0, ge=0)
    lag_24_hour_footfall: float = Field(default=7600.0, ge=0)


@app.get("/health")
def health() -> dict[str, Any]:
    return {"ok": True, "model_type": _metadata["model_type"], "trained_at": _metadata["trained_at"]}


@app.post("/train")
def train() -> dict[str, Any]:
    global _model, _metadata
    _metadata = train_and_save()
    _model, _metadata = load_artifacts()
    return {"status": "trained", "evaluation": _metadata["metrics"], "trained_at": _metadata["trained_at"]}


@app.get("/evaluation")
def evaluation() -> dict[str, Any]:
    return _metadata


@app.post("/predict")
def predict(request: FootfallForecastRequest) -> dict[str, Any]:
    row = pd.DataFrame([request.model_dump()])
    value = float(_model.predict(row[_metadata["features"]])[0])
    return {
        "prediction": int(round(value)),
        "unit": "visits",
        "target": _metadata["target"],
        "trained_at": _metadata["trained_at"],
    }
