SHELL := /bin/bash

.PHONY: gateway data restore-db services train-models up ps logs status down clean

COMPOSE := docker compose --env-file .env -f compose/backend-public-stack.yml
RESTORE_SCRIPT := ./scripts/restore-backend-db-market-franchise.sh
TRAIN_SCRIPT := ./scripts/train-onboarding-models.sh

GATEWAY_SERVICES := traefik
DATA_SERVICES := authentik-db backend-db community-db onboarding-db agent-db post-db redis rabbitmq minio minio-init
APP_SERVICES := authentik-server authentik-worker profile-service echo-service franchise-service market-service onboarding-service agent-service community-service post-service

gateway:
	@echo "Traefik 공개 게이트웨이를 시작합니다..."
	@$(COMPOSE) up -d $(GATEWAY_SERVICES)

data:
	@echo "배포용 데이터 저장소를 시작합니다..."
	@$(COMPOSE) up -d $(DATA_SERVICES)

restore-db:
	@if [[ "$${SKIP_RESTORE:-0}" == "1" ]]; then \
		echo "DB 덤프 복원을 건너뜁니다. SKIP_RESTORE=1"; \
	else \
		echo "market / franchise 덤프를 backend-db에 복원합니다..."; \
		$(RESTORE_SCRIPT); \
	fi

services:
	@echo "백엔드 서비스를 빌드하고 시작합니다..."
	@$(COMPOSE) up -d --build $(APP_SERVICES)

train-models:
	@if [[ "$${SKIP_TRAIN:-0}" == "1" ]]; then \
		echo "온보딩 모델 학습을 건너뜁니다. SKIP_TRAIN=1"; \
	else \
		echo "온보딩 모델 학습을 실행합니다..."; \
		$(TRAIN_SCRIPT); \
	fi

up: gateway data restore-db services train-models

ps:
	@$(COMPOSE) ps

logs:
	@$(COMPOSE) logs -f --tail=200

status:
	@$(COMPOSE) ps
	@set -a; source .env; set +a; \
		echo "auth host 확인: $$AUTH_PUBLIC_ORIGIN/application/o/$$AUTHENTIK_CLIENT_ID/.well-known/openid-configuration"; \
		echo "market status 확인: $$API_PUBLIC_ORIGIN/api/market/api/v1/status"; \
		echo "franchise status 확인: $$API_PUBLIC_ORIGIN/api/franchise/api/v1/status"; \
		echo "onboarding health 확인: $$API_PUBLIC_ORIGIN/api/onboarding/health"

down:
	@$(COMPOSE) down

clean:
	@$(COMPOSE) down --remove-orphans -v
