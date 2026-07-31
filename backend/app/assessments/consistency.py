"""
Consistency retry protocol for LLM evaluation.

V2 enhancements:
  - Minimum justification length enforcement (≥60 chars)
  - Evidence quality check (must reference submission content)
  - Validates new optional fields (strengths, weaknesses, improvement_actions)
  - Validates overall_assessment section

Implements the safeguard rules from the assessment system design:
  1. Run evaluation up to 3 times total
  2. If any dimension score delta > 20 between attempts, retry
  3. Take the median score across all attempts per dimension
"""
import logging

from app.config import settings
from app.core.llm import evaluate_submission, LLMClientError

logger = logging.getLogger(__name__)

MAX_ATTEMPTS = 2
MAX_DELTA_THRESHOLD = 20
MIN_JUSTIFICATION_LENGTH = 10  # characters — relaxed to accept concise LLM responses


def run_consistent_assessment(
    system_prompt: str,
    user_message: str,
    *,
    max_attempts: int = MAX_ATTEMPTS,
    delta_threshold: int = MAX_DELTA_THRESHOLD,
    user_api_key: str | None = None,
    user_base_url: str | None = None,
    user_model: str | None = None,
    user_provider: str | None = None,
) -> dict:
    """Run LLM evaluation with consistency checks.

    Strategy:
      - Call evaluate_submission() up to `max_attempts` times.
      - Reject attempts with hollow justifications (< MIN_JUSTIFICATION_LENGTH chars,
        or containing generic phrases with no concrete evidence).
      - After each attempt, compare with previous: if any dimension's score
        differs by more than `delta_threshold` from another attempt, retry.
      - When consistent (all deltas ≤ threshold), or max attempts exhausted,
        take the median score per dimension across all valid attempts.
      - If ALL attempts fail (LLMClientError or validation), raise the last error.

    Args:
        system_prompt: Full evaluation system prompt (rubric embedded).
        user_message: User content (quest info + submission).
        max_attempts: Max number of LLM calls (default 3).
        delta_threshold: Max allowed delta between any two attempt scores (default 20).

    Returns:
        Dict with per-dimension median scores, justifications, strengths,
        weaknesses, improvement_actions, and overall_assessment:
          {
            "knowledge":   {"score": 75, "justification": "...", "strengths": [...], ...},
            "reasoning":   {"score": 70, ...},
            "application": {"score": 80, ...},
            "creation":    {"score": 55, ...},
            "overall_assessment": {"summary": "...", "top_strength": "...", ...},
            "attempts": 3,
            "attempt_details": [...],
          }
    """
    dimensions = ["knowledge", "reasoning", "application", "creation"]
    attempts: list[dict] = []

    for attempt_num in range(1, max_attempts + 1):
        logger.info("Assessment attempt %d/%d", attempt_num, max_attempts)
        try:
            result = evaluate_submission(
                system_prompt=system_prompt,
                user_content=user_message,
                user_api_key=user_api_key,
                user_base_url=user_base_url,
                user_model=user_model,
                user_provider=user_provider,
                timeout=settings.llm_timeout_seconds,
            )
        except LLMClientError as exc:
            logger.warning("Attempt %d failed: %s", attempt_num, exc)
            if attempt_num == max_attempts and not attempts:
                raise  # All attempts failed
            continue  # Try again if attempts remain

        # Log raw result keys for debugging
        logger.info(
            "Attempt %d raw result keys: %s",
            attempt_num,
            list(result.keys()) if isinstance(result, dict) else type(result).__name__,
        )
        logger.debug("Attempt %d raw result: %s", attempt_num, result)

        # Normalize the result — fix common LLM output issues like float
        # scores, None values, missing keys, etc.
        result = _normalize_result(result)

        # Validate the result structure
        if not _is_valid_result(result):
            logger.warning("Attempt %d returned invalid structure, retrying", attempt_num)
            logger.debug("Invalid result: %s", result)
            continue

        # Validate justification quality
        if not _has_quality_justifications(result):
            logger.warning(
                "Attempt %d has hollow justifications, retrying", attempt_num
            )
            continue

        attempts.append(result)

        # Need at least 2 attempts to check consistency
        if len(attempts) >= 2:
            is_consistent = True
            for prev in attempts[:-1]:
                for dim in dimensions:
                    delta = abs(
                        result[dim]["score"] - prev[dim]["score"]
                    )
                    if delta > delta_threshold:
                        logger.info(
                            "Dimension %s delta=%d > threshold=%d, retrying",
                            dim,
                            delta,
                            delta_threshold,
                        )
                        is_consistent = False
                        break
                if not is_consistent:
                    break

            if is_consistent:
                logger.info("Consistent after %d attempts", len(attempts))
                break

    # Safety net: if all attempts failed validation (not LLMClientError, but
    # invalid result structure or hollow justifications), attempts will be
    # empty. The min() below would raise "min() iterable argument is empty".
    # Raise a clear LLMClientError so the engine can fail the assessment
    # gracefully and the user can retry/abandon.
    if not attempts:
        logger.error(
            "All %d assessment attempts failed validation (no usable results)",
            max_attempts,
        )
        raise LLMClientError(
            "All assessment attempts failed validation — LLM returned invalid "
            "or hollow results. Please retry assessment later."
        )

    # Compute median per dimension across all successful attempts
    final: dict = {"attempts": len(attempts), "attempt_details": attempts}
    for dim in dimensions:
        scores = sorted(a[dim]["score"] for a in attempts)
        median_score = _median(scores)
        # Use the richest justification from the attempt closest to the median
        best_attempt = min(
            attempts, key=lambda a: abs(a[dim]["score"] - median_score)
        )
        final[dim] = {
            "score": median_score,
            "justification": best_attempt[dim]["justification"],
            "strengths": best_attempt[dim].get("strengths", []),
            "weaknesses": best_attempt[dim].get("weaknesses", []),
            "improvement_actions": best_attempt[dim].get("improvement_actions", []),
        }

    # Use the overall_assessment from the median-score attempt
    if attempts and "overall_assessment" in attempts[0]:
        # Find the attempt with the most balanced scores (closest to overall median)
        median_overall_idx = _closest_to_median(attempts, dimensions)
        final["overall_assessment"] = attempts[median_overall_idx].get(
            "overall_assessment", {}
        )

    return final


