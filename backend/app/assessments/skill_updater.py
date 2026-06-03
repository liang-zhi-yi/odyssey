"""
Skill updater — applies assessment results to UserSkill.

After an assessment completes, this module:
  1. Fetches the UserSkill row for the user + skill
  2. Applies the per-dimension smoothed update formula:
     new_dim = round(old_dim × 0.8 + assessed_dim × 0.2)
  3. Recomputes overall_score and rank
  4. Saves the changes
"""
import logging
from uuid import UUID

from sqlalchemy.orm import Session

from app.skills.models import UserSkill
from app.core.exceptions import NotFoundException

logger = logging.getLogger(__name__)

UPDATE_WEIGHT = 0.2  # How much the new assessment contributes (20%)


def apply_assessment_to_user_skill(
    db: Session,
    user_id: str | UUID,
    skill_id: str | UUID,
    assessment_scores: dict,
) -> UserSkill:
    """Update the UserSkill with assessment results using smoothed per-dimension formula.

    Args:
        db: Database session.
        user_id: The user being assessed.
        skill_id: The skill being assessed.
        assessment_scores: Dict with keys knowledge/reasoning/application/creation,
                           each containing {"score": int, "justification": str}.

    Returns:
        The updated UserSkill instance (already flushed to DB).

    Raises:
        NotFoundException: If the UserSkill row doesn't exist.
    """
    user_skill = (
        db.query(UserSkill)
        .filter(UserSkill.user_id == user_id, UserSkill.skill_id == skill_id)
        .first()
    )
    if user_skill is None:
        raise NotFoundException(
            "UserSkill", f"user={user_id} skill={skill_id}"
        )

    old_k = user_skill.knowledge_score
    old_r = user_skill.reasoning_score
    old_a = user_skill.application_score
    old_c = user_skill.creation_score
    old_overall = user_skill.overall_score

    new_k = UserSkill.apply_assessment(
        user_skill.knowledge_score,
        assessment_scores["knowledge"]["score"],
        weight=UPDATE_WEIGHT,
    )
    new_r = UserSkill.apply_assessment(
        user_skill.reasoning_score,
        assessment_scores["reasoning"]["score"],
        weight=UPDATE_WEIGHT,
    )
    new_a = UserSkill.apply_assessment(
        user_skill.application_score,
        assessment_scores["application"]["score"],
        weight=UPDATE_WEIGHT,
    )
    new_c = UserSkill.apply_assessment(
        user_skill.creation_score,
        assessment_scores["creation"]["score"],
        weight=UPDATE_WEIGHT,
    )

    new_overall = UserSkill.compute_overall(new_k, new_r, new_a, new_c)
    new_rank = UserSkill.compute_rank(new_overall)

    user_skill.knowledge_score = new_k
    user_skill.reasoning_score = new_r
    user_skill.application_score = new_a
    user_skill.creation_score = new_c
    user_skill.overall_score = new_overall
    user_skill.rank = new_rank

    db.flush()

    logger.info(
        "UserSkill updated — user=%s skill=%s | "
        "K: %d→%d | R: %d→%d | A: %d→%d | C: %d→%d | "
        "Overall: %d→%d | Rank: %s",
        user_id, skill_id,
        old_k, new_k, old_r, new_r, old_a, new_a, old_c, new_c,
        old_overall, new_overall, new_rank.value,
    )

    return user_skill
