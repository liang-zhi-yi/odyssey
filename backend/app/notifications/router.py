"""Notification routes — /api/v1/notifications"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.notifications.schemas import (
    NotificationResponse,
    NotificationListResponse,
    UnreadCountResponse,
)
from app.notifications import service
from app.database import get_db
from app.dependencies import get_current_user
from app.auth.models import User

router = APIRouter(tags=["notifications"])


@router.get("/notifications", response_model=NotificationListResponse)
def list_notifications(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return paginated notifications for the authenticated user, newest first."""
    result = service.get_notifications(db, str(current_user.id), limit, offset)
    return NotificationListResponse(
        items=[NotificationResponse.model_validate(item) for item in result["items"]],
        total=result["total"],
        unread_count=result["unread_count"],
    )


@router.get("/notifications/unread-count", response_model=UnreadCountResponse)
def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the count of unread notifications."""
    count = service.get_unread_count(db, str(current_user.id))
    return UnreadCountResponse(count=count)


@router.put("/notifications/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark a single notification as read."""
    notification = service.mark_read(db, str(current_user.id), notification_id)
    if notification is None:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("Notification", notification_id)
    return NotificationResponse.model_validate(notification)


@router.put("/notifications/read-all")
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark all unread notifications as read for the authenticated user."""
    count = service.mark_all_read(db, str(current_user.id))
    return {"updated": count}
