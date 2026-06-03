"""Health-check endpoint."""

from fastapi import APIRouter

from app.core.schemas import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health_check():
    """Returns ok when the service is running."""
    return HealthResponse(status="ok")
