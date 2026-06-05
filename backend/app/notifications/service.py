"""Notification business logic — create, list, mark read."""

from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.notifications.models import Notification


def create_notification(
    db: Session,
    user_id: str | UUID,
    type: str,
    title: str,
    title_en: str | None = None,
    body: str | None = None,
    body_en: str | None = None,
    link: str | None = None,
) -> Notification:
    """Create and persist a notification. Returns the ORM object."""
    notification = Notification(
        user_id=UUID(str(user_id)),
        type=type,
        title=title,
        title_en=title_en,
        body=body,
        body_en=body_en,
        link=link,
    )
    db.add(notification)
    db.flush()
    return notification


def get_notifications(
    db: Session,
    user_id: str | UUID,
    limit: int = 20,
    offset: int = 0,
) -> dict:
    """Return paginated notifications for a user, newest first."""
    uid = UUID(str(user_id))

    total = (
        db.query(Notification)
        .filter(Notification.user_id == uid)
        .count()
    )

    unread_count = (
        db.query(Notification)
        .filter(Notification.user_id == uid, Notification.is_read == False)
        .count()
    )

    items = (
        db.query(Notification)
        .filter(Notification.user_id == uid)
        .order_by(desc(Notification.created_at))
        .offset(offset)
        .limit(limit)
        .all()
    )

    return {
        "items": items,
        "total": total,
        "unread_count": unread_count,
    }


def mark_read(
    db: Session,
    user_id: str | UUID,
    notification_id: str | UUID,
) -> Notification | None:
    """Mark a single notification as read. Returns the updated notification or None."""
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == user_id,
        )
        .first()
    )
    if notification is None:
        return None
    notification.is_read = True
    db.flush()
    return notification


def mark_all_read(db: Session, user_id: str | UUID) -> int:
    """Mark all unread notifications as read for a user. Returns count of updated rows."""
    count = (
        db.query(Notification)
        .filter(
            Notification.user_id == user_id,
            Notification.is_read == False,
        )
        .update({Notification.is_read: True})
    )
    db.flush()
    return count


def get_unread_count(db: Session, user_id: str | UUID) -> int:
    """Return the number of unread notifications for a user."""
    return (
        db.query(Notification)
        .filter(
            Notification.user_id == user_id,
            Notification.is_read == False,
        )
        .count()
    )
