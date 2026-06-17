from __future__ import annotations

from pydantic import BaseModel, Field

MODEL_ID = "subway_trend_signal"


class SubwayTrendFeatures(BaseModel):
    station_name: str
    line_name: str
    current_7d_boarding: float = Field(ge=0)
    current_7d_alighting: float = Field(ge=0)
    previous_7d_boarding: float = Field(ge=0)
    previous_7d_alighting: float = Field(ge=0)
    commute_alighting: float = Field(ge=0)
    lunch_alighting: float = Field(ge=0)
    night_alighting: float = Field(ge=0)
    weekend_ratio: float = Field(ge=0, le=1)


class SubwayTrendSignal(BaseModel):
    model_id: str = MODEL_ID
    station_name: str
    line_name: str
    trend_score: float
    boarding_growth_rate: float
    alighting_growth_rate: float

