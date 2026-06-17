from __future__ import annotations

from pydantic import BaseModel, Field

MODEL_ID = "market_trend_classifier"


class MarketTrendFeatures(BaseModel):
    quarter_code: int = Field(ge=200001)
    district_code: str
    district_name: str
    service_category_code: str
    service_category_name: str
    sales_amount: float = Field(ge=0)
    sales_count: float = Field(ge=0)
    resident_population: float = Field(ge=0)
    worker_population: float = Field(ge=0)
    living_population: float = Field(ge=0)
    consumption_total: float = Field(ge=0)
    attraction_facility_count: float = Field(ge=0)
    apartment_average_price: float = Field(ge=0)
    subway_trend_score: float | None = None


class MarketTrendPrediction(BaseModel):
    model_id: str = MODEL_ID
    trend: str
    score: float = Field(ge=0, le=1)
    label_scores: dict[str, float]

