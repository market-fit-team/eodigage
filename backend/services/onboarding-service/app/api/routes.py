from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.concurrency import run_in_threadpool

from app.api.deps import get_db_session
from app.core.config import settings
from app.models.onboarding_two_tower.runtime import evaluation_payload, train_runtime
from app.two_tower.contracts import (
    CatalogResponse,
    EvaluationResponse,
    PredictRequest,
    PredictResponse,
    ResolvedProfileResponse,
    SaveUserTowerProfileRequest,
    TrainRequest,
)
from app.two_tower.service import (
    get_catalog_response,
    get_saved_profile_response,
    resolve_prediction_response,
    resolve_shared_profile_response,
    upsert_saved_profile_response,
)

router = APIRouter()


@router.get(
    "/health",
    tags=["system"],
    summary="서비스 상태 조회",
    description="현재 로드된 온보딩 투타워 모델의 기본 상태를 반환한다.",
)
async def health() -> dict[str, Any]:
    evaluation = await run_in_threadpool(evaluation_payload)
    return {
        "ok": True,
        "service": settings.service_name,
        "version": settings.service_version,
        "model_id": settings.model_id,
        "trained_at": evaluation["trained_at"],
        "item_count": evaluation["item_count"],
    }


@router.get(
    "/two-tower/catalog",
    response_model=CatalogResponse,
    tags=["two-tower"],
    summary="투타워 카탈로그 조회",
    description="예제 화면 초기 렌더링에 필요한 유저 컨트롤, 샘플 프로필, 아이템 미리보기를 반환한다.",
)
async def two_tower_catalog() -> CatalogResponse:
    return await get_catalog_response()


@router.get(
    "/two-tower/evaluation",
    response_model=EvaluationResponse,
    tags=["two-tower"],
    summary="투타워 학습 지표 조회",
    description="현재 artifact 기준의 학습 시간, 손실값, retrieval 지표를 반환한다.",
)
async def two_tower_evaluation() -> EvaluationResponse:
    return EvaluationResponse.model_validate(await run_in_threadpool(evaluation_payload))


@router.post(
    "/two-tower/train",
    response_model=EvaluationResponse,
    tags=["two-tower"],
    summary="투타워 모델 재학습",
    description="샘플 프로필과 샘플 아이템 카탈로그를 사용해 온보딩 투타워 모델을 다시 학습한다.",
)
async def train_two_tower(request: TrainRequest) -> EvaluationResponse:
    return EvaluationResponse.model_validate(await run_in_threadpool(train_runtime, request.epochs))


@router.post(
    "/two-tower/predict",
    response_model=PredictResponse,
    tags=["two-tower"],
    summary="투타워 추천 계산",
    description="프론트에서 조정한 유저 타워 입력값으로 행정동-업종 후보를 다시 정렬한다.",
)
async def predict_two_tower(
    request: PredictRequest,
    session: AsyncSession = Depends(get_db_session),
) -> PredictResponse:
    return await resolve_prediction_response(
        session=session,
        user_profile=request.user_profile.model_dump(),
        top_k=request.top_k,
    )


@router.get(
    "/two-tower/profiles/users/{auth_user_uuid}",
    response_model=ResolvedProfileResponse,
    tags=["two-tower"],
    summary="사용자 저장 프로필 조회",
    description="JWT의 user_profile.uuid에 대응하는 현재 유저 타워 프로필과 추천 결과를 조회한다.",
)
async def get_two_tower_profile_by_user(
    auth_user_uuid: str,
    top_k: int = Query(default=5, ge=1, le=10, description="함께 조회할 추천 개수"),
    session: AsyncSession = Depends(get_db_session),
) -> ResolvedProfileResponse:
    return await get_saved_profile_response(
        session=session,
        auth_user_uuid=auth_user_uuid,
        top_k=top_k,
    )


@router.put(
    "/two-tower/profiles/users/{auth_user_uuid}",
    response_model=ResolvedProfileResponse,
    tags=["two-tower"],
    summary="사용자 유저 타워 저장 또는 수정",
    description="JWT의 user_profile.uuid를 기준으로 현재 유저 타워 점수와 원문 응답 JSON을 저장한다.",
)
async def put_two_tower_profile_by_user(
    auth_user_uuid: str,
    request: SaveUserTowerProfileRequest,
    session: AsyncSession = Depends(get_db_session),
) -> ResolvedProfileResponse:
    return await upsert_saved_profile_response(
        session=session,
        auth_user_uuid=auth_user_uuid,
        request=request,
    )


@router.get(
    "/two-tower/profiles/code/{profile_code}",
    response_model=ResolvedProfileResponse,
    tags=["two-tower"],
    summary="공유 코드 기반 프로필 조회",
    description="base36 공유 코드만으로 유저 타워 점수를 복원하고 추천 결과를 반환한다.",
)
async def get_two_tower_profile_by_code(
    profile_code: str,
    top_k: int = Query(default=5, ge=1, le=10, description="함께 조회할 추천 개수"),
    session: AsyncSession = Depends(get_db_session),
) -> ResolvedProfileResponse:
    return await resolve_shared_profile_response(
        session=session,
        profile_code=profile_code,
        top_k=top_k,
    )
