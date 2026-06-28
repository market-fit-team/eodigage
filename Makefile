.PHONY: dev mac-dev infra mac-infra status api-catalog api-gen frontend down clean

COMPOSE_PROJECT_NAME ?= $(notdir $(CURDIR))
export COMPOSE_PROJECT_NAME
export ROOT_COMPOSE_PROJECT_NAME := $(COMPOSE_PROJECT_NAME)

COMPOSE := docker compose
MAC_COMPOSE := docker compose -f docker-compose.yml -f docker-compose.mac.yml
UP_COMPOSE := docker compose -f docker-compose.yml -f docker-compose.langgraph-up.override.yml
MAC_UP_COMPOSE := docker compose -f docker-compose.yml -f docker-compose.mac.yml -f docker-compose.langgraph-up.override.yml
AGENT_SERVICE_DIR := backend/services/agent-service

infra:
	@echo "langgraph up용 공통 인프라를 시작합니다..."
	@$(UP_COMPOSE) up -d --build

mac-infra:
	@echo "Apple Silicon용 langgraph up 공통 인프라를 시작합니다..."
	@$(MAC_UP_COMPOSE) up -d --build

status:
	@echo "authentik, traefik의 현재 상태를 확인합니다..."
	@curl -fsS http://localhost:9000/application/o/pickle-web/.well-known/openid-configuration >/dev/null \
		&& echo "authentik 상태: ok" \
		|| echo "authentik 상태: fail"
	@docker inspect -f '{{.State.Status}}' traefik >/dev/null 2>&1 \
		&& echo "traefik 상태: running" \
		|| echo "traefik 상태: fail"


api-catalog:
	@echo "docker-compose 라벨을 기준으로 Orval 카탈로그를 생성합니다..."
	@cd frontend && npm run api:catalog

api-gen: api-catalog
	@echo "docker-compose 라벨 카탈로그를 기준으로 API 클라이언트를 생성합니다..."
	@cd frontend && npm run api:gen:only

frontend:
	@echo "authentik, traefik은 실행에 시간이 필요합니다. 프론트엔드에서 에러 발생 시 이 터미널을 종료한 뒤(Ctrl+C) 'make frontend'로 프론트엔드만 다시 시작하세요. 'make status'로 authentik, traefik의 상태를 확인할 수 있습니다."
	@echo "Compose 네트워크 바깥에서 Next.js를 시작합니다..."
	@cd frontend && npm run dev

# make dev/mac-dev에서는 root compose의 agent-service 대신
# langgraph up 스택이 같은 네트워크에 합류해 /api/agent를 받습니다.
dev: infra
	@echo "agent-service를 langgraph up으로 시작합니다..."
	@$(MAKE) -C $(AGENT_SERVICE_DIR) run-up
	@$(MAKE) status
	@$(MAKE) frontend

mac-dev: mac-infra
	@echo "agent-service를 langgraph up으로 시작합니다..."
	@$(MAKE) -C $(AGENT_SERVICE_DIR) run-up
	@$(MAKE) status
	@$(MAKE) frontend

down:
	@$(COMPOSE) down
	@$(MAKE) -C $(AGENT_SERVICE_DIR) down-up

clean:
	@$(COMPOSE) down --remove-orphans -v
	@$(MAKE) -C $(AGENT_SERVICE_DIR) clean-up
