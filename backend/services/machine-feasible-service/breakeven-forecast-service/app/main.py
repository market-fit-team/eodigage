from __future__ import annotations

from typing import Any

import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel, Field

from app.train import load_artifacts, train_and_save

app = FastAPI(
    title="breakeven-forecast-service",
    version="1.0.0",
    description="XGBoost regression service for franchise breakeven month forecasts.",
)

_model, _metadata = load_artifacts()


class BreakevenForecastRequest(BaseModel):
    district_code: str = Field(default="1168064000")
    district_name: str = Field(default="강남구 역삼동")
    borough: str = Field(default="강남구")
    service_category: str = Field(default="coffee")
    district_grade: str = Field(default="B")
    store_size: str = Field(default="medium")
    commercial_change_grade: str = Field(default="stable")
    initial_cost_million_krw: float = Field(default=145.0, ge=0)
    franchise_deposit_million_krw: float = Field(default=18.0, ge=0)
    franchise_education_million_krw: float = Field(default=4.0, ge=0)
    franchise_other_cost_million_krw: float = Field(default=42.0, ge=0)
    monthly_rent_million_krw: float = Field(default=7.8, ge=0)
    rent_per_sqm_thousand_krw: float = Field(default=82.0, ge=0)
    vacancy_rate: float = Field(default=6.2, ge=0)
    monthly_labor_cost_million_krw: float = Field(default=8.5, ge=0)
    expected_monthly_sales_million_krw: float = Field(default=62.0, ge=0)
    avg_brand_sales_million_krw: float = Field(default=70.0, ge=0)
    avg_sales_per_area_million_krw: float = Field(default=5.8, ge=0)
    gross_margin_rate: float = Field(default=0.42, ge=0, le=1)
    delivery_ratio: float = Field(default=0.22, ge=0, le=1)
    store_count: int = Field(default=58, ge=0)
    franchise_store_count: int = Field(default=17, ge=0)
    opening_store_count: int = Field(default=6, ge=0)
    closing_store_count: int = Field(default=4, ge=0)
    average_operating_months: float = Field(default=58.0, ge=0)
    survival_rate_3y: float = Field(default=0.54, ge=0, le=1)
    closure_rate: float = Field(default=0.07, ge=0, le=1)
    change_indicator_score: float = Field(default=0.52, ge=0, le=1)
    facility_total_count: int = Field(default=91, ge=0)
    subway_peak_boarding: int = Field(default=52000, ge=0)
    working_capital_million_krw: float = Field(default=32.0, ge=0)


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
def predict(request: BreakevenForecastRequest) -> dict[str, Any]:
    row = pd.DataFrame([request.model_dump()])
    value = float(_model.predict(row[_metadata["features"]])[0])
    return {
        "prediction": round(value, 2),
        "unit": "months",
        "target": _metadata["target"],
        "trained_at": _metadata["trained_at"],
    }
