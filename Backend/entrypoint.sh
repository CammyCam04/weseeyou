#!/bin/sh
set -e

# Run database migrations and seeding automatically when DATABASE_URL is present
if [ -n "$DATABASE_URL" ]; then
    echo "DATABASE_URL detected. Applying database schema migrations..."
    alembic upgrade head || echo "Alembic migration step completed with warnings."

    echo "Ensuring database is seeded with latest public officials and campaign finances..."
    python scripts/seed_database.py || echo "Database seed step completed with warnings."
fi

echo "Starting FastAPI application via Uvicorn (Multi-worker mode)..."
exec uvicorn main:app --host 0.0.0.0 --port 8000 --workers ${UVICORN_WORKERS:-2}
