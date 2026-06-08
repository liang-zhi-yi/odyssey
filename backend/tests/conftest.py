"""
Pytest fixtures for Odyssey backend tests.

Uses SQLite in-memory to avoid external database dependency.
Patches UUID handling for SQLite compatibility.
"""
import pytest
import uuid as _uuid
from datetime import datetime, timezone
from uuid import uuid4, UUID

# ── Override config BEFORE any app imports ──────────────────────────
from app.config import settings

settings.database_url = "sqlite:///:memory:"
settings.jwt_secret = "test-secret"
settings.db_echo = False

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.types import Uuid as SAUuid

# ── SQLite UUID fix: Uuid bind processor must accept strings ────────
def _patched_uuid_bind_processor(self, dialect):
    """Return a bind processor that normalizes both uuid.UUID and str to hex."""
    def process(value):
        if value is None:
            return value
        if isinstance(value, _uuid.UUID):
            return value.hex
        # Normalize string UUIDs (with or without dashes) to hex
        clean = str(value).replace("-", "")
        return clean
    return process

SAUuid.bind_processor = _patched_uuid_bind_processor

from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.main import app
from app.core.security import create_access_token, hash_password
from app.auth.models import User
from app.skills.models import Skill, UserSkill

from app.quests.models import Quest
from app.core.enums import QuestDifficulty, QuestType, DeliverableType, SkillRank
from app.credentials.models import Credential


TEST_ENGINE = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
TestSessionLocal = sessionmaker(bind=TEST_ENGINE, autoflush=False, autocommit=False)


@pytest.fixture(scope="session", autouse=True)
def create_tables():
    """Create all tables once per test session."""
    Base.metadata.create_all(bind=TEST_ENGINE)
    yield
    Base.metadata.drop_all(bind=TEST_ENGINE)


@pytest.fixture
def db() -> Session:
    """Fresh DB session with rollback after each test."""
    connection = TEST_ENGINE.connect()
    transaction = connection.begin()
    session = TestSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db: Session) -> TestClient:
    """TestClient with overridden DB dependency."""

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


# ── Helpers ─────────────────────────────────────────────────────────

def _safe_refresh(db: Session, obj):
    """Refresh without triggering selectin relationship loads."""
    db.commit()
    pk = obj.id
    db.expire(obj)
    # Re-query with a simple PK lookup, no relationship loading
    row = db.query(type(obj)).filter(type(obj).id == pk).first()
    # Copy attributes manually
    for col in type(obj).__table__.columns:
        setattr(obj, col.name, getattr(row, col.name))
    return obj


# ── Factory fixtures ────────────────────────────────────────────────

@pytest.fixture
def seeded_user(db: Session) -> User:
    user = User(
        id=uuid4(),
        email="test@odyssey.dev",
        username="testuser",
        password_hash=hash_password("password123"),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(user)
    db.commit()
    # Re-query to get server-generated values without loading relationships
    user = db.query(User).filter(User.id == user.id).first()
    return user


@pytest.fixture
def auth_token(seeded_user: User) -> str:
    return create_access_token(
        data={"sub": str(seeded_user.id)},
        secret=settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )


@pytest.fixture
def auth_headers(auth_token: str) -> dict:
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture
def seeded_skills(db: Session) -> dict[str, Skill]:
    skill_data = [
        {"id": UUID("00000000-0000-0000-0000-000000000001"), "name": "Prompt Engineering", "description": "...", "category": "AI", "max_score": 100},
        {"id": UUID("00000000-0000-0000-0000-000000000002"), "name": "RAG", "description": "...", "category": "AI", "max_score": 100},
        {"id": UUID("00000000-0000-0000-0000-000000000003"), "name": "Workflow Design", "description": "...", "category": "AI", "max_score": 100},
        {"id": UUID("00000000-0000-0000-0000-000000000004"), "name": "LangGraph", "description": "...", "category": "AI", "max_score": 100},
    ]
    mapping = {}
    for data in skill_data:
        skill = Skill(**data)
        db.add(skill)
        mapping[data["name"]] = skill
    db.commit()
    mapping = {name: db.query(Skill).filter(Skill.id == s.id).first() for name, s in mapping.items()}
    return mapping


@pytest.fixture
def seeded_user_skills(db: Session, seeded_user: User, seeded_skills: dict) -> dict[str, UserSkill]:
    mapping = {}
    for name, skill in seeded_skills.items():
        us = UserSkill(
            user_id=seeded_user.id,
            skill_id=skill.id,
            knowledge_score=30, reasoning_score=30,
            application_score=30, creation_score=30,
            overall_score=30, rank=SkillRank.BEGINNER,
        )
        db.add(us)
        mapping[name] = us
    db.commit()
    return mapping


@pytest.fixture
def seeded_quest(db: Session, seeded_skills: dict) -> Quest:
    quest = Quest(
        title="Write a Translation Prompt",
        description="Design a prompt that translates text between languages.",
        skill_id=seeded_skills["Prompt Engineering"].id,
        difficulty=QuestDifficulty.LEVEL_1,
        quest_type=QuestType.APPLICATION,
        expected_deliverable=DeliverableType.PROMPT,
    )
    db.add(quest)
    db.commit()
    return db.query(Quest).filter(Quest.id == quest.id).first()


@pytest.fixture
def seeded_credentials(db: Session, seeded_skills: dict) -> dict[str, Credential]:
    cred_data = [
        {"name": "Prompt Practitioner", "skill_id": seeded_skills["Prompt Engineering"].id, "required_score": 60, "description": "All Prompt dims >= 60"},
        {"name": "RAG Practitioner", "skill_id": seeded_skills["RAG"].id, "required_score": 60, "description": "All RAG dims >= 60"},
        {"name": "Workflow Practitioner", "skill_id": seeded_skills["Workflow Design"].id, "required_score": 60, "description": "All Workflow dims >= 60"},
        {"name": "LangGraph Practitioner", "skill_id": seeded_skills["LangGraph"].id, "required_score": 60, "description": "All LangGraph dims >= 60"},
        {"name": "Agent Engineer", "skill_id": None, "required_score": 60, "description": "All 4 skills all dims >= 60"},
    ]
    mapping = {}
    for data in cred_data:
        c = Credential(**data)
        db.add(c)
        mapping[data["name"]] = c
    db.commit()
    return {name: db.query(Credential).filter(Credential.id == c.id).first() for name, c in mapping.items()}
