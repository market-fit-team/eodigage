from typing import cast

from langchain_core.messages import AnyMessage, SystemMessage
from langchain_core.runnables import RunnableConfig
from langgraph.runtime import Runtime

from agent.services.chat.context import ChatRuntimeContext, resolve_chat_model_context
from agent.services.chat.models import get_chat_model
from agent.services.chat.state import ChatState
from agent.services.chat.toolkits.chat_toolkit import CHAT_TOOLS


CHAT_SYSTEM_PROMPT = "도구 호출이 완료된 뒤에는 결과를 사용자에게 보고해야 합니다."


async def call_chat_model(
    state: ChatState,
    config: RunnableConfig,
    runtime: Runtime[ChatRuntimeContext],
) -> dict[str, list[AnyMessage]]:
    """등록된 tool schema를 붙여 chat model을 호출하는 LangGraph node입니다."""

    context = resolve_chat_model_context(runtime.context)
    model = get_chat_model(
        model=context["model"],
        reasoning_effort=context["reasoning_effort"],
    ).bind_tools(CHAT_TOOLS)
    response = await model.ainvoke(
        [SystemMessage(content=CHAT_SYSTEM_PROMPT), *state["messages"]],
        config=config,
    )
    return {"messages": [cast(AnyMessage, response)]}
