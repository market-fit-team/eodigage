from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException

from app.core.config import settings
from app.ml.artifacts import get_artifact_metadata
from app.ml.registry import get_model_spec, list_model_specs

router = APIRouter()


@router.get("/health")
def health() -> dict[str, Any]:
    return {
        "ok": True,
        "service": settings.service_name,
        "version": settings.service_version,
        "models": [spec.model_id for spec in list_model_specs()],
    }


@router.get("/models")
def models() -> list[dict[str, Any]]:
    return [spec.model_dump() for spec in list_model_specs()]


@router.get("/models/{model_id}")
def model_detail(model_id: str) -> dict[str, Any]:
    spec = get_model_spec(model_id)
    if spec is None:
        raise HTTPException(status_code=404, detail=f"Unknown model_id: {model_id}")
    return {
        "spec": spec.model_dump(),
        "artifact": get_artifact_metadata(model_id),
    }


@router.post("/models/{model_id}/train")
def train_model(model_id: str) -> dict[str, Any]:
    spec = get_model_spec(model_id)
    if spec is None:
        raise HTTPException(status_code=404, detail=f"Unknown model_id: {model_id}")
    raise HTTPException(
        status_code=501,
        detail=f"{model_id} trainer is not implemented yet. Add app/models/{model_id}/train.py.",
    )


@router.post("/models/{model_id}/predict")
def predict(model_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    spec = get_model_spec(model_id)
    if spec is None:
        raise HTTPException(status_code=404, detail=f"Unknown model_id: {model_id}")
    raise HTTPException(
        status_code=501,
        detail=f"{model_id} predictor is not implemented yet. Add app/models/{model_id}/predict.py.",
    )

