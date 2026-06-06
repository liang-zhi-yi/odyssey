"""
Seed runner — populates the database with MVP reference data.

Usage:
  python -m app.seed          # from backend/
  or import and call seed_all(db) programmatically.
"""
from sqlalchemy.orm import Session

from app.seed import (
    seed_skills_full,
    seed_buildings_full,
    seed_compound_buildings_full,
    seed_paths,
    seed_path_skills,
    seed_quests,
    seed_credentials,
    seed_badges,
    seed_milestones,
)


def seed_all(db: Session) -> None:
    """Run every seed module in dependency order. Idempotent."""
    # 1. Skills (no dependencies) — full catalog ~55 skills
    skill_ids = seed_skills_full.run(db)

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

    # 7. Building templates (depend on skills) — full catalog ~55 buildings, 10-level
    seed_buildings_full.seed_buildings_full(db)

    # 8. Compound building templates — full catalog 12 compounds, 10-level
    seed_compound_buildings_full.seed_compound_buildings_full(db)

    # 9. Milestone definitions (no FK dependencies)
    seed_milestones.seed_milestones(db)


__all__ = ["seed_all"]
