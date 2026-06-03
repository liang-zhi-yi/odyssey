"""Passport route — /api/v1/passport"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.passport.schemas import PassportResponse
from app.passport import service
from app.database import get_db
from app.dependencies import get_current_user
from app.auth.models import User

router = APIRouter(tags=["passport"])


@router.get("/passport", response_model=PassportResponse)
def get_passport(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate and return the user's capability passport.

    Aggregates skills, credentials, and projects into a single view.
    Not stored — dynamically generated on each request.
    """
    data = service.generate_passport(db, str(current_user.id))
    return PassportResponse(**data)
