"""Quests business logic — list, detail, accept, user quests, recommendations."""

import random
from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from app.quests.models import Quest
from app.submissions.models import QuestSubmission
from app.core.enums import SubmissionStatus, QuestDifficulty, QuestType
from app.core.exceptions import ConflictException, NotFoundException


# ── Reward calculation ──────────────────────────────────────────────────

# Reward base values by difficulty level
DIFFICULTY_REWARD_MAP = {
    "LEVEL_1": {"knowledge": 5, "reasoning": 3, "application": 2, "creation": 2, "building_exp": 10, "civ": 30},
    "LEVEL_2": {"knowledge": 8, "reasoning": 6, "application": 5, "creation": 4, "building_exp": 25, "civ": 60},
    "LEVEL_3": {"knowledge": 12, "reasoning": 10, "application": 10, "creation": 8, "building_exp": 50, "civ": 120},
    "LEVEL_4": {"knowledge": 18, "reasoning": 15, "application": 15, "creation": 12, "building_exp": 80, "civ": 200},
}

# Type multipliers adjust dimension weights based on quest_type
QUEST_TYPE_MULTIPLIERS = {
    "KNOWLEDGE": {"knowledge": 1.5, "reasoning": 0.8, "application": 0.5, "creation": 0.5},
    "APPLICATION": {"knowledge": 0.8, "reasoning": 1.0, "application": 1.5, "creation": 0.7},
    "PROJECT": {"knowledge": 1.0, "reasoning": 1.0, "application": 1.0, "creation": 1.0},
    "MASTERY": {"knowledge": 1.2, "reasoning": 1.2, "application": 1.2, "creation": 1.5},
}


def calculate_reward_preview(difficulty: str, quest_type: str) -> dict:
    """Calculate estimated reward preview for a quest.

    Based on difficulty level and quest type, returns the 4-dimension
    knowledge/reasoning/application/creation gains, building EXP, and
    civilization contribution value.
    """
    base = DIFFICULTY_REWARD_MAP.get(difficulty, DIFFICULTY_REWARD_MAP["LEVEL_1"])
    multipliers = QUEST_TYPE_MULTIPLIERS.get(quest_type, QUEST_TYPE_MULTIPLIERS["APPLICATION"])

    return {
        "knowledge": round(base["knowledge"] * multipliers.get("knowledge", 1.0)),
        "reasoning": round(base["reasoning"] * multipliers.get("reasoning", 1.0)),
        "application": round(base["application"] * multipliers.get("application", 1.0)),
        "creation": round(base["creation"] * multipliers.get("creation", 1.0)),
        "building_exp": base["building_exp"],
        "civilization_contribution": base["civ"],
    }


def get_building_for_skill(db: Session, skill_id: str | UUID) -> dict | None:
    """Resolve the BuildingTemplate associated with a skill."""
    from app.world.models import BuildingTemplate
    from app.skills.models import UserSkill

    skill_id = UUID(str(skill_id)) if isinstance(skill_id, str) else skill_id
    tpl = db.query(BuildingTemplate).filter(BuildingTemplate.skill_id == skill_id).first()
    if not tpl:
        return None

    return {
        "id": str(tpl.id),
        "name": tpl.name,
        "name_en": tpl.name_en,
        "icon": tpl.icon,
        "region": tpl.region,
        "region_en": tpl.region_en,
        "max_level": tpl.max_level,
    }


def get_building_context(db: Session, skill_id: str | UUID, user_id: str | UUID | None = None) -> dict | None:
    """Get building context including current user level if available."""
    from app.world.models import BuildingTemplate, UserBuilding
    from app.skills.models import UserSkill

    skill_id = UUID(str(skill_id)) if isinstance(skill_id, str) else skill_id
    tpl = db.query(BuildingTemplate).filter(BuildingTemplate.skill_id == skill_id).first()
    if not tpl:
        return None

    result = {
        "id": str(tpl.id),
        "name": tpl.name,
        "name_en": tpl.name_en,
        "icon": tpl.icon,
        "region": tpl.region,
        "region_en": tpl.region_en,
        "max_level": tpl.max_level,
    }

    if user_id:
        user_id = UUID(str(user_id)) if isinstance(user_id, str) else user_id
        ub = db.query(UserBuilding).filter(
            UserBuilding.user_id == user_id,
            UserBuilding.building_template_id == tpl.id,
        ).first()
        us = db.query(UserSkill).filter(
            UserSkill.user_id == user_id,
            UserSkill.skill_id == skill_id,
        ).first()

        current_score = us.overall_score if us else 0
        from app.world.upgrade_engine import score_to_level
        next_thresholds = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
        next_level_at = None
        for t in next_thresholds:
            if current_score < t:
                next_level_at = t
                break

        result.update({
            "current_level": ub.level if ub else 1,
            "current_score": current_score,
            "next_level_at": next_level_at,
            "status": ub.status.value if ub and hasattr(ub.status, 'value') else "LOCKED",
        })

    return result


