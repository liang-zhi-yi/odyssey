"""Standalone seed runner — called from Docker or locally."""

import os
import sys

# Ensure the backend package is importable
sys.path.insert(0, os.path.dirname(__file__))

# Override DATABASE_URL early, before any app imports
os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+psycopg2://postgres:postgres@host.docker.internal:5432/odyssey",
)

# Import app.models FIRST so ALL ORM models are registered before any query
import app.models  # noqa: F401 — side-effect: registers all models + configure_mappers()

from app.database import _get_session_local
from app.seed import seed_all

db = _get_session_local()()
try:
    seed_all(db)
    print("Seed complete — all reference data inserted.")
finally:
    db.close()
