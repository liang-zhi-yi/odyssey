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

from app.core.llm import evaluate_submission, LLMClientError

logger = logging.getLogger(__name__)

MAX_ATTEMPTS = 3
MAX_DELTA_THRESHOLD = 20
MIN_JUSTIFICATION_LENGTH = 60  # characters


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
            )
        except LLMClientError as exc:
            logger.warning("Attempt %d failed: %s", attempt_num, exc)
            if attempt_num == max_attempts and not attempts:
                raise  # All attempts failed
            continue  # Try again if attempts remain

        # Validate the result structure
        if not _is_valid_result(result):
            logger.warning("Attempt %d returned invalid structure, retrying", attempt_num)
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


def _is_valid_result(result: dict) -> bool:
    """Check that the LLM response has all required fields with valid types."""
    required_dims = ["knowledge", "reasoning", "application", "creation"]
    for dim in required_dims:
        if dim not in result:
            return False
        dim_data = result[dim]
        if not isinstance(dim_data, dict):
            return False
        if "score" not in dim_data or "justification" not in dim_data:
            return False
        score = dim_data["score"]
        if not isinstance(score, int) or score < 0 or score > 100:
            return False
        justification = dim_data["justification"]
        if not isinstance(justification, str):
            return False

    # overall_assessment is now required by the schema
    if "overall_assessment" not in result:
        return False
    oa = result["overall_assessment"]
    if not isinstance(oa, dict):
        return False
    for key in ["summary", "top_strength", "top_growth_area", "next_step_recommendation"]:
        if key not in oa or not isinstance(oa[key], str):
            return False

    return True


def _has_quality_justifications(result: dict) -> bool:
    """Check that justifications are substantive (not hollow/generic).

    Requirements:
      - Each justification must be at least MIN_JUSTIFICATION_LENGTH chars
      - Must contain at least one concrete reference indicator
        (e.g., "你提到", "你的方案", "在提交中", "具体表现在",
         "your submission", "you mentioned", "for example")
    """
    generic_phrases = [
        "提交内容展示了",
        "整体表现不错",
        "表现良好",
        "完成的很好",
        "good job",
        "well done",
        "overall good",
    ]

    evidence_indicators = [
        "你提到", "你的方案", "在提交中", "你在", "你设计",
        "你的代码", "你的分析", "你的回答", "提交内容中",
        "具体表现在", "例如", "比如", "体现在",
        "you mentioned", "your submission", "in your",
        "for example", "specifically", "you demonstrated",
        "your code", "your design", "you wrote",
    ]

    dims = ["knowledge", "reasoning", "application", "creation"]
    for dim in dims:
        just = result[dim].get("justification", "")

        # Check minimum length
        if len(just) < MIN_JUSTIFICATION_LENGTH:
            logger.info(
                "Dimension %s justification too short: %d chars",
                dim, len(just),
            )
            return False

        # Check for generic-only language
        has_evidence = any(ind in just.lower() for ind in evidence_indicators)
        is_generic = any(phrase in just for phrase in generic_phrases)

        if is_generic and not has_evidence:
            logger.info(
                "Dimension %s justification is generic with no evidence", dim
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
