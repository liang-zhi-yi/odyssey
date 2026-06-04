"""Paths business logic — available paths, user path selection."""

from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from app.paths.models import Path, PathSkill, UserPath
from app.skills.models import Skill, UserSkill
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


def get_path_nodes(db: Session, path_id: str) -> dict | None:
    """Return a path with all its skill nodes (stages) in order."""
    path = (
        db.query(Path)
        .options(joinedload(Path.path_skills).joinedload(PathSkill.skill))
        .filter(Path.id == path_id)
        .first()
    )
    if path is None:
        raise NotFoundException("Path", path_id)

    nodes = []
    for ps in sorted(path.path_skills, key=lambda x: x.stage_order):
        nodes.append({
            "stage_order": ps.stage_order,
            "skill_id": str(ps.skill_id),
            "skill_name": ps.skill.name,
            "skill_description": ps.skill.description,
            "required_score": ps.required_score,
        })

    return {
        "path_id": str(path.id),
        "path_name": path.name,
        "path_description": path.description,
        "nodes": nodes,
    }


def get_next_path_node(db: Session, user_id: str) -> dict | None:
    """Return the first incomplete path node for the user, or None if all done."""
    up_row = (
        db.query(UserPath)
        .filter(UserPath.user_id == user_id, UserPath.status == UserPathStatus.ACTIVE)
        .first()
    )
    if up_row is None:
        return None

    # Get all path skills in order
    path_skills = (
        db.query(PathSkill)
        .options(joinedload(PathSkill.skill))
        .filter(PathSkill.path_id == up_row.path_id)
        .order_by(PathSkill.stage_order)
        .all()
    )

    for ps in path_skills:
        us = (
            db.query(UserSkill)
            .filter(
                UserSkill.user_id == user_id,
                UserSkill.skill_id == ps.skill_id,
            )
            .first()
        )
        current_score = us.overall_score if us else 0
        if current_score < ps.required_score:
            return {
                "stage_order": ps.stage_order,
                "skill_id": str(ps.skill_id),
                "skill_name": ps.skill.name,
                "skill_description": ps.skill.description,
                "required_score": ps.required_score,
                "current_score": current_score,
                "path_id": str(up_row.path_id),
            }

    return None  # All nodes complete


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
