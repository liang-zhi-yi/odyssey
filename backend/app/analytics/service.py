"""Analytics business logic — insights, summary, trends."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.skills.models import UserSkill, Skill
from app.progress.models import ProgressLog
from app.assessments.models import Assessment
from app.submissions.models import QuestSubmission
from app.core.enums import AssessmentStatus
from app.analytics.schemas import (
    AIInsight,
    AnalyticsSummary,
    TrendPoint,
    TrendsResponse,
)
from app.analytics.insight_engine import generate_insights

logger = logging.getLogger(__name__)


def get_insights(db: Session, user_id: str) -> list[AIInsight]:
    """Generate AI-powered insights for a user.

    Args:
        db: SQLAlchemy session.
        user_id: UUID string of the user.

    Returns:
        List of AIInsight objects.
    """
    uid = UUID(user_id)
    return generate_insights(uid, db)


def _compute_streak(db: Session, user_id: UUID) -> int:
    """Compute the current consecutive days of activity for a user.

    Activity is defined as having at least one submission on a given day.
    Returns the number of consecutive days ending today (or yesterday).
    """
    from collections import defaultdict

    # Get all submission dates for this user
    submissions = (
        db.query(QuestSubmission.submitted_at)
        .filter(
            QuestSubmission.user_id == user_id,
            QuestSubmission.submitted_at.isnot(None),
        )
        .order_by(QuestSubmission.submitted_at.desc())
        .all()
    )

    if not submissions:
        return 0

    # Extract unique dates (date only, no time)
    active_dates = set()
    for (submitted_at,) in submissions:
        if submitted_at:
            active_dates.add(submitted_at.date())

    if not active_dates:
        return 0

    # Sort dates descending
    sorted_dates = sorted(active_dates, reverse=True)

    # Check if the most recent activity is within the last 2 days
    today = datetime.now(timezone.utc).date()
    yesterday = today - timedelta(days=1)

    if sorted_dates[0] < yesterday:
        return 0  # No recent activity

    # Count consecutive days
    streak = 1
    for i in range(1, len(sorted_dates)):
        expected = sorted_dates[i - 1] - timedelta(days=1)
        if sorted_dates[i] == expected:
            streak += 1
        else:
            break

    return streak


def get_summary(db: Session, user_id: str) -> AnalyticsSummary:
    """Compute analytics summary from database queries.

    Args:
        db: SQLAlchemy session.
        user_id: UUID string of the user.

    Returns:
        AnalyticsSummary with aggregate stats.
    """
    uid = UUID(user_id)

    # Total quests
    total_quests = (
        db.query(func.count(QuestSubmission.id))
        .filter(QuestSubmission.user_id == uid)
        .scalar()
    ) or 0

    # Total assessments (completed)
    total_assessments = (
        db.query(func.count(Assessment.id))
        .join(QuestSubmission, Assessment.submission_id == QuestSubmission.id)
        .filter(
            QuestSubmission.user_id == uid,
            Assessment.status == AssessmentStatus.COMPLETED,
        )
        .scalar()
    ) or 0

    # Growth rate — average score delta from progress logs
    log_deltas = (
        db.query(ProgressLog.score_delta)
        .filter(ProgressLog.user_id == uid)
        .all()
    )
    deltas = [d[0] for d in log_deltas]
    growth_rate = round(sum(deltas) / len(deltas), 1) if deltas else 0.0

    # Strongest / weakest skill by overall score
    user_skills = (
        db.query(UserSkill)
        .filter(UserSkill.user_id == uid)
        .all()
    )

    strongest_skill = None
    strongest_skill_en = None
    strongest_skill_score = None
    weakest_skill = None
    weakest_skill_en = None
    weakest_skill_score = None

    if user_skills:
        sorted_desc = sorted(user_skills, key=lambda s: s.overall_score, reverse=True)
        sorted_asc = sorted(user_skills, key=lambda s: s.overall_score)

        top = sorted_desc[0]
        skill_top = db.query(Skill).filter(Skill.id == top.skill_id).first()
        strongest_skill = skill_top.name if skill_top else "Unknown"
        strongest_skill_en = skill_top.name_en if skill_top and skill_top.name_en else strongest_skill
        strongest_skill_score = top.overall_score

        bottom = sorted_asc[0]
        skill_bottom = db.query(Skill).filter(Skill.id == bottom.skill_id).first()
        weakest_skill = skill_bottom.name if skill_bottom else "Unknown"
        weakest_skill_en = skill_bottom.name_en if skill_bottom and skill_bottom.name_en else weakest_skill
        weakest_skill_score = bottom.overall_score

    return AnalyticsSummary(
        total_quests=total_quests,
        total_assessments=total_assessments,
        growth_rate=growth_rate,
        streak_days=_compute_streak(db, uid),
        strongest_skill=strongest_skill,
        strongest_skill_en=strongest_skill_en,
        strongest_skill_score=strongest_skill_score,
        weakest_skill=weakest_skill,
        weakest_skill_en=weakest_skill_en,
        weakest_skill_score=weakest_skill_score,
    )


def get_trends(
    db: Session,
    user_id: str,
    skill_id: str,
    period_days: int = 30,
) -> TrendsResponse | None:
    """Get time-series trend data for a specific skill.

    Returns progress logs + assessment data ordered by date.

    Args:
        db: SQLAlchemy session.
        user_id: UUID of the user.
        skill_id: UUID of the skill.
        period_days: Number of days to look back.

    Returns:
        TrendsResponse with time-series points, or None if skill not found.
    """
    uid = UUID(user_id)
    sid = UUID(skill_id)

    skill = db.query(Skill).filter(Skill.id == sid).first()
    if not skill:
        return None

    since = datetime.now(timezone.utc) - timedelta(days=period_days)

    # Get completed assessments for this skill in the period
    assessments = (
        db.query(Assessment)
        .join(QuestSubmission, Assessment.submission_id == QuestSubmission.id)
        .filter(
            QuestSubmission.user_id == uid,
            QuestSubmission.quest.has(skill_id=sid),
            Assessment.status == AssessmentStatus.COMPLETED,
            Assessment.assessed_at >= since,
        )
        .order_by(Assessment.assessed_at.asc())
        .all()
    )

    points = []
    for a in assessments:
        points.append(TrendPoint(
            date=a.assessed_at.strftime("%Y-%m-%d") if a.assessed_at else "",
            overall=a.overall_score or 0,
            knowledge=a.knowledge_score or 0,
            reasoning=a.reasoning_score or 0,
            application=a.application_score or 0,
            creation=a.creation_score or 0,
        ))

    return TrendsResponse(
        skill_id=str(sid),
        skill_name=skill.name,
        skill_name_en=skill.name_en,
        points=points,
    )
