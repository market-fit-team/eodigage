from __future__ import annotations

from pydantic import BaseModel


class ModelSpec(BaseModel):
    model_id: str
    task: str
    status: str
    package: str
    artifact_name: str
    description: str


MODEL_SPECS = [
    ModelSpec(
        model_id="subway_commercial_trend_score",
        task="regression",
        status="sample_trained",
        package="app.models.subway_commercial_trend_score",
        artifact_name="model.joblib",
        description="Scores short-term commercial-area inflow signal from subway alighting patterns.",
    ),
    ModelSpec(
        model_id="sales_momentum_forecast",
        task="classification",
        status="planned",
        package="app.models.sales_momentum_forecast",
        artifact_name="model.joblib",
        description="Predicts next-quarter up/flat/down sales trend for district and service-category pairs.",
    ),
    ModelSpec(
        model_id="category_opportunity_score",
        task="regression",
        status="planned",
        package="app.models.category_opportunity_score",
        artifact_name="model.joblib",
        description="Ranks service categories by opportunity score inside a commercial area.",
    ),
    ModelSpec(
        model_id="demand_gap_detector",
        task="classification",
        status="planned",
        package="app.models.demand_gap_detector",
        artifact_name="model.joblib",
        description="Detects area-category pairs where demand signals are stronger than sales response.",
    ),
]


def list_model_specs() -> list[ModelSpec]:
    return MODEL_SPECS


def get_model_spec(model_id: str) -> ModelSpec | None:
    return next((spec for spec in MODEL_SPECS if spec.model_id == model_id), None)
