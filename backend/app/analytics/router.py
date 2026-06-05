"""Analytics routes — /api/v1/analytics"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.analytics import service
from app.analytics.schemas import InsightsResponse
from app.database import get_db
from app.dependencies import get_current_user
from app.auth.models import User

router = APIRouter(tags=["analytics"])


@router.get("/analytics/insights", response_model=InsightsResponse)
def get_insights(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get AI-powered insights about the user's capability growth.

    Returns 3-5 actionable insights covering growth acceleration,
    plateau warnings, skill gaps, strength areas, and recommended focus.
    """
    user_id = str(current_user.id)
    insights = service.get_insights(db, user_id)
    return InsightsResponse(insights=insights)


@router.get("/analytics/summary")
def get_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get analytics summary: total quests, assessments, growth rate,
    strongest/weakest skills.
    """
    user_id = str(current_user.id)
    return service.get_summary(db, user_id)


@router.get("/analytics/trends")
def get_trends(
    skill_id: str = Query(..., description="Skill UUID"),
    period: int = Query(30, ge=7, le=365, description="Days to look back"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get time-series trend data for a specific skill.

    Returns assessment score snapshots over the given period (default 30 days).
    """
    user_id = str(current_user.id)
    result = service.get_trends(db, user_id, skill_id, period)
    return result
