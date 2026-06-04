/** World API calls — /api/v1/world */

import { api } from "@/lib/api";
import type {
  World,
  BuildingDetail,
  CompoundBuildingDetail,
  WorldEvent,
  UserMilestone,
  TechTreeData,
} from "@/types/world";

export const worldService = {
  /** Get the full world state for the current user */
  getWorld(): Promise<World> {
    return api.get<World>("/world");
  },

  /** Get a single regular building's detail */
  getBuilding(buildingId: string): Promise<BuildingDetail> {
    return api.get<BuildingDetail>(`/world/buildings/${buildingId}`);
  },

  /** Get a single compound building's detail */
  getCompoundBuilding(buildingId: string): Promise<CompoundBuildingDetail> {
    return api.get<CompoundBuildingDetail>(
      `/world/compound-buildings/${buildingId}`
    );
  },

  /** Get paginated world events */
  getEvents(limit?: number, offset?: number): Promise<WorldEvent[]> {
    const params = new URLSearchParams();
    if (limit !== undefined) params.set("limit", String(limit));
    if (offset !== undefined) params.set("offset", String(offset));
    const query = params.toString() ? `?${params.toString()}` : "";
    return api.get<WorldEvent[]>(`/world/events${query}`);
  },

  /** Get all milestones with user unlock status */
  getMilestones(): Promise<UserMilestone[]> {
    return api.get<UserMilestone[]>("/world/milestones");
  },

  /** Get the full tech tree */
  getTechTree(): Promise<TechTreeData> {
    return api.get<TechTreeData>("/world/tech-tree");
  },
};
