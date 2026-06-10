from agent.services.chat.context import resolve_chat_model_context


def test_resolve_chat_model_context_uses_catalog_default_when_context_missing() -> None:
    result = resolve_chat_model_context(None)

    assert result == {
        "model": "gpt-oss:120b",
        "reasoning_effort": "medium",
    }


def test_resolve_chat_model_context_uses_selected_model_default_effort() -> None:
    result = resolve_chat_model_context({"model": "deepseek-v4-flash"})

    assert result == {
        "model": "deepseek-v4-flash",
        "reasoning_effort": "high",
    }


def test_resolve_chat_model_context_keeps_explicit_effort() -> None:
    result = resolve_chat_model_context(
        {
            "model": "gpt-oss:120b",
            "reasoning_effort": "low",
            "allowed_tools": ["add"],
            "interrupt_on": {},
        }
    )

    assert result == {
        "model": "gpt-oss:120b",
        "reasoning_effort": "low",
    }
