"""
Agent service — Civilization Mentor: context building, world rules, chat.

Stage 1 (Foundation): Rich user context + world rules injection + unified LLM.
Stage 2 (Intelligence): Growth planner, building advisor, learning advisor, civ analyst.
Stage 3 (Proactivity): Data-driven proactive greeting.

All capability modules are prompt-driven — the enriched context + world rules +
system prompt give the LLM enough knowledge to perform all five capabilities
without separate code modules.
"""
from __future__ import annotations

import json
import logging
import re
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.orm import Session

from app.agent.models import ConversationHistory
from app.agent.persona import (
    AGENT_NAME,
    AGENT_NAME_ZH,
    AGENT_ROLE,
    AGENT_ROLE_ZH,
    AGENT_SUB_ROLE_1,
    AGENT_SUB_ROLE_1_ZH,
    AGENT_SUB_ROLE_2,
    AGENT_SUB_ROLE_2_ZH,
    AGENT_DESCRIPTION,
    SYSTEM_PROMPT,
    TONE_GUIDELINES,
    build_proactive_greeting,
)
from app.agent.schemas import (
    ChatRequest,
    ChatResponse,
    AgentMessage,
    AgentCard,
    ConversationListItem,
    ChatMessage,
    HistoryResponse,
)
from app.auth.models import User
from app.core.exceptions import ValidationException
from app.learning_paths.memory import build_memory_context, record_interaction
from app.settings.models import UserSettings

logger = logging.getLogger(__name__)

# ── Constants ──────────────────────────────────────────────────────────

MAX_HISTORY_MESSAGES = 20  # Increased from 10 for better multi-turn context
CARDS_SEPARATOR = "---CARDS---"

# ═══════════════════════════════════════════════════════════════════════
# Intent Classification (expanded)
# ═══════════════════════════════════════════════════════════════════════

INTENT_PATTERNS: list[tuple[str, list[str]]] = [
    # ── Civilization Analysis ──
    ("civilization_analysis", [
        "分析", "analyze", "文明状态", "civilization state",
        "评估", "evaluate", "整体", "overview", "状态", "status",
        "我的文明", "my civilization", "发展得怎么样", "how am i doing",
    ]),
    # ── Growth Planning ──
    ("growth_planning", [
        "下一步", "next step", "规划", "plan", "路线", "roadmap",
        "该做什么", "what should i do", "优先", "priority",
        "如何提升", "how to improve", "最快", "fastest",
        "成长路径", "growth path", "发展方向", "direction",
    ]),
    # ── Building Advisor ──
    ("building_advisor", [
        "建什么", "what to build", "解锁", "unlock", "建筑",
        "building", "可以建", "can build", "下一座", "next building",
        "建造", "construct", "升级建筑", "upgrade building",
        "复合建筑", "compound building",
    ]),
    # ── Learning Advisor ──
    ("learning_advisor", [
        "学什么", "what to learn", "推荐", "recommend", "建议", "suggest",
        "学习路径", "learning path", "path", "课程", "course",
        "技能缺口", "skill gap", "应该学", "should learn",
        "学习计划", "study plan",
    ]),
    # ── Skill Query ──
    ("skill_query", [
        "技能", "skill", "能力", "ability", "等级", "level",
        "擅长", "good at", "what skills", "能力值",
        "维度", "dimension", "评估", "assessment",
    ]),
    # ── World / Era Query ──
    ("world_query", [
        "世界", "world", "文明", "civilization",
        "时代", "era", "tier", "等级", "什么时候",
        "需要多少", "how much", "距离", "how far",
        "规则", "rule", "怎么运作", "how does it work",
    ]),
    # ── Quest Query ──
    ("quest_query", [
        "任务", "quest", "挑战", "challenge",
        "做任务", "do quest", "完成", "complete",
    ]),
    # ── Progress Query ──
    ("progress_query", [
        "进度", "progress", "最近", "recent", "成长", "growth",
        "变化", "change", "提升了", "improved", "变化了", "changed",
    ]),
]


def classify_intent(message: str) -> str:
    """Classify user intent via keyword matching. Returns intent label."""
    msg_lower = message.lower()
    for intent, keywords in INTENT_PATTERNS:
        for kw in keywords:
            if kw.lower() in msg_lower:
                return intent
    return "general_chat"


# ═══════════════════════════════════════════════════════════════════════
# World Rules Context (static — built from DB once, cached in memory)
# ═══════════════════════════════════════════════════════════════════════

_world_rules_cache: str | None = None
_world_rules_cache_time: datetime | None = None


def build_world_rules_context(db: Session) -> str:
    """Build the complete Odyssey world rules reference for the Agent.

    Pulls from BuildingTemplate, CompoundBuildingTemplate, Skill models,
    and era/tier definitions. Cached in memory — rebuilds only on request
    after cache expiry (5 minutes) or explicit invalidation.

    This tells the Agent:
    - What buildings exist and what skills they need
    - How eras and tiers advance
    - What compound buildings require
    - The core growth logic
    """
    global _world_rules_cache, _world_rules_cache_time

    # Return cached if fresh (< 5 min)
    now = datetime.now(timezone.utc)
    if _world_rules_cache and _world_rules_cache_time:
        if (now - _world_rules_cache_time).total_seconds() < 300:
            return _world_rules_cache

    try:
        rules = _build_world_rules(db)
        _world_rules_cache = rules
        _world_rules_cache_time = now
        return rules
    except Exception as exc:
        logger.warning("Failed to build world rules context: %s", exc)
        # Return stale cache if available, otherwise minimal rules
        if _world_rules_cache:
            return _world_rules_cache
        return "（世界规则暂时无法加载，请稍后再试。）"


