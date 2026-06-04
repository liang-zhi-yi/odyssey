"""Progress business logic — progress logs, skill growth curve, path growth."""

from datetime import datetime, timedelta

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.progress.models import ProgressLog
from app.skills.models import Skill, UserSkill
from app.paths.models import Path, PathSkill
from app.core.exceptions import NotFoundException


def get_progress_logs(
    db: Session,
    user_id: str,
    *,
    limit: int = 20,
    skill_id: str | None = None,
) -> list[dict]:
    """Return recent progress log entries for a user.

    Args:
        db: Database session.
        user_id: The authenticated user's UUID.
        limit: Max entries to return (default 20).
        skill_id: Optional filter by skill.

    Returns:
        List of dicts with skill name, previous/current/delta scores, and reason.
    """
    q = (
        db.query(ProgressLog, Skill.name)
        .join(Skill, ProgressLog.skill_id == Skill.id)
        .filter(ProgressLog.user_id == user_id)
    )
    if skill_id:
        q = q.filter(ProgressLog.skill_id == skill_id)

    rows = (
        q.order_by(ProgressLog.created_at.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "skill": skill_name,
            "previous": log.previous_score,
            "current": log.new_score,
            "delta": log.score_delta,
            "reason": log.reason,
            "created_at": log.created_at,
        }
        for log, skill_name in rows
    ]


def get_skill_growth(
    db: Session,
    user_id: str,
    skill_id: str,
) -> list[dict]:
    """Return the growth curve for a specific skill.

    Includes both historical progress log entries AND the current UserSkill
    state as the latest data point.

    Args:
        db: Database session.
        user_id: The authenticated user's UUID.
        skill_id: The skill to query.

    Returns:
        List of {"date": "YYYY-MM-DD", "score": int} sorted ascending by date.
    """
    # Get progress log entries
    logs = (
        db.query(ProgressLog)
        .filter(
            ProgressLog.user_id == user_id,
            ProgressLog.skill_id == skill_id,
        )
        .order_by(ProgressLog.created_at.asc())
        .all()
    )

    points: list[dict] = []
    seen_dates: set[str] = set()

    for log in logs:
        date_str = log.created_at.strftime("%Y-%m-%d")
        points.append({"date": date_str, "score": log.new_score})
        seen_dates.add(date_str)

    # Add current UserSkill score as the latest point if it's newer
    user_skill = (
        db.query(UserSkill)
        .filter(
            UserSkill.user_id == user_id,
            UserSkill.skill_id == skill_id,
        )
        .first()
    )

    if user_skill and user_skill.last_assessed_at:
        current_date = user_skill.last_assessed_at.strftime("%Y-%m-%d")
        if current_date not in seen_dates:
            points.append({
                "date": current_date,
                "score": user_skill.overall_score,
            })
            points.sort(key=lambda p: p["date"])

    return points


def get_skill_trend(
    db: Session,
    user_id: str,
    skill_id: str,
    *,
    days: int = 30,
) -> list[dict]:
    """Return the growth trend for a skill over the last N days.

    Returns a list of {date, score} points suitable for sparkline rendering.
    Only includes points from the last `days` days.
    """
    cutoff = datetime.utcnow() - timedelta(days=days)

    logs = (
        db.query(ProgressLog)
        .filter(
            ProgressLog.user_id == user_id,
            ProgressLog.skill_id == skill_id,
            ProgressLog.created_at >= cutoff,
        )
        .order_by(ProgressLog.created_at.asc())
        .all()
    )

    points: list[dict] = []
    seen_dates: set[str] = set()

    for log in logs:
        date_str = log.created_at.strftime("%Y-%m-%d")
        if date_str not in seen_dates:
            points.append({"date": date_str, "score": log.new_score})
            seen_dates.add(date_str)

    # Add current score as latest point if within the window
    user_skill = (
        db.query(UserSkill)
        .filter(
            UserSkill.user_id == user_id,
            UserSkill.skill_id == skill_id,
        )
        .first()
    )

    if user_skill and user_skill.last_assessed_at:
        if user_skill.last_assessed_at >= cutoff:
            current_date = user_skill.last_assessed_at.strftime("%Y-%m-%d")
            if current_date not in seen_dates:
                points.append({
                    "date": current_date,
                    "score": user_skill.overall_score,
                })
                points.sort(key=lambda p: p["date"])

    return points


def get_path_growth(
    db: Session,
    user_id: str,
    path_id: str,
) -> dict:
    """Return growth curves for all skills in a learning path.

    Args:
        db: Database session.
        user_id: The authenticated user's UUID.
        path_id: The path to query.

    Returns:
        Dict with path_id, path_name, and skills list — each skill has
        its skill_id, skill_name, and growth points array.

    Raises:
        NotFoundException: If the path doesn't exist.
    """
    # Verify path exists
    path = db.query(Path).filter(Path.id == path_id).first()
    if path is None:
        raise NotFoundException("Path", path_id)

    # Get all skills in this path, ordered by stage_order
    path_skills = (
        db.query(PathSkill, Skill.name)
        .join(Skill, PathSkill.skill_id == Skill.id)
        .filter(PathSkill.path_id == path_id)
        .order_by(PathSkill.stage_order)
        .all()
    )

    skills_data: list[dict] = []
    for ps, skill_name in path_skills:
        points = get_skill_growth(db, user_id, str(ps.skill_id))
        skills_data.append({
            "skill_id": str(ps.skill_id),
            "skill_name": skill_name,
            "points": points,
        })

    return {
        "path_id": path_id,
        "path_name": path.name,
        "skills": skills_data,
    }


def get_timeline(
    db: Session,
    user_id: str,
    *,
    start_date: str | None = None,
    end_date: str | None = None,
    skill_id: str | None = None,
    limit: int = 50,
) -> dict:
    """Return timeline events with optional date/skill filters.

    Args:
        db: Database session.
        user_id: The authenticated user's UUID.
        start_date: Optional start date filter (YYYY-MM-DD).
        end_date: Optional end date filter (YYYY-MM-DD).
        skill_id: Optional filter by skill UUID.
        limit: Max entries to return (default 50).

    Returns:
        Dict with "events" list and "total" count.
    """
    q = (
        db.query(ProgressLog, Skill.name)
        .join(Skill, ProgressLog.skill_id == Skill.id)
        .filter(ProgressLog.user_id == user_id)
    )

    if skill_id:
        q = q.filter(ProgressLog.skill_id == skill_id)
    if start_date:
        q = q.filter(ProgressLog.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        # Include the full end date
        end_dt = datetime.fromisoformat(end_date) + timedelta(days=1)
        q = q.filter(ProgressLog.created_at < end_dt)

    total = q.count()

    rows = (
        q.order_by(ProgressLog.created_at.desc())
        .limit(limit)
        .all()
    )

    events = [
        {
            "date": log.created_at.strftime("%Y-%m-%d"),
            "skill_name": skill_name,
            "event_type": "assessment",
            "previous_score": log.previous_score,
            "new_score": log.new_score,
            "delta": log.score_delta,
            "reason": log.reason,
        }
        for log, skill_name in rows
    ]

    return {"events": events, "total": total}
