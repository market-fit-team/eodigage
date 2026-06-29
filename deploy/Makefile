SHELL := /bin/bash

.PHONY: validate-env reset reset-hard reset-frontend gateway data restore-db services frontend-codegen frontend train-onboarding-models train-trend-models train-models up up-mac ps logs status down clean

COMPOSE := docker compose --env-file .env -f compose/backend-public-stack.yml
MAC_COMPOSE := docker compose --env-file .env -f compose/backend-public-stack.yml -f compose/backend-public-stack.mac.yml
NO_CACHE ?= 0
VALIDATE_DEPLOY_ENV_SCRIPT := ./scripts/validate-deploy-env.sh
SYNC_POSTGRES_PASSWORDS_SCRIPT := ./scripts/sync-postgres-passwords.sh
RESTORE_SCRIPT := ./scripts/restore-backend-db-market-franchise.sh
POST_RESTORE_SCRIPT := ./scripts/restore-post-db.sh
ONBOARDING_TRAIN_SCRIPT := ./scripts/train-onboarding-models.sh
TREND_TRAIN_SCRIPT := ./scripts/train-trend-models.sh
FRONTEND_API_GEN_SCRIPT := ./scripts/generate-frontend-api-clients.sh
AUTHENTIK_BLUEPRINT_REFRESH_SCRIPT := ./scripts/refresh-authentik-blueprint.sh

GATEWAY_SERVICES := traefik
DATA_SERVICES := authentik-db backend-db community-db onboarding-db agent-db post-db trend-db redis rabbitmq minio minio-init
APP_SERVICES := authentik-server authentik-worker profile-service echo-service franchise-service market-service onboarding-service agent-service community-service post-service trend-service
FRONTEND_SERVICE := frontend
BUILD_DATA_SERVICES := backend-db
BUILD_APP_SERVICES := profile-service echo-service franchise-service market-service onboarding-service agent-service community-service post-service trend-service

validate-env:
	@bash $(VALIDATE_DEPLOY_ENV_SCRIPT) .env

reset: validate-env
	@echo "배포 스택 컨테이너, compose 볼륨, 로컬 compose 이미지를 초기화합니다..."
	@$(COMPOSE) down --remove-orphans -v --rmi local

reset-hard: reset
	@echo "VPS 전체 Docker BuildKit build cache와 dangling image를 정리합니다..."
	@docker builder prune -af
	@docker image prune -f

reset-frontend: validate-env
	@echo "프론트엔드 컨테이너와 익명 볼륨만 초기화합니다..."
	@$(COMPOSE) rm -sfv $(FRONTEND_SERVICE)

gateway: validate-env
	@echo "Traefik 공개 게이트웨이를 시작합니다..."
	@$(COMPOSE) up -d $(GATEWAY_SERVICES)

data: validate-env
	@echo "배포용 데이터 저장소를 시작합니다..."
	@if [[ "$(NO_CACHE)" == "1" ]]; then \
		echo "Docker build cache를 사용하지 않고 data build 대상을 빌드합니다..."; \
		$(COMPOSE) build --no-cache $(BUILD_DATA_SERVICES); \
		$(COMPOSE) up -d $(DATA_SERVICES); \
	else \
		$(COMPOSE) up -d --build $(DATA_SERVICES); \
	fi
	@bash $(SYNC_POSTGRES_PASSWORDS_SCRIPT)

restore-db: validate-env
	@if [[ "$${SKIP_RESTORE:-0}" == "1" ]]; then \
		echo "DB 덤프 복원을 건너뜁니다. SKIP_RESTORE=1"; \
	else \
		echo "market / franchise 덤프를 backend-db에 복원합니다..."; \
		$(RESTORE_SCRIPT); \
		echo "post-service 덤프를 post-db에 복원합니다..."; \
		$(POST_RESTORE_SCRIPT); \
	fi

services: validate-env
	@echo "백엔드 서비스를 빌드하고 시작합니다..."
	@if [[ "$(NO_CACHE)" == "1" ]]; then \
		echo "Docker build cache를 사용하지 않고 backend service build 대상을 빌드합니다..."; \
		$(COMPOSE) build --no-cache $(BUILD_APP_SERVICES); \
		$(COMPOSE) up -d $(APP_SERVICES); \
	else \
		$(COMPOSE) up -d --build $(APP_SERVICES); \
	fi
	@bash $(AUTHENTIK_BLUEPRINT_REFRESH_SCRIPT)

# frontend 빌드 전에 현재 backend OpenAPI 기준으로 Orval 산출물을 다시 만든다.
frontend-codegen: validate-env
	@echo "프론트엔드 API 타입과 클라이언트를 생성합니다..."
	@bash $(FRONTEND_API_GEN_SCRIPT)

frontend: frontend-codegen
	@echo "프론트엔드 standalone 서비스를 빌드하고 시작합니다..."
	@if [[ "$(NO_CACHE)" == "1" ]]; then \
		echo "Docker build cache를 사용하지 않고 frontend를 빌드합니다..."; \
		$(COMPOSE) build --no-cache $(FRONTEND_SERVICE); \
		$(COMPOSE) up -d --no-deps $(FRONTEND_SERVICE); \
	else \
		$(COMPOSE) up -d --build --no-deps $(FRONTEND_SERVICE); \
	fi

train-onboarding-models: validate-env
	@echo "온보딩 모델 학습을 실행합니다..."
	@bash $(ONBOARDING_TRAIN_SCRIPT)

train-trend-models: validate-env
	@echo "트렌드 배치를 실행합니다..."
	@bash $(TREND_TRAIN_SCRIPT)

# 배포 기준 모델 후처리는 온보딩 학습과 trend 배치를 함께 묶어 다룬다.
train-models:
	@if [[ "$${SKIP_TRAIN:-0}" == "1" ]]; then \
		echo "모델 후처리를 건너뜁니다. SKIP_TRAIN=1"; \
	else \
		$(MAKE) train-onboarding-models; \
		$(MAKE) train-trend-models; \
	fi

up: gateway data restore-db services train-models

up-mac: validate-env
	@echo "Apple Silicon용 mac 오버라이드로 배포 스택을 시작합니다..."
	@$(MAC_COMPOSE) up -d --build $(GATEWAY_SERVICES) $(DATA_SERVICES)
	@STACK_FILE="$(CURDIR)/compose/backend-public-stack.yml" bash $(SYNC_POSTGRES_PASSWORDS_SCRIPT)
	@# mac 오버라이드와 dump 오버라이드를 함께 넘겨 backend-db 구성을 맞춘다.
	@STACK_EXTRA_FILES="$(CURDIR)/compose/backend-public-stack.mac.yml $(CURDIR)/compose/backend-db-market-franchise.dump.yml $(CURDIR)/compose/post-db.dump.yml" $(MAKE) restore-db
	@$(MAC_COMPOSE) up -d --build $(APP_SERVICES)
	@$(MAKE) train-models

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
		echo "onboarding health 확인: $$API_PUBLIC_ORIGIN/api/onboarding/health"; \
		echo "trend health 확인: $$API_PUBLIC_ORIGIN/api/trend/health"

down:
	@$(COMPOSE) down

clean:
	@$(COMPOSE) down --remove-orphans -v