def _build_world_rules(db: Session) -> str:
    """Internal: build world rules string from DB."""
    parts = []

    # ── 1. Era & Tier System ──
    parts.append("""
## 时代与文明等级系统

### 时代 (Era)
文明发展程度由「时代」体现，从低到高：

| 时代 | Era | 图标 | 文明等级要求 |
|------|-----|------|-------------|
| 荒野时代 | WILDERNESS | 🏕️ | Lv 1-4 |
| 农耕时代 | AGRICULTURE | 🌾 | Lv 5-9 |
| 工业时代 | INDUSTRY | ⚙️ | Lv 10-14 |
| 信息时代 | INFORMATION | 💻 | Lv 15-19 |
| 智能时代 | INTELLIGENCE | 🤖 | Lv 20+ |

### 文明等级 (Civilization Tier)
| 等级 | Tier | 图标 | 分数范围 |
|------|------|------|---------|
| 定居者 | SETTLER | 🏕️ | 0-4 |
| 村落 | VILLAGE | 🏘️ | 5-9 |
| 城镇 | TOWN | 🏙️ | 10-14 |
| 城市 | CITY | 🌆 | 15-19 |
| 大都会 | METROPOLIS | 🏛️ | 20-24 |
| 文明 | CIVILIZATION | 🌍 | 25+ |

**文明指数公式**：所有常规建筑等级之和 + 所有复合建筑等级 × 2 + 已解锁里程碑数
""")

    # ── 2. Regular Buildings (from DB) ──
    try:
        from app.world.models import BuildingTemplate
        templates = db.query(BuildingTemplate).order_by(BuildingTemplate.era, BuildingTemplate.name).all()

        parts.append("\n## 常规建筑（技能建筑）")
        parts.append("每项技能对应一座建筑。建筑等级由技能综合分数决定。\n")
        for t in templates:
            skill_name = t.skill.name if t.skill else "Unknown"
            name_en = f"（{t.name_en}）" if t.name_en else ""
            era_label = t.era or "WILDERNESS"
            parts.append(
                f"- {t.icon} **{t.name}**{name_en} — 技能：{skill_name}，"
                f"区域：{t.region}，最高 Lv.{t.max_level}，时代：{era_label}"
            )
    except Exception as exc:
        logger.warning("Failed to load regular building templates: %s", exc)
        parts.append("\n（常规建筑数据暂不可用）")

    # ── 3. Compound Buildings (from DB) ──
    try:
        from app.world.models import CompoundBuildingTemplate
        compounds = db.query(CompoundBuildingTemplate).order_by(
            CompoundBuildingTemplate.era, CompoundBuildingTemplate.name
        ).all()

        parts.append("\n## 复合建筑（需要多技能组合）")
        parts.append("复合建筑是文明发展的关键节点，需要多技能协同达到要求等级才能解锁。\n")
        for c in compounds:
            name_en = f"（{c.name_en}）" if c.name_en else ""
            reqs_list = []
            for r in (c.required_skills or []):
                skill_name = r.get("skill_name", "?")
                min_level = r.get("min_level", "?")
                reqs_list.append(f"{skill_name} ≥ Lv.{min_level}")
            reqs = "、".join(reqs_list) if reqs_list else "条件未知"
            era_label = c.era or "WILDERNESS"
            parts.append(
                f"- {c.icon} **{c.name}**{name_en} — 需求：{reqs}，"
                f"区域：{c.region}，最高 Lv.{c.max_level}，时代：{era_label}"
            )
    except Exception as exc:
        logger.warning("Failed to load compound building templates: %s", exc)
        parts.append("\n（复合建筑数据暂不可用）")

    # ── 4. Skill System ──
    try:
        from app.skills.models import Skill
        skills = db.query(Skill).order_by(Skill.domain, Skill.name).all()
        domains: dict[str, list[str]] = {}
        for s in skills:
            domain = s.domain or "OTHER"
            if domain not in domains:
                domains[domain] = []
            domains[domain].append(f"{s.name}" + (f"（{s.name_en}）" if s.name_en else ""))

        parts.append("\n## 技能系统")
        parts.append("技能分为 4 个维度：知识 (Knowledge)、推理 (Reasoning)、应用 (Application)、创造 (Creation)")
        parts.append("技能等级：新手 (NOVICE, 0-20) → 初级 (BEGINNER, 21-40) → 实践者 (PRACTITIONER, 41-60) → 工程师 (ENGINEER, 61-80) → 架构师 (ARCHITECT, 81-100)")
        parts.append("\n### 技能领域")
        domain_labels = {
            "AI": "🤖 AI与人工智能",
            "PROGRAMMING": "💻 编程",
            "PRODUCT": "📦 产品",
            "DESIGN": "🎨 设计",
            "WRITING": "✍️ 写作",
            "RESEARCH": "🔬 研究",
            "BUSINESS": "💼 商业",
            "MANAGEMENT": "📋 管理",
            "LANGUAGE": "🗣️ 语言",
            "FITNESS": "💪 健身",
            "CAREER": "🚀 职业",
        }
        for domain, skill_names in sorted(domains.items()):
            label = domain_labels.get(domain, domain)
            parts.append(f"- **{label}**：{'、'.join(skill_names)}")
    except Exception as exc:
        logger.warning("Failed to load skills: %s", exc)

    # ── 5. Quest & Path Systems ──
    parts.append("""
## Quest 系统
- Quest 是验证能力的具体任务，完成后获得 AI 评估和分数
- Quest 难度：EASY / MEDIUM / HARD / EXPERT
- 完成 Quest 会提升对应技能维度的分数，进而推动建筑升级

## 学习路径系统 (Learning Path)
- 学习路径是结构化的成长路线图，包含多个里程碑 (Milestone)
- 每个里程碑可关联技能，完成后推动对应建筑升级
- 路径类型：PRESET（官方预设）/ AI_GENERATED（AI 定制）
- 路径难度：★～★★★★★

## 项目系统 (Project)
- 项目是综合实践任务，可关联多个技能和建筑
- 完成项目可获得技能分数和文明指数

## 徽章系统 (Badge)
- 徽章是里程碑成就的视觉标记
- 包括设计文档徽章和时代徽章
""")

    # ── 6. Core Growth Logic + Evolution Standards ──
    parts.append("""
## 核心成长逻辑

```
学习实践 → 技能分数 ↑ → 建筑等级 ↑ → 文明指数 ↑ → 时代/等级推进
                                  ↘ 复合建筑解锁 → 文明跨越式发展
```

### 关键规则
1. **单一建筑** = 1 项技能驱动，等级 = 技能综合分数 / 10
2. **复合建筑** = 多技能协同，需要所有要求的技能达到最低等级才能解锁
3. **文明指数** = Σ(常规建筑等级) + Σ(复合建筑等级 × 2) + 里程碑解锁数
4. **时代推进** = 文明等级达到阈值 + 核心建筑条件
5. **区域解锁** = 建造该区域第一座建筑后自动解锁
6. **建筑升级** = 关联技能分数每提升 10 分，建筑升 1 级（最高 Lv.10）

## 进化标准 (Evolution Standards)

> 当用户询问文明系统如何运作、需要多少分、如何升级时，你必须引用以下具体数字回答。
> 不要含糊其辞或只说"需要更多分数"——给出具体的数值和目标。

### 任务奖励标准 (Quest Rewards)
完成任务后获得的奖励取决于任务难度（LEVEL_1 ~ LEVEL_4）。以下为基础值，
实际奖励会根据任务类型（KNOWLEDGE / APPLICATION / PROJECT / MASTERY）应用维度加权：

| 难度 | 知识 | 推理 | 应用 | 创造 | 建筑经验 | 文明贡献 |
|------|------|------|------|------|----------|----------|
| LEVEL_1（入门） | +5 | +3 | +2 | +2 | +10 | +30 |
| LEVEL_2（基础） | +8 | +6 | +5 | +4 | +25 | +60 |
| LEVEL_3（进阶） | +12 | +10 | +10 | +8 | +50 | +120 |
| LEVEL_4（专家） | +18 | +15 | +15 | +12 | +80 | +200 |

**任务类型加权（乘数）**：
- KNOWLEDGE（知识型）：知识 ×1.5，应用 ×0.8
- APPLICATION（应用型）：应用 ×1.3，推理 ×1.1
- PROJECT（项目型）：应用 ×1.5，创造 ×1.5
- MASTERY（精通型）：四维均等 ×1.0

**示例**：一个 LEVEL_2 的 KNOWLEDGE 型 Quest，实际获得：
知识 +12（8×1.5）、推理 +6、应用 +4（5×0.8）、创造 +4、建筑经验 +25、文明贡献 +60

### 技能等级标准 (Skill Proficiency Levels)
每项技能的 4 个维度（知识、推理、应用、创造）加权求和得到综合分数：

| 等级 | Rank | 综合分数 |
|------|------|---------|
| 新手 | NOVICE | 0-20 |
| 初级 | BEGINNER | 21-40 |
| 实践者 | PRACTITIONER | 41-60 |
| 工程师 | ENGINEER | 61-80 |
| 架构师 | ARCHITECT | 81-100 |

### 建筑升级标准 (Building Upgrade Thresholds)
- **建筑等级 = 关联技能综合分数 ÷ 10**（向下取整，最高 Lv.10）
- 技能每增长 10 分，建筑自动升 1 级
- 常规建筑：1 项技能驱动，该技能综合分数达标即升级
- 复合建筑：需所有关联技能达到最低等级要求才能解锁，解锁后等级 = 所有关联技能综合分数平均值 ÷ 10
- 建筑升级是系统自动完成的，用户无需手动操作

### 文明等级标准 (Civilization Tier Thresholds)
文明指数计算公式：**Σ(常规建筑等级) + Σ(复合建筑等级 × 2) + 已解锁里程碑数**

| 等级 | Tier | 图标 | 文明指数 |
|------|------|------|---------|
| 定居者 | SETTLER | 🏕️ | 0-4 |
| 村落 | VILLAGE | 🏘️ | 5-9 |
| 城镇 | TOWN | 🏙️ | 10-14 |
| 城市 | CITY | 🌆 | 15-19 |
| 大都会 | METROPOLIS | 🏛️ | 20-24 |
| 文明 | CIVILIZATION | 🌍 | 25+ |

### 时代推进标准 (Era Advancement Thresholds)

| 时代 | Era | 图标 | 文明等级 | 额外条件 |
|------|-----|------|---------|---------|
| 荒野时代 | WILDERNESS | 🏕️ | Lv 1-4 | — |
| 农耕时代 | AGRICULTURE | 🌾 | Lv 5-9 | 至少解锁 2 座常规建筑 |
| 工业时代 | INDUSTRY | ⚙️ | Lv 10-14 | 至少解锁 1 座复合建筑 |
| 信息时代 | INFORMATION | 💻 | Lv 15-19 | 至少解锁 3 座复合建筑 |
| 智能时代 | INTELLIGENCE | 🤖 | Lv 20+ | 至少解锁 5 座复合建筑 |

时代推进是系统自动判定的，满足文明等级 + 额外条件后自动进入下一时代。

### 区域系统 (5 Regions)
文明由 5 大区域构成，每座建筑属于一个区域：

| 区域 | Region | 代表技能 |
|------|--------|---------|
| 🧠 思维区 | THINKING | AI、推理、研究、学习 |
| 💻 技术区 | TECHNICAL | 编程、工具、开发、工程 |
| 🎨 创造区 | CREATIVE | 设计、写作、产品、创作 |
| 🌐 社交区 | SOCIAL | 沟通、管理、商业、语言 |
| 💪 实践区 | PHYSICAL | 健身、实践、职业、执行 |

建造某区域的第一座建筑后，该区域自动解锁。

### 快速参考：如何提升文明等级？（给用户的解释）

当用户问"如何提升文明"或"下一步做什么"时，用以下逻辑解释：

1. **接受 Quest** → 在任务页面选择适合你当前等级的 Quest
2. **完成任务并提交** → 提交你的成果（提示词、代码、报告等）
3. **AI 评估** → 系统评估你的成果质量，计算得分
4. **技能分数增长** → 4 个维度（知识/推理/应用/创造）获得对应分数
5. **建筑自动升级** → 技能综合分数每增长 10 分，对应建筑升 1 级
6. **文明指数累积** → 建筑等级之和 + 复合建筑加权 + 里程碑数
7. **时代/等级自动推进** → 文明指数达标 + 额外条件满足时自动升级

**估算示例**：
- 完成 3 个 LEVEL_1 Quest（文明贡献各 +30）→ 文明指数 +90 → 足够从定居者升至村落（5分）
- 完成 5 个 LEVEL_2 Quest（文明贡献各 +60）→ 文明指数 +300 → 足够升至城镇（10分）
- 解锁 1 座复合建筑 = 额外 +2 文明指数（等同一座常规建筑升 2 级）
""")

    return "\n".join(parts)