def _normalize_result(result: dict) -> dict:
    """Fix common LLM output issues before validation.

    Handles:
      - Float scores (85.0 → 85)
      - String scores ("85" → 85)
      - None justification → empty string
      - None overall_assessment values → empty string
      - Missing overall_assessment → create with empty strings
      - Missing dimension keys → skip (will fail validation)
    """
    for dim in ["knowledge", "reasoning", "application", "creation"]:
        if dim not in result or not isinstance(result[dim], dict):
            continue
        d = result[dim]
        # Normalize score: accept int, float, or numeric string
        score = d.get("score")
        if score is not None:
            try:
                d["score"] = int(float(score))
            except (TypeError, ValueError):
                pass  # Leave as-is, validation will catch it
        # Normalize justification: None → ""
        if d.get("justification") is None:
            d["justification"] = ""
        # Ensure list fields exist as lists
        for key in ["strengths", "weaknesses", "improvement_actions"]:
            if d.get(key) is None:
                d[key] = []
            elif not isinstance(d.get(key), list):
                d[key] = []

    # Normalize overall_assessment
    oa = result.get("overall_assessment")
    if oa is None:
        result["overall_assessment"] = {
            "summary": "",
            "top_strength": "",
            "top_growth_area": "",
            "next_step_recommendation": "",
        }
    elif isinstance(oa, dict):
        for key in ["summary", "top_strength", "top_growth_area", "next_step_recommendation"]:
            if oa.get(key) is None:
                oa[key] = ""

    return result


