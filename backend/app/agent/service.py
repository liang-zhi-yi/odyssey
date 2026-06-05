"""
Agent service — business logic for chat, context building, intent routing.

Key design decisions (A1):
- Non-streaming request/response (SSE streaming comes in A3)
- Reuses evaluate_submission() from app.core.llm for LLM calls
- Reuses build_memory_context() from app.learning_paths.memory
- Aggregates data from existing services (skills, progress, world, etc.)
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
    AGENT_DESCRIPTION,
    SYSTEM_PROMPT,
    build_greeting,
    build_context_summary,
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

# ── Constants ──────────────────────────────────────────────────────

MAX_HISTORY_MESSAGES = 10  # Number of past messages included in LLM context
CARDS_SEPARATOR = "---CARDS---"

# ── Intent classification ──────────────────────────────────────────

INTENT_PATTERNS: list[tuple[str, list[str]]] = [
    ("progress_query", [
        "进度", "progress", "成长", "growth", "最近", "recent",
        "做了什么", "取得了", "improved", "improvement",
    ]),
    ("skill_query", [
        "技能", "skill", "能力", "ability", "level", "等级",
        "擅长", "good at", "what skills",
    ]),
    ("world_query", [
        "世界", "world", "建筑", "building", "文明", "civilization",
        "tier", "升级", "upgrade", "城市", "city",
    ]),
    ("quest_query", [
        "任务", "quest", "下一步", "next", "该做什么", "what should",
        "what to do", "推荐", "recommend", "建议", "suggest",
    ]),
    ("path_query", [
        "路径", "path", "学习计划", "learning plan", "路线",
        "milestone", "里程碑", "checkpoint",
    ]),
]


def classify_intent(message: str) -> str:
    """Classify user intent with keyword matching. Returns intent label."""
    msg_lower = message.lower()
    for intent, keywords in INTENT_PATTERNS:
        for kw in keywords:
            if kw.lower() in msg_lower:
                return intent
    return "general_chat"


# ── Context builder ────────────────────────────────────────────────

def build_agent_context(db: Session, user: User) -> dict:
    """Aggregate user data from existing services for LLM context injection."""
    context: dict = {
        "user_name": user.nickname or user.username,
        "skills": _get_skills_summary(db, user),
        "world": _get_world_summary(db, user),
        "quests": _get_quests_summary(db, user),
        "paths": _get_paths_summary(db, user),
        "recent_activity": _get_recent_activity(db, user),
        "memory": build_memory_context(db, str(user.id)),
        "buildings_near_upgrade": _get_near_upgrade(db, user),
    }
    return context


def _get_skills_summary(db: Session, user: User) -> list[dict]:
    """Get top 5 user skills with levels."""
    try:
        from app.skills.service import get_user_skills
        skills = get_user_skills(db, str(user.id))
        top = sorted(
            skills, key=lambda s: s.get("overall", 0), reverse=True
        )[:5]
        return [
            {
                "name": s.get("skill_name", "Unknown"),
                "level": s.get("overall", 0),
                "rank": s.get("rank", "NOVICE"),
            }
            for s in top
        ]
    except Exception as exc:
        logger.warning("Failed to get skills summary: %s", exc)
        return []


def _get_world_summary(db: Session, user: User) -> dict:
    """Get civilization tier and building summary."""
    try:
        from app.world.models import World
        world = db.query(World).filter(World.user_id == user.id).first()
        if not world:
            return {"tier": "SETTLER", "tier_label": "Settler", "building_count": 0}
        return {
            "tier": world.current_tier if hasattr(world, "current_tier") else "SETTLER",
            "tier_label": world.tier_label if hasattr(world, "tier_label") else "Settler",
            "building_count": world.total_buildings if hasattr(world, "total_buildings") else 0,
        }
    except Exception as exc:
        logger.warning("Failed to get world summary: %s", exc)
        return {"tier": "SETTLER", "tier_label": "Settler", "building_count": 0}


def _get_quests_summary(db: Session, user: User) -> dict:
    """Get active and completed quest counts."""
    try:
        from app.quests.service import get_user_quests
        quests = get_user_quests(db, str(user.id))
        active = [q for q in quests if q.get("status") == "accepted"]
        completed = [q for q in quests if q.get("status") == "completed"]
        return {
            "active": len(active),
            "completed": len(completed),
        }
    except Exception as exc:
        logger.warning("Failed to get quests summary: %s", exc)
        return {"active": 0, "completed": 0}


def _get_paths_summary(db: Session, user: User) -> list[dict]:
    """Get active learning paths with progress."""
    try:
        from app.learning_paths.service import list_learning_paths
        paths = list_learning_paths(db, str(user.id), status="active")
        return [
            {
                "id": str(p.id),
                "title": p.title,
                "progress_pct": p.progress_pct if hasattr(p, "progress_pct") else 0,
            }
            for p in (paths or [])[:3]
        ]
    except Exception as exc:
        logger.warning("Failed to get paths summary: %s", exc)
        return []


def _get_recent_activity(db: Session, user: User) -> list[dict]:
    """Get last 5 progress logs."""
    try:
        from app.progress.service import get_progress_logs
        logs = get_progress_logs(db, str(user.id), limit=5)
        return [
            {
                "skill": log.get("skill", "Unknown"),
                "description": f"{log.get('skill', 'Activity')}: +{log.get('delta', 0)} points",
                "created_at": log.get("created_at").isoformat() if log.get("created_at") else "",
            }
            for log in (logs or [])
        ]
    except Exception as exc:
        logger.warning("Failed to get recent activity: %s", exc)
        return []


def _get_near_upgrade(db: Session, user: User) -> list[dict]:
    """Get buildings close to leveling up (level >= 80% of max)."""
    try:
        from app.world.models import UserBuilding
        buildings = (
            db.query(UserBuilding)
            .filter(UserBuilding.user_id == user.id)
            .all()
        )
        near = []
        for b in buildings:
            current = b.current_level or 0
            max_lvl = b.max_level or 10
            if max_lvl > 0 and current > 0 and (current / max_lvl) >= 0.8 and current < max_lvl:
                near.append({
                    "building_name": b.building_template.name if hasattr(b, "building_template") and b.building_template else "Unknown",
                    "current_level": current,
                    "max_level": max_lvl,
                })
        return near[:3]
    except Exception as exc:
        logger.warning("Failed to get near-upgrade buildings: %s", exc)
        return []


# ── Context formatter ──────────────────────────────────────────────

def _format_context_for_prompt(context: dict) -> str:
    """Format the context dict into a string for the system prompt."""
    lines = []

    lines.append(f"**User:** {context.get('user_name', 'User')}")

    # Skills
    skills = context.get("skills", [])
    if skills:
        lines.append("\n**Skills:**")
        for s in skills:
            lines.append(f"- {s['name']}: Level {s['level']} ({s['rank']})")
    else:
        lines.append("\n**Skills:** No skills recorded yet.")

    # World
    world = context.get("world", {})
    if world:
        lines.append(f"\n**Civilization:** {world.get('tier_label', 'Unknown')} tier, "
                     f"{world.get('building_count', 0)} buildings")

    # Quests
    quests = context.get("quests", {})
    lines.append(f"\n**Quests:** {quests.get('active', 0)} active, {quests.get('completed', 0)} completed")

    # Paths
    paths = context.get("paths", [])
    if paths:
        lines.append("\n**Active Learning Paths:**")
        for p in paths:
            lines.append(f"- {p['title']} ({p['progress_pct']}%)")

    # Buildings near upgrade
    near = context.get("buildings_near_upgrade", [])
    if near:
        lines.append("\n**Buildings Near Upgrade:**")
        for b in near:
            lines.append(f"- {b['building_name']}: Level {b['current_level']}/{b['max_level']}")

    # Recent activity
    recent = context.get("recent_activity", [])
    if recent:
        lines.append("\n**Recent Activity:**")
        for r in recent[:3]:
            lines.append(f"- {r['description']}")

    return "\n".join(lines)


# ── LLM config for agent ──────────────────────────────────────────

def _get_agent_llm_kwargs(db: Session, user_id: str) -> dict:
    """Extract LLM config from UserSettings for agent chat."""
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


# ── LLM chat completion (conversational, no JSON schema) ──────────

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
    """Call the LLM for conversational chat (no structured output enforcement).

    Uses the same provider resolution as evaluate_submission(),
    but without json_schema — so the model can respond in natural language.
    """
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


# ── Core chat logic ────────────────────────────────────────────────

def generate_response(
    db: Session,
    user: User,
    message: str,
    conversation_id: str | None = None,
) -> ChatResponse:
    """Generate an agent response to a user message.

    1. Build user context from existing services
    2. Get conversation history for multi-turn awareness
    3. Classify intent
    4. Call LLM with persona + context + history (plain chat, no JSON schema)
    5. Parse response for embedded cards
    6. Persist messages to conversation history
    """
    user_id_str = str(user.id)

    # Resolve or create conversation_id
    if not conversation_id:
        import uuid as _uuid
        conversation_id = str(_uuid.uuid4())
    conv_uuid = UUID(conversation_id)

    # Build context
    context = build_agent_context(db, user)
    context_str = _format_context_for_prompt(context)

    # Get conversation history
    history = _get_recent_history(db, user_id_str, conv_uuid)

    # Classify intent
    intent = classify_intent(message)

    # Build system prompt
    system_prompt = SYSTEM_PROMPT.format(
        agent_name=AGENT_NAME,
        agent_name_zh=AGENT_NAME_ZH,
        agent_role=AGENT_ROLE,
        agent_role_zh=AGENT_ROLE_ZH,
        agent_description=AGENT_DESCRIPTION,
        user_context=context_str,
        current_time=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
    )

    # Build messages with conversation history
    user_content = message
    if history:
        history_context = "\n".join(
            f"[{m['role']}]: {m['content'][:300]}" for m in history[-6:]
        )
        user_content = (
            f"Previous conversation:\n{history_context}\n\n"
            f"User's latest message: {message}"
        )

    # Save user message
    _save_message(db, user_id_str, conv_uuid, "user", message, "text")

    # Get LLM config
    llm_kwargs = _get_agent_llm_kwargs(db, user_id_str)

    # Call LLM
    try:
        agent_text = _chat_completion(
            system_prompt=system_prompt,
            user_content=user_content,
            temperature=0.7,
            **llm_kwargs,
        )
    except Exception as exc:
        logger.error("Agent LLM call failed: %s", exc)
        agent_text = _generate_fallback_response(intent, context)

    # Parse cards from response
    cards = _extract_cards_from_text(agent_text)
    # Clean card markers from display text
    display_text = agent_text.split(CARDS_SEPARATOR)[0].strip() if CARDS_SEPARATOR in agent_text else agent_text

    # Save agent message
    _save_message(
        db, user_id_str, conv_uuid, "agent", display_text, "text",
        metadata_={"intent": intent, "cards": [c.model_dump() for c in cards] if cards else None},
    )

    # Record interaction in memory bank
    record_interaction(
        db, user_id_str, f"agent_chat_{intent}",
        {"message": message[:200], "intent": intent, "conversation_id": conversation_id},
    )

    return ChatResponse(
        conversation_id=conversation_id,
        message=AgentMessage(role="agent", content=display_text),
        cards=cards,
    )


def generate_greeting(db: Session, user: User) -> ChatResponse:
    """Generate a context-aware greeting for the agent sidebar."""
    import uuid as _uuid
    conversation_id = str(_uuid.uuid4())
    user_id_str = str(user.id)

    context = build_agent_context(db, user)
    context_summary = build_context_summary(context)
    greeting_text = build_greeting(
        context.get("user_name", "there"),
        context_summary,
    )

    # Save as system message
    _save_message(
        db, user_id_str, UUID(conversation_id), "agent", greeting_text, "greeting",
        metadata_={"context_snapshot": {k: str(v)[:200] for k, v in context.items()}},
    )

    return ChatResponse(
        conversation_id=conversation_id,
        message=AgentMessage(role="agent", content=greeting_text, message_type="greeting"),
    )


# ── History management ─────────────────────────────────────────────

def list_user_conversations(db: Session, user_id: str) -> list[ConversationListItem]:
    """List all conversations for a user, grouped by conversation_id."""
    from sqlalchemy import func, distinct
    from sqlalchemy.orm import aliased

    # Get latest message per conversation
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


# ── Internal helpers ───────────────────────────────────────────────

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
    # Use first 50 chars of first user message as title
    return content[:50] + ("..." if len(content) > 50 else "")


def _extract_cards_from_text(text: str) -> list[AgentCard] | None:
    """Parse embedded card JSON from agent response text."""
    if CARDS_SEPARATOR not in text:
        return None

    try:
        parts = text.split(CARDS_SEPARATOR, 1)
        card_json = parts[1].strip()
        # Strip markdown code fences
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
    user_name = context.get("user_name", "there")

    responses = {
        "progress_query": (
            f"I'd love to tell you about your progress, {user_name}, but I'm having "
            f"trouble connecting to my analysis engine right now. Please try again in a moment!"
        ),
        "skill_query": (
            f"I can help you understand your skills, {user_name}! However, my analysis "
            f"engine seems to be taking a break. Could you try asking again?"
        ),
        "world_query": (
            f"Your capability world is an exciting place, {user_name}! Unfortunately, "
            f"I can't load the details right now. Please try again shortly."
        ),
        "quest_query": (
            f"I have some ideas for your next steps, {user_name}, but I need my analysis "
            f"engine to give you specific recommendations. Mind trying again?"
        ),
        "path_query": (
            f"Learning paths are my specialty, {user_name}! But I'm having a temporary "
            f"issue accessing my tools. Please ask again in a moment."
        ),
    }

    return responses.get(
        intent,
        f"Hello {user_name}! I'm here to help with your growth journey, but I'm having "
        f"a temporary technical issue. Please try again in a moment. I can help with your "
        f"skills, progress, world, quests, and learning paths!",
    )
