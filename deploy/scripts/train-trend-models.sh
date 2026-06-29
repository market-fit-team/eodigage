#!/usr/bin/env bash
# trend-service 컨테이너를 기동하고 배치로 점수·배너 스냅샷을 갱신한다.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "$ROOT_DIR/.." && pwd)"
STACK_FILE="${STACK_FILE:-$ROOT_DIR/compose/backend-public-stack.yml}"
COMPOSE_ENV_FILE="${COMPOSE_ENV_FILE:-$ROOT_DIR/.env}"
TREND_DB_SERVICE_NAME="${TREND_DB_SERVICE_NAME:-trend-db}"
TREND_SERVICE_NAME="${TREND_SERVICE_NAME:-trend-service}"
TREND_RAW_DIR="${TREND_RAW_DIR:-$REPO_ROOT/backend/services/trend-service/.raw}"
TREND_HDONG_NAME_FILE="${TREND_HDONG_NAME_FILE:-hdong_code_name.sample.csv}"

if [[ -f "$COMPOSE_ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$COMPOSE_ENV_FILE"
  set +a
fi

COMPOSE=(docker compose --env-file "$COMPOSE_ENV_FILE" -f "$STACK_FILE")

echo ">> trend-db / trend-service 기동"
"${COMPOSE[@]}" up -d --build "$TREND_DB_SERVICE_NAME" "$TREND_SERVICE_NAME"

if [[ -f "$TREND_RAW_DIR/$TREND_HDONG_NAME_FILE" ]]; then
  echo ">> trend-service 배치 실행 (.raw ingest 포함)"
  "${COMPOSE[@]}" run --rm "$TREND_SERVICE_NAME" python -m app.batch --ingest --force
else
  echo ">> trend-service 배치 실행 (.raw 없음, ingest 생략)"
  "${COMPOSE[@]}" run --rm "$TREND_SERVICE_NAME" python -m app.batch --force
fi

echo ">> done"
