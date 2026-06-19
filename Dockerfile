FROM python:3.12-slim

WORKDIR /app

# System dependencies for psycopg2 and Pillow
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc libjpeg-dev zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy backend source (pyproject.toml is in backend/)
COPY backend/ .

# Install Python dependencies
RUN pip install --no-cache-dir .

EXPOSE 8000

# Healthcheck (uses PORT env var for Railway compatibility)
HEALTHCHECK --interval=10s --timeout=5s --retries=3 --start-period=15s \
    CMD python -c "import os,urllib.request; urllib.request.urlopen(f'http://localhost:{os.environ.get(\"PORT\",\"8000\")}/api/v1/health')" || exit 1

# Run migrations then start server (PORT env var for Railway compatibility)
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
