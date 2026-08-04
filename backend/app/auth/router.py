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
    """Register a new user account."""
    user, token = service.register(db, req)
    return TokenResponse(token=token, user_id=str(user.id))


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Log in with email + password and receive a JWT."""
    user, token = service.login(db, req.email, req.password)
    return TokenResponse(token=token, user_id=str(user.id))


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return service.user_to_response(current_user)


@router.put("/me", response_model=UserResponse)
def update_current_user(
    req: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update the current user's profile."""
    updated_user = service.update_profile(db, current_user, req)
    return service.user_to_response(updated_user)


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


@router.post("/me/intro-video", response_model=UserResponse)
def mark_intro_video_seen(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark the current user as having watched the intro video.

    Called only after the video finishes playing (onEnded event).
    """
    updated_user = service.mark_intro_video_seen(db, current_user)
    return service.user_to_response(updated_user)
