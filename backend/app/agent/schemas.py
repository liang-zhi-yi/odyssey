"""
Agent chat request/response schemas (Pydantic v2).

Follows the existing pattern from app/quests/schemas.py and
app/assessments/schemas.py.
"""
from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field


# ── Request ────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    """Incoming chat message from the user."""
    message: str = Field(..., min_length=1, max_length=4000)
    conversation_id: str | None = Field(
        None, description="Existing conversation ID for multi-turn chat"
    )


# ── Response ───────────────────────────────────────────────────────

class AgentCard(BaseModel):
    """Structured card data embedded in agent responses."""
    card_type: str = Field(
        ...,
        description="skill_summary | quest_recommendation | world_update | progress_insight | path_suggestion",
    )
    data: dict = Field(..., description="Card-specific payload")


class AgentMessage(BaseModel):
    """A single agent message."""
    role: str = "agent"
    content: str
    message_type: str = "text"  # "text" | "greeting"


class ChatResponse(BaseModel):
    """Complete response from the agent."""
    conversation_id: str
    message: AgentMessage
    cards: list[AgentCard] | None = None


# ── History ────────────────────────────────────────────────────────

class ConversationListItem(BaseModel):
    """Summary of a conversation for the history sidebar."""
    id: str
    title: str
    last_message: str
    updated_at: str


class ChatMessage(BaseModel):
    """A single message in conversation history."""
    id: str
    role: str
    content: str
    message_type: str
    created_at: str


class HistoryResponse(BaseModel):
    """Response containing conversation list or messages for a single conversation."""
    conversations: list[ConversationListItem] | None = None
    messages: list[ChatMessage] | None = None
