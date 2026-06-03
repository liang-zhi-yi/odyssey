"""
JWT token creation / verification and password hashing utilities.
"""
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
import bcrypt

from app.config import settings

ALGORITHM = settings.jwt_algorithm
SECRET_KEY = settings.jwt_secret
EXPIRE_MINUTES = settings.jwt_expire_minutes


def hash_password(password: str) -> str:
    """Hash a plain-text password with bcrypt."""
    return bcrypt.hashpw(
        password.encode("utf-8"), bcrypt.gensalt()
    ).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against its bcrypt hash."""
    return bcrypt.checkpw(
        plain_password.encode("utf-8"), hashed_password.encode("utf-8")
    )


def create_access_token(
    data: dict | str | None = None,
    secret: str | None = None,
    algorithm: str | None = None,
) -> str:
    """Create a JWT access token.

    Can be called as:
      - create_access_token(str(user_id)) — backwards compatible
      - create_access_token(data={"sub": str(user_id)}) — new style
    """
    if isinstance(data, str):
        # Backwards-compat: passed user_id directly
        data = {"sub": data}
    expire = datetime.now(timezone.utc) + timedelta(minutes=EXPIRE_MINUTES)
    payload = {**(data or {}), "exp": expire, "iat": datetime.now(timezone.utc)}
    return jwt.encode(
        payload,
        secret or SECRET_KEY,
        algorithm=algorithm or ALGORITHM,
    )


def decode_access_token(token: str) -> dict | None:
    """Decode and validate a JWT token. Returns the payload or None."""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None
