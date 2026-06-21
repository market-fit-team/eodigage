from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class UserProfilePayload(BaseModel):
    user_id: str = Field(default="ad_hoc_user", description="프로필 식별자")
    profile_name: str = Field(default="사용자 조정 프로필", description="프론트에 표시할 프로필 이름")
    preferred_category_code: str = Field(default="CS100001", description="선호 업종 코드")
    budget_level: int = Field(default=3, ge=1, le=5, description="예산 허용치")
    stability_level: int = Field(default=3, ge=1, le=5, description="안정성 선호도")
    subway_dependency_level: int = Field(default=3, ge=1, le=5, description="지하철 의존도")
    weekend_preference_level: int = Field(default=3, ge=1, le=5, description="주말 매출 선호도")
    evening_preference_level: int = Field(default=3, ge=1, le=5, description="저녁 운영 선호도")
    resident_focus_level: int = Field(default=3, ge=1, le=5, description="거주민 수요 집중도")
    worker_focus_level: int = Field(default=3, ge=1, le=5, description="직장인 수요 집중도")
    rent_sensitivity_level: int = Field(default=3, ge=1, le=5, description="임대료 민감도")
    competition_tolerance_level: int = Field(default=3, ge=1, le=5, description="경쟁 허용도")


class TrainRequest(BaseModel):
    epochs: int = Field(default=16, ge=1, le=80, description="학습 epoch 수")


class PredictRequest(BaseModel):
    top_k: int = Field(default=5, ge=1, le=10, description="반환할 추천 개수")
    user_profile: UserProfilePayload


class SaveUserTowerProfileRequest(BaseModel):
    top_k: int = Field(default=5, ge=1, le=10, description="캐시와 응답에 사용할 추천 개수")
    source: Literal["manual", "preset", "survey", "shared_url"] = Field(
        default="manual",
        description="현재 프로필이 만들어진 경로",
    )
    raw_answers: dict[str, Any] | None = Field(
        default=None,
        description="설문 원문 응답을 그대로 보관할 때 사용하는 JSON",
    )
    user_profile: UserProfilePayload


class FeatureControl(BaseModel):
    name: str
    label: str
    description: str
    minimum: int = Field(default=1)
    maximum: int = Field(default=5)


class CategoryOption(BaseModel):
    code: str
    label: str


class RecommendationItem(BaseModel):
    rank: int
    score: float
    item_id: str
    area_name: str
    service_category_name: str
    area_profile_type: str
    sales_amount: float
    weekend_sales_ratio: float
    evening_sales_ratio: float
    resident_population: int
    worker_population: int
    subway_commercial_trend_score: float
    category_opportunity_score: float
    demand_gap_score: float


class EvaluationResponse(BaseModel):
    model_id: str
    trained_at: str
    epochs: int
    rows: int
    user_count: int
    item_count: int
    embedding_dim: int
    final_loss: float
    hit_rate_at_3: float
    mrr: float
    artifact_paths: dict[str, str]
    user_string_features: list[str]
    user_numeric_features: list[str]
    item_string_features: list[str]
    item_numeric_features: list[str]


class CatalogResponse(BaseModel):
    model_id: str
    profile_code_prefix: str
    profile_schema_version: int
    feature_controls: list[FeatureControl]
    category_options: list[CategoryOption]
    sample_profiles: list[UserProfilePayload]
    item_preview: list[dict[str, Any]]
    evaluation: EvaluationResponse


class PredictResponse(BaseModel):
    trained_at: str
    model_signature: str
    top_k: int
    profile_code: str
    profile_schema_version: int
    share_path: str
    share_url: str
    user_profile: UserProfilePayload
    recommendations: list[RecommendationItem]


class StoredUserTowerProfile(BaseModel):
    auth_user_uuid: str | None
    profile_code: str
    profile_schema_version: int
    share_path: str
    share_url: str
    source: str
    updated_at: str | None
    raw_answers: dict[str, Any] | None = None
    user_profile: UserProfilePayload


class ResolvedProfileResponse(BaseModel):
    profile: StoredUserTowerProfile
    prediction: PredictResponse