def invalidate_world_rules_cache() -> None:
    """Invalidate the world rules cache (call after seed data changes)."""
    global _world_rules_cache, _world_rules_cache_time
    _world_rules_cache = None
    _world_rules_cache_time = None
    logger.info("World rules cache invalidated.")


# ═══════════════════════════════════════════════════════════════════════
# Rich User Context Builder
# ═══════════════════════════════════════════════════════════════════════

def build_rich_user_context(db: Session, user: User) -> dict:
    """Build a complete user state snapshot for Agent context.

    Key difference from old build_agent_context():
    - ALL skills (not just top 5)
    - ALL buildings with unlock status analysis
    - Building unlock/near-unlock analysis
    - Projects and badges
    - Era/tier with progress toward next level
    - Growth trends
    """
    user_id_str = str(user.id)

    context: dict = {
        "profile": _get_profile(user),
        "civilization": _get_civilization_full(db, user),
        "skills": _get_all_skills(db, user),
        "buildings": _get_all_buildings(db, user),
        "buildings_unlockable": _get_unlockable_buildings(db, user),
        "buildings_near_unlock": _get_near_unlock_buildings(db, user),
        "quests": _get_quests_full(db, user_id_str),
        "paths": _get_paths_full(db, user_id_str),
        "projects": _get_projects(db, user_id_str),
        "badges": _get_badges(db, user_id_str),
        "recent_activity": _get_recent_activity_full(db, user_id_str),
        "growth_summary": _get_growth_summary(db, user_id_str),
        "memory": build_memory_context(db, user_id_str),
    }

    return context


# ── Sub-helpers: Profile ──────────────────────────────────────────────

def _get_profile(user: User) -> dict:
    return {
        "name": user.nickname or user.username,
        "username": user.username,
        "level": getattr(user, "level", 1),
        "title": getattr(user, "title", None),
        "bio": getattr(user, "bio", None),
        "joined_at": user.created_at.isoformat() if hasattr(user, "created_at") else "",
    }


# ── Sub-helpers: Civilization ─────────────────────────────────────────

def _get_civilization_full(db: Session, user: User) -> dict:
    """Full civilization state including era/tier progress."""
    try:
        from app.world.models import World
        world = db.query(World).filter(World.user_id == user.id).first()
        if not world:
            return {
                "tier": "SETTLER", "tier_name": "定居者", "tier_score": 0,
                "next_tier_at": 5, "era": "WILDERNESS", "era_name": "荒野时代",
                "era_score": 0, "next_era_at": 5, "civilization_level": 1,
                "knowledge_points": 0, "tech_points": 0,
                "exploration_progress": 0, "population": 0,
            }
        return {
            "tier": world.tier or "SETTLER",
            "tier_name": _tier_display_name(world.tier),
            "tier_score": world.tier_score or 0,
            "next_tier_at": _next_tier_threshold(world.tier_score or 0, _TIER_THRESHOLDS),
            "era": world.era or "WILDERNESS",
            "era_name": _era_display_name(world.era),
            "era_score": world.era_score or 0,
            "next_era_at": _next_tier_threshold(world.era_score or 0, _ERA_THRESHOLDS),
            "civilization_level": world.civilization_level or 1,
            "knowledge_points": world.knowledge_points or 0,
            "tech_points": world.tech_points or 0,
            "exploration_progress": world.exploration_progress or 0,
            "population": world.population or 0,
        }
    except Exception as exc:
        logger.warning("Failed to get civilization state: %s", exc)
        return {"tier": "SETTLER", "tier_name": "定居者", "era": "WILDERNESS", "era_name": "荒野时代"}


_TIER_THRESHOLDS = [0, 5, 10, 15, 20, 25, float("inf")]
_ERA_THRESHOLDS = [0, 5, 10, 15, 20, float("inf")]

_TIER_NAMES = {
    "SETTLER": "定居者", "VILLAGE": "村落", "TOWN": "城镇",
    "CITY": "城市", "METROPOLIS": "大都会", "CIVILIZATION": "文明",
}
_ERA_NAMES = {
    "WILDERNESS": "荒野时代", "AGRICULTURE": "农耕时代",
    "INDUSTRY": "工业时代", "INFORMATION": "信息时代",
    "INTELLIGENCE": "智能时代",
}


def _tier_display_name(tier: str | None) -> str:
    return _TIER_NAMES.get(tier or "", tier or "定居者")


def _era_display_name(era: str | None) -> str:
    return _ERA_NAMES.get(era or "", era or "荒野时代")


def _next_tier_threshold(current: int, thresholds: list[float]) -> int | None:
    for t in thresholds:
        if current < t:
            return int(t)
    return None


# ── Sub-helpers: Skills (ALL) ────────────────────────────────────────

def _get_all_skills(db: Session, user: User) -> list[dict]:
    """Get ALL user skills with full dimension scores (not just top 5)."""
    try:
        from app.skills.service import get_user_skills
        skills = get_user_skills(db, str(user.id))
        result = []
        for s in sorted(skills, key=lambda x: x.get("overall", 0), reverse=True):
            result.append({
                "name": s.get("skill_name", "Unknown"),
                "skill_id": s.get("skill_id", ""),
                "overall": s.get("overall", 0),
                "knowledge": s.get("knowledge", 0),
                "reasoning": s.get("reasoning", 0),
                "application": s.get("application", 0),
                "creation": s.get("creation", 0),
                "rank": s.get("rank", "NOVICE"),
                "domain": s.get("domain", ""),
            })
        return result
    except Exception as exc:
        logger.warning("Failed to get all skills: %s", exc)
        return []


# ── Sub-helpers: Buildings (ALL + Analysis) ──────────────────────────

