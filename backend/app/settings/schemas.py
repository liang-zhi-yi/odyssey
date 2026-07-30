"""Settings schemas — unified LLM configuration with optional path override."""
from pydantic import BaseModel, Field


class UserSettingsResponse(BaseModel):
    """User's model configuration (API key masked for security).

    Primary LLM config is shared by Agent chat AND Path generation by default.
    Set use_path_llm_override=True to use separate path_llm_* config for paths.
    """
    llm_provider: str | None = None
    llm_api_key_masked: str | None = None  # e.g. "sk-...abcd"
    llm_base_url: str | None = None
    llm_model: str | None = None
    # Path generation — only used when use_path_llm_override=True
    use_path_llm_override: bool = False
    path_llm_provider: str | None = None
    path_llm_api_key_masked: str | None = None
    path_llm_base_url: str | None = None
    path_llm_model: str | None = None

    model_config = {"from_attributes": True}


class UpdateSettingsRequest(BaseModel):
    """Update user's model configuration. All fields optional."""
    llm_provider: str | None = None
    llm_api_key: str | None = None  # plaintext input, stored as-is
    llm_base_url: str | None = None
    llm_model: str | None = None
    # Path generation override toggle
    use_path_llm_override: bool | None = None
    # Path generation LLM (only used when use_path_llm_override=True)
    path_llm_provider: str | None = None
    path_llm_api_key: str | None = None
    path_llm_base_url: str | None = None
    path_llm_model: str | None = None


class TestLlmRequest(BaseModel):
    """Request to test an LLM connection.

    If api_key is empty, the backend uses the stored key from the database.
    This lets users test the saved config without re-entering the key.
    """
    config_type: str = Field(
        "assessment",
        description="Which config to test: 'assessment' (primary llm_*) or 'mentor' (path_llm_*)",
    )
    provider: str | None = None
    api_key: str | None = None  # empty → use stored key
    base_url: str | None = None
    model: str | None = None


class TestLlmResponse(BaseModel):
    """Result of an LLM connection test."""
    success: bool
    message: str
    error_type: str | None = None  # auth, not_found, connection, timeout, config, unknown
    suggestions: list[str] = []
    latency_ms: int | None = None