# ── CRUD ────────────────────────────────────────────────────────────────

def get_quests(
    db: Session,
    skill_id: str | None = None,
    difficulty: str | None = None,
) -> list[Quest]:
    """Return quests with skill relationship loaded, optionally filtered by skill and/or difficulty."""
    q = db.query(Quest).options(joinedload(Quest.skill))
    if skill_id:
        q = q.filter(Quest.skill_id == skill_id)
    if difficulty:
        q = q.filter(Quest.difficulty == difficulty)
    return q.order_by(Quest.difficulty, Quest.title).all()


def get_quest_detail(db: Session, quest_id: str) -> Quest:
    """Return a single quest with its skill relationship loaded, or raise NotFoundException."""
    quest = (
        db.query(Quest)
        .options(joinedload(Quest.skill))
        .filter(Quest.id == quest_id)
        .first()
    )
    if quest is None:
        raise NotFoundException("Quest", quest_id)
    return quest


def get_recommended_quests(
    db: Session, user_id: str, limit: int = 4, context: str | None = None
) -> tuple[list[Quest], dict[str, dict] | None]:
    """Return daily recommended quests — quests the user hasn't accepted yet.

    When context="world", prioritises quests for skills whose buildings are
    closest to the next level threshold, and returns building_context info.

    Returns: (quests, building_context_map) where building_context_map is
    {quest_id: {building_name, building_icon, current_level, next_level_at}}
    """
    # Quests the user has already interacted with
    accepted_ids = {
        str(row.quest_id)
        for row in db.query(QuestSubmission.quest_id)
        .filter(QuestSubmission.user_id == user_id)
        .all()
    }

    # All available quests with skill loaded
    all_quests = (
        db.query(Quest)
        .options(joinedload(Quest.skill))
        .order_by(Quest.difficulty, Quest.title)
        .all()
    )

    # Filter out already-accepted quests
    available = [q for q in all_quests if str(q.id) not in accepted_ids]

    if not available:
        available = all_quests

    building_context: dict[str, dict] | None = None

    if context == "world":
        # Find buildings closest to the next level threshold and prioritize their skills
        from app.world.models import BuildingTemplate, UserBuilding
        from app.skills.models import UserSkill

        user_buildings = (
            db.query(UserBuilding)
            .filter(UserBuilding.user_id == user_id)
            .all()
        )
        # Build skill_id -> building gap info
        skill_gaps: dict[str, dict] = {}
        for ub in user_buildings:
            if ub.building_template_id is None:
                continue
            tpl = db.query(BuildingTemplate).filter(
                BuildingTemplate.id == ub.building_template_id
            ).first()
            if tpl is None:
                continue

            skill_id_str = str(tpl.skill_id)
            us = (
                db.query(UserSkill)
                .filter(
                    UserSkill.user_id == user_id,
                    UserSkill.skill_id == tpl.skill_id,
                )
                .first()
            )
            current_score = us.overall_score if us else 0
            # Calculate next level threshold
            from app.world.service import score_to_next_level
            next_at = score_to_next_level(current_score)
            gap = next_at - current_score if next_at <= 100 else 999

            skill_gaps[skill_id_str] = {
                "building_name": tpl.name,
                "building_name_en": tpl.name_en,
                "building_icon": tpl.icon,
                "current_level": ub.level,
                "current_score": current_score,
                "next_level_at": next_at,
                "gap": gap,
            }

        # Sort available quests: those with smaller gaps come first
        available.sort(
            key=lambda q: skill_gaps.get(str(q.skill_id), {}).get("gap", 999)
        )

        # Build building_context map for eligible quests
        building_context = {}
        for q in all_quests:
            sid = str(q.skill_id)
            if sid in skill_gaps and skill_gaps[sid]["next_level_at"] <= 100:
                building_context[str(q.id)] = {
                    "building_name": skill_gaps[sid]["building_name"],
                    "building_name_en": skill_gaps[sid]["building_name_en"],
                    "building_icon": skill_gaps[sid]["building_icon"],
                    "current_level": skill_gaps[sid]["current_level"],
                    "next_level_at": skill_gaps[sid]["next_level_at"],
                }
    else:
        # Deterministic daily shuffle: seed from date so it changes daily
        from datetime import date
        daily_seed = int(date.today().strftime("%Y%m%d"))
        rng = random.Random(daily_seed)
        rng.shuffle(available)

    return available[:limit], building_context


