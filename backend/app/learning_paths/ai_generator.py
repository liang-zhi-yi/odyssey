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

_PATH_SYSTEM_PROMPT = """You are an expert civilization development architect for the Odyssey platform. Your task is to design a detailed "Civilization Development Route" (文明发展路线) for a user's growth goal.

The route is NOT a simple 3-step tutorial — it is a civilization-building journey that transforms the user's world. Design it accordingly.

The route should be organized in 4-6 stages (milestones), each containing 2-5 checkpoints, for a total of 8-25 checkpoints.

Stage pattern (adapt to the specific goal):
1. **基础认知** (Foundation) — Core concepts, theory, vocabulary
2. **核心组件** (Core Skills) — Key techniques, tools, methods
3. **项目实践** (Projects) — Hands-on projects applying skills
4. **文明建设** (Civilization Building) — Building/unlocking structures in the user's world

Output ONLY a JSON object with this exact structure:
{
  "path_summary": "A 2-3 sentence summary of the civilization development route",
  "difficulty": 1-5 (integer),
  "estimated_weeks": total weeks to complete (integer),
  "civilization_type": "AI | ENGINEERING | KNOWLEDGE | BUSINESS | DESIGN | SOCIAL | SCIENCE | LANGUAGE | HEALTH | FINANCE",
  "milestones": [
    {
      "title": "Stage name in Chinese (e.g. 基础认知)",
      "title_en": "Stage name in English",
      "description": "What this stage covers and why it matters for civilization growth (Chinese)",
      "description_en": "What this stage covers and why it matters for civilization growth (English)",
      "skill_name": "Primary skill this stage targets (English, match existing skills)",
      "building_target": "Building name this stage will unlock/upgrade (Chinese, e.g. AI研究院)",
      "building_target_en": "Building name in English (e.g. AI Research Institute)",
      "order_sequence": 0,
      "checkpoints": [
        {
          "title": "Checkpoint name in Chinese",
          "title_en": "Checkpoint name in English",
          "description": "Specific learning objective and expected output (Chinese)",
          "description_en": "Specific learning objective and expected output (English)",
          "order_sequence": 0,
          "required_score": 60,
          "estimated_hours": 2
        }
      ]
    }
  ]
}

Rules (CRITICAL — violations will be rejected):
- 4 to 6 milestones (MUST be at least 4 — a 3-milestone path is too shallow)
- 2 to 5 checkpoints per milestone (aim for 3-4 for depth)
- Total checkpoints across all milestones MUST be between 8 and 25
- The LAST milestone MUST be "文明建设" stage — describe buildings to unlock, civilization benefits
- estimated_hours between 1 and 8 per checkpoint (be realistic)
- Bilingual: title/description in Chinese, title_en/description_en in English
- order_sequence starts at 0 for each level within its parent
- skill_name should match existing skills in the system when possible
- building_target should reference real Odyssey buildings (e.g. AI研究院, 知识殿堂, 自动化工厂, 设计工坊, 语言学院, 研究院, 图书馆, 训练场)
- required_score between 50 and 80
- civilization_type must be one of the listed values
- Do NOT include markdown code fences or extra text."""


