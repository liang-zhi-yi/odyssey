"""
World API routes — world state, buildings, compound buildings,
events, milestones, and tech tree.
"""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.auth.models import User
from app.database import get_db
from app.dependencies import get_current_user
from app.world import service as world_service
from app.world import events as world_events
from app.world.schemas import (
    WorldResponse,
    BuildingDetailResponse,
    CompoundBuildingDetailResponse,
    WorldEventResponse,
    UserMilestoneResponse,
    TechTreeResponse,
    CivilizationDirectionResponse,
    ActivePathDirection,
    TargetedBuildingResponse,
)

router = APIRouter(tags=["world"])


# ── World state ────────────────────────────────────────────────────────

@router.get("/world", response_model=WorldResponse)
def get_world(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the full world state — buildings, compound buildings,
    regions, stats, tier info, and recent events."""
    world_data = world_service.get_world_state(db, current_user.id)
    return WorldResponse(**world_data)


# ── Regular building detail ────────────────────────────────────────────

@router.get("/world/buildings/{building_id}", response_model=BuildingDetailResponse)
def get_building(
    building_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get detailed info for a single regular building."""
    detail = world_service.get_building_detail(db, current_user.id, building_id)
    if detail is None:
        raise HTTPException(status_code=404, detail="Building not found")
    return BuildingDetailResponse(**detail)


# ── Compound building detail ───────────────────────────────────────────

@router.get(
    "/world/compound-buildings/{building_id}",
    response_model=CompoundBuildingDetailResponse,
)
def get_compound_building(
    building_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get detailed info for a single compound building,
    including source skill scores."""
    detail = world_service.get_compound_building_detail(db, current_user.id, building_id)
    if detail is None:
        raise HTTPException(status_code=404, detail="Compound building not found")
    return CompoundBuildingDetailResponse(**detail)


# ── World events ───────────────────────────────────────────────────────

@router.get("/world/events", response_model=list[WorldEventResponse])
def get_events(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get recent world events for the current user (paginated)."""
    events = world_events.get_recent_events(
        db, current_user.id, limit=limit, offset=offset
    )
    return [WorldEventResponse(**e) for e in events]


# ── Milestones ─────────────────────────────────────────────────────────

@router.get("/world/milestones", response_model=list[UserMilestoneResponse])
def get_milestones(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all milestone definitions with user unlock status."""
    milestones = world_service.get_milestones(db, current_user.id)
    return [UserMilestoneResponse(**m) for m in milestones]


# ── Civilization Direction ──────────────────────────────────────────────

@router.get("/world/civilization-direction", response_model=CivilizationDirectionResponse)
def get_civilization_direction(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Analyze active learning paths and their projected impact on the world.

    Returns which buildings each active path is driving growth toward,
    along with projected levels and a summary of civilization direction.
    """
    return world_service.get_civilization_direction(db, current_user.id)


# ── Tech Tree ──────────────────────────────────────────────────────────

@router.get("/world/tech-tree", response_model=TechTreeResponse)
def get_tech_tree(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the full tech tree — all regular and compound building nodes
    with prerequisite progress."""
    data = world_service.get_tech_tree(db, current_user.id)
    return TechTreeResponse(**data)
