"""Skill routes — /api/v1/skills/* and /api/v1/user-skills/*"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.skills.schemas import SkillResponse, UserSkillResponse
from app.skills import service
from app.database import get_db
from app.dependencies import get_current_user
from app.auth.models import User

router = APIRouter(tags=["skills"])


@router.get("/skills", response_model=list[SkillResponse])
def list_skills(db: Session = Depends(get_db)):
    """Return the global skill tree (all defined skills)."""
    skills = service.get_all_skills(db)
    return [
        SkillResponse(
            id=str(s.id),
            name=s.name,
            name_en=s.name_en,
            description=s.description,
            description_en=s.description_en,
            category=s.category,
            domain=s.domain,
        )
        for s in skills
    ]


@router.get("/user-skills", response_model=list[UserSkillResponse])
def list_user_skills(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the current user's skill states with scores and ranks."""
    rows = service.get_user_skills(db, str(current_user.id))
    return [UserSkillResponse(**r) for r in rows]


@router.get("/user-skills/{skill_id}", response_model=UserSkillResponse)
def get_user_skill_detail(
    skill_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return a single skill's detailed state for the current user."""
    detail = service.get_user_skill_detail(db, str(current_user.id), skill_id)
    return UserSkillResponse(**detail)
