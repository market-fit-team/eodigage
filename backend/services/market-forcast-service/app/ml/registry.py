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
        status="sample_trained",
        package="app.models.sales_momentum_forecast",
        artifact_name="model.joblib",
        description="Predicts next-quarter up/flat/down sales trend for district and service-category pairs.",
    ),
    ModelSpec(
        model_id="category_opportunity_score",
        task="regression",
        status="sample_trained",
        package="app.models.category_opportunity_score",
        artifact_name="model.joblib",
        description="Ranks service categories by opportunity score inside a commercial area.",
    ),
    ModelSpec(
        model_id="demand_gap_detector",
        task="classification",
        status="sample_trained",
        package="app.models.demand_gap_detector",
        artifact_name="model.joblib",
        description="Detects area-category pairs where demand signals are stronger than sales response.",
    ),
    ModelSpec(
        model_id="survey_market_fit_two_tower",
        task="retrieval",
        status="sample_trained",
        package="app.models.survey_market_fit_two_tower",
        artifact_name="user_tower.weights.h5,item_tower.weights.h5",
        description="Retrieves personalized area-category candidates from survey response embeddings.",
    ),
    ModelSpec(
        model_id="market_segment_clusterer",
        task="clustering",
        status="sample_trained",
        package="app.models.market_segment_clusterer",
        artifact_name="model.joblib",
        description="Clusters area-category candidates into interpretable market segment types.",
    ),
    ModelSpec(
        model_id="market_anomaly_detector",
        task="anomaly_detection",
        status="sample_trained",
        package="app.models.market_anomaly_detector",
        artifact_name="model.joblib",
        description="Detects unusual sales and footfall patterns for monitoring and warning badges.",
    ),
    ModelSpec(
        model_id="trend_ensemble_calibrator",
        task="calibration",
        status="sample_trained",
        package="app.models.trend_ensemble_calibrator",
        artifact_name="model.joblib",
        description="Calibrates multiple trend signals into one composite confidence score.",
    ),
    ModelSpec(
        model_id="graph_market_influence_ranker",
        task="graph_ranking",
        status="sample_trained",
        package="app.models.graph_market_influence_ranker",
        artifact_name="item_scores.json",
        description="Ranks area-category candidates with graph influence scores.",
    ),
    ModelSpec(
        model_id="xgb_personalized_reranker",
        task="learning_to_rank",
        status="sample_trained",
        package="app.models.xgb_personalized_reranker",
        artifact_name="model.joblib",
        description="Reranks two-tower candidates with XGBoost ranking features.",
    ),
]


def list_model_specs() -> list[ModelSpec]:
    return MODEL_SPECS


def get_model_spec(model_id: str) -> ModelSpec | None:
    return next((spec for spec in MODEL_SPECS if spec.model_id == model_id), None)
