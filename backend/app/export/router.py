"""Export routes — /api/v1/export"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.export import service
from app.database import get_db
from app.dependencies import get_current_user
from app.auth.models import User

router = APIRouter(tags=["export"])


@router.get("/export/passport")
def export_passport(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Export user's capability passport as JSON."""
    data = service.export_passport(db, str(current_user.id))
    data["generated_at"] = datetime.now(timezone.utc).isoformat()
    return JSONResponse(
        content=data,
        headers={
            "Content-Disposition": "attachment; filename=odyssey-passport.json",
        },
    )


@router.get("/export/data")
def export_full_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Export all user data as JSON (GDPR-compliant full export)."""
    data = service.export_full_data(db, str(current_user.id))
    data["exported_at"] = datetime.now(timezone.utc).isoformat()
    return JSONResponse(
        content=data,
        headers={
            "Content-Disposition": "attachment; filename=odyssey-data.json",
        },
    )
