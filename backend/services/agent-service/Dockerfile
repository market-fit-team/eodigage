FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim

WORKDIR /app

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    LANGGRAPH_CLI_NO_ANALYTICS=1

COPY pyproject.toml langgraph.json README.md Makefile ./
COPY src ./src
COPY evals ./evals
COPY scripts ./scripts

RUN uv sync --no-dev

# langgraph-api 0.9.0의 bundled openapi.json validator enum 누락 보정.
# 런타임 monkey patch가 아니라 Docker image 빌드 시점에 vendor schema만 수정한다.
# 근거:
# https://github.com/langchain-ai/langgraph/issues/7986
# https://docs.langchain.com/oss/javascript/langgraph/streaming#tool-progress
RUN uv run python scripts/patch_langgraph_api_openapi_stream_modes.py

EXPOSE 2024

CMD ["uv", "run", "langgraph", "dev", "--host", "0.0.0.0", "--port", "2024", "--no-browser"]
