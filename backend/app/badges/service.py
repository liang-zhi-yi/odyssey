"""Badge business logic — catalog, user status, progress."""

from sqlalchemy.orm import Session

from app.badges.models import BadgeDefinition, UserBadge
from app.badges.engine import get_user_badge_status


def get_all_badges(db: Session) -> list[BadgeDefinition]:
    """Return all badge definitions (the badge catalog)."""
    return db.query(BadgeDefinition).order_by(BadgeDefinition.category, BadgeDefinition.name).all()


def get_user_badges(db: Session, user_id: str) -> list[dict]:
    """Return all badges with earned/locked status and progress for a user.

    For each badge definition, checks whether the user has earned it
    and includes progress information.
    """
    all_badges = get_all_badges(db)
    earned_map = {
        str(ub.badge_id): ub
        for ub in (
            db.query(UserBadge)
            .filter(UserBadge.user_id == user_id)
            .all()
        )
    }

    result: list[dict] = []
    for badge in all_badges:
        badge_id = str(badge.id)
        user_badge = earned_map.get(badge_id)
        result.append({
            "badge_id": badge_id,
            "badge": badge,
            "earned": user_badge is not None,
            "earned_at": user_badge.earned_at.isoformat() if user_badge and user_badge.earned_at else None,
            "progress_current": user_badge.progress_current if user_badge else None,
            "progress_target": user_badge.progress_target if user_badge else None,
        })

    return result


def get_user_badge_detail(db: Session, user_id: str, badge_id: str) -> dict:
    """Return detailed status for a single badge."""
    return get_user_badge_status(db, user_id, badge_id)
