"""Alembic environment configuration.

Imports all models via `app.models` so Base.metadata is fully populated
before Alembic generates or runs migrations.
"""
import os
import re
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool


def _normalize_db_url(url: str | None) -> str | None:
    """Normalize DATABASE_URL for SQLAlchemy + psycopg2 compatibility.

    - Converts ``postgresql://`` → ``postgresql+psycopg2://``
    - Removes empty port (``host:/db`` → ``host/db``)
    """
    if not url:
        return url
    # Add +psycopg2 driver if missing
    if url.startswith("postgresql://"):
        url = "postgresql+psycopg2://" + url[len("postgresql://"):]
    # Fix empty port: host:/ → host/
    url = re.sub(r":/(?=\D|$)", "/", url)
    return url


# Alembic Config object
config = context.config

# Set up Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ── Allow DATABASE_URL env var to override alembic.ini ─────────────
sqlalchemy_url = _normalize_db_url(
    os.environ.get("DATABASE_URL")
) or config.get_main_option("sqlalchemy.url")
if sqlalchemy_url:
    config.set_main_option("sqlalchemy.url", sqlalchemy_url)

# ── Import ALL models so Base.metadata is complete ──────────────────
from app.models import Base  # noqa: E402

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode (emit SQL without a DB connection)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode (connected to a live DB)."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
