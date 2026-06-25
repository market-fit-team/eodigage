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
    # key=세그먼트 식별자, label=노출 제목.
    # predicted=곧 뜰 동네(검증된 예측 모델), popular=요즘 뜨는 동네(최근 실측 증가).
    key: str
    label: str
    predicted: list[TrendForecastMetric]
    popular: list[TrendForecastMetric]


class TrendForecastBanner(BaseModel):
    # 프론트엔드 TrendForecastBanner 타입과 동일한 형태(카멜케이스)로 직렬화한다.
    model_config = ConfigDict(populate_by_name=True)

    eyebrow: str
    title: str
    description: str
    primary_cta: TrendForecastCta = Field(alias="primaryCta")
    secondary_cta: TrendForecastCta = Field(alias="secondaryCta")
    metrics: list[TrendForecastMetric]  # 하위호환: 통합 주제의 '곧 뜰' 상위 N개
    themes: list[TrendForecastTheme]  # 주제별 섹션(전체·남성·여성·20·30대) — 각 예측/인기
