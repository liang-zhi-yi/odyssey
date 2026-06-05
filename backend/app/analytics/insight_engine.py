"""
AI Insight Engine — generates personalized growth insights from user skill data.

Uses the LLM (gpt-4o, temperature=0) to analyze a user's skill profile and
produce actionable insights. Falls back to rule-based computation if the LLM
call fails.

Insight types:
  - growth_acceleration  → skill improving faster recently
  - plateau_warning      → skill hasn't improved in last 3 assessments
  - skill_gap            → weakest dimension across all skills
  - strength_area        → strongest dimension across all skills
  - recommended_focus    → which skill to focus on next
"""

from __future__ import annotations

import json
import logging
from uuid import UUID

from sqlalchemy.orm import Session

from app.skills.models import UserSkill, Skill
from app.progress.models import ProgressLog
from app.assessments.models import Assessment
from app.submissions.models import QuestSubmission
from app.core.enums import AssessmentStatus
from app.config import settings
from app.core.providers import (
    resolve_provider,
    get_effective_base_url,
    get_effective_model,
)
from app.analytics.schemas import AIInsight, InsightType

logger = logging.getLogger(__name__)

# ── JSON schema for structured LLM output ──────────────────────────────

_INSIGHTS_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "insights": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "type": {
                        "type": "string",
                        "enum": [
                            "growth_acceleration",
                            "plateau_warning",
                            "skill_gap",
                            "strength_area",
                            "recommended_focus",
                        ],
                    },
                    "title": {"type": "string"},
                    "title_en": {"type": "string"},
                    "description": {"type": "string"},
                    "description_en": {"type": "string"},
                    "icon": {"type": "string"},
                    "related_skill_id": {"type": ["string", "null"]},
                    "action_label": {"type": ["string", "null"]},
                    "action_label_en": {"type": ["string", "null"]},
                },
                "required": [
                    "type",
                    "title",
                    "title_en",
                    "description",
                    "description_en",
                    "icon",
                ],
                "additionalProperties": False,
            },
            "maxItems": 5,
        },
    },
    "required": ["insights"],
    "additionalProperties": False,
}


# ── Public API ──────────────────────────────────────────────────────────


def generate_insights(user_id: UUID, db: Session) -> list[AIInsight]:
    """Generate AI-powered insights for a user.

    Attempts LLM generation first; falls back to rule-based if it fails.

    Args:
        user_id: UUID of the user.
        db: SQLAlchemy session.

    Returns:
        List of AIInsight objects (up to 5).
    """
    # Gather data
    user_skills = (
        db.query(UserSkill)
        .filter(UserSkill.user_id == user_id)
        .all()
    )

    if not user_skills:
        return []

    # Build user profile summary for the LLM
    profile = _build_user_profile(user_id, user_skills, db)

    # Try LLM
    try:
        return _llm_insights(profile)
    except Exception as exc:
        logger.warning(
            "LLM insight generation failed, falling back to rules: %s", exc
        )
        return _rule_based_insights(user_id, user_skills, db)


# ── Data gathering ──────────────────────────────────────────────────────


def _build_user_profile(
    user_id: UUID,
    user_skills: list[UserSkill],
    db: Session,
) -> dict:
    """Collect all relevant user data for insight generation."""
    skills_data = []
    for us in user_skills:
        skill = db.query(Skill).filter(Skill.id == us.skill_id).first()
        progress_logs = (
            db.query(ProgressLog)
            .filter(
                ProgressLog.user_id == user_id,
                ProgressLog.skill_id == us.skill_id,
            )
            .order_by(ProgressLog.created_at.desc())
            .limit(10)
            .all()
        )
        recent_scores = [log.new_score for log in progress_logs]

        skills_data.append({
            "skill_id": str(us.skill_id),
            "skill_name": skill.name if skill else "Unknown",
            "skill_name_en": skill.name_en if skill else None,
            "knowledge": us.knowledge_score,
            "reasoning": us.reasoning_score,
            "application": us.application_score,
            "creation": us.creation_score,
            "overall": us.overall_score,
            "rank": us.rank.value if us.rank else "NOVICE",
            "recent_scores": recent_scores,
            "recent_score_deltas": _compute_deltas(recent_scores),
            "last_3_assessments_trend": (
                "improving" if _is_improving(recent_scores, 3)
                else "stagnant" if recent_scores and len(recent_scores) >= 3
                else "insufficient_data"
            ),
        })

    total_assessments = (
        db.query(Assessment)
        .join(QuestSubmission, Assessment.submission_id == QuestSubmission.id)
        .filter(
            QuestSubmission.user_id == user_id,
            Assessment.status == AssessmentStatus.COMPLETED,
        )
        .count()
    )

    total_quests = (
        db.query(QuestSubmission)
        .filter(QuestSubmission.user_id == user_id)
        .count()
    )

    return {
        "total_skills": len(skills_data),
        "total_assessments": total_assessments,
        "total_quests": total_quests,
        "skills": skills_data,
    }


