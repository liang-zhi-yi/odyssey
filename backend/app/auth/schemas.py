"""Auth request / response schemas."""

from pydantic import BaseModel, ConfigDict, EmailStr


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

    model_config = ConfigDict(from_attributes=True)
