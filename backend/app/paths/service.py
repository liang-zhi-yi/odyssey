"""Paths business logic — available paths, user path selection."""

from uuid import UUID

from sqlalchemy.orm import Session

from app.paths.models import Path, UserPath
from app.skills.models import UserSkill
from app.core.enums import UserPathStatus
from app.core.exceptions import ConflictException, NotFoundException


def get_all_paths(db: Session) -> list[Path]:
    """Return every available Path."""
    return db.query(Path).order_by(Path.name).all()


def get_active_user_path(db: Session, user_id: str) -> dict | None:
    """Return the user's current active path with progress, or None."""
    row = (
        db.query(UserPath, Path.name)
        .join(Path, UserPath.path_id == Path.id)
        .filter(UserPath.user_id == user_id, UserPath.status == UserPathStatus.ACTIVE)
        .first()
    )
    if row is None:
        return None

    up, path_name = row
    # progress = average overall_score across skills in this path
    progress = _compute_path_progress(db, user_id, up.path_id)
    return {
        "path_id": str(up.path_id),
        "name": path_name,
        "progress": progress,
    }


def select_path(db: Session, user_id: str, path_id: str) -> UserPath:
    """Assign a path to the user. MVP: only one ACTIVE path is allowed."""
    # Validate path exists
    path = db.query(Path).filter(Path.id == path_id).first()
    if path is None:
        raise NotFoundException("Path", path_id)

    # Check for existing ACTIVE path
    existing = (
        db.query(UserPath)
        .filter(UserPath.user_id == user_id, UserPath.status == UserPathStatus.ACTIVE)
        .first()
    )
    if existing is not None:
        raise ConflictException(
            "PATH_ALREADY_ACTIVE",
            "You already have an active path. Pause or complete it first.",
        )

    user_path = UserPath(user_id=UUID(user_id), path_id=UUID(path_id))
    db.add(user_path)
    db.commit()
    db.refresh(user_path)
    return user_path


def _compute_path_progress(db: Session, user_id: str, path_id: str) -> int:
    """Return the average overall_score across skills linked to this path."""
    from app.paths.models import PathSkill

    skill_id_rows = (
        db.query(PathSkill.skill_id)
        .filter(PathSkill.path_id == path_id)
        .all()
    )
    skill_id_list = [str(s[0]) for s in skill_id_rows]
    if not skill_id_list:
        return 0

    scores = (
        db.query(UserSkill.overall_score)
        .filter(
            UserSkill.user_id == user_id,
            UserSkill.skill_id.in_(skill_id_list),
        )
        .all()
    )
    if not scores:
        return 0
    return sum(s[0] for s in scores) // len(scores)
