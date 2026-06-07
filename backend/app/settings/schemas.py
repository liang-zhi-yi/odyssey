"""Settings schemas — unified LLM configuration with optional path override."""
from pydantic import BaseModel


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
