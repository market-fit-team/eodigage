from __future__ import annotations

import json
from importlib import resources
from pathlib import Path

# langgraph-api 0.9.0은 StreamMode 타입/런타임에는 tools/lifecycle이 있지만,
# bundled openapi.json의 RunCreateStateful stream_mode enum에는 누락되어 422가 발생한다.
# 이 스크립트는 런타임 monkey patch가 아니라, 설치된 vendor schema 파일만 빌드/개발환경 준비 시점에 보정한다.
# 근거:
# https://github.com/langchain-ai/langgraph/issues/7986
# https://docs.langchain.com/oss/javascript/langgraph/streaming#tool-progress
EXTRA_STREAM_MODES = ("tools", "lifecycle")

STREAM_MODE_ENUM_FINGERPRINT = {
    "values",
    "messages",
    "messages-tuple",
    "tasks",
    "checkpoints",
    "updates",
    "events",
    "debug",
    "custom",
}


def _patch_stream_mode_enum(value: object) -> int:
    patched = 0

    if isinstance(value, dict):
        enum = value.get("enum")

        if isinstance(enum, list) and STREAM_MODE_ENUM_FINGERPRINT.issubset(set(enum)):
            for mode in EXTRA_STREAM_MODES:
                if mode not in enum:
                    enum.append(mode)
                    patched += 1

        for child in value.values():
            patched += _patch_stream_mode_enum(child)

    elif isinstance(value, list):
        for child in value:
            patched += _patch_stream_mode_enum(child)

    return patched


def patch_langgraph_api_openapi() -> int:
    import langgraph_api
    openapi_path = Path(langgraph_api.__file__).parent.parent / "openapi.json"
    schema = json.loads(openapi_path.read_text(encoding="utf-8"))

    patched = _patch_stream_mode_enum(schema)

    if patched:
        openapi_path.write_text(
            json.dumps(schema, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

    return patched


def main() -> None:
    patched = patch_langgraph_api_openapi()
    print(f"[langgraph-openapi-patch] patched stream_mode enum entries: {patched}")


if __name__ == "__main__":
    main()
