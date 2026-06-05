"""Auth routes — /api/v1/auth/*"""

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.auth.schemas import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    UserResponse,
    UpdateProfileRequest,
    ChangePasswordRequest,
    AvatarUploadResponse,
    PublicProfileResponse,
)
from app.auth import service
from app.database import get_db
from app.dependencies import get_current_user
from app.auth.models import User

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user account and initialise their skill tree."""
    user, token = service.register(db, req)
    # Ensure the new user has a UserSkill row for every Skill
    from app.skills.service import ensure_user_skills_exist
    ensure_user_skills_exist(db, str(user.id))
    return TokenResponse(token=token, user_id=str(user.id))


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Log in with email + password and receive a JWT."""
    user, token = service.login(db, req.email, req.password)
    return TokenResponse(token=token, user_id=str(user.id))


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return UserResponse(
        id=str(current_user.id),
        username=current_user.username,
        email=current_user.email,
        nickname=current_user.nickname,
        github_username=current_user.github_username,
        avatar_url=current_user.avatar_url,
        bio=current_user.bio,
        title=current_user.title,
        location=current_user.location,
        website=current_user.website,
        social_links=current_user.social_links,
    )


@router.put("/me", response_model=UserResponse)
def update_current_user(
    req: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update the current user's profile."""
    return service.update_profile(db, current_user, req)


@router.put("/password")
def change_current_user_password(
    req: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Change the current user's password."""
    service.change_password(db, current_user, req.current_password, req.new_password)
    return {"message": "Password updated successfully"}


@router.post("/me/avatar", response_model=AvatarUploadResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload or update the current user's avatar image.

    Accepted formats: JPEG, PNG, WebP. Max size: 2 MB.
    """
    content = await file.read()
    avatar_url = service.save_avatar(
        db, current_user, content, file.content_type or "application/octet-stream", file.filename or "avatar.png"
    )
    return AvatarUploadResponse(avatar_url=avatar_url, message="Avatar uploaded successfully")


@router.delete("/me/avatar")
def remove_avatar(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove the current user's avatar image."""
    service.delete_avatar(db, current_user)
    return {"message": "Avatar removed successfully"}


@router.get("/profile/{username}", response_model=PublicProfileResponse)
def get_public_profile(username: str, db: Session = Depends(get_db)):
    """Return a user's public profile and skills summary.

    No authentication required — safe for public viewing.
    """
    return service.get_public_profile(db, username)
