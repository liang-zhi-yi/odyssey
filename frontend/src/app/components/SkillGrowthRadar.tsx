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
 * 能力星图 — 用户四维能力地图
 * 保留 RadarChart 数据与功能，增加中心核心节点 + 轨道线装饰
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
    <div className="group relative rounded-2xl border border-[#C9A45C]/20 bg-gradient-to-br from-[#F7F2E8] to-[#F0E8D8] dark:from-[oklch(0.22_0.008_85)] dark:to-[oklch(0.2_0.006_85)] p-5 shadow-card h-full overflow-hidden transition-all duration-300 hover:shadow-card-hover hover:border-[#C9A45C]/40">
      {/* 星图轨道装饰背景 */}
      <svg className="absolute inset-0 w-full h-full opacity-40 pointer-events-none" aria-hidden="true">
        <defs>
          <pattern id="star-orbit" width="80" height="80" patternUnits="userSpaceOnUse" patternTransform="scale(0.6)">
            <circle cx="40" cy="40" r="2" fill="oklch(0.72 0.12 80 / 0.06)" />
            <circle cx="40" cy="40" r="20" fill="none" stroke="oklch(0.72 0.12 80 / 0.04)" strokeWidth="0.4" strokeDasharray="1 4" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#star-orbit)" />
      </svg>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[oklch(0.62_0.12_75)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
              <ellipse cx="12" cy="12" rx="10" ry="4" opacity="0.6" />
              <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" opacity="0.4" />
              <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" opacity="0.25" />
            </svg>
            <h3 className="text-lg font-bold font-civ-serif text-[#4A3825] dark:text-[oklch(0.85_0.04_80)]">
              {t("dashboard.skillLandscape")}
            </h3>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[oklch(0.72_0.12_80_/_0.2)] bg-[oklch(0.72_0.12_80_/_0.06)] px-2.5 py-0.5 text-xs font-semibold text-[oklch(0.55_0.1_75)] font-mono">
            <span className="w-1 h-1 rounded-full bg-[oklch(0.72_0.12_80)] animate-glow-pulse" />
            {userSkills.length} {t("common.skills")}
          </span>
        </div>

        {userSkills.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="relative mb-4">
              <div className="absolute inset-0 rounded-full bg-[oklch(0.72_0.12_80_/_0.06)] blur-xl animate-glow-pulse" />
              <div className="relative w-16 h-16 rounded-full border border-[oklch(0.72_0.12_80_/_0.2)] bg-gradient-to-br from-[oklch(0.99_0.003_85)] to-[oklch(0.96_0.008_80)] flex items-center justify-center">
                <svg className="w-7 h-7 text-[oklch(0.72_0.12_80_/_0.5)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="3" />
                  <ellipse cx="12" cy="12" rx="10" ry="4" opacity="0.5" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("dashboard.noSkillData")}
            </p>
          </div>
        ) : (
          <div className="relative flex items-center justify-center">
            {/* 中心核心节点光晕（星图质感） */}
            <div
              className="absolute w-12 h-12 rounded-full pointer-events-none animate-glow-pulse"
              style={{
                background: "radial-gradient(circle, oklch(0.72 0.12 80 / 0.15), transparent 70%)",
                zIndex: 0,
              }}
            />
            <div className="relative z-10">
              <RadarChart scores={scores} size={200} showLabels />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