def _compute_deltas(scores: list[int]) -> list[int]:
    """Compute sequential deltas from a list of scores (oldest first)."""
    if len(scores) < 2:
        return []
    # scores are newest-first from the query, reverse to oldest-first
    ordered = list(reversed(scores))
    return [ordered[i + 1] - ordered[i] for i in range(len(ordered) - 1)]


def _is_improving(scores: list[int], lookback: int) -> bool:
    """Check if the trend in last N scores is positive."""
    if len(scores) < 2:
        return False
    recent = scores[:lookback]
    if len(recent) < 2:
        return False
    return recent[0] > recent[-1]


# ── LLM-powered insight generation ─────────────────────────────────────


def _llm_insights(profile: dict) -> list[AIInsight]:
    """Call the LLM to generate insights from the user profile.

    Uses the same provider resolution pattern as the assessment engine.
    """
    from openai import OpenAI

    provider_key = settings.llm_provider
    provider = resolve_provider(provider_key)

    api_key = settings.llm_api_key
    if not api_key:
        raise RuntimeError("LLM_API_KEY is not configured")

    base_url = get_effective_base_url(provider_key, settings.llm_base_url)
    model = get_effective_model(provider_key, settings.llm_model)

    client_kwargs: dict = {"api_key": api_key}
    if base_url:
        client_kwargs["base_url"] = base_url
    client = OpenAI(**client_kwargs)

    system_prompt = _build_insight_system_prompt()
    user_message = json.dumps(profile, ensure_ascii=False, indent=2)

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message},
    ]

    create_kwargs: dict = {
        "model": model,
        "temperature": 0.0,
        "timeout": settings.llm_timeout_seconds,
        "messages": messages,
    }

    if provider.supports_json_schema:
        create_kwargs["response_format"] = {
            "type": "json_schema",
            "json_schema": {
                "name": "insights_output",
                "strict": True,
                "schema": _INSIGHTS_JSON_SCHEMA,
            },
        }
    elif provider.supports_json_object:
        create_kwargs["response_format"] = {"type": "json_object"}

    logger.info(
        "Calling LLM for insights — provider=%s model=%s",
        provider_key,
        model,
    )

    response = client.chat.completions.create(**create_kwargs)
    content = response.choices[0].message.content

    if not content:
        raise RuntimeError("LLM returned empty response")

    # Parse — with fallback for providers that wrap JSON in text
    result = _parse_insights_json(content)

    insights = []
    for item in result.get("insights", []):
        insights.append(AIInsight(**item))

    logger.info("LLM generated %d insights", len(insights))
    return insights


def _build_insight_system_prompt() -> str:
    """Build the system prompt for insight generation."""
    return """You are an AI Capability Analyst for Odyssey, a personal growth platform.

Your task: analyze a user's skill profile and generate meaningful, actionable insights about their capability growth.

## Context
The user has skills scored across 4 dimensions (0–100 scale):
- knowledge (知识): theoretical understanding
- reasoning (推理): analytical thinking
- application (应用): practical application
- creation (创造): creative synthesis

Each skill has an overall score and rank (NOVICE/BEGINNER/PRACTITIONER/ENGINEER/ARCHITECT).

## Insight Types You Can Generate

1. **growth_acceleration**: A skill that is improving faster recently than before. Celebrate acceleration!
2. **plateau_warning**: A skill that has not improved in the last 3 assessments. Warn about stagnation.
3. **skill_gap**: The dimension (knowledge/reasoning/application/creation) where the user is weakest AVERAGED ACROSS ALL SKILLS. This reveals a systemic weakness.
4. **strength_area**: The dimension where the user is strongest on average. This is their superpower.
5. **recommended_focus**: Which specific skill the user should focus on next, with reasoning.

## Rules
- Generate 3-5 insights maximum. Prioritize quality over quantity.
- Every insight MUST have both Chinese (title, description) and English (title_en, description_en) versions.
- The icon field must be a single emoji.
- related_skill_id should be the skill's UUID for growth_acceleration, plateau_warning, and recommended_focus.
- action_label (Chinese) and action_label_en (English) should suggest a concrete action.

## Tone
Professional, encouraging, direct. No flattery. Real growth requires honest feedback.

## Output Format
Return a JSON object: { "insights": [...] }

Generate insights ONLY from the data provided. Do not invent data."""


