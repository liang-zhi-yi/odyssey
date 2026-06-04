"""
LLM provider presets for the Odyssey assessment engine.

Each provider defines:
  - base_url: OpenAI-compatible API endpoint
  - default_model: recommended model for assessment
  - supports_json_schema: whether the provider supports OpenAI's strict
    structured output (response_format={"type": "json_schema", ...})
  - supports_json_object: whether the provider supports the simpler
    response_format={"type": "json_object"} mode
  - is_openai_compatible: whether the API accepts OpenAI-format requests
  - notes: human-readable notes for the README / settings UI

Users can select a preset via LLM_PROVIDER and optionally override
LLM_BASE_URL / LLM_MODEL in their .env file.
"""

from dataclasses import dataclass, field


@dataclass
class Provider:
    """Configuration preset for an LLM provider."""

    name: str
    base_url: str
    default_model: str
    supports_json_schema: bool = False
    supports_json_object: bool = True
    is_openai_compatible: bool = True
    notes: str = ""


# ── Preset registry ────────────────────────────────────────────────────
# fmt: off
PROVIDERS: dict[str, Provider] = {
    # ── OpenAI ──────────────────────────────────────────────────────
    "openai": Provider(
        name="OpenAI",
        base_url="https://api.openai.com/v1",
        default_model="gpt-4o",
        supports_json_schema=True,
        supports_json_object=True,
        notes="Official OpenAI API. Full structured output support.",
    ),

    # ── DeepSeek ────────────────────────────────────────────────────
    "deepseek": Provider(
        name="DeepSeek",
        base_url="https://api.deepseek.com/v1",
        default_model="deepseek-chat",
        supports_json_schema=False,
        supports_json_object=True,
        notes="DeepSeek V3/R1. Supports json_object mode. "
              "Get key at https://platform.deepseek.com",
    ),

    # ── Alibaba Bailian (Qwen) ──────────────────────────────────────
    "bailian": Provider(
        name="阿里百炼 (Bailian)",
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        default_model="qwen-plus",
        supports_json_schema=False,
        supports_json_object=True,
        notes="Alibaba Bailian platform. Qwen series models. "
              "Get key at https://bailian.console.aliyun.com",
    ),

    # ── Zhipu AI (GLM) ─────────────────────────────────────────────
    "zhipu": Provider(
        name="智谱AI (Zhipu)",
        base_url="https://open.bigmodel.cn/api/paas/v4",
        default_model="glm-4-flash",
        supports_json_schema=False,
        supports_json_object=True,
        notes="Zhipu AI GLM series. Get key at https://open.bigmodel.cn",
    ),

    # ── Moonshot (Kimi) ────────────────────────────────────────────
    "moonshot": Provider(
        name="月之暗面 (Moonshot)",
        base_url="https://api.moonshot.cn/v1",
        default_model="moonshot-v1-8k",
        supports_json_schema=False,
        supports_json_object=True,
        notes="Moonshot / Kimi. Get key at https://platform.moonshot.cn",
    ),

    # ── OpenRouter (multi-provider proxy) ─────────────────────────
    "openrouter": Provider(
        name="OpenRouter",
        base_url="https://openrouter.ai/api/v1",
        default_model="openai/gpt-4o",
        supports_json_schema=False,
        supports_json_object=True,
        notes="OpenRouter proxies OpenAI, Claude, Gemini & more. "
              "Get key at https://openrouter.ai/keys. "
              "Use LLM_MODEL to select a specific model (e.g. anthropic/claude-sonnet-4).",
    ),

    # ── Anthropic Claude (native API — NOT OpenAI-compatible) ──────
    "claude": Provider(
        name="Anthropic Claude",
        base_url="https://api.anthropic.com/v1",
        default_model="claude-sonnet-4-6",
        supports_json_schema=False,
        supports_json_object=False,
        is_openai_compatible=False,
        notes="⚠️ Anthropic native API is NOT OpenAI-compatible. "
              "Use OpenRouter or LiteLLM proxy to access Claude via OpenAI format. "
              "Or set LLM_PROVIDER=openrouter with LLM_MODEL=anthropic/claude-sonnet-4-6.",
    ),

    # ── Custom / self-hosted ───────────────────────────────────────
    "custom": Provider(
        name="Custom",
        base_url="",
        default_model="",
        supports_json_schema=False,
        supports_json_object=True,
        notes="Bring your own OpenAI-compatible endpoint. "
              "Set LLM_BASE_URL and LLM_MODEL in .env.",
    ),
}
# fmt: on


# ── Resolution helpers ──────────────────────────────────────────────────


def resolve_provider(provider_key: str | None = None) -> Provider:
    """Resolve a provider by key, falling back to 'custom' if unknown.

    Args:
        provider_key: The LLM_PROVIDER value from settings (e.g. "openai").

    Returns:
        The matching Provider preset, or a generated "custom" Provider
        if the key is not in the registry.
    """
    key = (provider_key or "openai").strip().lower()
    if key in PROVIDERS:
        return PROVIDERS[key]

    # Unknown provider — treat as custom
    return Provider(
        name=f"Custom ({provider_key})",
        base_url="",
        default_model="",
        supports_json_schema=False,
        supports_json_object=True,
        is_openai_compatible=True,
    )


def get_effective_base_url(provider_key: str | None = None, override_url: str = "") -> str:
    """Return the effective base URL: explicit override > provider default.

    Args:
        provider_key: The LLM_PROVIDER value from settings.
        override_url: Explicit LLM_BASE_URL from settings (may be empty).

    Returns:
        The resolved base URL string, or "" if neither source has one.
    """
    if override_url.strip():
        return override_url.strip().rstrip("/")
    provider = resolve_provider(provider_key)
    return provider.base_url.rstrip("/") if provider.base_url else ""


def get_effective_model(provider_key: str | None = None, override_model: str = "") -> str:
    """Return the effective model: explicit LLM_MODEL > provider default.

    Args:
        provider_key: The LLM_PROVIDER value from settings.
        override_model: Explicit LLM_MODEL from settings (may be empty).

    Returns:
        The resolved model name. Raises ValueError if neither source has one.
    """
    if override_model.strip():
        return override_model.strip()
    provider = resolve_provider(provider_key)
    if provider.default_model:
        return provider.default_model
    raise ValueError(
        "LLM_MODEL is not set and the chosen provider has no default model. "
        "Set LLM_MODEL in .env or choose a provider with a default model."
    )
