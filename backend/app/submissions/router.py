"""Submission routes — /api/v1/submissions"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.submissions.schemas import SubmitRequest, SubmitResponse, SubmissionResponse
from app.submissions import service
from app.database import get_db
from app.dependencies import get_current_user
from app.auth.models import User

router = APIRouter(tags=["submissions"])


@router.get("/submissions/{submission_id}", response_model=SubmissionResponse)
def get_submission(
    submission_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the status and content of a specific submission."""
    result = service.get_submission(db, submission_id, str(current_user.id))
    return SubmissionResponse(
        submission_id=result["submission_id"],
        quest_id=result["quest_id"],
        content=result["content"],
        github_url=result["github_url"],
        demo_url=result["demo_url"],
        status=result["status"],
    )


@router.get("/submissions")
def list_submissions(
    quest_id: str | None = Query(None, description="Filter by quest ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List submissions for the current user, optionally filtered by quest."""
    return service.get_submission_history(db, str(current_user.id), quest_id)


@router.post("/submissions", response_model=SubmitResponse)
def submit_quest(
    body: SubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Submit work for an accepted quest.

    The quest must have been accepted via POST /quests/{id}/accept first.
    Transitions the QuestSubmission from ACCEPTED/IN_PROGRESS → SUBMITTED.
    """
    sub = service.submit_quest(
        db=db,
        user_id=str(current_user.id),
        quest_id=body.quest_id,
        content=body.content,
        github_url=body.github_url,
        demo_url=body.demo_url,
    )
    return SubmitResponse(
        submission_id=str(sub.id),
        status=sub.status.value,
    )
