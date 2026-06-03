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

# Map skill name → rubric dict
_RUBRICS: dict[str, dict] = {
    "Prompt Engineering": PROMPT_RUBRIC,
    "RAG": RAG_RUBRIC,
    "Workflow Design": WORKFLOW_RUBRIC,
    "LangGraph": LANGGRAPH_RUBRIC,
}


def get_rubric_for_skill(skill_name: str) -> dict:
    """Return the full rubric dict for a skill name.

    Raises ValueError if the skill has no rubric defined.
    """
    rubric = _RUBRICS.get(skill_name)
    if rubric is None:
        raise ValueError(f"No rubric defined for skill: {skill_name}")
    return rubric


def list_rubric_skills() -> list[str]:
    """Return the names of all skills with defined rubrics."""
    return list(_RUBRICS.keys())
