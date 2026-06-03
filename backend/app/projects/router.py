"""Projects routes — /api/v1/projects"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.projects.schemas import CreateProjectRequest, ProjectResponse
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
    return ProjectResponse(
        id=str(project.id),
        title=project.title,
        description=project.description,
        github_url=project.github_url,
        demo_url=project.demo_url,
    )


@router.get("/projects", response_model=list[ProjectResponse])
def list_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all projects created by the authenticated user."""
    projects = service.list_projects(db, str(current_user.id))
    return [ProjectResponse(**p) for p in projects]
