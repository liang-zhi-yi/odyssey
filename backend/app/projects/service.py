"""Projects business logic — create, list, and detail user projects."""

from uuid import UUID
from collections import defaultdict

from sqlalchemy.orm import Session, joinedload

from app.projects.models import Project
from app.submissions.models import QuestSubmission
from app.quests.models import Quest
from app.skills.models import Skill
from app.world.models import BuildingTemplate, UserBuilding
from app.learning_paths.models import LearningPathQuest, LearningPath
from app.core.enums import SubmissionStatus
from app.core.exceptions import NotFoundException, ConflictException


def _score_to_grade(score: int | None) -> str | None:
    """Map 0-100 assessment score to S/A/B/C/D grade."""
    if score is None:
        return None
    if score >= 90:
        return "S"
    elif score >= 80:
        return "A"
    elif score >= 70:
        return "B"
    elif score >= 60:
        return "C"
    else:
        return "D"


def _enrich_project(
    p: Project,
    ub_by_template: dict,
    source_path_by_quest: dict,
) -> dict:
    """Build a rich project dict from a Project ORM instance + pre-fetched lookups."""

    result: dict = {
        "id": str(p.id),
        "title": p.title,
        "description": p.description,
        "github_url": p.github_url,
        "demo_url": p.demo_url,
        "created_at": p.created_at,
        "related_skill": None,
        "related_building": None,
        "quest_submission": None,
        "source_path": None,
    }

    # ── Related skill ──────────────────────────────────────────────
    skill = p.related_skill
    if skill is not None:
        result["related_skill"] = {
            "id": str(skill.id),
            "name": skill.name,
            "category": skill.category,
        }

        # Related building (Skill → BuildingTemplate → UserBuilding)
        bt = skill.building_template
        if bt is not None:
            ub = ub_by_template.get(bt.id)
            if ub is not None:
                result["related_building"] = {
                    "id": str(ub.id),
                    "name": bt.name,
                    "icon": bt.icon,
                    "level": ub.level,
                }

    # ── Quest submission (with assessment grade) ────────────────────
    qs = p.quest_submission
    if qs is not None:
        quest = qs.quest
        assessment = qs.assessment

        quest_title = quest.title if quest else ""
        quest_id_str = str(quest.id) if quest else ""

        assessment_score = None
        assessment_grade = None
        if assessment is not None:
            assessment_score = assessment.overall_score
            assessment_grade = _score_to_grade(assessment_score)

        status_str = qs.status.value if hasattr(qs.status, "value") else str(qs.status)

        result["quest_submission"] = {
            "id": str(qs.id),
            "status": status_str,
            "quest_title": quest_title,
            "quest_id": quest_id_str,
            "assessment_score": assessment_score,
            "assessment_grade": assessment_grade,
        }

        # Source learning path (Quest → LearningPathQuest → LearningPath)
        if quest is not None:
            lp = source_path_by_quest.get(quest.id)
            if lp is not None:
                result["source_path"] = {
                    "id": str(lp.id),
                    "title": lp.title,
                }

    return result


def create_project(db: Session, user_id: str, data: dict) -> Project:
    """Create a new project for the user.

    If quest_submission_id is provided, validates that:
      - The submission exists and belongs to the user.
      - The submission has status PASSED.
    """
    uid = UUID(user_id)

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


def _fetch_user_buildings(db: Session, user_id: UUID) -> dict:
    """Fetch user buildings keyed by template_id."""
    ubs = (
        db.query(UserBuilding)
        .filter(UserBuilding.user_id == user_id)
        .all()
    )
    return {ub.building_template_id: ub for ub in ubs}


def _fetch_source_paths(db: Session, quest_ids: set, user_id: UUID) -> dict:
    """Fetch source learning paths for given quest_ids, keyed by quest_id."""
    if not quest_ids:
        return {}
    result = {}
    lpq_entries = (
        db.query(LearningPathQuest)
        .options(joinedload(LearningPathQuest.learning_path))
        .filter(
            LearningPathQuest.quest_id.in_(list(quest_ids)),
            LearningPathQuest.user_id == user_id,
        )
        .all()
    )
    for lpq in lpq_entries:
        if lpq.quest_id and lpq.learning_path:
            # First path wins per quest
            if lpq.quest_id not in result:
                result[lpq.quest_id] = lpq.learning_path
    return result


def _query_projects(db: Session, user_id: UUID):
    """Base query for projects with eager-loaded relationships."""
    return (
        db.query(Project)
        .options(
            joinedload(Project.related_skill).joinedload(Skill.building_template),
            joinedload(Project.quest_submission)
            .joinedload(QuestSubmission.quest),
            joinedload(Project.quest_submission)
            .joinedload(QuestSubmission.assessment),
        )
        .filter(Project.user_id == user_id)
    )


def list_projects(db: Session, user_id: str) -> list[dict]:
    """Return all projects belonging to the user with enriched relations."""
    uid = UUID(user_id)
    projects = (
        _query_projects(db, uid)
        .order_by(Project.created_at.desc())
        .all()
    )

    ub_by_template = _fetch_user_buildings(db, uid)

    # Collect quest_ids from projects for source-path lookup
    quest_ids = set()
    for p in projects:
        if p.quest_submission and p.quest_submission.quest:
            quest_ids.add(p.quest_submission.quest.id)
    source_path_by_quest = _fetch_source_paths(db, quest_ids, uid)

    return [
        _enrich_project(p, ub_by_template, source_path_by_quest)
        for p in projects
    ]


def delete_project(db: Session, user_id: str, project_id: str) -> None:
    """Delete a project. Verifies ownership before deletion."""
    uid = UUID(user_id)
    pid = UUID(project_id)

    project = (
        db.query(Project)
        .filter(Project.id == pid, Project.user_id == uid)
        .first()
    )

    if project is None:
        raise NotFoundException("Project", project_id)

    db.delete(project)
    db.commit()


def get_project(db: Session, user_id: str, project_id: str) -> dict:
    """Return a single project by id with enriched relations."""
    uid = UUID(user_id)
    pid = UUID(project_id)

    p = (
        _query_projects(db, uid)
        .filter(Project.id == pid)
        .first()
    )

    if p is None:
        raise NotFoundException("Project", project_id)

    ub_by_template = _fetch_user_buildings(db, uid)

    quest_ids = set()
    if p.quest_submission and p.quest_submission.quest:
        quest_ids.add(p.quest_submission.quest.id)
    source_path_by_quest = _fetch_source_paths(db, quest_ids, uid)

    return _enrich_project(p, ub_by_template, source_path_by_quest)
