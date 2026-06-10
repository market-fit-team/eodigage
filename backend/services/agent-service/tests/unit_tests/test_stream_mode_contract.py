from __future__ import annotations

from typing import get_args

import pytest

from scripts.patch_langgraph_api_openapi_stream_modes import patch_langgraph_api_openapi

REQUIRED_NATIVE_STREAM_MODES = {"values", "messages-tuple", "updates", "tools"}


def test_langgraph_api_validator_accepts_native_tool_stream_mode_when_installed() -> None:
    """tools stream mode가 RunCreateStateful validator를 통과해야 useStream().toolProgress가 동작한다.

    langgraph-api 0.9.0은 타입/런타임에는 tools/lifecycle이 있지만,
    bundled openapi.json validator enum에서 누락되어 422를 낸다.
    이 테스트는 vendor schema patch 후 local uv run 환경에서도 같은 계약이 성립하는지 확인한다.

    근거:
    https://github.com/langchain-ai/langgraph/issues/7986
    https://docs.langchain.com/oss/javascript/langgraph/streaming#tool-progress
    """

    schema = pytest.importorskip("langgraph_api.schema")

    # validation 모듈이 import되기 전에 openapi.json을 보정해야 한다.
    # validation import 후에는 jsonschema_rs.Validator가 이미 생성될 수 있다.
    # 근거:
    # https://github.com/langchain-ai/langgraph/issues/7986
    patch_langgraph_api_openapi()

    validation = pytest.importorskip("langgraph_api.validation")

    stream_modes = set(get_args(schema.StreamMode))
    assert REQUIRED_NATIVE_STREAM_MODES <= stream_modes

    payload = {
        "assistant_id": "chat",
        "input": {"messages": [{"role": "human", "content": "1+2 계산해줘"}]},
        "context": {
            "model": "gpt-oss:120b",
            "reasoning_effort": "medium",
            "allowed_tools": ["add"],
            "interrupt_on": {},
        },
        "stream_mode": sorted(REQUIRED_NATIVE_STREAM_MODES),
        "stream_resumable": True,
    }

    assert validation.RunCreateStateful.is_valid(payload)
