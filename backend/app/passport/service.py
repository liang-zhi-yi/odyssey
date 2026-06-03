"""Passport business logic — aggregate capability passport.

Passport is NOT a database table. It is dynamically generated from:
  - UserSkill (via skill relationship for name)
  - UserCredential (via credential relationship for name)
  - Project
"""

from uuid import UUID

from sqlalchemy.orm import Session

from app.auth.models import User
from app.skills.models import UserSkill
from app.credentials.models import UserCredential
from app.projects.models import Project


def generate_passport(db: Session, user_id: str) -> dict:
    """Dynamically generate the capability passport for a user.

    Aggregates skills (with rank + score), earned credentials, and projects.

    Args:
        db: Current DB session.
        user_id: UUID of the user.

    Returns:
        Dict with keys: user, skills, credentials, projects.
    """
    uid = UUID(user_id)

    # User
    user = db.query(User).filter(User.id == uid).first()

    # Skills with state
    user_skills = (
        db.query(UserSkill)
        .filter(UserSkill.user_id == uid)
        .order_by(UserSkill.overall_score.desc())
        .all()
    )

    # Credentials
    user_credentials = (
        db.query(UserCredential)
        .filter(UserCredential.user_id == uid)
        .order_by(UserCredential.issued_at.desc())
        .all()
    )

    # Projects
    projects = (
        db.query(Project)
        .filter(Project.user_id == uid)
        .order_by(Project.created_at.desc())
        .all()
    )

    return {
        "user": user.username if user else "unknown",
        "skills": [
            {
                "name": us.skill.name,
                "rank": us.rank.value if us.rank else "NOVICE",
                "score": us.overall_score,
            }
            for us in user_skills
        ],
        "credentials": [
            {"name": uc.credential.name}
            for uc in user_credentials
        ],
        "projects": [
            {"title": p.title}
            for p in projects
        ],
    }
