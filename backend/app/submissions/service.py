"""Submissions business logic — submit quest work, retrieve submission status."""

from uuid import UUID
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.submissions.models import QuestSubmission
from app.quests.models import Quest
from app.core.enums import SubmissionStatus
from app.core.exceptions import NotFoundException, ConflictException, ValidationException


def submit_quest(
    db: Session,
    user_id: str,
    quest_id: str,
    content: str | None,
    github_url: str | None,
    demo_url: str | None,
) -> QuestSubmission:
    """Submit work for an accepted quest.

    Finds the user's QuestSubmission for this quest (must be ACCEPTED or IN_PROGRESS),
    sets submission content, and transitions to SUBMITTED.

    Raises:
        NotFoundException: If the quest hasn't been accepted yet.
        ConflictException: If already submitted.
    """
    submission = (
        db.query(QuestSubmission)
        .filter(
            QuestSubmission.user_id == user_id,
            QuestSubmission.quest_id == quest_id,
        )
        .first()
    )
    if submission is None:
        raise NotFoundException(
            "QuestSubmission",
            f"quest={quest_id} — accept the quest first",
        )

    if submission.status == SubmissionStatus.SUBMITTED:
        raise ConflictException(
            "ALREADY_SUBMITTED",
            "This quest has already been submitted",
        )
    if submission.status == SubmissionStatus.ASSESSING:
        raise ConflictException(
            "ASSESSING_IN_PROGRESS",
            "This quest is currently being assessed",
        )
    if submission.status in (SubmissionStatus.PASSED, SubmissionStatus.FAILED):
        raise ConflictException(
            "QUEST_ALREADY_COMPLETED",
            f"This quest has already been {submission.status.value}",
        )

    # Combine github_url and demo_url into submission_url
    urls = []
    if github_url:
        urls.append(f"github: {github_url}")
    if demo_url:
        urls.append(f"demo: {demo_url}")

    submission.submission_content = content
    submission.submission_url = "\n".join(urls) if urls else None
    submission.status = SubmissionStatus.SUBMITTED
    submission.submitted_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(submission)
    return submission


def get_submission(db: Session, submission_id: str, user_id: str) -> dict:
    """Return a submission with its quest title.

    Raises:
        NotFoundException: If the submission doesn't exist or doesn't belong to user.
    """
    row = (
        db.query(QuestSubmission, Quest.title)
        .join(Quest, QuestSubmission.quest_id == Quest.id)
        .filter(
            QuestSubmission.id == submission_id,
            QuestSubmission.user_id == user_id,
        )
        .first()
    )
    if row is None:
        raise NotFoundException("QuestSubmission", submission_id)

    sub, quest_title = row
    return {
        "submission_id": str(sub.id),
        "quest_id": str(sub.quest_id),
        "quest_title": quest_title,
        "content": sub.submission_content,
        "github_url": _extract_url(sub.submission_url, "github"),
        "demo_url": _extract_url(sub.submission_url, "demo"),
        "status": sub.status.value,
        "submitted_at": sub.submitted_at.isoformat() if sub.submitted_at else None,
    }


def _extract_url(submission_url: str | None, prefix: str) -> str | None:
    """Extract a URL from the combined submission_url field."""
    if not submission_url:
        return None
    for line in submission_url.split("\n"):
        if line.startswith(f"{prefix}: "):
            return line.removeprefix(f"{prefix}: ")
    return None
