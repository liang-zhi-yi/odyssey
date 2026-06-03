import type { UserSkill } from "@/types/skill";
import type { DimensionScores } from "@/types/assessment";

/**
 * Compute aggregate dimension scores by averaging across all user skills.
 * Returns zeroed scores when the list is empty so consumers can skip null checks.
 */
export function computeAggregateScores(userSkills: UserSkill[]): DimensionScores {
  if (userSkills.length === 0) {
    return { knowledge: 0, reasoning: 0, application: 0, creation: 0 };
  }

  const avg = (key: keyof DimensionScores) =>
    Math.round(userSkills.reduce((sum, us) => sum + us[key], 0) / userSkills.length);

  return {
    knowledge: avg("knowledge"),
    reasoning: avg("reasoning"),
    application: avg("application"),
    creation: avg("creation"),
  };
}