def _get_all_buildings(db: Session, user: User) -> dict:
    """Get ALL buildings — regular and compound — with status."""
    try:
        from app.world.models import UserBuilding, UserCompoundBuilding

        regular = []
        user_buildings = (
            db.query(UserBuilding)
            .filter(UserBuilding.user_id == user.id)
            .all()
        )
        for ub in user_buildings:
            tpl = ub.building_template
            status = ub.status.value if hasattr(ub.status, "value") else str(ub.status)
            regular.append({
                "name": tpl.name if tpl else "Unknown",
                "name_en": tpl.name_en if tpl else None,
                "icon": tpl.icon if tpl else "🏛️",
                "level": ub.level or 0,
                "max_level": tpl.max_level if tpl else 10,
                "status": status,
                "region": tpl.region if tpl else "",
                "skill_name": tpl.skill.name if tpl and tpl.skill else "",
                "era": tpl.era if tpl else "",
            })

        compound = []
        user_compounds = (
            db.query(UserCompoundBuilding)
            .filter(UserCompoundBuilding.user_id == user.id)
            .all()
        )
        for uc in user_compounds:
            tpl = uc.compound_template
            status = uc.status.value if hasattr(uc.status, "value") else str(uc.status)
            compound.append({
                "name": tpl.name if tpl else "Unknown",
                "name_en": tpl.name_en if tpl else None,
                "icon": tpl.icon if tpl else "🏛️",
                "level": uc.level or 0,
                "max_level": tpl.max_level if tpl else 10,
                "status": status,
                "region": tpl.region if tpl else "",
                "required_skills": tpl.required_skills if tpl else [],
                "era": tpl.era if tpl else "",
            })

        return {"regular": regular, "compound": compound}
    except Exception as exc:
        logger.warning("Failed to get all buildings: %s", exc)
        return {"regular": [], "compound": []}


def _get_unlockable_buildings(db: Session, user: User) -> list[dict]:
    """Buildings that can be unlocked RIGHT NOW (all conditions met)."""
    try:
        from app.skills.service import get_user_skills
        user_skills = {s.get("skill_name", ""): s.get("overall", 0)
                       for s in get_user_skills(db, str(user.id))}

        result = []

        # Check regular buildings (LOCKED status, skill has score)
        from app.world.models import UserBuilding
        locked_regular = (
            db.query(UserBuilding)
            .filter(UserBuilding.user_id == user.id, UserBuilding.status == "LOCKED")
            .all()
        )
        for ub in locked_regular:
            tpl = ub.building_template
            if not tpl or not tpl.skill:
                continue
            skill_name = tpl.skill.name
            skill_score = user_skills.get(skill_name, 0)
            if skill_score >= 10:  # Skill score >= 10 → can build
                result.append({
                    "name": tpl.name,
                    "name_en": tpl.name_en,
                    "icon": tpl.icon,
                    "type": "regular",
                    "skill_name": skill_name,
                    "current_skill_score": skill_score,
                    "region": tpl.region,
                })

        # Check compound buildings
        from app.world.models import UserCompoundBuilding, CompoundBuildingTemplate
        locked_compounds = (
            db.query(UserCompoundBuilding)
            .filter(UserCompoundBuilding.user_id == user.id,
                    UserCompoundBuilding.status == "LOCKED")
            .all()
        )
        for uc in locked_compounds:
            tpl = uc.compound_template
            if not tpl:
                continue
            all_met = True
            for req in (tpl.required_skills or []):
                req_skill = req.get("skill_name", "")
                req_level = req.get("min_level", 0)
                if user_skills.get(req_skill, 0) < req_level:
                    all_met = False
                    break
            if all_met:
                result.append({
                    "name": tpl.name,
                    "name_en": tpl.name_en,
                    "icon": tpl.icon,
                    "type": "compound",
                    "required_skills": tpl.required_skills,
                    "region": tpl.region,
                })

        return result
    except Exception as exc:
        logger.warning("Failed to get unlockable buildings: %s", exc)
        return []


def _get_near_unlock_buildings(db: Session, user: User) -> list[dict]:
    """Buildings close to unlocking (>=60% conditions met)."""
    try:
        from app.skills.service import get_user_skills
        user_skills = {s.get("skill_name", ""): s.get("overall", 0)
                       for s in get_user_skills(db, str(user.id))}

        result = []

        # Check LOCKED compound buildings
        from app.world.models import UserCompoundBuilding
        locked_compounds = (
            db.query(UserCompoundBuilding)
            .filter(UserCompoundBuilding.user_id == user.id,
                    UserCompoundBuilding.status == "LOCKED")
            .all()
        )
        for uc in locked_compounds:
            tpl = uc.compound_template
            if not tpl or not tpl.required_skills:
                continue

            total_conditions = len(tpl.required_skills)
            met_conditions = 0
            missing = []
            for req in tpl.required_skills:
                req_skill = req.get("skill_name", "")
                req_level = req.get("min_level", 0)
                current = user_skills.get(req_skill, 0)
                if current >= req_level:
                    met_conditions += 1
                else:
                    missing.append(f"{req_skill} 需 Lv.{req_level}（当前 Lv.{current}）")

            completion_pct = int(met_conditions / total_conditions * 100) if total_conditions > 0 else 0
            if completion_pct >= 60 and completion_pct < 100:
                result.append({
                    "name": tpl.name,
                    "name_en": tpl.name_en,
                    "icon": tpl.icon,
                    "type": "compound",
                    "completion_pct": completion_pct,
                    "met_conditions": met_conditions,
                    "total_conditions": total_conditions,
                    "missing_conditions": missing,
                    "required_skills": tpl.required_skills,
                })

        # Sort by completion_pct descending
        result.sort(key=lambda x: x["completion_pct"], reverse=True)
        return result[:5]
    except Exception as exc:
        logger.warning("Failed to get near-unlock buildings: %s", exc)
        return []


# ── Sub-helpers: Quests ───────────────────────────────────────────────

def _get_quests_full(db: Session, user_id: str) -> dict:
    """Get active and completed quests with details."""
    try:
        from app.quests.service import get_user_quests
        quests = get_user_quests(db, user_id)
        active = []
        completed = []
        for q in quests:
            entry = {
                "title": q.get("quest_title", ""),
                "skill": q.get("skill_name", ""),
                "difficulty": q.get("difficulty", ""),
                "status": q.get("status", ""),
            }
            status = q.get("status", "")
            if status in ("ACCEPTED", "IN_PROGRESS", "accepted", "in_progress"):
                active.append(entry)
            elif status in ("PASSED", "COMPLETED", "completed", "passed"):
                completed.append(entry)

        return {
            "active": active,
            "completed": completed[-5:],  # Last 5 completed
            "active_count": len(active),
            "total_completed": len(completed),
        }
    except Exception as exc:
        logger.warning("Failed to get quests: %s", exc)
        return {"active": [], "completed": [], "active_count": 0, "total_completed": 0}


# ── Sub-helpers: Paths ───────────────────────────────────────────────

def _get_paths_full(db: Session, user_id: str) -> dict:
    """Get active and completed learning paths with civilization context."""
    try:
        from app.learning_paths.service import list_learning_paths, get_next_checkpoint
        active_paths = list_learning_paths(db, user_id, status="active") or []
        completed_paths = list_learning_paths(db, user_id, status="completed") or []

        active_with_context = []
        for p in active_paths:
            path_info = {
                "id": str(p.id),
                "title": p.title,
                "progress_pct": p.progress_pct if hasattr(p, "progress_pct") else 0,
                "difficulty": p.difficulty if hasattr(p, "difficulty") else 1,
                "category": p.category if hasattr(p, "category") else "",
                "civilization_type": None,
                "current_stage": None,
                "current_stage_idx": 0,
                "total_stages": len(p.milestones) if p.milestones else 0,
                "next_checkpoint": None,
                "building_targets": [],
                "estimated_hours_remaining": 0,
            }
            # Extract civilization type from path metadata
            if p.path_metadata:
                path_info["civilization_type"] = p.path_metadata.get("civilization_type")

            # Find current stage and next checkpoint
            if p.milestones:
                total_hours = 0
                for ms in p.milestones:
                    if ms.building_target:
                        target_info = {
                            "name": ms.building_target.name,
                            "name_en": ms.building_target.name_en,
                            "icon": ms.building_target.icon,
                        }
                        if target_info not in path_info["building_targets"]:
                            path_info["building_targets"].append(target_info)

                    if not ms.is_completed and path_info["current_stage"] is None:
                        path_info["current_stage"] = ms.title
                        path_info["current_stage_idx"] = ms.order_sequence

                        # Find next incomplete checkpoint
                        for cp in ms.checkpoints or []:
                            cp_hours = getattr(cp, 'estimated_hours', 2)
                            if not cp.is_completed:
                                path_info["next_checkpoint"] = {
                                    "id": str(cp.id),
                                    "title": cp.title,
                                    "description": cp.description,
                                    "estimated_hours": cp_hours,
                                }
                                total_hours += cp_hours
                            elif cp.is_completed:
                                total_hours += 0
                        # Add remaining hours from this milestone
                        for cp in ms.checkpoints or []:
                            if not cp.is_completed:
                                total_hours += getattr(cp, 'estimated_hours', 2)
                    elif not ms.is_completed:
                        # Later incomplete stages
                        for cp in ms.checkpoints or []:
                            if not cp.is_completed:
                                total_hours += getattr(cp, 'estimated_hours', 2)

                path_info["estimated_hours_remaining"] = total_hours

            active_with_context.append(path_info)

        return {
            "active": active_with_context,
            "completed": [
                {
                    "id": str(p.id),
                    "title": p.title,
                }
                for p in (completed_paths or [])[-5:]
            ],
            "active_count": len(active_paths),
            "total_completed": len(completed_paths or []),
        }
    except Exception as exc:
        logger.warning("Failed to get paths: %s", exc)
        return {"active": [], "completed": [], "active_count": 0, "total_completed": 0}


