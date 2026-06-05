"""
LLM client for the Odyssey assessment engine.

Supports multiple LLM providers via OpenAI-compatible APIs:
  - OpenAI (native structured output)
  - DeepSeek, Bailian (Qwen), Zhipu (GLM), Moonshot (Kimi)
  - OpenRouter (multi-provider proxy)
  - Custom OpenAI-compatible endpoints

Response format strategy (auto-selected per provider):
  1. json_schema (strict) — OpenAI native, most reliable
  2. json_object          — widely supported fallback
  3. plain-text + JSON extraction — last resort for non-OpenAI APIs

Architecture:
  config.py  →  providers.py  →  llm.py  →  assessment engine
  (env vars)    (presets)        (client)    (evaluate_submission)
"""
import json
import logging
import re

from openai import OpenAI

from app.config import settings
from app.core.providers import (
    resolve_provider,
    get_effective_base_url,
    get_effective_model,
)

logger = logging.getLogger(__name__)

# ── JSON instruction injected for providers without json_schema ─────────

_JSON_INSTRUCTION = (
    "\n\n---\n\n"
    "## ⚠️ 输出要求\n\n"
    "你必须**只输出一个合法的 JSON 对象**，不能包含任何其他文字、注释、"
    "Markdown 代码块标记（如 ```json```）或解释。\n"
    "直接以 `{` 开始，以 `}` 结束。"
)

# Regex to find a JSON object when the model wraps it in text
_JSON_BLOCK_RE = re.compile(r"\{[\s\S]*\}")


class LLMClientError(Exception):
    """Raised when the LLM call fails (timeout, API error, invalid JSON, etc.)."""


# ── Scoring output schema (reused across all provider modes) ────────────

_SCORING_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "knowledge": {
            "type": "object",
            "properties": {
                "score": {"type": "integer", "minimum": 0, "maximum": 100},
                "justification": {"type": "string"},
            },
            "required": ["score", "justification"],
            "additionalProperties": False,
        },
        "reasoning": {
            "type": "object",
            "properties": {
                "score": {"type": "integer", "minimum": 0, "maximum": 100},
                "justification": {"type": "string"},
            },
            "required": ["score", "justification"],
            "additionalProperties": False,
        },
        "application": {
            "type": "object",
            "properties": {
                "score": {"type": "integer", "minimum": 0, "maximum": 100},
                "justification": {"type": "string"},
            },
            "required": ["score", "justification"],
            "additionalProperties": False,
        },
        "creation": {
            "type": "object",
            "properties": {
                "score": {"type": "integer", "minimum": 0, "maximum": 100},
                "justification": {"type": "string"},
            },
            "required": ["score", "justification"],
            "additionalProperties": False,
        },
    },
    "required": ["knowledge", "reasoning", "application", "creation"],
    "additionalProperties": False,
}


# ── Client factory ──────────────────────────────────────────────────────


def _get_client() -> OpenAI:
    """Create an OpenAI client configured for the current provider.

    Uses the effective base URL (provider preset or LLM_BASE_URL override).
    Raises LLMClientError if LLM_API_KEY is not set.
    """
    if not settings.llm_api_key:
        raise LLMClientError(
            "LLM_API_KEY is not configured. Set it in backend/.env or as an "
            "environment variable. Get a key from your chosen provider "
            f"(LLM_PROVIDER={settings.llm_provider})."
        )

    kwargs: dict = {"api_key": settings.llm_api_key}

    base_url = get_effective_base_url(settings.llm_provider, settings.llm_base_url)
    if base_url:
        kwargs["base_url"] = base_url

    return OpenAI(**kwargs)


def _check_provider_compatibility(provider_key: str | None = None) -> None:
    """Raise LLMClientError if the selected provider is not OpenAI-compatible.

    Currently only Anthropic's native API is flagged as incompatible.
    The error message includes actionable advice (use OpenRouter instead).
    """
    effective_provider = provider_key or settings.llm_provider
    provider = resolve_provider(effective_provider)
    if not provider.is_openai_compatible:
        raise LLMClientError(
            f"Provider '{provider.name}' ({effective_provider}) is NOT "
            f"OpenAI-compatible and cannot be used directly.\n\n"
            f"To use Claude models, set LLM_PROVIDER=openrouter and "
            f"LLM_MODEL=anthropic/claude-sonnet-4-6 (or another Claude model).\n"
            f"Get a key at https://openrouter.ai/keys\n\n"
            f"Alternatively, use a LiteLLM proxy or any OpenAI-compatible "
            f"endpoint that wraps Claude."
        )


# ── Main evaluation entry point ─────────────────────────────────────────


