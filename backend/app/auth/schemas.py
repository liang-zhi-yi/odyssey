"""Auth request / response schemas."""

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator


class RegisterRequest(BaseModel):
    email: EmailStr
    username: str
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    token: str
    user_id: str | None = None


class UpdateProfileRequest(BaseModel):
    """Fields the user can update on their profile."""
    nickname: str | None = None
    bio: str | None = None
    avatar_url: str | None = None
    github_username: str | None = None
    title: str | None = None
    location: str | None = None
    website: str | None = None
    social_links: list | None = None


class ChangePasswordRequest(BaseModel):
    """Change password — requires current password for verification."""
    current_password: str
    new_password: str


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    nickname: str | None = None
    github_username: str | None = None
    avatar_url: str | None = None
    bio: str | None = None
    title: str | None = None
    location: str | None = None
    website: str | None = None
    social_links: list | None = None

    model_config = ConfigDict(from_attributes=True)


class AvatarUploadResponse(BaseModel):
    """Response after uploading an avatar."""
    avatar_url: str
    message: str


class SkillSummary(BaseModel):
    """Brief skill info for public profile display."""
    skill_id: str
    skill_name: str
    overall: int
    rank: str


class PublicProfileResponse(BaseModel):
    """Public profile data — no sensitive fields like email."""
    username: str
    nickname: str | None = None
    title: str | None = None
    avatar_url: str | None = None
    bio: str | None = None
    location: str | None = None
    website: str | None = None
    social_links: list | None = None
    skills: list[SkillSummary] = []

    model_config = ConfigDict(from_attributes=True)
