SHELL := /bin/bash

.PHONY: dev down logs seed test lint preview

dev:
	cp -n .env.example .env || true
	docker compose up --build

down:
	docker compose down -v

logs:
	docker compose logs -f --tail=200

seed:
	docker compose run --rm api bash -lc "alembic upgrade head && python -m app.scripts.seed"

test:
	cd apps/api && pip install -e . --no-build-isolation && pytest -q
	cd apps/web && npm install && npm run build

lint:
	cd apps/api && ruff check .
	cd apps/web && npm install && npm run lint

preview:
	cp -n .env.example .env || true
	( \
		cd apps/api && pip install -e . --no-build-isolation && DATABASE_URL=${DATABASE_URL:-sqlite+aiosqlite:///./internatlas.db} SYNC_DATABASE_URL=${SYNC_DATABASE_URL:-sqlite:///./internatlas.db} uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload & \
		cd apps/web && npm install && API_ORIGIN=http://localhost:8000 npm run dev & \
		trap 'kill 0' SIGINT SIGTERM EXIT; \
		wait \
	)
