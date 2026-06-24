from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class TrendForecastCta(BaseModel):
    label: str
    href: str


class TrendForecastMetric(BaseModel):
    label: str
    value: str
    description: str


class TrendForecastTheme(BaseModel):
    # key=세그먼트 식별자, label=노출 제목, metrics=주제당 상위 N개
    # score_type: forecast(다음 7일 예측 증감률) / weekend_affinity(주말 쏠림, 예측 아님)
    model_config = ConfigDict(populate_by_name=True)

    key: str
    label: str
    score_type: str = Field(alias="scoreType")
    metrics: list[TrendForecastMetric]


class TrendForecastBanner(BaseModel):
    # 프론트엔드 TrendForecastBanner 타입과 동일한 형태(카멜케이스)로 직렬화한다.
    model_config = ConfigDict(populate_by_name=True)

    eyebrow: str
    title: str
    description: str
    primary_cta: TrendForecastCta = Field(alias="primaryCta")
    secondary_cta: TrendForecastCta = Field(alias="secondaryCta")
    metrics: list[TrendForecastMetric]  # 하위호환: 전체 주제의 상위 N개
    themes: list[TrendForecastTheme]  # 주제별 섹션(전체·주말·남성·여성·20·30대)
    as_of_date: str | None = Field(alias="asOfDate", default=None)  # 데이터 기준일(신선도 표시)
    forecast_days: int = Field(alias="forecastDays", default=7)  # 예측 지평(다음 N일)
