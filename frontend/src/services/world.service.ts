/** World API calls — /api/v1/world */

import { api } from "@/lib/api";
import type { World, BuildingDetail } from "@/types/world";

export const worldService = {
  /** Get the full world state for the current user */
  getWorld(): Promise<World> {
    return api.get<World>("/world");
  },

  /** Get a single building's detail */
  getBuilding(buildingId: string): Promise<BuildingDetail> {
    return api.get<BuildingDetail>(`/world/buildings/${buildingId}`);
  },
};
