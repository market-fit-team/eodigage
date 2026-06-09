.PHONY: dev

dev:
	@echo "Starting Docker Compose services (if not already running)..."
	@docker compose up -d
	@echo "Waiting for database to be ready..."
	@sleep 3
	@echo "Running database migrations..."
	@cd frontend && npm run db:migrate
	@echo "Starting development server..."
	@cd frontend && npm run dev
