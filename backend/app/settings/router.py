"""Settings router — per-user LLM configuration endpoints."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.auth.models import User
from app.settings.schemas import (
    UserSettingsResponse,
    UpdateSettingsRequest,
    TestLlmRequest,
    TestLlmResponse,
)
from app.settings.service import get_settings, update_settings, test_llm_connection

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("", response_model=UserSettingsResponse)
def get_user_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the current user's model configuration."""
    return get_settings(db, str(current_user.id))


@router.put("", response_model=UserSettingsResponse)
def update_user_settings(
    req: UpdateSettingsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update the current user's model configuration."""
    update_data = req.model_dump(exclude_unset=True)
    return update_settings(db, str(current_user.id), update_data)


@router.post("/test-llm", response_model=TestLlmResponse)
def test_llm_config(
    req: TestLlmRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Test an LLM connection with the provided or stored config.

    If api_key is empty, uses the stored key from the database.
    For config_type='mentor', falls back to assessment config for unset fields.
    """
    return test_llm_connection(
        db,
        str(current_user.id),
        config_type=req.config_type,
        provider=req.provider,
        api_key=req.api_key,
        base_url=req.base_url,
        model=req.model,
    )
