.PHONY: dev

dev:
	@if [ -z "$$(docker compose ps -q)" ]; then \
		echo "Docker is not running. Starting Docker Compose..."; \
		docker compose up -d; \
		echo "Waiting for database to be ready..."; \
		sleep 3; \
	else \
		echo "Docker is already running. Skipping..."; \
	fi
	@echo "Running database migrations..."
	@cd frontend && npm run db:migrate
	@echo "Starting development server..."
	@cd frontend && npm run dev