# ── Sub-helpers: Projects ────────────────────────────────────────────

def _get_projects(db: Session, user_id: str) -> dict:
    """Get active and completed projects."""
    try:
        from app.projects.service import list_projects
        projects = list_projects(db, user_id) or []
        active = []
        completed = []
        for p in projects:
            # Status comes from nested quest_submission (if present)
            qs = p.get("quest_submission")
            status = qs.get("status", "") if qs else "STANDALONE"

            # Skills come from related_skill
            skill = p.get("related_skill")
            skills_list = [skill.get("name", "")] if skill else []

            entry = {
                "title": p.get("title", ""),
                "status": status,
                "skills": skills_list,
            }
            if status in ("ACTIVE", "IN_PROGRESS", "active", "in_progress", "SUBMITTED", "ASSESSING", "submitted", "assessing"):
                active.append(entry)
            elif status in ("COMPLETED", "PASSED", "completed", "passed"):
                completed.append(entry)
            elif status == "STANDALONE":
                active.append(entry)  # Standalone projects count as active

        return {
            "active": active,
            "completed": completed[-5:],
            "active_count": len(active),
            "total_completed": len(completed),
        }
    except Exception as exc:
        logger.warning("Failed to get projects: %s", exc)
        return {"active": [], "completed": [], "active_count": 0, "total_completed": 0}


# ── Sub-helpers: Badges ──────────────────────────────────────────────

def _get_badges(db: Session, user_id: str) -> dict:
    """Get earned badges."""
    try:
        from app.badges.service import get_user_badges
        badges = get_user_badges(db, user_id) or []
        earned = []
        for b in badges:
            if not b.get("earned"):
                continue
            badge_def = b.get("badge")
            earned.append({
                "name": badge_def.name if badge_def else "",
                "icon": badge_def.icon if badge_def else "🏅",
                "category": badge_def.category if badge_def else "",
                "earned_at": b.get("earned_at", ""),
            })
        return {
            "earned": earned,
            "total_earned": len(earned),
        }
    except Exception as exc:
        logger.warning("Failed to get badges: %s", exc)
        return {"earned": [], "total_earned": 0}


# ── Sub-helpers: Recent Activity ─────────────────────────────────────

def _get_recent_activity_full(db: Session, user_id: str) -> list[dict]:
    """Get recent activity including world events and progress logs."""
    events = []
    try:
        from app.world.models import WorldEvent
        world_events = (
            db.query(WorldEvent)
            .filter(WorldEvent.user_id == user_id)
            .order_by(WorldEvent.created_at.desc())
            .limit(10)
            .all()
        )
        for we in world_events:
            events.append({
                "type": "world_event",
                "event_type": we.event_type,
                "title": we.title or "",
                "description": we.description or "",
                "created_at": we.created_at.isoformat() if we.created_at else "",
            })
    except Exception as exc:
        logger.debug("Failed to get world events: %s", exc)

    try:
        from app.progress.service import get_progress_logs
        logs = get_progress_logs(db, user_id, limit=5)
        for log in (logs or []):
            events.append({
                "type": "skill_change",
                "skill": log.get("skill", ""),
                "delta": log.get("delta", 0),
                "description": f"{log.get('skill', '')}: +{log.get('delta', 0)} 分",
                "created_at": log.get("created_at").isoformat() if log.get("created_at") else "",
            })
    except Exception as exc:
        logger.debug("Failed to get progress logs: %s", exc)

    # Sort by created_at descending
    events.sort(key=lambda e: e.get("created_at", ""), reverse=True)
    return events[:10]


# ── Sub-helpers: Growth Summary ──────────────────────────────────────

def _get_growth_summary(db: Session, user_id: str) -> dict:
    """Summarize recent growth trends."""
    try:
        from app.skills.service import get_user_skills
        skills = get_user_skills(db, user_id)
        total_score = sum(s.get("overall", 0) for s in skills)
        avg_score = total_score / len(skills) if skills else 0

        domains: dict[str, list[int]] = {}
        for s in skills:
            domain = s.get("domain", "OTHER")
            if domain not in domains:
                domains[domain] = []
            domains[domain].append(s.get("overall", 0))

        strongest_domain = ""
        weakest_domain = ""
        if domains:
            domain_avgs = {d: sum(v)/len(v) for d, v in domains.items()}
            strongest_domain = max(domain_avgs, key=domain_avgs.get)
            weakest_domain = min(domain_avgs, key=domain_avgs.get)

        return {
            "total_skills": len(skills),
            "total_score": total_score,
            "average_score": round(avg_score, 1),
            "strongest_domain": strongest_domain,
            "weakest_domain": weakest_domain,
        }
    except Exception as exc:
        logger.warning("Failed to get growth summary: %s", exc)
        return {}


# ═══════════════════════════════════════════════════════════════════════
# Context Formatter
# ═══════════════════════════════════════════════════════════════════════

