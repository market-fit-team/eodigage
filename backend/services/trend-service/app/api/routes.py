from __future__ import annotations

from typing import Any

from fastapi import APIRouter
from starlette.concurrency import run_in_threadpool

from app.core.config import settings
from app.models.commercial_trend.runtime import evaluation_payload
from app.trend.contracts import TrendForecastBanner
from app.trend.service import build_banner

router = APIRouter()


@router.get(
    "/health",
    tags=["system"],
    summary="서비스 상태 조회",
    description="트렌드 점수 모델의 적재 상태를 반환한다.",
)
async def health() -> dict[str, Any]:
    model = await run_in_threadpool(evaluation_payload)
    return {
        "ok": True,
        "service": settings.service_name,
        "version": settings.service_version,
        "model": model,
    }


@router.get(
    "/api/v1/trend/banner",
    tags=["trend"],
    summary="상권 트렌드 배너 조회",
    description="상위 상권의 트렌드 점수를 배너 형태로 반환한다.",
    response_model=TrendForecastBanner,
)
async def trend_banner() -> TrendForecastBanner:
    return await run_in_threadpool(build_banner)
