"""
Agent router — thin FastAPI routes for the Odyssey AI growth companion.

Endpoints (all protected with get_current_user):
  POST /agent/chat      — send a message, get agent response + optional cards
  GET  /agent/history   — list conversations or get messages for one
  GET  /agent/greeting  — context-aware welcome message
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.agent.schemas import (
    ChatRequest,
    ChatResponse,
    HistoryResponse,
)
from app.agent.service import (
    generate_response,
    list_user_conversations,
    get_conversation_messages,
    generate_greeting,
)
from app.auth.models import User
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter(tags=["agent"])


@router.post("/agent/chat", response_model=ChatResponse)
def chat(
    body: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ChatResponse:
    """Send a message to the Odyssey Agent and get a response.

    The agent analyzes your skills, progress, world state, quests, and
    learning paths to provide personalized, data-driven answers.
    Supports multi-turn conversations via conversation_id.
    """
    return generate_response(
        db=db,
        user=current_user,
        message=body.message,
        conversation_id=body.conversation_id,
    )


@router.get("/agent/history", response_model=HistoryResponse)
def get_history(
    conversation_id: str | None = Query(None, description="Get messages for a specific conversation"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> HistoryResponse:
    """Get conversation history.

    Without conversation_id: returns list of all conversations.
    With conversation_id: returns messages for that conversation.
    """
    user_id = str(current_user.id)

    if conversation_id:
        messages = get_conversation_messages(db, user_id, conversation_id)
        return HistoryResponse(messages=messages)

    conversations = list_user_conversations(db, user_id)
    return HistoryResponse(conversations=conversations)


@router.get("/agent/greeting", response_model=ChatResponse)
def greeting(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ChatResponse:
    """Get a context-aware greeting from the agent.

    The greeting includes time-of-day awareness and mentions
    near-upgrade buildings, active quests, and recent activity.
    """
    return generate_greeting(db=db, user=current_user)
