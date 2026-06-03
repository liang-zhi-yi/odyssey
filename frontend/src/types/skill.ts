/** Skill types — matching backend app/skills/schemas.py */

export interface Skill {
  id: string;
  name: string;
  description: string | null;
  category: string;
}

export interface UserSkill {
  skill_id: string;
  skill_name: string | null;
  knowledge: number;
  reasoning: number;
  application: number;
  creation: number;
  overall: number;
  rank: SkillRank;
}

/** Rank enum matching backend SkillRank */
export type SkillRank = "NOVICE" | "BEGINNER" | "PRACTITIONER" | "ENGINEER" | "ARCHITECT";

/** Rank display labels (Chinese) */
export const RANK_LABELS: Record<SkillRank, string> = {
  NOVICE: "新手",
  BEGINNER: "初级",
  PRACTITIONER: "实践者",
  ENGINEER: "工程师",
  ARCHITECT: "架构师",
};
