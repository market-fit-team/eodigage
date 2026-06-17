from __future__ import annotations

from typing import Any

import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel, Field

from app.train import load_artifacts, train_and_save

app = FastAPI(
    title="revenue-forecast-service",
    version="1.0.0",
    description="XGBoost regression service for next-month franchise revenue forecasts.",
)

_model, _metadata = load_artifacts()


class RevenueForecastRequest(BaseModel):
    district_code: str = Field(default="1168064000")
    district_name: str = Field(default="강남구 역삼동")
    borough: str = Field(default="강남구")
    service_category: str = Field(default="coffee")
    quarter_code: int = Field(default=202604, ge=200000)
    resident_population_total: int = Field(default=31000, ge=0)
    resident_age_20_30_ratio: float = Field(default=0.31, ge=0, le=1)
    resident_age_40_60_ratio: float = Field(default=0.37, ge=0, le=1)
    worker_population_total: int = Field(default=42000, ge=0)
    living_population_total: int = Field(default=88000, ge=0)
    subway_peak_boarding: int = Field(default=52000, ge=0)
    subway_peak_alighting: int = Field(default=49500, ge=0)
    food_spend_ratio: float = Field(default=0.34, ge=0, le=1)
    apparel_spend_ratio: float = Field(default=0.09, ge=0, le=1)
    medical_spend_ratio: float = Field(default=0.08, ge=0, le=1)
    weekday_sales_ratio: float = Field(default=0.61, ge=0, le=1)
    weekend_sales_ratio: float = Field(default=0.39, ge=0, le=1)
    lunch_sales_ratio: float = Field(default=0.28, ge=0, le=1)
    dinner_sales_ratio: float = Field(default=0.31, ge=0, le=1)
    store_count: int = Field(default=58, ge=0)
    franchise_store_count: int = Field(default=17, ge=0)
    opening_store_count: int = Field(default=6, ge=0)
    closing_store_count: int = Field(default=4, ge=0)
    facility_total_count: int = Field(default=91, ge=0)
    hospital_count: int = Field(default=11, ge=0)
    school_count: int = Field(default=4, ge=0)
    apartment_household_count: int = Field(default=6400, ge=0)
    apartment_avg_price_million_krw: float = Field(default=1780.0, ge=0)
    rent_per_sqm_thousand_krw: float = Field(default=82.0, ge=0)
    vacancy_rate: float = Field(default=6.4, ge=0)
    lag_1_estimated_sales_million_krw: float = Field(default=118.0, ge=0)
    lag_4_estimated_sales_million_krw: float = Field(default=103.0, ge=0)


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
def predict(request: RevenueForecastRequest) -> dict[str, Any]:
    row = pd.DataFrame([request.model_dump()])
    value = float(_model.predict(row[_metadata["features"]])[0])
    return {
        "prediction": round(value, 3),
        "unit": "million_krw",
        "target": _metadata["target"],
        "trained_at": _metadata["trained_at"],
    }
