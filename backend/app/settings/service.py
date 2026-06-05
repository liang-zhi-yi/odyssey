"""Settings service — per-user LLM configuration."""
from sqlalchemy.orm import Session

from app.settings.models import UserSettings
from app.core.providers import PROVIDERS
from app.core.exceptions import ValidationException


def _mask_api_key(key: str | None) -> str | None:
    """Mask an API key, showing only the last 4 characters."""
    if not key:
        return None
    if len(key) <= 4:
        return "****"
    return f"{key[:3]}...{key[-4:]}"


def get_settings(db: Session, user_id: str) -> dict:
    """Get the user's model configuration, creating a default row if needed."""
    settings = (
        db.query(UserSettings)
        .filter(UserSettings.user_id == user_id)
        .first()
    )
    if settings is None:
        settings = UserSettings(user_id=user_id)
        db.add(settings)
        db.commit()
        db.refresh(settings)

    return {
        "llm_provider": settings.llm_provider,
        "llm_api_key_masked": _mask_api_key(settings.llm_api_key),
        "llm_base_url": settings.llm_base_url,
        "llm_model": settings.llm_model,
        "path_llm_provider": settings.path_llm_provider,
        "path_llm_api_key_masked": _mask_api_key(settings.path_llm_api_key),
        "path_llm_base_url": settings.path_llm_base_url,
        "path_llm_model": settings.path_llm_model,
    }


def update_settings(
    db: Session, user_id: str, data: dict
) -> dict:
    """Update the user's model configuration."""
    settings = (
        db.query(UserSettings)
        .filter(UserSettings.user_id == user_id)
        .first()
    )
    if settings is None:
        settings = UserSettings(user_id=user_id)
        db.add(settings)

    # Validate provider if provided
    if "llm_provider" in data and data["llm_provider"] is not None:
        provider_key = data["llm_provider"].strip().lower()
        if provider_key not in PROVIDERS:
            valid = ", ".join(PROVIDERS.keys())
            raise ValidationException(
                f"Unknown provider '{data['llm_provider']}'. "
                f"Valid options: {valid}"
            )
        settings.llm_provider = provider_key

    if "llm_api_key" in data and data["llm_api_key"] is not None:
        if data["llm_api_key"]:  # Only update if non-empty
            settings.llm_api_key = data["llm_api_key"]

    if "llm_base_url" in data:
        settings.llm_base_url = data["llm_base_url"] or None

    if "llm_model" in data:
        settings.llm_model = data["llm_model"] or None

    # Path LLM fields
    if "path_llm_provider" in data and data["path_llm_provider"] is not None:
        provider_key = data["path_llm_provider"].strip().lower()
        if provider_key not in PROVIDERS:
            valid = ", ".join(PROVIDERS.keys())
            raise ValidationException(
                f"Unknown provider '{data['path_llm_provider']}'. "
                f"Valid options: {valid}"
            )
        settings.path_llm_provider = provider_key

    if "path_llm_api_key" in data and data["path_llm_api_key"] is not None:
        if data["path_llm_api_key"]:
            settings.path_llm_api_key = data["path_llm_api_key"]

    if "path_llm_base_url" in data:
        settings.path_llm_base_url = data["path_llm_base_url"] or None

    if "path_llm_model" in data:
        settings.path_llm_model = data["path_llm_model"] or None

    db.commit()
    db.refresh(settings)

    return {
        "llm_provider": settings.llm_provider,
        "llm_api_key_masked": _mask_api_key(settings.llm_api_key),
        "llm_base_url": settings.llm_base_url,
        "llm_model": settings.llm_model,
        "path_llm_provider": settings.path_llm_provider,
        "path_llm_api_key_masked": _mask_api_key(settings.path_llm_api_key),
        "path_llm_base_url": settings.path_llm_base_url,
        "path_llm_model": settings.path_llm_model,
    }
