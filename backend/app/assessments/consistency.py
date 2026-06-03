"""
Consistency retry protocol for LLM evaluation.

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


def run_consistent_assessment(
    system_prompt: str,
    user_message: str,
    *,
    max_attempts: int = MAX_ATTEMPTS,
    delta_threshold: int = MAX_DELTA_THRESHOLD,
) -> dict:
    """Run LLM evaluation with consistency checks.

    Strategy:
      - Call evaluate_submission() up to `max_attempts` times.
      - After each attempt, compare with previous: if any dimension's score
        differs by more than `delta_threshold` from another attempt, retry.
      - When consistent (all deltas ≤ threshold), or max attempts exhausted,
        take the median score per dimension across all valid attempts.
      - If ALL attempts fail (LLMClientError), raise the last error.

    Args:
        system_prompt: Full evaluation system prompt (rubric embedded).
        user_message: User content (quest info + submission).
        max_attempts: Max number of LLM calls (default 3).
        delta_threshold: Max allowed delta between any two attempt scores (default 20).

    Returns:
        Dict with per-dimension median scores and all attempt results:
          {
            "knowledge":   {"score": 75, "justification": "..."},
            "reasoning":   {"score": 70, "justification": "..."},
            "application": {"score": 80, "justification": "..."},
            "creation":    {"score": 55, "justification": "..."},
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

        attempts.append(result)

        # Need at least 2 attempts to check consistency
        if len(attempts) >= 2:
            # Compare the latest attempt with all previous ones
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
    final = {"attempts": len(attempts), "attempt_details": attempts}
    for dim in dimensions:
        scores = sorted(a[dim]["score"] for a in attempts)
        median_score = _median(scores)
        # Use the justification from the attempt closest to the median
        best_attempt = min(attempts, key=lambda a: abs(a[dim]["score"] - median_score))
        final[dim] = {
            "score": median_score,
            "justification": best_attempt[dim]["justification"],
        }

    return final


def _is_valid_result(result: dict) -> bool:
    """Check that the LLM response has all required fields."""
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
    return True


def _median(sorted_values: list[int]) -> int:
    """Return the median of a sorted list of integers."""
    n = len(sorted_values)
    if n == 0:
        return 0
    if n % 2 == 1:
        return sorted_values[n // 2]
    return (sorted_values[n // 2 - 1] + sorted_values[n // 2]) // 2
