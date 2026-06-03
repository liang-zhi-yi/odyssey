"""Skills business logic — skill tree, user skills, skill detail."""

from sqlalchemy.orm import Session

from app.skills.models import Skill, UserSkill
from app.core.exceptions import NotFoundException


def get_all_skills(db: Session) -> list[Skill]:
    """Return every defined Skill (the global skill tree)."""
    return db.query(Skill).order_by(Skill.name).all()


def get_user_skills(db: Session, user_id: str) -> list[dict]:
    """Return the current user's skill states, joined with skill names.

    Returns a list of dicts suitable for UserSkillResponse serialisation.
    """
    rows = (
        db.query(UserSkill, Skill.name)
        .join(Skill, UserSkill.skill_id == Skill.id)
        .filter(UserSkill.user_id == user_id)
        .all()
    )
    results: list[dict] = []
    for us, skill_name in rows:
        results.append({
            "skill_id": str(us.skill_id),
            "skill_name": skill_name,
            "knowledge": us.knowledge_score,
            "reasoning": us.reasoning_score,
            "application": us.application_score,
            "creation": us.creation_score,
            "overall": us.overall_score,
            "rank": us.rank.value,
        })
    return results


def get_user_skill_detail(db: Session, user_id: str, skill_id: str) -> dict:
    """Return a single UserSkill row with skill name."""
    row = (
        db.query(UserSkill, Skill.name)
        .join(Skill, UserSkill.skill_id == Skill.id)
        .filter(UserSkill.user_id == user_id, UserSkill.skill_id == skill_id)
        .first()
    )
    if row is None:
        raise NotFoundException("UserSkill", f"user={user_id} skill={skill_id}")

    us, skill_name = row
    return {
        "skill_id": str(us.skill_id),
        "skill_name": skill_name,
        "knowledge": us.knowledge_score,
        "reasoning": us.reasoning_score,
        "application": us.application_score,
        "creation": us.creation_score,
        "overall": us.overall_score,
        "rank": us.rank.value,
    }


def ensure_user_skills_exist(db: Session, user_id: str) -> None:
    """Create a UserSkill row (score 0) for every Skill not yet tracked.

    Called once after registration so the user starts with a full skill tree.
    """
    existing_skill_ids = {
        str(row.skill_id)
        for row in db.query(UserSkill.skill_id)
        .filter(UserSkill.user_id == user_id)
        .all()
    }
    for skill in db.query(Skill).all():
        if str(skill.id) not in existing_skill_ids:
            db.add(UserSkill(user_id=user_id, skill_id=skill.id))
    db.commit()