def _format_rich_context_for_prompt(context: dict) -> str:
    """Format the rich user context into a structured string for the system prompt."""
    lines = []

    # ── Profile ──
    profile = context.get("profile", {})
    lines.append(f"## 用户资料")
    lines.append(f"- 名称：{profile.get('name', '')}")
    if profile.get("title"):
        lines.append(f"- 头衔：{profile.get('title')}")
    if profile.get("level", 1) > 1:
        lines.append(f"- 等级：{profile.get('level')}")

    # ── Civilization ──
    civ = context.get("civilization", {})
    lines.append(f"\n## 文明状态")
    lines.append(f"- 时代：{civ.get('era_name', '')}（{civ.get('era', '')}）")
    lines.append(f"- 文明等级：{civ.get('tier_name', '')}（{civ.get('tier', '')}）")
    lines.append(f"- 文明等级分数：{civ.get('tier_score', 0)}")
    if civ.get("next_tier_at"):
        remaining_tier = civ["next_tier_at"] - civ.get("tier_score", 0)
        lines.append(f"- 距下一等级还需：{remaining_tier} 分")
    lines.append(f"- 文明指数：Lv.{civ.get('civilization_level', 1)}")
    if civ.get("next_era_at"):
        remaining_era = civ["next_era_at"] - civ.get("era_score", 0)
        if remaining_era > 0:
            lines.append(f"- 距下一时代还需：{remaining_era} 文明指数")
    lines.append(f"- 知识点数：{civ.get('knowledge_points', 0)}")
    lines.append(f"- 科技点数：{civ.get('tech_points', 0)}")
    lines.append(f"- 探索进度：{civ.get('exploration_progress', 0)}")

    # ── Skills ──
    skills = context.get("skills", [])
    if skills:
        lines.append(f"\n## 技能状态（共 {len(skills)} 项）")
        for s in skills:
            if s.get("overall", 0) > 0:
                lines.append(
                    f"- {s['name']}：综合 {s['overall']} 分，等级 {s['rank']}，"
                    f"维度 K:{s['knowledge']}/R:{s['reasoning']}/A:{s['application']}/C:{s['creation']}"
                )
        inactive = [s for s in skills if s.get("overall", 0) == 0]
        if inactive and len(inactive) <= 10:
            lines.append(f"\n未激活技能：{'、'.join(s['name'] for s in inactive)}")
        elif inactive:
            lines.append(f"\n未激活技能：{len(inactive)} 项")
    else:
        lines.append("\n## 技能状态：暂无数据")

    # ── Buildings ──
    buildings = context.get("buildings", {})
    regular = buildings.get("regular", [])
    compound = buildings.get("compound", [])

    unlocked_regular = [b for b in regular if b.get("status") != "LOCKED"]
    locked_regular = [b for b in regular if b.get("status") == "LOCKED"]
    unlocked_compound = [b for b in compound if b.get("status") != "LOCKED"]
    locked_compound = [b for b in compound if b.get("status") == "LOCKED"]

    lines.append(f"\n## 建筑状态")
    lines.append(f"- 已解锁常规建筑：{len(unlocked_regular)}/{len(regular)}")
    lines.append(f"- 已解锁复合建筑：{len(unlocked_compound)}/{len(compound)}")

    if unlocked_regular:
        lines.append("\n### 已解锁常规建筑")
        for b in unlocked_regular:
            lines.append(f"- {b['icon']} {b['name']} Lv.{b['level']}/{b['max_level']}（技能：{b.get('skill_name', '')}，区域：{b.get('region', '')}）")

    if unlocked_compound:
        lines.append("\n### 已解锁复合建筑")
        for b in unlocked_compound:
            lines.append(f"- {b['icon']} {b['name']} Lv.{b['level']}/{b['max_level']}（区域：{b.get('region', '')}）")

    if locked_regular:
        lines.append(f"\n### 未解锁常规建筑（{len(locked_regular)} 座）")
        for b in locked_regular:
            lines.append(f"- {b['icon']} {b['name']}（技能：{b.get('skill_name', '')}，区域：{b.get('region', '')}）")

    if locked_compound:
        lines.append(f"\n### 未解锁复合建筑（{len(locked_compound)} 座）")
        for b in locked_compound:
            reqs = b.get("required_skills", [])
            req_str = "、".join(f"{r.get('skill_name','')}≥Lv.{r.get('min_level','')}" for r in reqs)
            lines.append(f"- {b['icon']} {b['name']}（需求：{req_str}）")

    # ── Unlockable Buildings ──
    unlockable = context.get("buildings_unlockable", [])
    if unlockable:
        lines.append(f"\n### 🔓 可立即解锁的建筑")
        for b in unlockable:
            if b.get("type") == "regular":
                lines.append(f"- {b['icon']} {b['name']} — 技能 {b.get('skill_name','')} 已达 Lv.{b.get('current_skill_score',0)}/10")
            else:
                lines.append(f"- {b['icon']} {b['name']} — 所有技能条件已满足")

    # ── Near Unlock ──
    near = context.get("buildings_near_unlock", [])
    if near:
        lines.append(f"\n### 🔜 接近解锁的建筑")
        for b in near:
            missing = b.get("missing_conditions", [])
            lines.append(f"- {b['icon']} {b['name']}（{b['completion_pct']}% — 缺少：{'、'.join(missing[:3])}）")

    # ── Quests ──
    quests = context.get("quests", {})
    lines.append(f"\n## Quest 状态")
    lines.append(f"- 进行中：{quests.get('active_count', 0)} 个")
    lines.append(f"- 已完成：{quests.get('total_completed', 0)} 个")
    for q in quests.get("active", []):
        lines.append(f"  - 📋 {q['title']}（技能：{q.get('skill', '')}，难度：{q.get('difficulty', '')}）")

    # ── Paths ──
    paths = context.get("paths", {})
    if paths.get("active_count", 0) > 0:
        lines.append(f"\n## 学习路径状态")
        lines.append(f"- 进行中：{paths.get('active_count', 0)} 条")
        lines.append(f"- 已完成：{paths.get('total_completed', 0)} 条")
        for p in paths.get("active", []):
            lines.append(f"  - 🛤️ {p['title']}（进度 {p['progress_pct']}%，难度 {'★'*p.get('difficulty',1)}）")

    # ── Projects ──
    projects = context.get("projects", {})
    if projects.get("active_count", 0) > 0 or projects.get("total_completed", 0) > 0:
        lines.append(f"\n## 项目状态")
        lines.append(f"- 进行中：{projects.get('active_count', 0)} 个")
        lines.append(f"- 已完成：{projects.get('total_completed', 0)} 个")
        for p in projects.get("active", []):
            lines.append(f"  - 📦 {p['title']}")

    # ── Badges ──
    badges = context.get("badges", {})
    if badges.get("total_earned", 0) > 0:
        lines.append(f"\n## 徽章状态")
        lines.append(f"- 已获得：{badges.get('total_earned', 0)} 枚")
        for b in badges.get("earned", [])[-5:]:
            lines.append(f"  - {b.get('icon', '🏅')} {b.get('name', '')}")

    # ── Recent Activity ──
    recent = context.get("recent_activity", [])
    if recent:
        lines.append(f"\n## 最近活动")
        for r in recent[:5]:
            lines.append(f"- {r.get('description', '')}")

    # ── Growth Summary ──
    growth = context.get("growth_summary", {})
    if growth:
        lines.append(f"\n## 成长摘要")
        lines.append(f"- 已激活技能：{growth.get('total_skills', 0)} 项")
        lines.append(f"- 总分：{growth.get('total_score', 0)}")
        lines.append(f"- 平均分：{growth.get('average_score', 0)}")
        if growth.get("strongest_domain"):
            lines.append(f"- 优势领域：{growth['strongest_domain']}")
        if growth.get("weakest_domain"):
            lines.append(f"- 薄弱领域：{growth['weakest_domain']}")

    # ── Memory ──
    memory = context.get("memory", [])
    if memory:
        lines.append(f"\n## 长期记忆")
        for m in memory[:5]:
            if isinstance(m, dict):
                lines.append(f"- [{m.get('memory_type', '')}] {m.get('key', '')}: {str(m.get('value', ''))[:100]}")

    return "\n".join(lines)


# ═══════════════════════════════════════════════════════════════════════
# LLM Config (Unified)
# ═══════════════════════════════════════════════════════════════════════

def _get_agent_llm_kwargs(db: Session, user_id: str) -> dict:
    """Extract LLM config from UserSettings for agent chat.

    Uses unified LLM config. If use_path_llm_override is enabled,
    falls back to path-specific settings for path generation only.
    For agent chat, always uses the primary LLM config.
    """
    try:
        settings = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
        if not settings:
            return {}
        kwargs = {}
        if settings.llm_api_key:
            kwargs["user_api_key"] = settings.llm_api_key
        if settings.llm_base_url:
            kwargs["user_base_url"] = settings.llm_base_url
        if settings.llm_model:
            kwargs["user_model"] = settings.llm_model
        if settings.llm_provider:
            kwargs["user_provider"] = settings.llm_provider
        return kwargs
    except Exception as exc:
        logger.warning("Failed to get agent LLM kwargs: %s", exc)
        return {}


# ═══════════════════════════════════════════════════════════════════════
# LLM Chat Completion
# ═══════════════════════════════════════════════════════════════════════

def _chat_completion(
    system_prompt: str,
    user_content: str,
    *,
    temperature: float = 0.7,
    user_api_key: str | None = None,
    user_base_url: str | None = None,
    user_model: str | None = None,
    user_provider: str | None = None,
) -> str:
    """Call the LLM for conversational chat (no structured output enforcement)."""
    from openai import OpenAI
    from app.config import settings
    from app.core.providers import (
        resolve_provider,
        get_effective_base_url,
        get_effective_model,
    )

    effective_provider_key = user_provider or settings.llm_provider
    provider = resolve_provider(effective_provider_key)

    # Resolve API key, base URL, model
    effective_api_key = user_api_key or settings.llm_api_key
    if not effective_api_key:
        logger.warning("No LLM API key configured — using fallback response")
        raise ValueError("LLM_API_KEY not configured")

    effective_base_url = (
        user_base_url.strip().rstrip("/") if user_base_url
        else get_effective_base_url(effective_provider_key, settings.llm_base_url)
    )
    effective_model = (
        user_model.strip() if user_model
        else get_effective_model(effective_provider_key, settings.llm_model)
    )

    # Create client
    client_kwargs: dict = {"api_key": effective_api_key}
    if effective_base_url:
        client_kwargs["base_url"] = effective_base_url
    client = OpenAI(**client_kwargs)

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_content},
    ]

    logger.info(
        "Agent chat — provider=%s model=%s temperature=%s",
        effective_provider_key, effective_model, temperature,
    )

    try:
        response = client.chat.completions.create(
            model=effective_model,
            temperature=temperature,
            timeout=settings.llm_timeout_seconds,
            messages=messages,
        )
        content = response.choices[0].message.content
        if not content:
            raise ValueError("LLM returned empty response")
        return content
    except Exception as exc:
        logger.error("Agent chat LLM call failed: %s", exc)
        raise


