/** Progress API calls — /api/v1/progress */

import { api } from "@/lib/api";
import type { ProgressLog, SkillGrowthPoint, TimelineResponse, PathGrowthResponse } from "@/types/progress";

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

  /** Get growth curves for all skills in a learning path */
  getPathGrowth(pathId: string): Promise<PathGrowthResponse> {
    return api.get<PathGrowthResponse>(`/progress/paths/${pathId}`);
  },

  /** Get timeline events with optional date/skill filters */
  getTimeline(params?: {
    start_date?: string;
    end_date?: string;
    skill_id?: string;
    limit?: number;
  }): Promise<TimelineResponse> {
    const searchParams = new URLSearchParams();
    if (params?.start_date) searchParams.set("start_date", params.start_date);
    if (params?.end_date) searchParams.set("end_date", params.end_date);
    if (params?.skill_id) searchParams.set("skill_id", params.skill_id);
    if (params?.limit) searchParams.set("limit", String(params.limit));
    const qs = searchParams.toString();
    return api.get<TimelineResponse>(`/progress/timeline${qs ? `?${qs}` : ""}`);
  },
};
