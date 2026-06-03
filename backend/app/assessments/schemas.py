"""Assessment request / response schemas."""

from pydantic import BaseModel


class RunAssessmentRequest(BaseModel):
    submission_id: str


class AssessmentStatusResponse(BaseModel):
    assessment_id: str
    status: str  # PROCESSING | COMPLETED | FAILED


class AssessmentCompletedResponse(BaseModel):
    assessment_id: str
    status: str
    knowledge: int
    reasoning: int
    application: int
    creation: int
    overall: int
    feedback: str | None = None
    suggestions: str | None = None


class AssessmentFailedResponse(BaseModel):
    assessment_id: str
    status: str
    error: str | None = None
    retry_url: str | None = None


class LLMScoreOutput(BaseModel):
    """Schema enforced via structured JSON output for LLM evaluation."""
    knowledge: int
    knowledge_justification: str
    reasoning: int
    reasoning_justification: str
    application: int
    application_justification: str
    creation: int
    creation_justification: str
