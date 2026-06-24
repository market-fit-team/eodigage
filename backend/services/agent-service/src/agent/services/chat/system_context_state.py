from __future__ import annotations

from collections.abc import Mapping
from typing import Any
from uuid import UUID

from langchain_core.runnables import RunnableConfig

from agent.clients.onboarding_service import onboarding_service_client
from agent.db.session import get_session_factory
from agent.repositories.workspace import (
    artifact_repository,
    content_repository,
    document_repository,
    memory_repository,
    onboarding_context_repository,
)
from agent.services.chat.context import ChatRuntimeContext
from agent.services.chat.state import (
    MemorySummary,
    OnboardingSummary,
    SelectedArtifactContextState,
    SelectedDocumentContextState,
    SystemContextRefreshState,
    SystemContextState,
)


def empty_system_context_state() -> SystemContextState:
    return {
        "selected_documents": [],
        "selected_artifacts": [],
        "memory_summary": None,
        "onboarding_summary": None,
    }


def clean_system_context_refresh_state() -> SystemContextRefreshState:
    return {
        "memory_summary_dirty": False,
        "onboarding_summary_dirty": False,
    }


def parse_selected_ids(raw_ids: object) -> list[UUID]:
    """실행 컨텍스트의 선택 ID 목록을 UUID list로 정규화한다."""

    if not isinstance(raw_ids, list):
        return []
    resolved_ids: list[UUID] = []
    for raw_id in raw_ids:
        if not isinstance(raw_id, str):
            continue
        try:
            resolved_ids.append(UUID(raw_id))
        except ValueError:
            continue
    return resolved_ids


def extract_authenticated_user_identity(config: RunnableConfig) -> str | None:
    """LangGraph custom auth가 주입한 사용자 식별자를 읽는다."""

    configurable = config.get("configurable", {})
    if not isinstance(configurable, Mapping):
        return None
    raw_user = configurable.get("langgraph_auth_user")
    if not isinstance(raw_user, Mapping):
        return None
    identity = raw_user.get("identity")
    return identity if isinstance(identity, str) and identity else None


def extract_authenticated_user_access_token(config: RunnableConfig) -> str | None:
    """LangGraph custom auth가 주입한 사용자 액세스 토큰을 읽는다."""

    configurable = config.get("configurable", {})
    if not isinstance(configurable, Mapping):
        return None
    raw_user = configurable.get("langgraph_auth_user")
    if not isinstance(raw_user, Mapping):
        return None
    access_token = raw_user.get("access_token")
    return access_token if isinstance(access_token, str) and access_token else None


def extract_app_thread_id(context: ChatRuntimeContext | None) -> UUID | None:
    raw_thread_id = (context or {}).get("app_thread_id")
    if not isinstance(raw_thread_id, str):
        return None
    try:
        return UUID(raw_thread_id)
    except ValueError:
        return None


async def _build_selected_document_states(
    owner: str | None,
    *,
    context: ChatRuntimeContext | None,
) -> list[SelectedDocumentContextState]:
    if owner is None:
        return []
    selected_document_ids = parse_selected_ids((context or {}).get("selected_document_ids"))
    if not selected_document_ids:
        return []

    async with get_session_factory()() as session:
        document_records = await document_repository.list_by_ids(
            session, owner, selected_document_ids
        )
        contents = {
            content.id: content
            for content in await content_repository.list_by_ids(
                session, [record.content_id for record in document_records]
            )
        }

    return [
        {
            "id": str(record.id),
            "type": content.type,
            "title": content.title,
            "summary": content.summary,
        }
        for record in document_records
        if (content := contents.get(record.content_id)) is not None
    ]


async def _build_selected_artifact_states(
    owner: str | None,
    *,
    context: ChatRuntimeContext | None,
) -> list[SelectedArtifactContextState]:
    if owner is None:
        return []
    selected_artifact_ids = parse_selected_ids((context or {}).get("selected_artifact_ids"))
    if not selected_artifact_ids:
        return []

    async with get_session_factory()() as session:
        artifact_records = await artifact_repository.list_by_ids(
            session, owner, selected_artifact_ids
        )
        contents = {
            content.id: content
            for content in await content_repository.list_by_ids(
                session, [record.content_id for record in artifact_records]
            )
        }

    return [
        {
            "id": str(record.id),
            "type": content.type,
            "title": content.title,
            "summary": content.summary,
            "version": record.version,
        }
        for record in artifact_records
        if (content := contents.get(record.content_id)) is not None
    ]


async def _build_memory_summary(owner: str | None) -> MemorySummary | None:
    if owner is None:
        return None
    async with get_session_factory()() as session:
        memory_count = await memory_repository.count_enabled(session, owner)
    return {
        "has_memories": memory_count > 0,
        "memory_count": memory_count,
    }


async def _build_onboarding_summary(
    owner: str | None,
    *,
    access_token: str | None,
    app_thread_id: UUID | None,
) -> OnboardingSummary | None:
    if owner is None or access_token is None:
        return None

    has_thread_context = False
    if app_thread_id is not None:
        async with get_session_factory()() as session:
            has_thread_context = (
                await onboarding_context_repository.get(session, owner, app_thread_id)
            ) is not None

    try:
        default_profile = await onboarding_service_client.get_default_profile(access_token)
    except Exception:
        return None

    return {
        "has_default_profile": default_profile is not None,
        "has_thread_context": has_thread_context,
    }


async def prepare_system_context_state_update(
    current_system_context: SystemContextState | None,
    current_refresh: SystemContextRefreshState | None,
    *,
    config: RunnableConfig,
    context: ChatRuntimeContext | None,
) -> dict[str, Any]:
    owner = extract_authenticated_user_identity(config)
    access_token = extract_authenticated_user_access_token(config)
    app_thread_id = extract_app_thread_id(context)

    system_context = (
        {
            "selected_documents": list(current_system_context["selected_documents"]),
            "selected_artifacts": list(current_system_context["selected_artifacts"]),
            "memory_summary": current_system_context["memory_summary"],
            "onboarding_summary": current_system_context["onboarding_summary"],
        }
        if current_system_context is not None
        else empty_system_context_state()
    )
    refresh_state = (
        {
            "memory_summary_dirty": current_refresh["memory_summary_dirty"],
            "onboarding_summary_dirty": current_refresh["onboarding_summary_dirty"],
        }
        if current_refresh is not None
        else clean_system_context_refresh_state()
    )

    system_context["selected_documents"] = await _build_selected_document_states(
        owner, context=context
    )
    system_context["selected_artifacts"] = await _build_selected_artifact_states(
        owner, context=context
    )

    if current_system_context is None or refresh_state["memory_summary_dirty"]:
        system_context["memory_summary"] = await _build_memory_summary(owner)
        refresh_state["memory_summary_dirty"] = False

    if current_system_context is None or refresh_state["onboarding_summary_dirty"]:
        system_context["onboarding_summary"] = await _build_onboarding_summary(
            owner,
            access_token=access_token,
            app_thread_id=app_thread_id,
        )
        refresh_state["onboarding_summary_dirty"] = False

    return {
        "system_context": system_context,
        "system_context_refresh": refresh_state,
    }
