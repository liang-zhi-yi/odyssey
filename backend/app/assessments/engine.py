"""
Assessment engine — orchestrates the full evaluation pipeline.

Flow:
  1. Load submission + quest + skill
  2. Get the rubric for the skill
  3. Build the evaluation prompt (rubric embedded inline)
  4. Run LLM evaluation with consistency retry protocol
  5. Apply results to UserSkill (smoothed per-dimension update)
  6. Log progress
  7. Update Assessment record with scores
  8. Update QuestSubmission status (PASSED/FAILED)
"""
import logging
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.orm import Session

from app.submissions.models import QuestSubmission
from app.quests.models import Quest
from app.skills.models import Skill
from app.assessments.models import Assessment
from app.core.enums import SubmissionStatus, AssessmentStatus
from app.core.llm import LLMClientError

from app.assessments.rubrics import get_rubric_for_skill
from app.assessments.prompt_builder import build_system_prompt, build_user_message
from app.assessments.consistency import run_consistent_assessment
from app.skills.models import UserSkill
from app.assessments.skill_updater import apply_assessment_to_user_skill
from app.assessments.progress_logger import log_progress
from app.credentials.checker import check_and_award_credentials
from app.badges.engine import check_and_award_badges

logger = logging.getLogger(__name__)

# Threshold for passing a quest (overall score must reach this)
PASS_THRESHOLD = 40


def run_assessment(db: Session, assessment_id: str | UUID) -> None:
    """Run the full assessment pipeline for a given Assessment record.

    This function is designed to be called from a FastAPI BackgroundTasks
    handler. It manages the complete lifecycle:
      PROCESSING → COMPLETED (on success) or FAILED (on error)

    Args:
        db: A SQLAlchemy database session (will be committed/rolled back here).
        assessment_id: UUID of the Assessment record to process.
    """
    assessment_id = UUID(str(assessment_id))
    logger.info("Starting assessment pipeline — assessment=%s", assessment_id)

    # ── 1. Load assessment ──────────────────────────────────────────
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if assessment is None:
        logger.error("Assessment not found: %s", assessment_id)
        return

    submission = assessment.submission
    quest = submission.quest
    skill = quest.skill

    logger.info(
        "Assessment context — submission=%s quest=%s skill=%s user=%s",
        submission.id, quest.title, skill.name, submission.user_id,
    )

    # ── 2. Get rubric ────────────────────────────────────────────────
    try:
        rubric = get_rubric_for_skill(skill.name)
    except ValueError as exc:
        _fail_assessment(db, assessment, f"No rubric: {exc}")
        return

    # ── 3. Build prompt ──────────────────────────────────────────────
    system_prompt = build_system_prompt(rubric)
    user_message = build_user_message(
        submission_content=submission.submission_content or "",
        quest_title=quest.title,
        quest_description=quest.description or "",
    )

    # ── 3.5 Load user settings for per-user model config ──────────
    from app.settings.models import UserSettings

    user_settings = (
        db.query(UserSettings)
        .filter(UserSettings.user_id == submission.user_id)
        .first()
    )

    user_api_key = None
    user_base_url = None
    user_model = None
    user_provider = None

    if user_settings and user_settings.llm_api_key:
        user_api_key = user_settings.llm_api_key
        user_base_url = user_settings.llm_base_url
        user_model = user_settings.llm_model
        user_provider = user_settings.llm_provider
        logger.info(
            "Using per-user LLM config — provider=%s model=%s user=%s",
            user_provider or "(default)",
            user_model or "(default)",
            submission.user_id,
        )

    # ── 4. Run LLM evaluation ───────────────────────────────────────
    try:
        result = run_consistent_assessment(
            system_prompt=system_prompt,
            user_message=user_message,
            user_api_key=user_api_key,
            user_base_url=user_base_url,
            user_model=user_model,
            user_provider=user_provider,
        )
    except LLMClientError as exc:
        _fail_assessment(db, assessment, f"LLM evaluation failed: {exc}")
        return

    if result.get("attempts", 0) == 0:
        _fail_assessment(db, assessment, "All evaluation attempts failed")
        return

    k_score = result["knowledge"]["score"]
    r_score = result["reasoning"]["score"]
    a_score = result["application"]["score"]
    c_score = result["creation"]["score"]

    # Compute overall from the assessment scores using the formula
    overall_assessment = round(
        k_score * 0.2 + r_score * 0.25 + a_score * 0.35 + c_score * 0.2
    )

    logger.info(
        "Assessment scores — K=%d R=%d A=%d C=%d Overall=%d (attempts=%d)",
        k_score, r_score, a_score, c_score, overall_assessment, result["attempts"],
    )

    # ── 5. Capture previous state ──────────────────────────────────
    user_skill = (
        db.query(UserSkill)
        .filter(
            UserSkill.user_id == submission.user_id,
            UserSkill.skill_id == skill.id,
        )
        .first()
    )
    previous_overall = user_skill.overall_score if user_skill else 0

    # ── 6. Apply to UserSkill ──────────────────────────────────────
    try:
        updated_skill = apply_assessment_to_user_skill(
            db=db,
            user_id=submission.user_id,
            skill_id=skill.id,
            assessment_scores={
                "knowledge": result["knowledge"],
                "reasoning": result["reasoning"],
                "application": result["application"],
                "creation": result["creation"],
            },
        )
        new_overall = updated_skill.overall_score
    except Exception as exc:
        _fail_assessment(db, assessment, f"Skill update failed: {exc}")
        return

    # ── 7. Log progress ────────────────────────────────────────────
    try:
        log_progress(
            db=db,
            user_id=submission.user_id,
            skill_id=skill.id,
            previous_overall=previous_overall,
            new_overall=new_overall,
            reason=f"{quest.title} — Assessment",
        )
    except Exception as exc:
        logger.warning("Progress logging failed (non-fatal): %s", exc)

    # ── 7b. Check credentials ───────────────────────────────────────
    try:
        newly_awarded = check_and_award_credentials(
            db=db,
            user_id=submission.user_id,
            skill_id=skill.id,
        )
        if newly_awarded:
            logger.info("Credentials awarded: %s", newly_awarded)
    except Exception as exc:
        logger.warning("Credential check failed (non-fatal): %s", exc)

    # ── 7c. Check badges ──────────────────────────────────────────
    try:
        new_badges = check_and_award_badges(
            db=db,
            user_id=submission.user_id,
        )
        if new_badges:
            logger.info("Badges awarded: %s", new_badges)
    except Exception as exc:
        logger.warning("Badge check failed (non-fatal): %s", exc)

    # ── 8. Update Assessment record ─────────────────────────────────
    passed = overall_assessment >= PASS_THRESHOLD

    assessment.status = AssessmentStatus.COMPLETED
    assessment.knowledge_score = k_score
    assessment.reasoning_score = r_score
    assessment.application_score = a_score
    assessment.creation_score = c_score
    assessment.overall_score = overall_assessment
    assessment.feedback = _build_feedback(result, quest.title)
    assessment.improvement_suggestions = _build_suggestions(result)
    # Store per-dimension justifications for explainability
    assessment.justifications = {
        dim: result[dim]["justification"]
        for dim in ["knowledge", "reasoning", "application", "creation"]
    }
    assessment.assessed_at = datetime.now(timezone.utc)

    # ── 9. Update submission status ─────────────────────────────────
    submission.status = SubmissionStatus.PASSED if passed else SubmissionStatus.FAILED

    db.commit()
    logger.info(
        "Assessment completed — assessment=%s status=%s passed=%s",
        assessment_id, assessment.status.value, passed,
    )


