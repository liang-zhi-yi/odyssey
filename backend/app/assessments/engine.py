"""
Assessment engine — orchestrates the full evaluation pipeline.

V2 enhancements:
  - Quest-type-aware prompts for more targeted evaluation
  - Difficulty-adjusted scoring expectations
  - Rich output: strengths, weaknesses, improvement actions per dimension
  - Overall assessment summary with actionable next-step recommendations
  - Calibrated feedback that matches the learner's level

Flow:
  1. Load submission + quest + skill
  2. Get the rubric for the skill
  3. Build the evaluation prompt (rubric embedded inline, quest-type guidance)
  4. Run LLM evaluation with consistency retry protocol
  5. Apply results to UserSkill (smoothed per-dimension update)
  6. Log progress
  7. Update Assessment record with scores + rich feedback
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
from app.world.upgrade_engine import sync_buildings_after_assessment

logger = logging.getLogger(__name__)

# Thresholds for passing a quest — adjusted by difficulty
PASS_THRESHOLD_BASE = 40
PASS_THRESHOLD_MAP = {
    "LEVEL_1": 35,   # Entry level — lenient
    "LEVEL_2": 40,   # Basic — standard
    "LEVEL_3": 45,   # Advanced — moderate
    "LEVEL_4": 50,   # Expert — stricter
}


def _get_pass_threshold(difficulty: str | None) -> int:
    """Return the pass threshold for a given difficulty level."""
    if difficulty and difficulty in PASS_THRESHOLD_MAP:
        return PASS_THRESHOLD_MAP[difficulty]
    return PASS_THRESHOLD_BASE


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

    quest_type = quest.quest_type.value if hasattr(quest.quest_type, 'value') else str(quest.quest_type)
    quest_difficulty = quest.difficulty.value if hasattr(quest.difficulty, 'value') else str(quest.difficulty)
    deliverable_type = (
        quest.expected_deliverable.value
        if hasattr(quest.expected_deliverable, 'value')
        else str(quest.expected_deliverable)
    )

    logger.info(
        "Assessment context — submission=%s quest=%s skill=%s user=%s "
        "type=%s difficulty=%s deliverable=%s",
        submission.id, quest.title, skill.name, submission.user_id,
        quest_type, quest_difficulty, deliverable_type,
    )

    # ── 2. Get rubric ────────────────────────────────────────────────
    try:
        rubric = get_rubric_for_skill(skill.name)
    except ValueError as exc:
        _fail_assessment(db, assessment, f"No rubric: {exc}")
        return

    # ── 3. Build prompt (enhanced with quest-type awareness) ─────────
    system_prompt = build_system_prompt(
        rubric,
        quest_type=quest_type,
        deliverable_type=deliverable_type,
    )
    user_message = build_user_message(
        submission_content=submission.submission_content or "",
        quest_title=quest.title,
        quest_description=quest.description or "",
        quest_difficulty=quest_difficulty,
        quest_type=quest_type,
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

    pass_threshold = _get_pass_threshold(quest_difficulty)

    logger.info(
        "Assessment scores — K=%d R=%d A=%d C=%d Overall=%d "
        "Threshold=%d (difficulty=%s) Attempts=%d",
        k_score, r_score, a_score, c_score, overall_assessment,
        pass_threshold, quest_difficulty, result["attempts"],
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

    # ── 7d. Sync world buildings ───────────────────────────────────
    try:
        upgrades = sync_buildings_after_assessment(
            db=db,
            user_id=submission.user_id,
        )
        if upgrades:
            logger.info("Building upgrades: %s", upgrades)
    except Exception as exc:
        logger.warning("Building sync failed (non-fatal): %s", exc)

    # ── 8. Update Assessment record ─────────────────────────────────
    passed = overall_assessment >= pass_threshold

    assessment.status = AssessmentStatus.COMPLETED
    assessment.knowledge_score = k_score
    assessment.reasoning_score = r_score
    assessment.application_score = a_score
    assessment.creation_score = c_score
    assessment.overall_score = overall_assessment
    assessment.feedback = _build_rich_feedback(result, quest.title, quest_difficulty)
    assessment.improvement_suggestions = _build_rich_suggestions(result)
    # Store per-dimension justifications for explainability
    assessment.justifications = {
        dim: result[dim]["justification"]
        for dim in ["knowledge", "reasoning", "application", "creation"]
    }
    # Store the overall assessment summary if available
    assessment.assessed_at = datetime.now(timezone.utc)

    # ── 9. Update submission status ─────────────────────────────────
    submission.status = SubmissionStatus.PASSED if passed else SubmissionStatus.FAILED

    db.commit()
    logger.info(
        "Assessment completed — assessment=%s status=%s passed=%s overall=%d",
        assessment_id, assessment.status.value, passed, overall_assessment,
    )


def _fail_assessment(db: Session, assessment: Assessment, error: str) -> None:
    """Mark the assessment as FAILED and record the error."""
    logger.error("Assessment failed — assessment=%s error=%s", assessment.id, error)
    assessment.status = AssessmentStatus.FAILED
    assessment.error_message = error[:512]
    assessment.submission.status = SubmissionStatus.FAILED
    db.commit()


def _build_rich_feedback(
    result: dict, quest_title: str, difficulty: str | None = None
) -> str:
    """Build comprehensive, readable feedback from the rich assessment result.

    Uses strengths, weaknesses, and improvement actions from each dimension,
    plus the overall_assessment summary, to create a detailed feedback report.
    """
    dim_labels = {
        "knowledge": "📚 Knowledge（知识）",
        "reasoning": "🧠 Reasoning（推理）",
        "application": "🔧 Application（应用）",
        "creation": "✨ Creation（创造）",
    }

    lines = [f"## {quest_title} — 能力评估报告\n"]

    # ── Overall summary ──────────────────────────────
    oa = result.get("overall_assessment", {})
    if oa:
        lines.append("### 📊 综合评估\n")
        if oa.get("summary"):
            lines.append(f"{oa['summary']}\n")
        if oa.get("top_strength"):
            lines.append(f"**🌟 最大亮点**：{oa['top_strength']}\n")
        if oa.get("top_growth_area"):
            lines.append(f"**📈 最大成长空间**：{oa['top_growth_area']}\n")

    # ── Per-dimension details ────────────────────────
    lines.append("### 📋 各维度详细分析\n")

    for dim_key, label in dim_labels.items():
        dim_data = result.get(dim_key, {})
        score = dim_data.get("score", "—")
        justification = dim_data.get("justification", "—")

        lines.append(f"#### {label} — {score}/100 分\n")

        # Strengths
        strengths = dim_data.get("strengths", [])
        if strengths:
            lines.append("**✅ 优点**：")
            for s in strengths:
                lines.append(f"- {s}")
            lines.append("")

        # Weaknesses
        weaknesses = dim_data.get("weaknesses", [])
        if weaknesses:
            lines.append("**⚠️ 待提升**：")
            for w in weaknesses:
                lines.append(f"- {w}")
            lines.append("")

        # Improvement actions
        actions = dim_data.get("improvement_actions", [])
        if actions:
            lines.append("**🎯 改进建议**：")
            for a in actions:
                lines.append(f"- {a}")
            lines.append("")

        # Detailed justification
        lines.append(f"<details>\n<summary>📝 详细评语</summary>\n\n{justification}\n</details>\n")

    # ── Next step ────────────────────────────────────
    if oa.get("next_step_recommendation"):
        lines.append("---\n")
        lines.append("### 🚀 下一步行动\n")
        lines.append(f"> {oa['next_step_recommendation']}\n")

    lines.append(f"\n*评估使用了 {result.get('attempts', '?')} 次 LLM 调用以确保一致性。*")
    return "\n".join(lines)


def _build_rich_suggestions(result: dict) -> str:
    """Build actionable improvement suggestions from the assessment result.

    Prioritizes improvement actions from dimensions scoring below 60,
    plus the overall next-step recommendation.
    """
    suggestions = []

    # ── Dimension-specific actions for low scores ────
    dim_labels = {
        "knowledge": "📚 Knowledge",
        "reasoning": "🧠 Reasoning",
        "application": "🔧 Application",
        "creation": "✨ Creation",
    }

    for dim_key, label in dim_labels.items():
        dim_data = result.get(dim_key, {})
        score = dim_data.get("score", 0)
        actions = dim_data.get("improvement_actions", [])

        if score < 60 and actions:
            for action in actions[:2]:  # Top 2 actions per weak dimension
                suggestions.append(f"- **{label}** (当前 {score}/100)：{action}")
        elif actions:
            # Even for decent scores, include the top action
            suggestions.append(f"- **{label}** ({score}/100)：{actions[0]}")

    # ── Overall recommendation ──────────────────────
    oa = result.get("overall_assessment", {})
    if oa.get("next_step_recommendation"):
        suggestions.append(f"\n### 🎯 优先行动\n\n{oa['next_step_recommendation']}")

    if not suggestions:
        suggestions.append("- 各维度表现良好，继续保持！")

    return "\n".join(suggestions)
