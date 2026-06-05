"""
Credential checker — automatically awards credentials after assessment.

Called from the assessment engine after UserSkill is updated.
Checks multi-dimension thresholds per skill and composite meta-credentials.
"""
import logging
from uuid import UUID

from sqlalchemy.orm import Session

from app.credentials.models import Credential, UserCredential
from app.skills.models import UserSkill

logger = logging.getLogger(__name__)

# Practitioner threshold: all four dimensions >= 60
PRACTITIONER_THRESHOLD = 60

# Agent Engineer threshold: all four skills each have all dimensions >= 60
AGENT_ENGINEER_CREDENTIAL = "Agent Engineer"


def check_and_award_credentials(
    db: Session,
    user_id: str | UUID,
    skill_id: str | UUID,
) -> list[str]:
    """Check credential thresholds after an assessment and award any earned.

    Two-level check:
      1. Skill-level: if all 4 dimensions of the updated skill >= 60,
         award the Practitioner credential for that skill.
      2. Meta-level: if ALL 4 core skills each have all dimensions >= 60,
         award the "Agent Engineer" composite credential.

    Args:
        db: Active DB session (caller commits).
        user_id: UUID of the assessed user.
        skill_id: UUID of the skill that was just assessed.

    Returns:
        List of credential names that were newly awarded.
    """
    user_id = UUID(str(user_id))
    skill_id = UUID(str(skill_id))
    awarded: list[str] = []

    # ── 1. Skill-level credential ───────────────────────────────────
    user_skill = (
        db.query(UserSkill)
        .filter(
            UserSkill.user_id == user_id,
            UserSkill.skill_id == skill_id,
        )
        .first()
    )

    if user_skill is None:
        logger.warning("UserSkill not found for user=%s skill=%s", user_id, skill_id)
        return awarded

    if _all_dims_above(user_skill, PRACTITIONER_THRESHOLD):
        credential = (
            db.query(Credential)
            .filter(Credential.skill_id == skill_id)
            .first()
        )
        if credential is not None:
            awarded_name = _award(db, user_id, credential)
            if awarded_name:
                awarded.append(awarded_name)
                logger.info(
                    "Skill credential awarded — user=%s credential=%s",
                    user_id, credential.name,
                )
                # Create notification for credential earned
                try:
                    from app.notifications.service import create_notification
                    skill_name = user_skill.skill.name if user_skill.skill else "Unknown"
                    create_notification(
                        db,
                        user_id=user_id,
                        type="CREDENTIAL_EARNED",
                        title=f"获得证书：{credential.name}",
                        title_en=f"Credential Earned: {credential.name}",
                        body=f"恭喜！你的{skill_name}技能四项维度均达到60分以上，获得{credential.name}证书。",
                        body_en=f"Congratulations! All four dimensions of {skill_name} reached 60+. You earned the {credential.name} credential.",
                        link="/credentials",
                    )
                except Exception as exc:
                    logger.warning("Credential notification failed: %s", exc)

    # ── 2. Agent Engineer meta-credential ───────────────────────────
    all_user_skills = (
        db.query(UserSkill)
        .filter(UserSkill.user_id == user_id)
        .all()
    )

    # Need all 4 core skills and each must pass the multi-dimension threshold
    if len(all_user_skills) >= 4 and all(
        _all_dims_above(us, PRACTITIONER_THRESHOLD) for us in all_user_skills
    ):
        ae_credential = (
            db.query(Credential)
            .filter(Credential.name == AGENT_ENGINEER_CREDENTIAL)
            .first()
        )
        if ae_credential is not None:
            awarded_name = _award(db, user_id, ae_credential)
            if awarded_name:
                awarded.append(awarded_name)
                logger.info(
                    "Meta-credential awarded — user=%s credential=%s",
                    user_id, AGENT_ENGINEER_CREDENTIAL,
                )
                # Create notification for Agent Engineer meta-credential
                try:
                    from app.notifications.service import create_notification
                    create_notification(
                        db,
                        user_id=user_id,
                        type="CREDENTIAL_EARNED",
                        title=f"获得复合证书：{AGENT_ENGINEER_CREDENTIAL}",
                        title_en=f"Compound Credential Earned: {AGENT_ENGINEER_CREDENTIAL}",
                        body=f"恭喜！你已掌握全部四项核心AI技能，获得{AGENT_ENGINEER_CREDENTIAL}复合证书！",
                        body_en=f"Congratulations! You've mastered all 4 core AI skills and earned the {AGENT_ENGINEER_CREDENTIAL} compound credential!",
                        link="/credentials",
                    )
                except Exception as exc:
                    logger.warning("Meta-credential notification failed: %s", exc)

    return awarded


def _all_dims_above(user_skill: UserSkill, threshold: int) -> bool:
    """Return True if all four dimensions are >= threshold."""
    return (
        user_skill.knowledge_score >= threshold
        and user_skill.reasoning_score >= threshold
        and user_skill.application_score >= threshold
        and user_skill.creation_score >= threshold
    )


def _award(db: Session, user_id: UUID, credential: Credential) -> str | None:
    """Create a UserCredential if it doesn't already exist.

    Returns the credential name if newly awarded, None if already held.
    """
    existing = (
        db.query(UserCredential)
        .filter(
            UserCredential.user_id == user_id,
            UserCredential.credential_id == credential.id,
        )
        .first()
    )
    if existing is not None:
        return None  # Already awarded

    uc = UserCredential(user_id=user_id, credential_id=credential.id)
    db.add(uc)
    return credential.name
