"""Settings service — unified LLM configuration with optional path override."""
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
        "use_path_llm_override": settings.use_path_llm_override,
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

    # ── Primary LLM config (shared by Agent + Path by default) ──
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

    # ── Path override toggle ──
    if "use_path_llm_override" in data and data["use_path_llm_override"] is not None:
        settings.use_path_llm_override = data["use_path_llm_override"]

    # ── Path LLM override config (only used when use_path_llm_override=True) ──
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
        "use_path_llm_override": settings.use_path_llm_override,
        "path_llm_provider": settings.path_llm_provider,
        "path_llm_api_key_masked": _mask_api_key(settings.path_llm_api_key),
        "path_llm_base_url": settings.path_llm_base_url,
        "path_llm_model": settings.path_llm_model,
    }


def get_effective_llm_config(db: Session, user_id: str, *, for_path: bool = False) -> dict:
    """Get the effective LLM config for Agent chat or Path generation.

    If for_path=True and use_path_llm_override=True, returns path-specific config.
    Otherwise returns the primary shared config.
    """
    settings = (
        db.query(UserSettings)
        .filter(UserSettings.user_id == user_id)
        .first()
    )

    if not settings:
        return {}

    # If Path generation and override is enabled, use path-specific config
    if for_path and settings.use_path_llm_override:
        return {
            "provider": settings.path_llm_provider or settings.llm_provider,
            "api_key": settings.path_llm_api_key or settings.llm_api_key,
            "base_url": settings.path_llm_base_url or settings.llm_base_url,
            "model": settings.path_llm_model or settings.llm_model,
        }

    # Default: shared primary config
    return {
        "provider": settings.llm_provider,
        "api_key": settings.llm_api_key,
        "base_url": settings.llm_base_url,
        "model": settings.llm_model,
    }
