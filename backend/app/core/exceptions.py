"""
Unified exception classes and FastAPI exception handlers.

All business-logic errors raise subclasses of AppException.
FastAPI exception handlers convert them to the standard error JSON format:
  { "error": { "code": "...", "message": "..." } }
"""
from fastapi import Request
from fastapi.responses import JSONResponse


class AppException(Exception):
    """Base application exception with HTTP status + error code."""

    def __init__(self, code: str, message: str, status_code: int = 400):
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


# ── Concrete exceptions ──────────────────────────────────────────

class NotFoundException(AppException):
    def __init__(self, entity: str, identifier: str = ""):
        super().__init__(
            code=f"{entity.upper()}_NOT_FOUND",
            message=f"{entity} not found" + (f": {identifier}" if identifier else ""),
            status_code=404,
        )


class ConflictException(AppException):
    def __init__(self, code: str, message: str):
        super().__init__(code=code, message=message, status_code=409)


class UnauthorizedException(AppException):
    def __init__(self, message: str = "Invalid or expired token"):
        super().__init__(code="UNAUTHORIZED", message=message, status_code=401)


class ForbiddenException(AppException):
    def __init__(self, message: str = "Forbidden"):
        super().__init__(code="FORBIDDEN", message=message, status_code=403)


class ValidationException(AppException):
    def __init__(self, message: str):
        super().__init__(code="VALIDATION_ERROR", message=message, status_code=422)


# ── FastAPI exception handlers ───────────────────────────────────

async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": exc.code, "message": exc.message}},
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred",
            }
        },
    )
