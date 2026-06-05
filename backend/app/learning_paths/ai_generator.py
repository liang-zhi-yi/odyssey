"""
AI Learning Path Generator -- uses LLM to generate personalized learning paths,
milestones, checkpoints, and quests from user goals.

Reuses evaluate_submission() from app/core/llm.py (same provider resolution
pattern as assessments and goals/ai_decompose.py).
"""
import json
import logging
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.orm import Session

from app.config import settings
from app.core.llm import evaluate_submission, LLMClientError
from app.learning_paths.memory import build_memory_context

logger = logging.getLogger(__name__)

# -- Path generation system prompt --

_PATH_SYSTEM_PROMPT = """You are an expert curriculum designer and career coach. Your task is to design a detailed, professional learning path for a user's goal.

The path should be:
- **Structured**: Broken into 3-6 milestones, each containing 2-4 checkpoints
- **Practical**: Hands-on, project-based learning with clear deliverables
- **Sequential**: Builds from foundational concepts to advanced application
- **Personalized**: Adapts to the user's preferences and learning style

Output ONLY a JSON object with this exact structure:
{
  "path_summary": "A 2-3 sentence summary of the learning path",
  "difficulty": 1-5 (integer),
  "estimated_weeks": total weeks to complete (integer),
  "milestones": [
    {
      "title": "Milestone name in Chinese",
      "title_en": "Milestone name in English",
      "description": "What will be learned in this milestone (Chinese)",
      "description_en": "What will be learned in this milestone (English)",
      "skill_name": "The primary skill this milestone targets (English name from the skill tree)",
      "order_sequence": 0,
      "checkpoints": [
        {
          "title": "Checkpoint name in Chinese",
          "title_en": "Checkpoint name in English",
          "description": "What to accomplish in this checkpoint (Chinese)",
          "description_en": "What to accomplish in this checkpoint (English)",
          "order_sequence": 0,
          "required_score": 60
        }
      ]
    }
  ]
}

Rules:
- 3 to 6 milestones
- 2 to 4 checkpoints per milestone
- Bilingual: title/description in Chinese, title_en/description_en in English
- order_sequence starts at 0 for each level
- skill_name should match existing skills in the system when possible
- required_score between 50 and 80
- Do NOT include markdown code fences or extra text."""


_QUEST_SYSTEM_PROMPT = """You are an expert quest designer for a capability growth platform. Your task is to create engaging, practical quests for a specific learning checkpoint.

Create quests that are:
- **Hands-on**: Concrete tasks with clear deliverables
- **Skill-specific**: Directly practice the target skill
- **Varied**: Mix of knowledge, application, project, and mastery types
- **Difficulty-appropriate**: Match the checkpoint's required skill level

Output ONLY a JSON object with this exact structure:
{
  "quests": [
    {
      "title": "Quest title in Chinese",
      "title_en": "Quest title in English",
      "description": "Detailed quest description with clear instructions (Chinese)",
      "description_en": "Detailed quest description with clear instructions (English)",
      "difficulty": "LEVEL_1" | "LEVEL_2" | "LEVEL_3" | "LEVEL_4",
      "quest_type": "KNOWLEDGE" | "APPLICATION" | "PROJECT" | "MASTERY",
      "expected_deliverable": "PROMPT" | "ARCHITECTURE" | "WORKFLOW" | "CODE" | "REPORT"
    }
  ]
}

Rules:
- 2 to 4 quests per checkpoint
- Bilingual: title/description in Chinese, title_en/description_en in English
- difficulty must be one of: LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4
- quest_type must be one of: KNOWLEDGE, APPLICATION, PROJECT, MASTERY
- expected_deliverable must be one of: PROMPT, ARCHITECTURE, WORKFLOW, CODE, REPORT
- Do NOT include markdown code fences or extra text."""


def generate_learning_path(
    title: str,
    description: str | None = None,
    *,
    user_api_key: str | None = None,
    user_base_url: str | None = None,
    user_model: str | None = None,
    user_provider: str | None = None,
    memory_context: str = "",
) -> dict:
    """Generate a full learning path (milestones + checkpoints) from a user goal.

    Args:
        title: The goal/path title.
        description: Optional description for context.
        memory_context: Pre-built memory context string from memory.py.

    Returns:
        Dict with path_summary, difficulty, estimated_weeks, and milestones list.
        Falls back to a generic 3-milestone path if LLM fails.
    """
    user_message = _build_path_message(title, description, memory_context)

    try:
        result = evaluate_submission(
            system_prompt=_PATH_SYSTEM_PROMPT,
            user_content=user_message,
            temperature=0.3,
            user_api_key=user_api_key,
            user_base_url=user_base_url,
            user_model=user_model,
            user_provider=user_provider,
            force_json_object=True,
        )
        milestones = result.get("milestones", [])
        if milestones and 3 <= len(milestones) <= 6:
            return result
        logger.warning(
            "AI path generation returned invalid milestone count: %d", len(milestones)
        )
    except (LLMClientError, Exception) as exc:
        logger.warning("AI path generation failed, using fallback: %s", exc)

    return _fallback_path(title, description)


