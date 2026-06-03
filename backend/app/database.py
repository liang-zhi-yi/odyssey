"""
SQLAlchemy database configuration and Base class.

All ORM models inherit from `Base` defined here.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


# Lazy engine — created on first access so env vars / CLI overrides work
_engine = None
_SessionLocal = None


def _get_engine():
    global _engine
    if _engine is None:
        _engine = create_engine(settings.database_url, echo=settings.db_echo)
    return _engine


def _get_session_local():
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(
            bind=_get_engine(), autoflush=False, autocommit=False
        )
    return _SessionLocal


def get_db():
    """FastAPI dependency: yields a DB session per request."""
    db = _get_session_local()()
    try:
        yield db
    finally:
        db.close()
