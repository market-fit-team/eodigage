.PHONY: help install dev run run-up down-up clean-up test integration-tests lint typecheck format

ROOT_COMPOSE_PROJECT_NAME ?= $(notdir $(abspath ../../..))
export ROOT_COMPOSE_PROJECT_NAME
LANGGRAPH_UP_COMPOSE := docker-compose.langgraph-up.yml
LANGGRAPH_UP_PROJECT := agent-service-up

help:
	@echo 'Targets:'
	@echo '  install             Sync runtime dependencies with uv'
	@echo '  dev                 Sync project + dev dependencies with uv'
	@echo '  run                 Start the local LangGraph dev server (eval/manual)'
	@echo '  run-up              Start the local LangGraph up stack'
	@echo '  down-up             Stop the local LangGraph up stack'
	@echo '  clean-up            Stop the LangGraph up stack and remove volumes'
	@echo '  test                Run unit tests'
	@echo '  integration-tests   Run integration tests'
	@echo '  lint                Run Ruff checks'
	@echo '  typecheck           Run Pyright checks'
	@echo '  format              Format with Ruff'

install:
	uv sync --no-dev

dev:
	uv sync

run:
	uv run langgraph dev

# langgraph up는 langgraph-api(8000)를 host 2024로 열고,
# 같은 root compose 네트워크에 붙어 기존 MSA와 통신합니다.
run-up:
	COMPOSE_PROJECT_NAME=$(LANGGRAPH_UP_PROJECT) uv run langgraph up --wait --port 2024 --no-pull --docker-compose $(LANGGRAPH_UP_COMPOSE)

down-up:
	COMPOSE_PROJECT_NAME=$(LANGGRAPH_UP_PROJECT) docker compose -f $(LANGGRAPH_UP_COMPOSE) down --remove-orphans

clean-up:
	COMPOSE_PROJECT_NAME=$(LANGGRAPH_UP_PROJECT) docker compose -f $(LANGGRAPH_UP_COMPOSE) down --remove-orphans -v

test:
	uv run python -m pytest tests/unit_tests -q

integration-tests:
	uv run python -m pytest tests/integration_tests -q

lint:
	uv run python -m ruff check src tests

typecheck:
	uv run pyright src tests evals

format:
	uv run python -m ruff format src tests
