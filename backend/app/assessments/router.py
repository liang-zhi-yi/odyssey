"""Assessment routes — /api/v1/assessments"""

from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session

from app.assessments.schemas import RunAssessmentRequest
from app.assessments import service
from app.database import get_db
from app.dependencies import get_current_user
from app.auth.models import User

router = APIRouter(tags=["assessments"])


@router.post("/assessments/run")
def run_assessment_endpoint(
    body: RunAssessmentRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Trigger an asynchronous assessment for a submitted quest.

    Creates an Assessment record with status PROCESSING and returns immediately.
    The assessment runs in the background.

    The frontend should poll GET /assessments/{assessment_id} every 3 seconds
    until status changes to COMPLETED or FAILED.

    Timeout: if the LLM doesn't respond within 60 seconds, status → FAILED.
    """
    user_id = str(current_user.id)
    assessment = service.trigger_assessment(db, body.submission_id, user_id)

    # Queue background processing with a fresh DB session
    background_tasks.add_task(
        service._launch_background_assessment,
        str(assessment.id),
    )

    return {
        "assessment_id": str(assessment.id),
        "status": assessment.status.value,
    }


@router.get("/assessments/{assessment_id}")
def get_assessment(
    assessment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Poll assessment status / retrieve result.

    While PROCESSING → { "assessment_id": "...", "status": "PROCESSING" }
    When COMPLETED → includes all four dimension scores + feedback
    When FAILED   → includes error message + retry_url
    """
    result = service.get_assessment_status(
        db, assessment_id, str(current_user.id)
    )
    return result
