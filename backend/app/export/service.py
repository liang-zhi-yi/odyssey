"""Export business logic — passport and full data export."""

from uuid import UUID

from sqlalchemy.orm import Session

from app.auth.models import User
from app.skills.models import UserSkill
from app.credentials.models import UserCredential
from app.projects.models import Project
from app.progress.models import ProgressLog


def export_passport(db: Session, user_id: str) -> dict:
    """Generate passport data: skills, credentials, projects, aggregate scores."""
    uid = UUID(user_id)

    user = db.query(User).filter(User.id == uid).first()

    user_skills = (
        db.query(UserSkill)
        .filter(UserSkill.user_id == uid)
        .order_by(UserSkill.overall_score.desc())
        .all()
    )

    user_credentials = (
        db.query(UserCredential)
        .filter(UserCredential.user_id == uid)
        .order_by(UserCredential.issued_at.desc())
        .all()
    )

    projects = (
        db.query(Project)
        .filter(Project.user_id == uid)
        .order_by(Project.created_at.desc())
        .all()
    )

    # Aggregate scores across all skills
    if user_skills:
        avg_knowledge = round(sum(s.knowledge_score or 0 for s in user_skills) / len(user_skills))
        avg_reasoning = round(sum(s.reasoning_score or 0 for s in user_skills) / len(user_skills))
        avg_application = round(sum(s.application_score or 0 for s in user_skills) / len(user_skills))
        avg_creation = round(sum(s.creation_score or 0 for s in user_skills) / len(user_skills))
        avg_overall = round(sum(s.overall_score or 0 for s in user_skills) / len(user_skills))
    else:
        avg_knowledge = avg_reasoning = avg_application = avg_creation = avg_overall = 0

    return {
        "generated_at": None,  # Will be set by router
        "user": {
            "username": user.username if user else "unknown",
            "email": user.email if user else None,
        },
        "aggregate_scores": {
            "knowledge": avg_knowledge,
            "reasoning": avg_reasoning,
            "application": avg_application,
            "creation": avg_creation,
            "overall": avg_overall,
        },
        "skills": [
            {
                "name": us.skill.name if us.skill else "Unknown",
                "rank": us.rank.value if us.rank else "NOVICE",
                "knowledge": us.knowledge_score,
                "reasoning": us.reasoning_score,
                "application": us.application_score,
                "creation": us.creation_score,
                "overall": us.overall_score,
            }
            for us in user_skills
        ],
        "credentials": [
            {
                "name": uc.credential.name,
                "issued_at": str(uc.issued_at),
            }
            for uc in user_credentials
        ],
        "projects": [
            {
                "title": p.title,
                "description": p.description,
                "github_url": p.github_url,
                "demo_url": p.demo_url,
                "created_at": str(p.created_at),
            }
            for p in projects
        ],
    }


def export_full_data(db: Session, user_id: str) -> dict:
    """Generate full data export (GDPR-compliant): all user data."""
    uid = UUID(user_id)

    user = db.query(User).filter(User.id == uid).first()

    user_skills = (
        db.query(UserSkill)
        .filter(UserSkill.user_id == uid)
        .order_by(UserSkill.overall_score.desc())
        .all()
    )

    user_credentials = (
        db.query(UserCredential)
        .filter(UserCredential.user_id == uid)
        .order_by(UserCredential.issued_at.desc())
        .all()
    )

    projects = (
        db.query(Project)
        .filter(Project.user_id == uid)
        .order_by(Project.created_at.desc())
        .all()
    )

    progress_logs = (
        db.query(ProgressLog)
        .filter(ProgressLog.user_id == uid)
        .order_by(ProgressLog.created_at.desc())
        .all()
    )

    return {
        "exported_at": None,  # Will be set by router
        "profile": {
            "id": str(user.id) if user else None,
            "username": user.username if user else None,
            "email": user.email if user else None,
            "nickname": user.nickname if user else None,
            "bio": user.bio if user else None,
            "github_username": user.github_username if user else None,
            "title": user.title if user else None,
            "location": user.location if user else None,
            "website": user.website if user else None,
            "social_links": user.social_links if user else None,
            "created_at": str(user.created_at) if user else None,
        },
        "skills": [
            {
                "name": us.skill.name if us.skill else "Unknown",
                "domain": us.skill.domain if us.skill else None,
                "rank": us.rank.value if us.rank else "NOVICE",
                "knowledge_score": us.knowledge_score,
                "reasoning_score": us.reasoning_score,
                "application_score": us.application_score,
                "creation_score": us.creation_score,
                "overall_score": us.overall_score,
            }
            for us in user_skills
        ],
        "credentials": [
            {
                "name": uc.credential.name,
                "description": uc.credential.description,
                "issued_at": str(uc.issued_at),
            }
            for uc in user_credentials
        ],
        "projects": [
            {
                "title": p.title,
                "description": p.description,
                "github_url": p.github_url,
                "demo_url": p.demo_url,
                "skill_name": p.skill.name if p.skill else None,
                "created_at": str(p.created_at),
            }
            for p in projects
        ],
        "progress_logs": [
            {
                "skill_name": pl.skill.name if pl.skill else "Unknown",
                "previous_score": pl.previous_overall,
                "new_score": pl.new_overall,
                "score_delta": pl.new_overall - pl.previous_overall if pl.previous_overall is not None else 0,
                "reason": pl.reason,
                "created_at": str(pl.created_at),
            }
            for pl in progress_logs
        ],
    }
