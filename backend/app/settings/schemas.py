"""Settings schemas — per-user LLM configuration."""
from pydantic import BaseModel


class UserSettingsResponse(BaseModel):
    """User's model configuration (API key masked for security)."""
    llm_provider: str | None = None
    llm_api_key_masked: str | None = None  # e.g. "sk-...abcd"
    llm_base_url: str | None = None
    llm_model: str | None = None

    model_config = {"from_attributes": True}


class UpdateSettingsRequest(BaseModel):
    """Update user's model configuration. All fields optional."""
    llm_provider: str | None = None
    llm_api_key: str | None = None  # plaintext input, stored as-is
    llm_base_url: str | None = None
    llm_model: str | None = None