def generate_path_quests(
    checkpoint_title: str,
    checkpoint_description: str | None,
    skill_name: str | None,
    difficulty_level: int = 1,
    *,
    user_api_key: str | None = None,
    user_base_url: str | None = None,
    user_model: str | None = None,
    user_provider: str | None = None,
    memory_context: str = "",
) -> list[dict]:
    """Generate quests for a specific checkpoint.

    Args:
        checkpoint_title: The checkpoint title.
        checkpoint_description: What the checkpoint covers.
        skill_name: The target skill name for quest linking.
        difficulty_level: 1-5 difficulty of the parent path.
        memory_context: Pre-built memory context string.

    Returns:
        List of quest dicts. Falls back to 2 generic quests if LLM fails.
    """
    user_message = _build_quest_message(
        checkpoint_title, checkpoint_description, skill_name, difficulty_level, memory_context
    )

    try:
        result = evaluate_submission(
            system_prompt=_QUEST_SYSTEM_PROMPT,
            user_content=user_message,
            temperature=0.5,
            user_api_key=user_api_key,
            user_base_url=user_base_url,
            user_model=user_model,
            user_provider=user_provider,
            force_json_object=True,
        )
        quests = result.get("quests", [])
        if quests and 1 <= len(quests) <= 4:
            return quests
        logger.warning(
            "AI quest generation returned invalid count: %d", len(quests)
        )
    except (LLMClientError, Exception) as exc:
        logger.warning("AI quest generation failed, using fallback: %s", exc)

    return _fallback_quests(checkpoint_title, skill_name)


def _build_path_message(
    title: str, description: str | None, memory_context: str
) -> str:
    parts = [f"User Goal: {title}"]
    if description:
        parts.append(f"Goal Description: {description}")
    if memory_context:
        parts.append(memory_context)
    return "\n\n".join(parts)


def _build_quest_message(
    checkpoint_title: str,
    checkpoint_description: str | None,
    skill_name: str | None,
    difficulty: int,
    memory_context: str,
) -> str:
    parts = [
        f"Checkpoint: {checkpoint_title}",
        f"Parent path difficulty: {difficulty}/5",
    ]
    if checkpoint_description:
        parts.append(f"Checkpoint description: {checkpoint_description}")
    if skill_name:
        parts.append(f"Target skill: {skill_name}")
    if memory_context:
        parts.append(memory_context)
    return "\n\n".join(parts)


def _fallback_path(title: str, description: str | None = None) -> dict:
    """Generate a generic 3-milestone path when LLM is unavailable."""
    return {
        "path_summary": f"A structured learning path for {title}",
        "difficulty": 2,
        "estimated_weeks": 6,
        "milestones": [
            {
                "title": f"掌握 {title} 基础概念",
                "title_en": f"Master {title} fundamentals",
                "description": f"学习 {title} 的核心理论和基础技能",
                "description_en": f"Learn the core theory and basic skills of {title}",
                "skill_name": None,
                "order_sequence": 0,
                "checkpoints": [
                    {
                        "title": "理论学习",
                        "title_en": "Theory study",
                        "description": "阅读和理解核心概念",
                        "description_en": "Read and understand core concepts",
                        "order_sequence": 0,
                        "required_score": 60,
                    },
                    {
                        "title": "基础练习",
                        "title_en": "Basic practice",
                        "description": "完成基础练习题",
                        "description_en": "Complete basic practice exercises",
                        "order_sequence": 1,
                        "required_score": 65,
                    },
                ],
            },
            {
                "title": f"{title} 实战应用",
                "title_en": f"Practical application of {title}",
                "description": "通过实际项目练习所学技能",
                "description_en": "Practice skills through real projects",
                "skill_name": None,
                "order_sequence": 1,
                "checkpoints": [
                    {
                        "title": "小型项目",
                        "title_en": "Small project",
                        "description": "完成一个简单但完整的项目",
                        "description_en": "Complete a simple but complete project",
                        "order_sequence": 0,
                        "required_score": 70,
                    },
                ],
            },
            {
                "title": f"{title} 综合精通",
                "title_en": f"Comprehensive mastery of {title}",
                "description": "通过复杂项目展示综合能力",
                "description_en": "Demonstrate comprehensive ability through complex projects",
                "skill_name": None,
                "order_sequence": 2,
                "checkpoints": [
                    {
                        "title": "综合项目",
                        "title_en": "Comprehensive project",
                        "description": "完成一个完整的综合项目",
                        "description_en": "Complete a comprehensive project",
                        "order_sequence": 0,
                        "required_score": 75,
                    },
                ],
            },
        ],
    }


def _fallback_quests(checkpoint_title: str, skill_name: str | None) -> list[dict]:
    """Generate 2 generic quests when LLM is unavailable."""
    skill_ref = skill_name or checkpoint_title
    return [
        {
            "title": f"学习 {skill_ref} 核心概念",
            "title_en": f"Study {skill_ref} core concepts",
            "description": f"通过阅读和实践掌握 {skill_ref} 的核心概念",
            "description_en": f"Master the core concepts of {skill_ref} through reading and practice",
            "difficulty": "LEVEL_1",
            "quest_type": "KNOWLEDGE",
            "expected_deliverable": "REPORT",
        },
        {
            "title": f"{skill_ref} 实践任务",
            "title_en": f"{skill_ref} hands-on task",
            "description": f"完成一个 {skill_ref} 相关的实践项目",
            "description_en": f"Complete a hands-on project related to {skill_ref}",
            "difficulty": "LEVEL_2",
            "quest_type": "APPLICATION",
            "expected_deliverable": "CODE",
        },
    ]
