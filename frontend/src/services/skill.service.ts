/** Skill API calls — /api/v1/skills, /api/v1/user-skills */

import { api } from "@/lib/api";
import type { Skill, UserSkill } from "@/types/skill";
import type { SkillGrowthPoint } from "@/types/progress";

export const skillService = {
  /** Get the global skill tree (all defined skills) */
  listSkills(): Promise<Skill[]> {
    return api.get<Skill[]>("/skills");
  },

  /** Get current user's skill states with scores and ranks */
  listUserSkills(): Promise<UserSkill[]> {
    return api.get<UserSkill[]>("/user-skills");
  },

  /** Get a single skill's detailed state for the current user */
  getUserSkillDetail(skillId: string): Promise<UserSkill> {
    return api.get<UserSkill>(`/user-skills/${skillId}`);
  },

  /** Get 30-day growth trend for a skill (for sparklines) */
  getSkillTrend(skillId: string, days?: number): Promise<SkillGrowthPoint[]> {
    const searchParams = new URLSearchParams();
    if (days) searchParams.set("days", String(days));
    const qs = searchParams.toString();
    return api.get<SkillGrowthPoint[]>(`/progress/skills/${skillId}/trend${qs ? `?${qs}` : ""}`);
  },
};