def _chat_completion_stream(
    system_prompt: str,
    user_content: str,
    *,
    temperature: float = 0.7,
    user_api_key: str | None = None,
    user_base_url: str | None = None,
    user_model: str | None = None,
    user_provider: str | None = None,
):
    """Call the LLM with streaming enabled, yielding text tokens one at a time."""
    from openai import OpenAI
    from app.config import settings
    from app.core.providers import (
        resolve_provider,
        get_effective_base_url,
        get_effective_model,
    )

    effective_provider_key = user_provider or settings.llm_provider
    provider = resolve_provider(effective_provider_key)

    effective_api_key = user_api_key or settings.llm_api_key
    if not effective_api_key:
        logger.warning("No LLM API key configured — using fallback response")
        raise ValueError("LLM_API_KEY not configured")

    effective_base_url = (
        user_base_url.strip().rstrip("/") if user_base_url
        else get_effective_base_url(effective_provider_key, settings.llm_base_url)
    )
    effective_model = (
        user_model.strip() if user_model
        else get_effective_model(effective_provider_key, settings.llm_model)
    )

    client_kwargs: dict = {"api_key": effective_api_key}
    if effective_base_url:
        client_kwargs["base_url"] = effective_base_url
    client = OpenAI(**client_kwargs)

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_content},
    ]

    logger.info(
        "Agent chat stream — provider=%s model=%s temperature=%s",
        effective_provider_key, effective_model, temperature,
    )

    stream = client.chat.completions.create(
        model=effective_model,
        temperature=temperature,
        timeout=settings.llm_timeout_seconds,
        messages=messages,
        stream=True,
    )

    for chunk in stream:
        delta = chunk.choices[0].delta if chunk.choices else None
        if delta and delta.content:
            yield delta.content


# ═══════════════════════════════════════════════════════════════════════
# Core Chat Logic
# ═══════════════════════════════════════════════════════════════════════

def generate_response(
    db: Session,
    user: User,
    message: str,
    conversation_id: str | None = None,
) -> ChatResponse:
    """Generate a Civilization Mentor response to a user message.

    1. Build rich user context (all skills, buildings, quests, paths, projects, badges)
    2. Build world rules context (static game rules from DB)
    3. Get conversation history for multi-turn awareness
    4. Classify intent
    5. Build system prompt with persona + world rules + user context + tone
    6. Call LLM (plain chat, no JSON schema)
    7. Parse response for embedded cards
    8. Persist messages to conversation history
    """
    user_id_str = str(user.id)

    # Resolve or create conversation_id
    if not conversation_id:
        import uuid as _uuid
        conversation_id = str(_uuid.uuid4())
    conv_uuid = UUID(conversation_id)

    # ── Build contexts ──
    user_context = build_rich_user_context(db, user)
    user_context_str = _format_rich_context_for_prompt(user_context)
    world_rules = build_world_rules_context(db)

    # ── Conversation history ──
    history = _get_recent_history(db, user_id_str, conv_uuid)

    # ── Intent ──
    intent = classify_intent(message)

    # ── System prompt ──
    system_prompt = SYSTEM_PROMPT.format(
        agent_name=AGENT_NAME,
        agent_name_zh=AGENT_NAME_ZH,
        agent_role=AGENT_ROLE,
        agent_role_zh=AGENT_ROLE_ZH,
        agent_sub_role_1=AGENT_SUB_ROLE_1,
        agent_sub_role_1_zh=AGENT_SUB_ROLE_1_ZH,
        agent_sub_role_2=AGENT_SUB_ROLE_2,
        agent_sub_role_2_zh=AGENT_SUB_ROLE_2_ZH,
        agent_description=AGENT_DESCRIPTION,
        tone_guidelines=TONE_GUIDELINES,
        world_rules=world_rules,
        user_context=user_context_str,
        current_time=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
    )

    # ── User message with history ──
    user_content = message
    if history:
        history_context = "\n".join(
            f"[{m['role']}]: {m['content'][:300]}" for m in history[-6:]
        )
        user_content = (
            f"Previous conversation:\n{history_context}\n\n"
            f"User's latest message: {message}"
        )

    # ── Save user message ──
    _save_message(db, user_id_str, conv_uuid, "user", message, "text")

    # ── LLM config ──
    llm_kwargs = _get_agent_llm_kwargs(db, user_id_str)

    # ── Call LLM ──
    try:
        agent_text = _chat_completion(
            system_prompt=system_prompt,
            user_content=user_content,
            temperature=0.7,
            **llm_kwargs,
        )
    except Exception as exc:
        logger.error("Agent LLM call failed: %s", exc)
        agent_text = _generate_fallback_response(intent, user_context)

    # ── Parse cards ──
    cards = _extract_cards_from_text(agent_text)
    display_text = agent_text.split(CARDS_SEPARATOR)[0].strip() if CARDS_SEPARATOR in agent_text else agent_text

    # ── Save agent message ──
    _save_message(
        db, user_id_str, conv_uuid, "agent", display_text, "text",
        metadata_={"intent": intent, "cards": [c.model_dump() for c in cards] if cards else None},
    )

    # ── Record interaction ──
    record_interaction(
        db, user_id_str, f"agent_chat_{intent}",
        {"message": message[:200], "intent": intent, "conversation_id": conversation_id},
    )

    return ChatResponse(
        conversation_id=conversation_id,
        message=AgentMessage(role="agent", content=display_text),
        cards=cards,
    )


def generate_response_stream(
    db: Session,
    user: User,
    message: str,
    conversation_id: str | None = None,
):
    """SSE streaming variant of generate_response.

    Same setup (context, history, intent, system prompt) but yields
    SSE-formatted events as the LLM streams tokens, then a final
    ``done`` event with conversation_id and cards.

    Yields strings of the form ``data: {json}\\n\\n``.
    """
    user_id_str = str(user.id)

    # Resolve or create conversation_id
    if not conversation_id:
        import uuid as _uuid
        conversation_id = str(_uuid.uuid4())
    conv_uuid = UUID(conversation_id)

    # ── Build contexts ──
    user_context = build_rich_user_context(db, user)
    user_context_str = _format_rich_context_for_prompt(user_context)
    world_rules = build_world_rules_context(db)

    # ── Conversation history ──
    history = _get_recent_history(db, user_id_str, conv_uuid)

    # ── Intent ──
    intent = classify_intent(message)

    # ── System prompt ──
    system_prompt = SYSTEM_PROMPT.format(
        agent_name=AGENT_NAME,
        agent_name_zh=AGENT_NAME_ZH,
        agent_role=AGENT_ROLE,
        agent_role_zh=AGENT_ROLE_ZH,
        agent_sub_role_1=AGENT_SUB_ROLE_1,
        agent_sub_role_1_zh=AGENT_SUB_ROLE_1_ZH,
        agent_sub_role_2=AGENT_SUB_ROLE_2,
        agent_sub_role_2_zh=AGENT_SUB_ROLE_2_ZH,
        agent_description=AGENT_DESCRIPTION,
        tone_guidelines=TONE_GUIDELINES,
        world_rules=world_rules,
        user_context=user_context_str,
        current_time=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
    )

    # ── User message with history ──
    user_content = message
    if history:
        history_context = "\n".join(
            f"[{m['role']}]: {m['content'][:300]}" for m in history[-6:]
        )
        user_content = (
            f"Previous conversation:\n{history_context}\n\n"
            f"User's latest message: {message}"
        )

    # ── Save user message ──
    _save_message(db, user_id_str, conv_uuid, "user", message, "text")

    # ── LLM config ──
    llm_kwargs = _get_agent_llm_kwargs(db, user_id_str)

    # ── Stream LLM tokens ──
    full_text = ""
    try:
        for token in _chat_completion_stream(
            system_prompt=system_prompt,
            user_content=user_content,
            temperature=0.7,
            **llm_kwargs,
        ):
            full_text += token
            yield f"data: {json.dumps({'type': 'token', 'content': token}, ensure_ascii=False)}\n\n"
    except Exception as exc:
        logger.error("Agent streaming LLM call failed: %s", exc)
        fallback = _generate_fallback_response(intent, user_context)
        full_text = fallback
        # Yield the fallback as a single token for display
        yield f"data: {json.dumps({'type': 'token', 'content': fallback}, ensure_ascii=False)}\n\n"

    # ── Parse cards ──
    cards = _extract_cards_from_text(full_text)
    display_text = full_text.split(CARDS_SEPARATOR)[0].strip() if CARDS_SEPARATOR in full_text else full_text

    # ── Save agent message ──
    _save_message(
        db, user_id_str, conv_uuid, "agent", display_text, "text",
        metadata_={"intent": intent, "cards": [c.model_dump() for c in cards] if cards else None},
    )

    # ── Record interaction ──
    record_interaction(
        db, user_id_str, f"agent_chat_{intent}",
        {"message": message[:200], "intent": intent, "conversation_id": conversation_id},
    )

    # ── Final done event ──
    yield f"data: {json.dumps({'type': 'done', 'conversation_id': conversation_id, 'cards': [c.model_dump() for c in cards] if cards else []}, ensure_ascii=False)}\n\n"


