"""Assessment business logic — trigger and poll assessment."""

import logging
from uuid import UUID

from sqlalchemy.orm import Session

from app.submissions.models import QuestSubmission
from app.assessments.models import Assessment
from app.core.enums import SubmissionStatus, AssessmentStatus
from app.core.exceptions import NotFoundException, ConflictException
from app.database import _get_session_local

from app.assessments.engine import run_assessment

logger = logging.getLogger(__name__)


def trigger_assessment(db: Session, submission_id: str, user_id: str) -> Assessment:
    """Create an Assessment record and queue background evaluation.

    Validates that the submission:
      - Exists and belongs to the user
      - Is in SUBMITTED status (ready to assess)
      - Doesn't already have an assessment

    Args:
        db: Current request DB session.
        submission_id: UUID of the QuestSubmission to assess.
        user_id: UUID of the authenticated user.

    Returns:
        The freshly created Assessment (status PROCESSING).

    Raises:
        NotFoundException: Submission not found.
        ConflictException: Submission not in assessable state or already assessed.
    """
    submission = (
        db.query(QuestSubmission)
        .filter(
            QuestSubmission.id == submission_id,
            QuestSubmission.user_id == user_id,
        )
        .first()
    )
    if submission is None:
        raise NotFoundException("QuestSubmission", submission_id)

    if submission.status != SubmissionStatus.SUBMITTED:
        raise ConflictException(
            "SUBMISSION_NOT_READY",
            f"Submission must be SUBMITTED, currently {submission.status.value}",
        )

    # Check for existing assessment
    existing = (
        db.query(Assessment)
        .filter(Assessment.submission_id == submission_id)
        .first()
    )
    if existing is not None and existing.status != AssessmentStatus.FAILED:
        raise ConflictException(
            "ASSESSMENT_EXISTS",
            f"Assessment already exists (status: {existing.status.value})",
        )

    # Create assessment record
    assessment = Assessment(
        submission_id=UUID(submission_id),
        status=AssessmentStatus.PROCESSING,
    )
    db.add(assessment)

    # Transition submission to ASSESSING
    submission.status = SubmissionStatus.ASSESSING

    db.commit()
    db.refresh(assessment)

    logger.info(
        "Assessment created — assessment=%s submission=%s",
        assessment.id, submission_id,
    )

    return assessment


def get_assessment_status(db: Session, assessment_id: str, user_id: str) -> dict:
    """Return the current status/result of an assessment.

    Args:
        db: Current request DB session.
        assessment_id: UUID of the Assessment.
        user_id: UUID of the authenticated user (for ownership check).

    Returns:
        Dict suitable for AssessmentStatusResponse / AssessmentCompletedResponse.

    Raises:
        NotFoundException: Assessment not found or doesn't belong to user.
    """
    assessment = (
        db.query(Assessment)
        .join(QuestSubmission, Assessment.submission_id == QuestSubmission.id)
        .filter(
            Assessment.id == assessment_id,
            QuestSubmission.user_id == user_id,
        )
        .first()
    )
    if assessment is None:
        raise NotFoundException("Assessment", assessment_id)

    if assessment.status == AssessmentStatus.PROCESSING:
        return {
            "assessment_id": str(assessment.id),
            "status": assessment.status.value,
        }

    if assessment.status == AssessmentStatus.COMPLETED:
        return {
            "assessment_id": str(assessment.id),
            "status": assessment.status.value,
            "knowledge": assessment.knowledge_score,
            "reasoning": assessment.reasoning_score,
            "application": assessment.application_score,
            "creation": assessment.creation_score,
            "overall": assessment.overall_score,
            "feedback": assessment.feedback,
            "suggestions": assessment.improvement_suggestions,
            "justifications": assessment.justifications,
        }

    # FAILED
    return {
        "assessment_id": str(assessment.id),
        "status": assessment.status.value,
        "error": assessment.error_message,
        "retry_url": "/api/v1/assessments/run",
    }


def _launch_background_assessment(assessment_id: str) -> None:
    """Create a new DB session and run the assessment pipeline.

    This is called synchronously inside the request, but we rely on FastAPI's
    BackgroundTasks to run it after the response. The key insight is that
    we use a fresh session so the background task isn't tied to the request lifecycle.
    """
    # Run in a new session
    session_factory = _get_session_local()
    db = session_factory()
    try:
        run_assessment(db=db, assessment_id=assessment_id)
    except Exception as exc:
        logger.exception("Background assessment crashed: %s", exc)
        # Attempt to mark as FAILED
        try:
            assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
            if assessment and assessment.status == AssessmentStatus.PROCESSING:
                assessment.status = AssessmentStatus.FAILED
                assessment.error_message = str(exc)[:512]
                db.commit()
        except Exception:
            pass
    finally:
        db.close()
