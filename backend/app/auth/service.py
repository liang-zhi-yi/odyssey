"""Auth business logic — register, login, user lookup, avatar management."""

import os
import uuid as uuid_lib
from sqlalchemy.orm import Session

from app.auth.models import User
from app.auth.schemas import RegisterRequest, UpdateProfileRequest
from app.config import settings
from app.core.exceptions import (
    ConflictException,
    NotFoundException,
    UnauthorizedException,
    ValidationException,
)
from app.core.security import create_access_token, hash_password, verify_password

ALLOWED_AVATAR_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_AVATAR_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


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
    if req.title is not None:
        user.title = req.title
    if req.location is not None:
        user.location = req.location
    if req.website is not None:
        user.website = req.website
    if req.social_links is not None:
        user.social_links = req.social_links

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


def save_avatar(db: Session, user: User, file_content: bytes, content_type: str, original_filename: str) -> str:
    """Save an uploaded avatar image and update the user's avatar_url.

    Returns the new avatar_url path.
    """
    # Validate content type
    if content_type not in ALLOWED_AVATAR_TYPES:
        raise ValidationException(
            f"Unsupported file type: {content_type}. Allowed: JPEG, PNG, WebP."
        )

    # Validate file size
    if len(file_content) > settings.max_avatar_size:
        max_mb = settings.max_avatar_size // (1024 * 1024)
        raise ValidationException(
            f"Avatar file too large. Maximum size: {max_mb} MB."
        )

    # Determine extension from original filename
    _, ext = os.path.splitext(original_filename)
    ext = ext.lower()
    if ext not in ALLOWED_AVATAR_EXTENSIONS:
        ext = ".png"  # default fallback

    # Generate unique filename to prevent caching issues
    unique_name = f"{user.id}_{uuid_lib.uuid4().hex[:8]}{ext}"

    # Save file
    avatars_dir = os.path.join(settings.upload_dir, "avatars")
    os.makedirs(avatars_dir, exist_ok=True)
    file_path = os.path.join(avatars_dir, unique_name)

    # Resize image to max 256x256 using Pillow
    try:
        from PIL import Image
        import io
        img = Image.open(io.BytesIO(file_content))
        img.thumbnail((256, 256), Image.LANCZOS)
        # Convert RGBA to RGB for JPEG
        if ext in (".jpg", ".jpeg") and img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        img.save(file_path, quality=85)
    except Exception:
        # If Pillow fails, save raw content
        with open(file_path, "wb") as f:
            f.write(file_content)

    # Remove old avatar file if it's a local file
    if user.avatar_url and user.avatar_url.startswith("/static/avatars/"):
        old_path = os.path.join(settings.upload_dir, user.avatar_url.lstrip("/static/"))
        if os.path.isfile(old_path):
            try:
                os.remove(old_path)
            except OSError:
                pass

    # Update user record
    avatar_url = f"/static/avatars/{unique_name}"
    user.avatar_url = avatar_url
    db.commit()
    db.refresh(user)

    return avatar_url


def delete_avatar(db: Session, user: User) -> None:
    """Remove the user's avatar and reset avatar_url to null."""
    # Delete file if it's a local file
    if user.avatar_url and user.avatar_url.startswith("/static/avatars/"):
        file_path = os.path.join(settings.upload_dir, user.avatar_url.lstrip("/static/"))
        if os.path.isfile(file_path):
            try:
                os.remove(file_path)
            except OSError:
                pass

    user.avatar_url = None
    db.commit()
    db.refresh(user)


def get_public_profile(db: Session, username: str) -> dict:
    """Return public profile data for a user by username.

    Does NOT include sensitive fields like email.
    """
    user = _user_by_username(db, username)
    if user is None:
        raise NotFoundException("User", username)

    skills_summary = get_user_skills_summary(db, str(user.id))

    return {
        "username": user.username,
        "nickname": user.nickname,
        "title": user.title,
        "avatar_url": user.avatar_url,
        "bio": user.bio,
        "location": user.location,
        "website": user.website,
        "social_links": user.social_links,
        "skills": skills_summary,
    }


def get_user_skills_summary(db: Session, user_id: str) -> list[dict]:
    """Return a summary list of the user's skills with rank and overall score."""
    from app.skills.service import get_user_skills

    skills = get_user_skills(db, user_id)
    return [
        {
            "skill_id": s["skill_id"],
            "skill_name": s["skill_name"],
            "overall": s["overall"],
            "rank": s["rank"],
        }
        for s in skills
    ]
