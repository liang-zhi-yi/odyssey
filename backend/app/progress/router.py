"""Progress routes — /api/v1/progress"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.progress.schemas import (
    ProgressLogResponse,
    SkillGrowthPoint,
    PathGrowthResponse,
    TimelineResponse,
)
from app.progress import service
from app.database import get_db
from app.dependencies import get_current_user
from app.auth.models import User

router = APIRouter(tags=["progress"])


@router.get("/progress", response_model=list[ProgressLogResponse])
def list_progress_logs(
    limit: int = Query(20, ge=5, le=100, description="Max entries"),
    skill_id: str | None = Query(None, description="Filter by skill UUID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return recent progress log entries for the authenticated user."""
    logs = service.get_progress_logs(
        db, str(current_user.id), limit=limit, skill_id=skill_id
    )
    return [ProgressLogResponse(**log) for log in logs]


@router.get("/progress/skills/{skill_id}", response_model=list[SkillGrowthPoint])
def get_skill_growth(
    skill_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the growth curve (date → score) for a specific skill."""
    points = service.get_skill_growth(db, str(current_user.id), skill_id)
    return [SkillGrowthPoint(**p) for p in points]


@router.get("/progress/skills/{skill_id}/trend", response_model=list[SkillGrowthPoint])
def get_skill_trend(
    skill_id: str,
    days: int = Query(30, ge=7, le=365, description="Number of days to include"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the growth trend for a skill over the last N days (for sparklines)."""
    points = service.get_skill_trend(db, str(current_user.id), skill_id, days=days)
    return [SkillGrowthPoint(**p) for p in points]


@router.get("/progress/paths/{path_id}", response_model=PathGrowthResponse)
def get_path_growth(
    path_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return growth curves for all skills in a learning path."""
    return service.get_path_growth(db, str(current_user.id), path_id)


@router.get("/progress/timeline", response_model=TimelineResponse)
def get_timeline(
    start_date: str | None = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: str | None = Query(None, description="End date (YYYY-MM-DD)"),
    skill_id: str | None = Query(None, description="Filter by skill UUID"),
    limit: int = Query(50, ge=5, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return timeline events with optional date range and skill filters."""
    return service.get_timeline(
        db,
        str(current_user.id),
        start_date=start_date,
        end_date=end_date,
        skill_id=skill_id,
        limit=limit,
    )
