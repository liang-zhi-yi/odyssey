"use client";

import type { UserSkill } from "@/types/skill";
import type { DimensionScores } from "@/types/assessment";
import { useLocale } from "@/hooks/useLocale";
import { computeAggregateScores } from "@/lib/scores";
import { AbilityEmblem } from "./CivArchiveTheme";

interface SkillGrowthRadarProps {
  userSkills: UserSkill[];
  isLoading: boolean;
}

/**
 * 能力节点图 — 文明核心纹章
 * 将四维能力数据转化为文明纹章可视化，弱化卡片边界
 */
export function SkillGrowthRadar({ userSkills, isLoading }: SkillGrowthRadarProps) {
  const { t } = useLocale();

  if (isLoading) {
    return (
      <div
        className="relative bg-gradient-to-br from-[#F7F2E8]/80 to-[#F0E8D8]/50 dark:from-[oklch(0.22_0.008_85)] dark:to-[oklch(0.2_0.006_85)] p-6 h-full"
        style={{ clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))" }}
      >
        <div className="h-5 w-36 bg-[#C9A45C]/15 skeleton-shimmer mb-4" />
        <div className="flex items-center justify-center h-48">
          <div className="h-40 w-40 rounded-full bg-[#C9A45C]/10 skeleton-shimmer" />
        </div>
      </div>
    );
  }

  const scores: DimensionScores = computeAggregateScores(userSkills);

  const labels = {
    knowledge: t("skills.dimensions.knowledge"),
    reasoning: t("skills.dimensions.reasoning"),
    application: t("skills.dimensions.application"),
    creation: t("skills.dimensions.creation"),
  };

  return (
    <div
      className="group relative bg-gradient-to-br from-[#F7F2E8]/70 to-[#F0E8D8]/40 dark:from-[oklch(0.22_0.008_85)] dark:to-[oklch(0.2_0.006_85)] p-5 h-full overflow-hidden transition-all duration-300 hover:from-[#F7F2E8]/90 hover:to-[#F0E8D8]/60"
      style={{ clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))" }}
    >
      {/* Top accent — gold gradient line */}
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-[#C9A45C]/40 to-transparent" />

      {/* Stone seal ring texture */}
      <svg className="absolute inset-0 w-full h-full opacity-25 pointer-events-none" aria-hidden="true">
        <defs>
          <pattern id="seal-ring-bg" width="120" height="120" patternUnits="userSpaceOnUse">
            <circle cx="60" cy="60" r="36" fill="none" stroke="#C9A45C" strokeWidth="0.3" strokeDasharray="2 4" opacity="0.4" />
            <circle cx="60" cy="60" r="24" fill="none" stroke="#C9A45C" strokeWidth="0.2" opacity="0.2" />
            <circle cx="60" cy="60" r="1" fill="#C9A45C" opacity="0.25" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#seal-ring-bg)" />
      </svg>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {/* Crystal Core icon */}
            <svg className="w-4 h-4 text-[#C9A45C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2 L18 9 L12 22 L6 9 Z" />
              <path d="M6 9 L18 9" strokeWidth="1" />
              <path d="M12 2 L12 22" strokeWidth="0.6" opacity="0.4" />
            </svg>
            <h3 className="text-lg font-bold font-civ-serif text-[#4A3825] dark:text-[oklch(0.85_0.04_80)]">
              {t("dashboard.skillLandscape")}
            </h3>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8C7655] dark:text-[oklch(0.6_0.012_80)] font-mono">
            <span className="w-1 h-1 rounded-full bg-[#C9A45C] animate-glow-pulse" />
            {userSkills.length} {t("nav.skills")}
          </span>
        </div>

        {userSkills.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="relative mb-4">
              <div className="absolute inset-0 rounded-full bg-[#C9A45C]/8 blur-xl animate-glow-pulse" />
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-10 h-10 text-[#C9A45C]/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2 L18 9 L12 22 L6 9 Z" />
                  <path d="M6 9 L18 9" strokeWidth="0.8" />
                  <path d="M12 2 L12 22" strokeWidth="0.5" opacity="0.3" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("dashboard.noSkillData")}
            </p>
          </div>
        ) : (
          <div className="relative flex items-center justify-center">
            {/* Crystal core glow behind emblem */}
            <div
              className="absolute w-16 h-16 rounded-full pointer-events-none animate-glow-pulse"
              style={{
                background: "radial-gradient(circle, oklch(0.72 0.12 80 / 0.12), transparent 70%)",
                zIndex: 0,
              }}
            />
            <div className="relative z-10">
              <AbilityEmblem scores={scores} size={200} labels={labels} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
