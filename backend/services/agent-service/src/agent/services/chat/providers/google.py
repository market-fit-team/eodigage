from collections.abc import AsyncIterator, Iterator
from typing import Any

from langchain_google_genai import ChatGoogleGenerativeAI

from agent.core.config import settings
from agent.schemas.chat import ReasoningEffort
from agent.services.chat.model_cards import ChatModelRoute
from agent.services.chat.providers.normalized import (
    normalize_chat_generation,
    normalize_chat_result,
)


class ChatGoogleGenerativeAINormalized(ChatGoogleGenerativeAI):
    """Google Gemma thinking blocks를 LangGraph stream 전에 정규화한다."""

    def _generate(self, *args: Any, **kwargs: Any) -> Any:
        return normalize_chat_result(super()._generate(*args, **kwargs))

    async def _agenerate(self, *args: Any, **kwargs: Any) -> Any:
        return normalize_chat_result(await super()._agenerate(*args, **kwargs))

    def _stream(self, *args: Any, **kwargs: Any) -> Iterator[Any]:
        for generation in super()._stream(*args, **kwargs):
            yield normalize_chat_generation(generation)

    async def _astream(self, *args: Any, **kwargs: Any) -> AsyncIterator[Any]:
        async for generation in super()._astream(*args, **kwargs):
            yield normalize_chat_generation(generation)


def create_google_chat_model(*, route: ChatModelRoute, reasoning_effort: ReasoningEffort) -> Any:
    kwargs: dict[str, Any] = {
        "model": route.langchain_model,
        "api_key": settings.gemini_api_key,
    }
    if reasoning_effort != "none":
        kwargs["thinking_level"] = reasoning_effort

    return ChatGoogleGenerativeAINormalized(**kwargs)
