/** Skill API calls — /api/v1/skills, /api/v1/user-skills */

import { api } from "@/lib/api";
import type { Skill, UserSkill } from "@/types/skill";

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
};
