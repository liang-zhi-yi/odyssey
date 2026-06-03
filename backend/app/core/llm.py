"""
LLM client for the Odyssey assessment engine.

Wraps the OpenAI SDK with structured JSON output enforcement,
consistent temperature=0, and configurable timeout.
"""
import json
import logging

from openai import OpenAI

from app.config import settings

logger = logging.getLogger(__name__)


class LLMClientError(Exception):
    """Raised when the LLM call fails (timeout, API error, etc.)."""


def _get_client() -> OpenAI:
    """Create an OpenAI client (lazy — doesn't require API key at import time)."""
    if not settings.llm_api_key:
        raise LLMClientError(
            "LLM_API_KEY is not configured. Set it in .env or environment."
        )
    return OpenAI(api_key=settings.llm_api_key)


def evaluate_submission(
    system_prompt: str,
    user_content: str,
    *,
    model: str | None = None,
    temperature: float | None = None,
    timeout: int | None = None,
) -> dict:
    """Call the LLM for assessment with structured JSON output.

    The response MUST conform to the LLMScoreOutput schema:
      {
        "knowledge":           { "score": 0-100, "justification": "..." },
        "reasoning":           { "score": 0-100, "justification": "..." },
        "application":         { "score": 0-100, "justification": "..." },
        "creation":            { "score": 0-100, "justification": "..." }
      }

    Returns the parsed dict on success.
    Raises LLMClientError on any failure (timeout, API error, invalid JSON).
    """
    client = _get_client()
    used_model = model or settings.llm_model
    used_temperature = temperature if temperature is not None else settings.llm_temperature
    used_timeout = timeout or settings.llm_timeout_seconds

    logger.info(
        "Calling LLM — model=%s, temperature=%s, timeout=%ds",
        used_model,
        used_temperature,
        used_timeout,
    )

    try:
        response = client.chat.completions.create(
            model=used_model,
            temperature=used_temperature,
            timeout=used_timeout,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "assessment_output",
                    "strict": True,
                    "schema": {
                        "type": "object",
                        "properties": {
                            "knowledge": {
                                "type": "object",
                                "properties": {
                                    "score": {
                                        "type": "integer",
                                        "minimum": 0,
                                        "maximum": 100,
                                    },
                                    "justification": {"type": "string"},
                                },
                                "required": ["score", "justification"],
                                "additionalProperties": False,
                            },
                            "reasoning": {
                                "type": "object",
                                "properties": {
                                    "score": {
                                        "type": "integer",
                                        "minimum": 0,
                                        "maximum": 100,
                                    },
                                    "justification": {"type": "string"},
                                },
                                "required": ["score", "justification"],
                                "additionalProperties": False,
                            },
                            "application": {
                                "type": "object",
                                "properties": {
                                    "score": {
                                        "type": "integer",
                                        "minimum": 0,
                                        "maximum": 100,
                                    },
                                    "justification": {"type": "string"},
                                },
                                "required": ["score", "justification"],
                                "additionalProperties": False,
                            },
                            "creation": {
                                "type": "object",
                                "properties": {
                                    "score": {
                                        "type": "integer",
                                        "minimum": 0,
                                        "maximum": 100,
                                    },
                                    "justification": {"type": "string"},
                                },
                                "required": ["score", "justification"],
                                "additionalProperties": False,
                            },
                        },
                        "required": [
                            "knowledge",
                            "reasoning",
                            "application",
                            "creation",
                        ],
                        "additionalProperties": False,
                    },
                },
            },
        )

        content = response.choices[0].message.content
        if content is None:
            raise LLMClientError("LLM returned empty response")

        result = json.loads(content)
        logger.info("LLM returned valid assessment: %s", result)
        return result

    except LLMClientError:
        raise
    except Exception as exc:
        logger.error("LLM call failed: %s", exc)
        raise LLMClientError(str(exc)) from exc
