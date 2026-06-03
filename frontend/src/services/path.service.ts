/** Path API calls — /api/v1/paths, /api/v1/user-paths */

import { api } from "@/lib/api";
import type {
  GrowthPath,
  SelectPathRequest,
  SelectPathResponse,
  UserPath,
} from "@/types/path";

export const pathService = {
  /** Get all available growth paths */
  listPaths(): Promise<GrowthPath[]> {
    return api.get<GrowthPath[]>("/paths");
  },

  /** Select (activate) a growth path */
  selectPath(data: SelectPathRequest): Promise<SelectPathResponse> {
    return api.post<SelectPathResponse>("/user-paths", data);
  },

  /** Get the current user's active path with progress */
  getCurrentPath(): Promise<UserPath> {
    return api.get<UserPath>("/user-paths/current");
  },
};
