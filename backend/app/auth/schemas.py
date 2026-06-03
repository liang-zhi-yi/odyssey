"""Auth request / response schemas."""

from pydantic import BaseModel, EmailStr


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


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    avatar_url: str | None = None
    bio: str | None = None

    model_config = {"from_attributes": True}
