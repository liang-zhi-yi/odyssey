"""Progress routes — /api/v1/progress"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.progress.schemas import ProgressLogResponse, SkillGrowthPoint
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
