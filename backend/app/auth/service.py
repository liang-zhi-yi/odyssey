"""Auth business logic — register, login, user lookup."""

from sqlalchemy.orm import Session

from app.auth.models import User
from app.auth.schemas import RegisterRequest, UpdateProfileRequest
from app.core.exceptions import (
    ConflictException,
    UnauthorizedException,
    ValidationException,
)
from app.core.security import create_access_token, hash_password, verify_password


def _user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def _user_by_username(db: Session, username: str) -> User | None:
    return db.query(User).filter(User.username == username).first()


def get_user_by_id(db: Session, user_id: str) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def register(db: Session, req: RegisterRequest) -> tuple[User, str]:
    """Create a new user and return (user, jwt_token)."""
    if _user_by_email(db, req.email):
        raise ConflictException("EMAIL_EXISTS", "A user with this email already exists")
    if _user_by_username(db, req.username):
        raise ConflictException("USERNAME_EXISTS", "A user with this username already exists")

    user = User(
        email=req.email,
        username=req.username,
        password_hash=hash_password(req.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(str(user.id))
    return user, token


def login(db: Session, email: str, password: str) -> tuple[User, str]:
    """Authenticate a user and return (user, jwt_token)."""
    user = _user_by_email(db, email)
    if user is None or not verify_password(password, user.password_hash):
        raise UnauthorizedException("Invalid email or password")

    token = create_access_token(str(user.id))
    return user, token


def update_profile(
    db: Session, user: User, req: UpdateProfileRequest
) -> User:
    """Update the user's profile fields.

    Only updates fields that are explicitly provided (not None).
    Validates github_username uniqueness if provided.
    """
    if req.github_username is not None:
        # Check uniqueness
        existing = (
            db.query(User)
            .filter(
                User.github_username == req.github_username,
                User.id != user.id,
            )
            .first()
        )
        if existing:
            raise ConflictException(
                "GITHUB_USERNAME_TAKEN",
                f"GitHub username '{req.github_username}' is already in use",
            )
        user.github_username = req.github_username

    if req.nickname is not None:
        user.nickname = req.nickname
    if req.bio is not None:
        user.bio = req.bio
    if req.avatar_url is not None:
        user.avatar_url = req.avatar_url

    db.commit()
    db.refresh(user)
    return user


def change_password(
    db: Session,
    user: User,
    current_password: str,
    new_password: str,
) -> None:
    """Change the user's password after verifying the current one."""
    if not verify_password(current_password, user.password_hash):
        raise UnauthorizedException(
            "Current password is incorrect"
        )

    if len(new_password) < 8:
        raise ValidationException(
            "Password must be at least 8 characters long"
        )

    user.password_hash = hash_password(new_password)
    db.commit()
