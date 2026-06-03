"""Credentials routes — /api/v1/credentials, /api/v1/user-credentials"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.credentials.schemas import CredentialResponse, UserCredentialResponse
from app.credentials import service
from app.database import get_db
from app.dependencies import get_current_user
from app.auth.models import User

router = APIRouter(tags=["credentials"])


@router.get("/credentials", response_model=list[CredentialResponse])
def get_credentials(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return all credential definitions available in the system."""
    creds = service.list_credentials(db)
    return [CredentialResponse(**c) for c in creds]


@router.get("/user-credentials", response_model=list[UserCredentialResponse])
def get_user_credentials(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return credentials awarded to the authenticated user."""
    creds = service.list_user_credentials(db, str(current_user.id))
    return [UserCredentialResponse(**c) for c in creds]
