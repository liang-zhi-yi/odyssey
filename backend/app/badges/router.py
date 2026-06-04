"""Badge routes — /api/v1/badges"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.badges.schemas import BadgeDefinitionResponse, UserBadgeResponse
from app.badges import service
from app.database import get_db
from app.dependencies import get_current_user
from app.auth.models import User

router = APIRouter(tags=["badges"])


@router.get("/badges", response_model=list[BadgeDefinitionResponse])
def list_badges(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return all badge definitions (the badge catalog)."""
    badges = service.get_all_badges(db)
    return [
        BadgeDefinitionResponse(
            id=str(b.id),
            name=b.name,
            name_en=b.name_en,
            description=b.description,
            description_en=b.description_en,
            icon=b.icon,
            criteria=b.criteria,
            category=b.category,
        )
        for b in badges
    ]


@router.get("/badges/me", response_model=list[UserBadgeResponse])
def list_user_badges(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return all badges with earned/locked status for the current user."""
    items = service.get_user_badges(db, str(current_user.id))
    return [
        UserBadgeResponse(
            badge_id=item["badge_id"],
            badge=BadgeDefinitionResponse(
                id=str(item["badge"].id),
                name=item["badge"].name,
                name_en=item["badge"].name_en,
                description=item["badge"].description,
                description_en=item["badge"].description_en,
                icon=item["badge"].icon,
                criteria=item["badge"].criteria,
                category=item["badge"].category,
            ),
            earned=item["earned"],
            earned_at=item["earned_at"],
            progress_current=item["progress_current"],
            progress_target=item["progress_target"],
        )
        for item in items
    ]


@router.get("/badges/me/{badge_id}", response_model=UserBadgeResponse)
def get_user_badge(
    badge_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return detailed status for a single badge."""
    item = service.get_user_badge_detail(db, str(current_user.id), badge_id)
    b = item["badge"]
    return UserBadgeResponse(
        badge_id=str(b.id) if b else badge_id,
        badge=BadgeDefinitionResponse(
            id=str(b.id) if b else badge_id,
            name=b.name if b else "Unknown",
            name_en=b.name_en if b else None,
            description=b.description if b else None,
            description_en=b.description_en if b else None,
            icon=b.icon if b else "🏅",
            criteria=b.criteria if b else {},
            category=b.category if b else "milestone",
        ),
        earned=item["earned"],
        earned_at=item["earned_at"],
        progress_current=item["progress_current"],
        progress_target=item["progress_target"],
    )
