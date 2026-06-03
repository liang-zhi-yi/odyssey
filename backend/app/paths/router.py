"""Path routes — /api/v1/paths and /api/v1/user-paths"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.paths.schemas import (
    PathResponse,
    SelectPathRequest,
    SelectPathResponse,
    UserPathResponse,
)
from app.paths import service
from app.database import get_db
from app.dependencies import get_current_user
from app.auth.models import User

router = APIRouter(tags=["paths"])


@router.get("/paths", response_model=list[PathResponse])
def list_paths(db: Session = Depends(get_db)):
    """Return all available growth paths."""
    paths = service.get_all_paths(db)
    return [
        PathResponse(
            id=str(p.id),
            name=p.name,
            description=p.description,
            difficulty=p.difficulty,
            is_official=p.is_official,
        )
        for p in paths
    ]


@router.post("/user-paths", response_model=SelectPathResponse, status_code=201)
def select_path(
    req: SelectPathRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Select (activate) a growth path. MVP: single active path only."""
    up = service.select_path(db, str(current_user.id), req.path_id)
    return SelectPathResponse(status=up.status.value)


@router.get("/user-paths/current", response_model=UserPathResponse)
def get_current_path(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the user's currently active path with progress."""
    result = service.get_active_user_path(db, str(current_user.id))
    if result is None:
        return UserPathResponse(path_id="", name="None", progress=0)
    return UserPathResponse(**result)
