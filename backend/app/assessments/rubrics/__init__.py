"""
Rubric registry — maps skill names to their full rubrics.

Usage:
    from app.assessments.rubrics import get_rubric_for_skill
    rubric = get_rubric_for_skill("Prompt Engineering")
"""

from app.assessments.rubrics.prompt_rubric import PROMPT_RUBRIC
from app.assessments.rubrics.rag_rubric import RAG_RUBRIC
from app.assessments.rubrics.workflow_rubric import WORKFLOW_RUBRIC
from app.assessments.rubrics.langgraph_rubric import LANGGRAPH_RUBRIC
from app.assessments.rubrics.default_rubric import DEFAULT_RUBRIC

# Map skill name → rubric dict
_RUBRICS: dict[str, dict] = {
    "Prompt Engineering": PROMPT_RUBRIC,
    "RAG": RAG_RUBRIC,
    "Workflow Design": WORKFLOW_RUBRIC,
    "LangGraph": LANGGRAPH_RUBRIC,
}


def get_rubric_for_skill(skill_name: str) -> dict:
    """Return the full rubric dict for a skill name.

    Falls back to a generic DEFAULT_RUBRIC when no skill-specific rubric
    is defined, so assessments work for any skill (including dynamically
    created ones like Design, Writing, Research, etc.).
    """
    rubric = _RUBRICS.get(skill_name)
    if rubric is None:
        import logging
        logger = logging.getLogger(__name__)
        logger.info("No specific rubric for '%s' — using default rubric", skill_name)
        return DEFAULT_RUBRIC
    return rubric


def list_rubric_skills() -> list[str]:
    """Return the names of all skills with defined rubrics."""
    return list(_RUBRICS.keys())