def _fail_assessment(db: Session, assessment: Assessment, error: str) -> None:
    """Mark the assessment as FAILED and record the error."""
    logger.error("Assessment failed — assessment=%s error=%s", assessment.id, error)
    assessment.status = AssessmentStatus.FAILED
    assessment.error_message = error[:512]
    assessment.submission.status = SubmissionStatus.FAILED
    db.commit()


def _build_feedback(result: dict, quest_title: str) -> str:
    """Build a consolidated feedback string from all dimension justifications."""
    parts = [
        f"## {quest_title} — Assessment Feedback\n",
    ]
    labels = {
        "knowledge": "Knowledge（知识）",
        "reasoning": "Reasoning（推理）",
        "application": "Application（应用）",
        "creation": "Creation（创造）",
    }
    for dim_key, label in labels.items():
        dim_data = result.get(dim_key, {})
        score = dim_data.get("score", "—")
        justification = dim_data.get("justification", "—")
        parts.append(f"### {label} — Score: {score}\n{justification}\n")

    parts.append(f"\n*Evaluated across {result.get('attempts', '?')} attempt(s).*")
    return "\n".join(parts)


def _build_suggestions(result: dict) -> str:
    """Extract improvement suggestions from the assessment result."""
    suggestions = []
    for dim_key, label in [
        ("knowledge", "Knowledge"),
        ("reasoning", "Reasoning"),
        ("application", "Application"),
        ("creation", "Creation"),
    ]:
        dim_data = result.get(dim_key, {})
        score = dim_data.get("score", 0)
        if score < 60:
            suggestions.append(
                f"- **{label}** (当前 {score}/100)：建议加强该维度训练。"
            )
    if not suggestions:
        suggestions.append("- 各维度表现良好，继续保持！")
    return "\n".join(suggestions)
