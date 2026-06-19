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
 * Capability Domain card — the user's four-dimensional ability map.
 * Framed as a "domain map" with hexagonal texture and glassmorphism.
 */
export function SkillGrowthRadar({ userSkills, isLoading }: SkillGrowthRadarProps) {
  const { t } = useLocale();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card h-full">
        <div className="h-5 w-36 rounded-md bg-muted skeleton-shimmer mb-4" />
        <div className="flex items-center justify-center h-48">
          <div className="h-40 w-40 rounded-full bg-muted skeleton-shimmer" />
        </div>
      </div>
    );
  }

  const scores: DimensionScores = computeAggregateScores(userSkills);

  return (
    <div className="group relative rounded-2xl border border-[oklch(0.88_0.02_90)] dark:border-[oklch(0.3_0.01_80)] bg-gradient-to-br from-[oklch(0.99_0.003_95)] to-[oklch(0.975_0.005_92)] dark:from-[oklch(0.22_0.008_85)] dark:to-[oklch(0.2_0.006_85)] p-5 shadow-card h-full overflow-hidden transition-all duration-300 hover:shadow-card-hover hover:border-[oklch(0.7_0.12_85_/_0.3)]">
      {/* Subtle hex texture overlay */}
      <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" aria-hidden="true">
        <defs>
          <pattern id="radar-hex" width="50" height="87" patternUnits="userSpaceOnUse" patternTransform="scale(0.5)">
            <path d="M25 3 L45 15 L45 45 L25 57 L5 45 L5 15 Z" fill="none" stroke="oklch(0.55 0.08 160 / 0.04)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#radar-hex)" />
      </svg>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2 L22 8.5 L22 15.5 L12 22 L2 15.5 L2 8.5 Z M12 2 L12 22 M2 8.5 L22 15.5" strokeWidth="1" />
            </svg>
            <h3 className="text-lg font-bold font-civ-serif text-[oklch(0.3_0.02_80)] dark:text-[oklch(0.85_0.04_80)]">
              {t("dashboard.skillLandscape")}
            </h3>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[oklch(0.7_0.12_85_/_0.2)] bg-accent/[0.06] px-2.5 py-0.5 text-xs font-semibold text-accent font-mono">
            <span className="w-1 h-1 rounded-full bg-accent animate-glow-pulse" />
            {userSkills.length} {t("common.skills")}
          </span>
        </div>

        {userSkills.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="relative mb-4">
              <div className="absolute inset-0 rounded-full bg-accent/[0.06] blur-xl animate-glow-pulse" />
              <div className="relative w-16 h-16 rounded-full border border-[oklch(0.7_0.12_85_/_0.2)] bg-gradient-to-br from-[oklch(0.99_0.003_95)] to-[oklch(0.96_0.008_88)] flex items-center justify-center">
                <svg className="w-7 h-7 text-accent/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2 L22 8.5 L22 15.5 L12 22 L2 15.5 L2 8.5 Z" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("dashboard.noSkillData")}
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <RadarChart scores={scores} size={200} showLabels />
          </div>
        )}
      </div>
    </div>
  );
}