# ═══════════════════════════════════════════════════════════════════════
# Proactive Greeting (Stage 3)
# ═══════════════════════════════════════════════════════════════════════

def generate_greeting(db: Session, user: User) -> ChatResponse:
    """Generate a proactive, data-rich greeting for the agent sidebar.

    Uses build_rich_user_context() to get complete user state,
    then build_proactive_greeting() to generate a context-aware welcome
    with suggestions, progress reminders, and unlock alerts.
    """
    import uuid as _uuid
    conversation_id = str(_uuid.uuid4())
    user_id_str = str(user.id)

    # Build rich context
    context = build_rich_user_context(db, user)
    greeting_text = build_proactive_greeting(
        context.get("profile", {}).get("name", "there"),
        context,
    )

    # Save as agent greeting message
    _save_message(
        db, user_id_str, UUID(conversation_id), "agent", greeting_text, "greeting",
        metadata_={"context_snapshot": {
            "civilization": context.get("civilization", {}),
            "skills_count": len(context.get("skills", [])),
            "buildings_unlocked": len([
                b for b in context.get("buildings", {}).get("regular", [])
                if b.get("status") != "LOCKED"
            ]),
        }},
    )

    return ChatResponse(
        conversation_id=conversation_id,
        message=AgentMessage(role="agent", content=greeting_text, message_type="greeting"),
    )


# ═══════════════════════════════════════════════════════════════════════
# History Management
# ═══════════════════════════════════════════════════════════════════════

def list_user_conversations(db: Session, user_id: str) -> list[ConversationListItem]:
    """List all conversations for a user, grouped by conversation_id."""
    from sqlalchemy import func

    subquery = (
        db.query(
            ConversationHistory.conversation_id,
            func.max(ConversationHistory.created_at).label("max_created"),
        )
        .filter(ConversationHistory.user_id == user_id)
        .group_by(ConversationHistory.conversation_id)
        .subquery()
    )

    messages = (
        db.query(ConversationHistory)
        .join(
            subquery,
            (ConversationHistory.conversation_id == subquery.c.conversation_id)
            & (ConversationHistory.created_at == subquery.c.max_created),
        )
        .filter(ConversationHistory.user_id == user_id)
        .order_by(ConversationHistory.created_at.desc())
        .limit(20)
        .all()
    )

    return [
        ConversationListItem(
            id=str(m.conversation_id),
            title=_generate_conversation_title(m),
            last_message=m.content[:100] if m.content else "",
            updated_at=m.created_at.isoformat(),
        )
        for m in messages
    ]


def get_conversation_messages(
    db: Session, user_id: str, conversation_id: str
) -> list[ChatMessage]:
    """Get all messages for a specific conversation."""
    try:
        conv_uuid = UUID(conversation_id)
    except ValueError:
        return []

    messages = (
        db.query(ConversationHistory)
        .filter(
            ConversationHistory.user_id == user_id,
            ConversationHistory.conversation_id == conv_uuid,
        )
        .order_by(ConversationHistory.created_at.asc())
        .all()
    )

    return [
        ChatMessage(
            id=str(m.id),
            role=m.role,
            content=m.content,
            message_type=m.message_type,
            created_at=m.created_at.isoformat(),
        )
        for m in messages
    ]


# ═══════════════════════════════════════════════════════════════════════
# Internal Helpers
# ═══════════════════════════════════════════════════════════════════════

def _get_recent_history(db: Session, user_id: str, conv_uuid: UUID) -> list[dict]:
    """Get the last N messages in this conversation for LLM context."""
    messages = (
        db.query(ConversationHistory)
        .filter(
            ConversationHistory.user_id == user_id,
            ConversationHistory.conversation_id == conv_uuid,
        )
        .order_by(ConversationHistory.created_at.desc())
        .limit(MAX_HISTORY_MESSAGES)
        .all()
    )
    return [
        {"role": m.role, "content": m.content}
        for m in reversed(messages)
    ]


def _save_message(
    db: Session,
    user_id: str,
    conv_uuid: UUID,
    role: str,
    content: str,
    message_type: str = "text",
    metadata_: dict | None = None,
) -> ConversationHistory:
    """Persist a message to conversation history."""
    msg = ConversationHistory(
        user_id=UUID(user_id),
        conversation_id=conv_uuid,
        role=role,
        content=content,
        message_type=message_type,
        metadata_=metadata_,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


def _generate_conversation_title(msg: ConversationHistory) -> str:
    """Generate a short title from the first user message."""
    content = msg.content or ""
    return content[:50] + ("..." if len(content) > 50 else "")


def _extract_cards_from_text(text: str) -> list[AgentCard] | None:
    """Parse embedded card JSON from agent response text."""
    if CARDS_SEPARATOR not in text:
        return None

    try:
        parts = text.split(CARDS_SEPARATOR, 1)
        card_json = parts[1].strip()
        card_json = re.sub(r"^```\w*\s*", "", card_json)
        card_json = re.sub(r"\s*```$", "", card_json)
        data = json.loads(card_json.strip())
        cards_data = data.get("cards", [])
        return [AgentCard(**c) for c in cards_data]
    except (json.JSONDecodeError, KeyError, TypeError) as exc:
        logger.warning("Failed to parse cards from response: %s", exc)
        return None


def _generate_fallback_response(intent: str, context: dict) -> str:
    """Generate a graceful fallback when LLM is unavailable."""
    user_name = context.get("profile", {}).get("name", "there")

    responses = {
        "civilization_analysis": (
            f"{user_name}，我暂时无法连接分析引擎来详细分析你的文明状态。"
            f"请稍后再试，我可以通过你的技能、建筑和 Quest 数据给你全面的分析。"
        ),
        "growth_planning": (
            f"{user_name}，我正在尝试为你规划最优成长路线，但分析引擎暂时不可用。"
            f'请稍后再问我「下一步该做什么」，我会结合你的真实数据给出建议。'
        ),
        "building_advisor": (
            f"{user_name}，我可以帮你分析哪些建筑可以解锁，但现在数据引擎暂时无法连接。"
            f"请稍后再试。"
        ),
        "learning_advisor": (
            f"{user_name}，我可以根据你的技能缺口推荐学习内容，但分析引擎需要一些时间恢复。"
            f'请稍后再问我「应该学什么」。'
        ),
        "skill_query": (
            f"{user_name}，我可以详细分析你的技能状态，但我的分析引擎暂时不可用。"
            f"请稍后再试。"
        ),
        "world_query": (
            f"{user_name}，Odyssey 世界有完整的时代、建筑和文明规则体系。"
            f"我暂时无法连接数据引擎来展示具体数据，请稍后再试。"
        ),
        "quest_query": (
            f"{user_name}，我有一些 Quest 建议想分享给你，但分析引擎需要一点时间恢复。"
            f"请稍后再问我。"
        ),
        "progress_query": (
            f"{user_name}，我很想告诉你最近的成长进展！但我的分析引擎暂时不可用。"
            f"请稍后再问。"
        ),
    }

    return responses.get(
        intent,
        f"{user_name}，我是 Odyssey，你的文明导师。我在这里帮助你理解你的能力成长、"
        f"文明建设和学习路径。但目前分析引擎暂时不可用，请稍后再试。"
        f"\n\n你可以问我关于技能、建筑、时代、Quest 和学习路径的任何问题。",
    )
