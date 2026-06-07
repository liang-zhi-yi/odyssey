"""Projects routes — /api/v1/projects"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.projects.schemas import CreateProjectRequest, ProjectResponse, ProjectDetailResponse
from app.projects import service
from app.database import get_db
from app.dependencies import get_current_user
from app.auth.models import User

router = APIRouter(tags=["projects"])


@router.post("/projects", response_model=ProjectResponse, status_code=201)
def create_project(
    body: CreateProjectRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new portfolio project.

    May optionally link to a PASSED quest submission as evidence.
    """
    project = service.create_project(
        db, str(current_user.id), body.model_dump()
    )
    # Re-fetch with full enrichment
    return service.get_project(db, str(current_user.id), str(project.id))


@router.get("/projects", response_model=list[ProjectResponse])
def list_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all projects created by the authenticated user with enriched relations."""
    return service.list_projects(db, str(current_user.id))


@router.delete("/projects/{project_id}")
def delete_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a project by ID. Only the owner can delete it."""
    service.delete_project(db, str(current_user.id), project_id)
    return {"detail": "ok"}


@router.get("/projects/{project_id}", response_model=ProjectDetailResponse)
def get_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a single project by ID with full enriched relations."""
    return service.get_project(db, str(current_user.id), project_id)
