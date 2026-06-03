FROM python:3.12-slim

WORKDIR /app

# Install Poetry or use pip
COPY pyproject.toml .
RUN pip install --no-cache-dir -e ".[dev]" 2>/dev/null || \
    pip install --no-cache-dir fastapi>=0.115.0 uvicorn[standard]>=0.30.0 \
    sqlalchemy>=2.0.30 alembic>=1.13.0 psycopg2-binary>=2.9.9 \
    pydantic>=2.7.0 pydantic-settings>=2.3.0 pydantic[email]>=2.7.0 \
    python-jose[cryptography]>=3.3.0 \
    openai>=1.40.0 httpx>=0.27.0 bcrypt>=4.0.0

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