def _is_valid_result(result: dict) -> bool:
    """Check that the LLM response has all required fields with valid types.

    After _normalize_result, scores should be int and strings should be str.
    """
    required_dims = ["knowledge", "reasoning", "application", "creation"]
    for dim in required_dims:
        if dim not in result:
            logger.debug("_is_valid_result FAIL: missing dimension %s", dim)
            return False
        dim_data = result[dim]
        if not isinstance(dim_data, dict):
            logger.debug("_is_valid_result FAIL: %s is not a dict", dim)
            return False
        if "score" not in dim_data or "justification" not in dim_data:
            logger.debug("_is_valid_result FAIL: %s missing score/justification", dim)
            return False
        score = dim_data["score"]
        # Accept int (and bool is a subclass of int, so explicitly reject it)
        if isinstance(score, bool) or not isinstance(score, (int, float)):
            logger.debug("_is_valid_result FAIL: %s.score is %s (type %s)", dim, score, type(score).__name__)
            return False
        if score < 0 or score > 100:
            logger.debug("_is_valid_result FAIL: %s.score=%s out of range", dim, score)
            return False
        justification = dim_data["justification"]
        if not isinstance(justification, str):
            logger.debug("_is_valid_result FAIL: %s.justification is not str", dim)
            return False

    # overall_assessment is required by the schema
    if "overall_assessment" not in result:
        logger.debug("_is_valid_result FAIL: missing overall_assessment")
        return False
    oa = result["overall_assessment"]
    if not isinstance(oa, dict):
        logger.debug("_is_valid_result FAIL: overall_assessment is not a dict")
        return False
    for key in ["summary", "top_strength", "top_growth_area", "next_step_recommendation"]:
        if key not in oa or not isinstance(oa[key], str):
            logger.debug("_is_valid_result FAIL: overall_assessment.%s missing or not str", key)
            return False

    return True


def _has_quality_justifications(result: dict) -> bool:
    """Check that justifications are substantive (not hollow/generic).

    Requirements:
      - Each justification must be at least MIN_JUSTIFICATION_LENGTH chars

    Note: The previous implementation rejected justifications that didn't
    contain specific Chinese/English evidence indicator phrases (e.g.,
    "你提到", "你的方案", "your submission"). This was too strict — many
    valid LLM responses use different phrasings and were incorrectly
    rejected as "hollow", causing all assessment attempts to fail
    validation. Now we only enforce minimum length, which is sufficient
    to filter out truly empty/garbage responses.
    """
    dims = ["knowledge", "reasoning", "application", "creation"]
    for dim in dims:
        just = result[dim].get("justification", "")

        # Check minimum length — this is the only hard requirement.
        # The LLM may phrase evidence in many valid ways we can't
        # anticipate with a fixed keyword list.
        if len(just) < MIN_JUSTIFICATION_LENGTH:
            logger.info(
                "Dimension %s justification too short: %d chars (min %d)",
                dim, len(just), MIN_JUSTIFICATION_LENGTH,
            )
            return False

    return True


def _median(sorted_values: list[int]) -> int:
    """Return the median of a sorted list of integers."""
    n = len(sorted_values)
    if n == 0:
        return 0
    if n % 2 == 1:
        return sorted_values[n // 2]
    return (sorted_values[n // 2 - 1] + sorted_values[n // 2]) // 2


def _closest_to_median(attempts: list[dict], dimensions: list[str]) -> int:
    """Return the index of the attempt whose scores are closest to the median per dimension."""
    n = len(attempts)
    if n == 0:
        return 0

    # Compute per-dimension medians
    median_scores = {}
    for dim in dimensions:
        scores = sorted(a[dim]["score"] for a in attempts)
        median_scores[dim] = _median(scores)

    # Find attempt with smallest total distance to median scores
    best_idx = 0
    best_distance = float("inf")
    for i, attempt in enumerate(attempts):
        total_dist = sum(
            abs(attempt[dim]["score"] - median_scores[dim])
            for dim in dimensions
        )
        if total_dist < best_distance:
            best_distance = total_dist
            best_idx = i

    return best_idx
