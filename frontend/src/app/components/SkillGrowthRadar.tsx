"use client";

import { RadarChart } from "./RadarChart";
import type { UserSkill } from "@/types/skill";
import type { DimensionScores } from "@/types/assessment";
import { useLocale } from "@/hooks/useLocale";
import { computeAggregateScores } from "@/lib/scores";

interface SkillGrowthRadarProps {
  userSkills: UserSkill[];
  isLoading: boolean;
}

/**
 * Large skill radar for the Bento Grid — shows the user's
 * capability landscape in a prominent 2-column card.
 */
export function SkillGrowthRadar({ userSkills, isLoading }: SkillGrowthRadarProps) {
  const { t } = useLocale();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="h-5 w-36 rounded-md bg-muted skeleton-shimmer mb-4" />
        <div className="flex items-center justify-center h-48">
          <div className="h-40 w-40 rounded-full bg-muted skeleton-shimmer" />
        </div>
      </div>
    );
  }

  const scores: DimensionScores = computeAggregateScores(userSkills);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{t("dashboard.skillLandscape")}</h3>
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
          {userSkills.length} {t("common.skills")}
        </span>
      </div>
      {userSkills.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          {t("dashboard.noSkillData")}
        </p>
      ) : (
        <div className="flex items-center justify-center">
          <RadarChart scores={scores} size={200} showLabels />
        </div>
      )}
    </div>
  );
}