def _parse_insights_json(content: str) -> dict:
    """Parse the LLM JSON response with fallback extraction."""
    import re

    # Attempt 1: direct parse
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        pass

    # Attempt 2: strip ```json ... ``` fences
    stripped = content.strip()
    if stripped.startswith("```"):
        stripped = re.sub(r"^```\w*\s*", "", stripped)
        stripped = re.sub(r"\s*```$", "", stripped)
        try:
            return json.loads(stripped.strip())
        except json.JSONDecodeError:
            pass

    # Attempt 3: regex — find the first { ... } block
    match = re.search(r"\{[\s\S]*\}", content)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass

    raise RuntimeError(
        f"LLM response could not be parsed as JSON. "
        f"Raw response (first 500 chars): {content[:500]}"
    )


# ── Rule-based fallback ────────────────────────────────────────────────


def _rule_based_insights(
    user_id: UUID,
    user_skills: list[UserSkill],
    db: Session,
) -> list[AIInsight]:
    """Generate insights using simple heuristics when LLM is unavailable."""
    insights: list[AIInsight] = []

    if not user_skills:
        return insights

    # ── Helper: resolve skill name ──────────────────────────────────
    skill_names: dict[str, str] = {}
    skill_names_en: dict[str, str] = {}
    for us in user_skills:
        skill = db.query(Skill).filter(Skill.id == us.skill_id).first()
        skill_names[str(us.skill_id)] = skill.name if skill else "Unknown"
        skill_names_en[str(us.skill_id)] = skill.name_en if (skill and skill.name_en) else skill_names[str(us.skill_id)]

    # ── 1. Strength area (strongest dimension on average) ───────────
    dim_avgs = {
        "知识 (Knowledge)": (
            sum(us.knowledge_score for us in user_skills) / len(user_skills)
        ),
        "推理 (Reasoning)": (
            sum(us.reasoning_score for us in user_skills) / len(user_skills)
        ),
        "应用 (Application)": (
            sum(us.application_score for us in user_skills) / len(user_skills)
        ),
        "创造 (Creation)": (
            sum(us.creation_score for us in user_skills) / len(user_skills)
        ),
    }
    dim_labels_en = {
        "知识 (Knowledge)": "Knowledge",
        "推理 (Reasoning)": "Reasoning",
        "应用 (Application)": "Application",
        "创造 (Creation)": "Creation",
    }
    strongest_dim = max(dim_avgs, key=dim_avgs.get)
    insights.append(AIInsight(
        type=InsightType.STRENGTH_AREA,
        title=f"你的优势维度：{strongest_dim}",
        title_en=f"Your strength: {dim_labels_en[strongest_dim]}",
        description=f"你的{dim_labels_en[strongest_dim]}维度在所有技能中平均得分最高 ({dim_avgs[strongest_dim]:.0f}/100)，这是你的核心优势。持续发挥这一优势，并利用它带动其他维度。",
        description_en=f"Your {dim_labels_en[strongest_dim]} dimension scores highest across all skills ({dim_avgs[strongest_dim]:.0f}/100). This is your core strength. Continue leveraging it to lift other dimensions.",
        icon="💪",
    ))

    # ── 2. Skill gap (weakest dimension on average) ─────────────────
    weakest_dim = min(dim_avgs, key=dim_avgs.get)
    if dim_avgs[weakest_dim] < dim_avgs[strongest_dim] * 0.8:
        insights.append(AIInsight(
            type=InsightType.SKILL_GAP,
            title=f"需要关注的维度：{weakest_dim}",
            title_en=f"Dimension to improve: {dim_labels_en[weakest_dim]}",
            description=f"你的{dim_labels_en[weakest_dim]}维度在所有技能中平均得分最低 ({dim_avgs[weakest_dim]:.0f}/100)。建议优先选择注重{dim_labels_en[weakest_dim]}的Quest来弥补这个短板。",
            description_en=f"Your {dim_labels_en[weakest_dim]} dimension scores lowest across all skills ({dim_avgs[weakest_dim]:.0f}/100). Prioritize quests that emphasize {dim_labels_en[weakest_dim]} to close this gap.",
            icon="🎯",
        ))

    # ── 3. Growth acceleration / Plateau detection ──────────────────
    for us in user_skills:
        logs = (
            db.query(ProgressLog)
            .filter(
                ProgressLog.user_id == user_id,
                ProgressLog.skill_id == us.skill_id,
            )
            .order_by(ProgressLog.created_at.desc())
            .limit(5)
            .all()
        )
        scores = [log.new_score for log in logs]

        # Growth acceleration: at least 3 scores and latest 2 deltas positive and growing
        if len(scores) >= 3:
            deltas = _compute_deltas(scores)
            if len(deltas) >= 2 and deltas[-1] > deltas[-2] > 0:
                name = skill_names[str(us.skill_id)]
                name_en = skill_names_en[str(us.skill_id)]
                insights.append(AIInsight(
                    type=InsightType.GROWTH_ACCELERATION,
                    title=f"{name} 正在加速成长！",
                    title_en=f"{name_en} is accelerating!",
                    description=f"你最近在 {name} 的表现进步越来越快，最新评分为 {us.overall_score}。保持这个势头！",
                    description_en=f"Your recent {name_en} performance is improving faster — latest score {us.overall_score}. Keep the momentum!",
                    icon="🚀",
                    related_skill_id=str(us.skill_id),
                    action_label="查看趋势",
                    action_label_en="View trends",
                ))
                break  # Only one growth acceleration insight

    # ── 4. Plateau warning ──────────────────────────────────────────
    for us in user_skills:
        logs = (
            db.query(ProgressLog)
            .filter(
                ProgressLog.user_id == user_id,
                ProgressLog.skill_id == us.skill_id,
            )
            .order_by(ProgressLog.created_at.desc())
            .limit(3)
            .all()
        )
        scores = [log.new_score for log in logs]
        if len(scores) >= 3 and len(set(scores)) == 1:
            name = skill_names[str(us.skill_id)]
            name_en = skill_names_en[str(us.skill_id)]
            insights.append(AIInsight(
                type=InsightType.PLATEAU_WARNING,
                title=f"{name} 进入平台期",
                title_en=f"{name_en} has plateaued",
                description=f"你最近3次 {name} 的评估没有增长，当前评分 {us.overall_score}。尝试更具挑战性的Quest来突破瓶颈。",
                description_en=f"Your last 3 {name_en} assessments show no growth (score {us.overall_score}). Try a more challenging quest to break through.",
                icon="⚠️",
                related_skill_id=str(us.skill_id),
                action_label="寻找挑战",
                action_label_en="Find a challenge",
            ))
            break  # Only one plateau warning

    # ── 5. Recommended focus ────────────────────────────────────────
    sorted_by_score = sorted(user_skills, key=lambda s: s.overall_score)
    weakest_skill = sorted_by_score[0]
    if weakest_skill.overall_score < 60:
        name = skill_names[str(weakest_skill.skill_id)]
        name_en = skill_names_en[str(weakest_skill.skill_id)]
        insights.append(AIInsight(
            type=InsightType.RECOMMENDED_FOCUS,
            title=f"建议优先提升：{name}",
            title_en=f"Focus recommendation: {name_en}",
            description=f"{name} 目前评分最低 ({weakest_skill.overall_score}/100)，作为基础技能，提升它将为其他技能的成长打下坚实基础。",
            description_en=f"{name_en} currently has the lowest score ({weakest_skill.overall_score}/100). Strengthening this foundational skill will support growth in other areas.",
            icon="📈",
            related_skill_id=str(weakest_skill.skill_id),
            action_label="开始 Quest",
            action_label_en="Start a Quest",
        ))

    logger.info("Rule-based engine generated %d insights", len(insights))
    return insights