def evaluate_submission(
    system_prompt: str,
    user_content: str,
    *,
    model: str | None = None,
    temperature: float | None = None,
    timeout: int | None = None,
    # Per-user overrides for model configuration
    user_api_key: str | None = None,
    user_base_url: str | None = None,
    user_model: str | None = None,
    user_provider: str | None = None,
    # When True, skip json_schema strict mode even if the provider supports it.
    # Use json_object mode instead — for non-assessment outputs (path generation, etc.).
    force_json_object: bool = False,
    # Optional custom JSON schema for structured output (only used when not force_json_object).
    # When None, defaults to the assessment scoring schema.
    output_json_schema: dict | None = None,
    output_schema_name: str = "assessment_output",
) -> dict:
    """Call the LLM for assessment with structured JSON output.

    Automatically adapts the response_format based on provider capabilities:
      - OpenAI  → json_schema (strict) ← most reliable
      - DeepSeek / Bailian / Zhipu / Moonshot → json_object
      - Custom   → json_object (with JSON instruction injection)

    The default response schema requires:
      {
        "knowledge":   { "score": 0-100, "justification": "..." },
        "reasoning":   { "score": 0-100, "justification": "..." },
        "application": { "score": 0-100, "justification": "..." },
        "creation":    { "score": 0-100, "justification": "..." }
      }

    Set force_json_object=True to skip the schema enforcement (path generation, etc.).
    Set output_json_schema to override the default assessment schema.

    Returns the parsed dict on success.
    Raises LLMClientError on any failure (timeout, API error, invalid JSON).
    """
    # Determine effective provider
    effective_provider_key = user_provider or settings.llm_provider
    _check_provider_compatibility(effective_provider_key)

    provider = resolve_provider(effective_provider_key)

    # Determine effective API key
    effective_api_key = user_api_key or settings.llm_api_key
    if not effective_api_key:
        raise LLMClientError(
            "LLM_API_KEY is not configured. Set it in backend/.env or as an "
            "environment variable. Get a key from your chosen provider "
            f"(LLM_PROVIDER={effective_provider_key})."
        )

    # Determine effective base URL
    if user_base_url:
        effective_base_url = user_base_url.strip().rstrip("/")
    else:
        effective_base_url = get_effective_base_url(effective_provider_key, settings.llm_base_url)

    # Determine effective model
    if user_model:
        effective_model = user_model.strip()
    else:
        effective_model = model or get_effective_model(effective_provider_key, settings.llm_model)

    used_temperature = (
        temperature if temperature is not None else settings.llm_temperature
    )
    used_timeout = timeout or settings.llm_timeout_seconds

    # Create client with effective values
    client_kwargs: dict = {"api_key": effective_api_key}
    if effective_base_url:
        client_kwargs["base_url"] = effective_base_url
    client = OpenAI(**client_kwargs)

    # Build messages — inject JSON instruction when json_object is used
    effective_system = system_prompt
    use_json_schema = provider.supports_json_schema and not force_json_object
    use_json_object = provider.supports_json_object and not use_json_schema
    if use_json_object and not provider.supports_json_schema:
        effective_system = system_prompt + _JSON_INSTRUCTION

    messages = [
        {"role": "system", "content": effective_system},
        {"role": "user", "content": user_content},
    ]

    # Build create() kwargs with appropriate response_format
    create_kwargs: dict = {
        "model": effective_model,
        "temperature": used_temperature,
        "timeout": used_timeout,
        "messages": messages,
    }

    if use_json_schema:
        schema = output_json_schema or _SCORING_JSON_SCHEMA
        create_kwargs["response_format"] = {
            "type": "json_schema",
            "json_schema": {
                "name": output_schema_name,
                "strict": True,
                "schema": schema,
            },
        }
    elif use_json_object:
        create_kwargs["response_format"] = {"type": "json_object"}

    logger.info(
        "Calling LLM — provider=%s model=%s temperature=%s timeout=%ds "
        "base_url=%s json_mode=%s",
        effective_provider_key,
        effective_model,
        used_temperature,
        used_timeout,
        effective_base_url or "(default)",
        "json_schema" if provider.supports_json_schema else (
            "json_object" if provider.supports_json_object else "text"
        ),
    )

    try:
        response = client.chat.completions.create(**create_kwargs)
    except Exception as exc:
        logger.error("LLM call failed: %s", exc)
        raise LLMClientError(
            f"LLM API call failed for provider '{effective_provider_key}': {exc}"
        ) from exc

    content = response.choices[0].message.content
    if content is None:
        raise LLMClientError("LLM returned empty response")

    # Parse JSON — with fallback extraction for non-schema modes
    result = _parse_json_response(content, provider_key=effective_provider_key)

    logger.info(
        "LLM returned valid assessment — provider=%s model=%s",
        effective_provider_key,
        effective_model,
    )
    return result


# ── JSON parsing helpers ─────────────────────────────────────────────────


def _parse_json_response(content: str, *, provider_key: str | None = None) -> dict:
    """Parse JSON from LLM response, with progressive fallback.

    1. Direct parse (works for json_schema / json_object modes)
    2. Strip Markdown code fences and retry
    3. Regex extraction of first JSON object
    """
    # Attempt 1: direct parse
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        pass

    # Attempt 2: strip ```json ... ``` fences
    stripped = content.strip()
    if stripped.startswith("```"):
        # Remove opening fence line
        stripped = re.sub(r"^```\w*\s*", "", stripped)
        # Remove closing fence
        stripped = re.sub(r"\s*```$", "", stripped)
        try:
            return json.loads(stripped.strip())
        except json.JSONDecodeError:
            pass

    # Attempt 3: regex — find the first { ... } block
    match = _JSON_BLOCK_RE.search(content)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass

    # All attempts failed
    raise LLMClientError(
        f"LLM response could not be parsed as JSON. "
        f"Provider: {provider_key or settings.llm_provider}. "
        f"Raw response (first 500 chars): {content[:500]}"
    )
