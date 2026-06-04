"""
Seed runner — populates the database with MVP reference data.

Usage:
  python -m app.seed          # from backend/
  or import and call seed_all(db) programmatically.
"""
from sqlalchemy.orm import Session

from app.seed import seed_skills, seed_paths, seed_path_skills, seed_quests, seed_credentials, seed_badges


def seed_all(db: Session) -> None:
    """Run every seed module in dependency order. Idempotent."""
    # 1. Skills (no dependencies)
    skill_ids = seed_skills.run(db)
    # 2. Paths (no dependencies)
    path_id = seed_paths.run(db)
    # 3. Path ↔ Skill mappings
    seed_path_skills.run(db, skill_ids, path_id)
    # 4. Quests (depend on skills)
    seed_quests.run(db, skill_ids)
    # 5. Credentials (depend on skills)
    seed_credentials.run(db, skill_ids)
    # 6. Badges (no dependencies)
    seed_badges.seed_badges(db)


__all__ = ["seed_all"]
