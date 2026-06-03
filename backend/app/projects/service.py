"""Projects business logic — create and list user projects."""

from uuid import UUID

from sqlalchemy.orm import Session

from app.projects.models import Project
from app.submissions.models import QuestSubmission
from app.core.enums import SubmissionStatus
from app.core.exceptions import NotFoundException, ConflictException


def create_project(db: Session, user_id: str, data: dict) -> Project:
    """Create a new project for the user.

    If quest_submission_id is provided, validates that:
      - The submission exists and belongs to the user.
      - The submission has status PASSED.

    Args:
        db: Current DB session.
        user_id: UUID of the authenticated user.
        data: Dict with keys: title, description, github_url, demo_url,
              related_skill_id, quest_submission_id.

    Returns:
        The newly created Project.

    Raises:
        NotFoundException: If quest_submission_id is invalid.
        ConflictException: If submission is not PASSED.
    """
    uid = UUID(user_id)

    # Validate quest_submission_id if provided
    qs_id = data.get("quest_submission_id")
    if qs_id is not None:
        submission = (
            db.query(QuestSubmission)
            .filter(
                QuestSubmission.id == UUID(qs_id),
                QuestSubmission.user_id == uid,
            )
            .first()
        )
        if submission is None:
            raise NotFoundException("QuestSubmission", qs_id)
        if submission.status != SubmissionStatus.PASSED:
            raise ConflictException(
                "SUBMISSION_NOT_PASSED",
                "Can only link projects to PASSED submissions.",
            )

    project = Project(
        user_id=uid,
        title=data["title"],
        description=data.get("description"),
        github_url=data.get("github_url"),
        demo_url=data.get("demo_url"),
        related_skill_id=(
            UUID(data["related_skill_id"])
            if data.get("related_skill_id")
            else None
        ),
        quest_submission_id=UUID(qs_id) if qs_id else None,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def list_projects(db: Session, user_id: str) -> list[dict]:
    """Return all projects belonging to the user."""
    projects = (
        db.query(Project)
        .filter(Project.user_id == UUID(user_id))
        .order_by(Project.created_at.desc())
        .all()
    )
    return [
        {
            "id": str(p.id),
            "title": p.title,
            "description": p.description,
            "github_url": p.github_url,
            "demo_url": p.demo_url,
        }
        for p in projects
    ]
