#!/usr/bin/env bash
# onboarding-service 컨테이너 안에서 두 개의 모델을 순서대로 학습한다.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STACK_FILE="${STACK_FILE:-$ROOT_DIR/compose/backend-public-stack.yml}"
COMPOSE_ENV_FILE="${COMPOSE_ENV_FILE:-$ROOT_DIR/.env}"

if [[ -f "$COMPOSE_ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$COMPOSE_ENV_FILE"
  set +a
fi

ONBOARDING_SERVICE_NAME="${ONBOARDING_SERVICE_NAME:-onboarding-service}"
TWO_TOWER_EPOCHS="${ONBOARDING_TWO_TOWER_EPOCHS:-20}"
CATEGORY_TOWER_EPOCHS="${ONBOARDING_CATEGORY_TOWER_EPOCHS:-24}"
CATEGORY_DATA_MODE="${ONBOARDING_CATEGORY_DATA_MODE:-sample}"

COMPOSE=(docker compose --env-file "$COMPOSE_ENV_FILE" -f "$STACK_FILE")

echo ">> onboarding_two_tower 학습 시작 (epochs=${TWO_TOWER_EPOCHS})"
"${COMPOSE[@]}" exec -T "$ONBOARDING_SERVICE_NAME" \
  python -m app.models.onboarding_two_tower.train --epochs "$TWO_TOWER_EPOCHS"

echo ">> onboarding_category_tower 학습 시작 (epochs=${CATEGORY_TOWER_EPOCHS}, data_mode=${CATEGORY_DATA_MODE})"
"${COMPOSE[@]}" exec -T "$ONBOARDING_SERVICE_NAME" \
  python -m app.models.onboarding_category_tower.train --epochs "$CATEGORY_TOWER_EPOCHS" --data-mode "$CATEGORY_DATA_MODE"

echo ">> done"
