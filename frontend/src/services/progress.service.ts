/** Progress API calls — /api/v1/progress */

import { api } from "@/lib/api";
import type { ProgressLog, SkillGrowthPoint } from "@/types/progress";

export const progressService = {
  /** Get recent progress logs */
  listProgressLogs(params?: {
    limit?: number;
    skill_id?: string;
  }): Promise<ProgressLog[]> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.skill_id) searchParams.set("skill_id", params.skill_id);
    const qs = searchParams.toString();
    return api.get<ProgressLog[]>(`/progress${qs ? `?${qs}` : ""}`);
  },

  /** Get growth curve for a specific skill */
  getSkillGrowth(skillId: string): Promise<SkillGrowthPoint[]> {
    return api.get<SkillGrowthPoint[]>(`/progress/skills/${skillId}`);
  },
};
