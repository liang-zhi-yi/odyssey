"""Settings router — per-user LLM configuration endpoints."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.auth.models import User
from app.settings.schemas import UserSettingsResponse, UpdateSettingsRequest
from app.settings.service import get_settings, update_settings

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