_QUEST_SYSTEM_PROMPT = """You are an expert quest designer for the Odyssey civilization growth platform. Your task is to create engaging, practical quests for a specific learning checkpoint.

Each quest should feel like a civilization-building mission, not a generic exercise.

Create quests that are:
- **Mission-Oriented**: Frame as civilization tasks (e.g. "Establish the AI Research Lab's knowledge base")
- **Skill-specific**: Directly practice the target skill with concrete deliverables
- **Reward-Clear**: Make the civilization contribution obvious (building progress, skill growth)
- **Varied**: Mix of KNOWLEDGE (learning), APPLICATION (building), PROJECT (creating), MASTERY (mastering)

Output ONLY a JSON object with this exact structure:
{
  "quests": [
    {
      "title": "Quest title in Chinese (civilization-mission style)",
      "title_en": "Quest title in English",
      "description": "Detailed quest description with clear objectives and expected output (Chinese)",
      "description_en": "Detailed quest description with clear objectives and expected output (English)",
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
        total_checkpoints = sum(len(m.get("checkpoints", [])) for m in milestones)
        if milestones and 4 <= len(milestones) <= 6 and total_checkpoints >= 8:
            return result
        logger.warning(
            "AI path generation returned invalid structure: %d milestones, %d total checkpoints (need 4-6 milestones, >=8 checkpoints)",
            len(milestones), total_checkpoints,
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
    """Generate a rich 4-stage civilization development route when LLM is unavailable."""
    return {
        "path_summary": f"一条系统的文明发展路线，从{title}基础认知到文明建设，共4个阶段",
        "difficulty": 2,
        "estimated_weeks": 8,
        "civilization_type": "AI",
        "milestones": [
            {
                "title": f"阶段1：{title}基础认知",
                "title_en": f"Stage 1: {title} Fundamentals",
                "description": f"建立{title}领域的基础知识体系，理解核心概念和工作原理",
                "description_en": f"Build foundational knowledge in {title}, understand core concepts and principles",
                "skill_name": None,
                "building_target": "研究院",
                "building_target_en": "Research Institute",
                "order_sequence": 0,
                "checkpoints": [
                    {
                        "title": f"理解{title}核心概念",
                        "title_en": f"Understanding {title} core concepts",
                        "description": f"系统学习{title}的定义、应用场景和基本原理",
                        "description_en": f"Systematically learn the definition, use cases and fundamentals of {title}",
                        "order_sequence": 0,
                        "required_score": 60,
                        "estimated_hours": 2,
                    },
                    {
                        "title": f"{title}生态系统与工具",
                        "title_en": f"{title} ecosystem and tools",
                        "description": f"了解{title}相关的工具链、框架和生态系统",
                        "description_en": f"Explore the toolchain, frameworks and ecosystem around {title}",
                        "order_sequence": 1,
                        "required_score": 60,
                        "estimated_hours": 2,
                    },
                    {
                        "title": "基础动手实践",
                        "title_en": "Hands-on fundamentals",
                        "description": "完成第一个基础练习，验证理解",
                        "description_en": "Complete first hands-on exercise to validate understanding",
                        "order_sequence": 2,
                        "required_score": 65,
                        "estimated_hours": 3,
                    },
                ],
            },
            {
                "title": f"阶段2：{title}核心技能",
                "title_en": f"Stage 2: {title} Core Skills",
                "description": f"掌握{title}的核心技术和实践方法",
                "description_en": f"Master core techniques and practical methods of {title}",
                "skill_name": None,
                "building_target": "训练场",
                "building_target_en": "Training Ground",
                "order_sequence": 1,
                "checkpoints": [
                    {
                        "title": "核心技术深入",
                        "title_en": "Deep dive into core techniques",
                        "description": "学习和实践关键技术点",
                        "description_en": "Learn and practice key technical points",
                        "order_sequence": 0,
                        "required_score": 65,
                        "estimated_hours": 3,
                    },
                    {
                        "title": "进阶方法与实践",
                        "title_en": "Advanced methods and practice",
                        "description": "学习进阶方法并完成实践练习",
                        "description_en": "Learn advanced methods and complete practice exercises",
                        "order_sequence": 1,
                        "required_score": 70,
                        "estimated_hours": 3,
                    },
                    {
                        "title": "工具链深度应用",
                        "title_en": "Toolchain deep application",
                        "description": "熟练使用相关工具链解决实际问题",
                        "description_en": "Proficiently use toolchain to solve real problems",
                        "order_sequence": 2,
                        "required_score": 70,
                        "estimated_hours": 2,
                    },
                ],
            },
            {
                "title": f"阶段3：{title}项目实战",
                "title_en": f"Stage 3: {title} Project Practice",
                "description": f"通过实际项目综合运用{title}技能",
                "description_en": f"Apply {title} skills through real projects",
                "skill_name": None,
                "building_target": "知识殿堂",
                "building_target_en": "Hall of Knowledge",
                "order_sequence": 2,
                "checkpoints": [
                    {
                        "title": "小型项目：端到端实践",
                        "title_en": "Small project: end-to-end practice",
                        "description": "完成一个完整的端到端项目",
                        "description_en": "Complete a full end-to-end project",
                        "order_sequence": 0,
                        "required_score": 70,
                        "estimated_hours": 4,
                    },
                    {
                        "title": "综合项目：多模块整合",
                        "title_en": "Comprehensive project: multi-module integration",
                        "description": "整合多个技术模块完成综合项目",
                        "description_en": "Integrate multiple technical modules into a comprehensive project",
                        "order_sequence": 1,
                        "required_score": 72,
                        "estimated_hours": 5,
                    },
                ],
            },
            {
                "title": f"阶段4：文明建设",
                "title_en": f"Stage 4: Civilization Building",
                "description": f"将{title}能力转化为文明建筑，解锁新的发展阶段",
                "description_en": f"Transform {title} capabilities into civilization buildings, unlock new development stages",
                "skill_name": None,
                "building_target": "AI研究院",
                "building_target_en": "AI Research Institute",
                "order_sequence": 3,
                "checkpoints": [
                    {
                        "title": "解锁研究院",
                        "title_en": "Unlock Research Institute",
                        "description": "通过能力验证，解锁研究院建筑",
                        "description_en": "Pass capability verification to unlock the Research Institute",
                        "order_sequence": 0,
                        "required_score": 75,
                        "estimated_hours": 2,
                    },
                    {
                        "title": "升级知识殿堂",
                        "title_en": "Upgrade Hall of Knowledge",
                        "description": "积累知识资产，升级知识殿堂",
                        "description_en": "Accumulate knowledge assets to upgrade the Hall of Knowledge",
                        "order_sequence": 1,
                        "required_score": 75,
                        "estimated_hours": 2,
                    },
                    {
                        "title": "文明进阶评估",
                        "title_en": "Civilization advancement assessment",
                        "description": "综合评估学习成果，确定文明发展方向",
                        "description_en": "Comprehensive assessment of learning outcomes, determine civilization development direction",
                        "order_sequence": 2,
                        "required_score": 80,
                        "estimated_hours": 2,
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
