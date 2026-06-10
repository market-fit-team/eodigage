from pathlib import Path
from typing import get_args

import pytest


SERVICE_ROOT = Path(__file__).resolve().parents[2]
REQUIRED_NATIVE_STREAM_MODES = {"values", "messages-tuple", "tools", "updates"}


def test_monkey_patch_file_is_removed() -> None:
    assert not (SERVICE_ROOT / "sitecustomize.py").exists()


def test_langgraph_api_validator_accepts_native_tool_stream_mode_when_installed() -> None:
    """sitecustomize 없이 tools stream mode를 받아야 useStream().toolProgress가 동작한다.

    langgraph-api 0.9.0은 타입/런타임에는 tools가 있지만 bundled OpenAPI validator가
    tools/lifecycle을 누락해 422를 냈던 버전이다. 이 테스트는 패치 제거 후 서버 의존성이
    upstream native 계약을 실제로 만족하는지 확인하는 게이트다.

    근거:
    - https://github.com/langchain-ai/langgraph/issues/7986
    - https://docs.langchain.com/langsmith/agent-server-api/thread-runs/create-run-stream-output
    """

    schema = pytest.importorskip("langgraph_api.schema")
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
