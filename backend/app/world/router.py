"""
World API routes — GET /world, GET /world/buildings/{id}
"""
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.models import User
from app.database import get_db
from app.dependencies import get_current_user
from app.world import service as world_service
from app.world.schemas import WorldResponse, BuildingDetailResponse

router = APIRouter(tags=["world"])


@router.get("/world", response_model=WorldResponse)
def get_world(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the full world state — buildings, regions, and stats."""
    world_data = world_service.get_world_state(db, current_user.id)
    return WorldResponse(**world_data)


@router.get("/world/buildings/{building_id}", response_model=BuildingDetailResponse)
def get_building(
    building_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get detailed info for a single building."""
    detail = world_service.get_building_detail(db, current_user.id, building_id)
    if detail is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Building not found")
    return BuildingDetailResponse(**detail)
