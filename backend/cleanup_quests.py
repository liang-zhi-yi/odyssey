"""
One-off script: delete all existing quests and re-seed with only the test quest.

Usage: cd backend && .venv\Scripts\python cleanup_quests.py
"""
import sys
import os

# Ensure backend is on path
sys.path.insert(0, os.path.dirname(__file__))

# Import all models in the correct dependency order (same as Alembic)
import app.models  # noqa: F401 — loads all models + configure_mappers()
from app.database import _get_session_local


def cleanup_and_reseed():
    db = _get_session_local()()
    try:
        # Import models AFTER app.main to ensure all relationships are resolved
        from app.quests.models import Quest
        from app.submissions.models import QuestSubmission
        from app.learning_paths.models import LearningPathQuest
        from app.seed import seed_quests, seed_skills_full

        # 1. Delete all quest submissions first (FK constraint)
        deleted_subs = db.query(QuestSubmission).delete()
        print(f"Deleted {deleted_subs} quest submissions")

        # 2. Delete generated quests (FK constraint from learning paths)
        deleted_gen = db.query(LearningPathQuest).delete()
        print(f"Deleted {deleted_gen} generated quests")

        # 3. Delete all quests
        deleted = db.query(Quest).delete()
        print(f"Deleted {deleted} quests")
        db.commit()

        # 4. Re-seed skills (to get skill_ids map)
        skill_ids = seed_skills_full.run(db)
        print(f"Got {len(skill_ids)} skill IDs")

        # 5. Re-seed with just the 1 test quest
        seed_quests.run(db, skill_ids)
        db.commit()

        # 6. Verify
        remaining = db.query(Quest).count()
        print(f"Quests remaining: {remaining}")

    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    cleanup_and_reseed()
    print("Done.")
