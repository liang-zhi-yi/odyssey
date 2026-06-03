"""Auth business logic — register, login, user lookup."""

from sqlalchemy.orm import Session

from app.auth.models import User
from app.auth.schemas import RegisterRequest
from app.core.exceptions import ConflictException, UnauthorizedException
from app.core.security import create_access_token, hash_password, verify_password


def _user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def _user_by_username(db: Session, username: str) -> User | None:
    return db.query(User).filter(User.username == username).first()


def get_user_by_id(db: Session, user_id: str) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def register(db: Session, req: RegisterRequest) -> tuple[User, str]:
    """Create a new user and return (user, jwt_token)."""
    if _user_by_email(db, req.email):
        raise ConflictException("EMAIL_EXISTS", "A user with this email already exists")
    if _user_by_username(db, req.username):
        raise ConflictException("USERNAME_EXISTS", "A user with this username already exists")

    user = User(
        email=req.email,
        username=req.username,
        password_hash=hash_password(req.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(str(user.id))
    return user, token


def login(db: Session, email: str, password: str) -> tuple[User, str]:
    """Authenticate a user and return (user, jwt_token)."""
    user = _user_by_email(db, email)
    if user is None or not verify_password(password, user.password_hash):
        raise UnauthorizedException("Invalid email or password")

    token = create_access_token(str(user.id))
    return user, token
