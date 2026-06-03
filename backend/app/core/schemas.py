"""
Shared Pydantic schemas — error response, pagination, health.
"""
from pydantic import BaseModel


class ErrorResponse(BaseModel):
    code: str
    message: str


class HealthResponse(BaseModel):
    status: str = "ok"
