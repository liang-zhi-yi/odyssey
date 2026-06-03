"""Credentials business logic — list credentials and user credentials."""

from uuid import UUID

from sqlalchemy.orm import Session

from app.credentials.models import Credential, UserCredential


def list_credentials(db: Session) -> list[dict]:
    """Return all available credential definitions."""
    credentials = db.query(Credential).order_by(Credential.name).all()
    return [
        {
            "id": str(c.id),
            "name": c.name,
            "description": c.description,
            "required_score": c.required_score,
        }
        for c in credentials
    ]


def list_user_credentials(db: Session, user_id: str) -> list[dict]:
    """Return credentials earned by a specific user.

    Joins UserCredential → Credential to include the credential name.
    """
    user_credentials = (
        db.query(UserCredential)
        .filter(UserCredential.user_id == UUID(user_id))
        .order_by(UserCredential.issued_at.desc())
        .all()
    )
    return [
        {
            "id": str(uc.id),
            "name": uc.credential.name,
            "issued_at": uc.issued_at,
        }
        for uc in user_credentials
    ]
