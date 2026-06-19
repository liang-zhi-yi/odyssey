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
# Also support constructing URL from individual PG* variables (Railway)
_raw_db_url = os.environ.get("DATABASE_URL", "").strip()

# If DATABASE_URL looks like a Railway template that wasn't resolved, ignore it
if _raw_db_url.startswith("${") or not _raw_db_url:
    _pguser = os.environ.get("PGUSER", "")
    _pgpass = os.environ.get("PGPASSWORD", "") or os.environ.get("POSTGRES_PASSWORD", "")
    _pghost = os.environ.get("PGHOST", "") or os.environ.get("RAILWAY_TCP_PROXY_DOMAIN", "")
    _pgport = os.environ.get("PGPORT", "") or os.environ.get("RAILWAY_TCP_PROXY_PORT", "")
    _pgdb = os.environ.get("PGDATABASE", "")
    if _pguser and _pghost and _pgdb:
        _raw_db_url = f"postgresql://{_pguser}:{_pgpass}@{_pghost}:{_pgport}/{_pgdb}"
        print(f"[alembic] Constructed DATABASE_URL from PG* vars: host={_pghost}, port={_pgport}, db={_pgdb}")
    else:
        print(f"[alembic] WARNING: DATABASE_URL not set and PG* vars incomplete")
        print(f"[alembic]   PGUSER={_pguser!r} PGHOST={_pghost!r} PGPORT={_pgport!r} PGDATABASE={_pgdb!r}")

sqlalchemy_url = _normalize_db_url(_raw_db_url) or config.get_main_option("sqlalchemy.url")

# Debug: print the URL with password masked
if sqlalchemy_url:
    _masked = re.sub(r"://([^:]+):([^@]+)@", r"://\1:****@", sqlalchemy_url)
    print(f"[alembic] Using DATABASE_URL: {_masked}")
    config.set_main_option("sqlalchemy.url", sqlalchemy_url)
else:
    print("[alembic] ERROR: No DATABASE_URL found anywhere!")

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