def get_quests_by_skill(db: Session, skill_id: str) -> list[Quest]:
    """Return all quests for a specific skill (used for path-node quest push)."""
    return (
        db.query(Quest)
        .options(joinedload(Quest.skill))
        .filter(Quest.skill_id == skill_id)
        .order_by(Quest.difficulty, Quest.title)
        .all()
    )


def accept_quest(db: Session, user_id: str, quest_id: str) -> QuestSubmission:
    """Accept a quest — creates a QuestSubmission with status ACCEPTED."""
    # Ensure the quest exists
    _ = get_quest_detail(db, quest_id)

    # Prevent duplicate acceptance of the same quest by the same user
    existing = (
        db.query(QuestSubmission)
        .filter(
            QuestSubmission.user_id == user_id,
            QuestSubmission.quest_id == quest_id,
        )
        .first()
    )
    if existing is not None:
        raise ConflictException(
            "QUEST_ALREADY_ACCEPTED",
            "You have already accepted this quest",
        )

    submission = QuestSubmission(
        user_id=UUID(user_id),
        quest_id=UUID(quest_id),
        status=SubmissionStatus.ACCEPTED,
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission


def get_user_quests(db: Session, user_id: str) -> list[dict]:
    """Return all quests the user has interacted with, including status and counts."""
    from sqlalchemy import desc

    # Get all user's submissions with quest titles, ordered newest first
    rows = (
        db.query(QuestSubmission, Quest.title, Quest.title_en)
        .join(Quest, QuestSubmission.quest_id == Quest.id)
        .filter(QuestSubmission.user_id == user_id)
        .order_by(desc(QuestSubmission.submitted_at))
        .all()
    )

    # Group by quest_id: first row is the latest submission (used for status/id),
    # count tracks total submissions per quest
    seen: dict[str, dict] = {}
    for sub, title, title_en in rows:
        qid = str(sub.quest_id)
        if qid not in seen:
            seen[qid] = {
                "quest_id": qid,
                "quest_title": title,
                "quest_title_en": title_en,
                "status": sub.status.value,
                "latest_submission_id": str(sub.id),
                "submission_count": 0,
            }
        seen[qid]["submission_count"] += 1

    return list(seen.values())


def abandon_quest(
    db: Session, user_id: str, quest_id: str
) -> dict:
    """Abandon an accepted quest.

    Only allowed when the submission status is ACCEPTED or IN_PROGRESS.
    Once SUBMITTED or ASSESSING, the quest cannot be abandoned.

    Raises:
        NotFoundException: If the quest hasn't been accepted.
        ConflictException: If the quest cannot be abandoned at its current status.
    """
    submission = (
        db.query(QuestSubmission)
        .filter(
            QuestSubmission.user_id == user_id,
            QuestSubmission.quest_id == quest_id,
        )
        .order_by(QuestSubmission.submitted_at.desc())
        .first()
    )

    if submission is None:
        raise NotFoundException(
            "QuestSubmission",
            f"quest={quest_id} — you haven't accepted this quest",
        )

    if submission.status not in (
        SubmissionStatus.ACCEPTED,
        SubmissionStatus.IN_PROGRESS,
    ):
        raise ConflictException(
            "CANNOT_ABANDON",
            f"Cannot abandon a quest with status '{submission.status.value}'. "
            "Only ACCEPTED or IN_PROGRESS quests can be abandoned.",
        )

    submission.status = SubmissionStatus.ABANDONED
    db.commit()

    return {"status": "ABANDONED", "quest_id": quest_id}
