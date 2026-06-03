"""
FastAPI dependency functions.

- get_db          → yields a SQLAlchemy session per request
- get_current_user → extracts and validates JWT, returns User ORM instance
"""
from fastapi import Depends, Header
from sqlalchemy.orm import Session

from app.core.exceptions import UnauthorizedException
from app.core.security import decode_access_token
from app.database import get_db
from app.auth.service import get_user_by_id


def get_current_user(
    authorization: str = Header(..., description="Bearer <JWT token>"),
    db: Session = Depends(get_db),
):
    """Dependency: validates the JWT and returns the authenticated User.

    Attach to any route that requires authentication:
        @router.get("/me")
        def me(current_user = Depends(get_current_user)):
            ...
    """
    if not authorization.startswith("Bearer "):
        raise UnauthorizedException("Missing or malformed Authorization header")

    token = authorization.removeprefix("Bearer ").strip()
    payload = decode_access_token(token)
    if payload is None:
        raise UnauthorizedException("Invalid or expired token")

    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedException("Token missing subject claim")

    user = get_user_by_id(db, user_id)
    if user is None:
        raise UnauthorizedException("User not found")

    return user
