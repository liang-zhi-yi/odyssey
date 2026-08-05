"use client";

import { useLocale } from "@/hooks/useLocale";

interface StreakWidgetProps {
  streakDays: number;
  totalQuests: number;
  isLoading: boolean;
}

/**
 * 文明火种 — 探索活动记录
 * 火种象征持续探索，水晶核心象征成就积累
 */
export function StreakWidget({ streakDays, totalQuests, isLoading }: StreakWidgetProps) {
  const { t } = useLocale();

  if (isLoading) {
    return (
      <div
        className="relative bg-gradient-to-br from-[#F7F2E8]/80 to-[#F0E8D8]/50 dark:from-[oklch(0.22_0.008_85)] dark:to-[oklch(0.2_0.006_85)] p-6 h-full"
        style={{ clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))" }}
      >
        <div className="h-5 w-20 bg-[#C9A45C]/15 skeleton-shimmer mb-4" />
        <div className="h-12 w-16 bg-[#C9A45C]/10 skeleton-shimmer" />
      </div>
    );
  }

  return (
    <div
      className="group relative bg-gradient-to-br from-[#F7F2E8]/70 to-[#F0E8D8]/40 dark:from-[oklch(0.22_0.008_85)] dark:to-[oklch(0.2_0.006_85)] p-5 h-full overflow-hidden transition-all duration-300 hover:from-[#F7F2E8]/90 hover:to-[#F0E8D8]/60"
      style={{ clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))" }}
    >
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-[#C9A45C]/40 to-transparent" />
      <div className="flex items-center gap-2 mb-4">
        {/* Fire Seed icon — 火种 */}
        <svg className="w-4 h-4 text-[#C9A45C] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2 C 8 6 6 10 8 14 C 9 16 11 17 12 17 C 13 17 15 16 16 14 C 18 10 16 6 12 2 Z" />
          <path d="M12 8 C 10 10 10 12 11 14 C 11.5 15 12.5 15 13 14 C 14 12 14 10 12 8 Z" opacity="0.5" strokeWidth="1" />
        </svg>
        <h3 className="text-base font-civ-serif font-bold text-[#4A3825] dark:text-[oklch(0.85_0.04_80)] truncate">
          {t("dashboard.sections.explorationActivity")}
        </h3>
      </div>

      <div className="space-y-5">
        {/* Streak — fire seed */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-[#C9A45C]/20 blur-md animate-glow-pulse" />
            <span className="relative flex h-10 w-10 items-center justify-center text-[#C9A45C]">
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2 C 8 6 6 10 8 14 C 9 16 11 17 12 17 C 13 17 15 16 16 14 C 18 10 16 6 12 2 Z" />
                <path d="M12 8 C 10 10 10 12 11 14 C 11.5 15 12.5 15 13 14 C 14 12 14 10 12 8 Z" opacity="0.5" strokeWidth="1" />
              </svg>
            </span>
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums text-[#4A3825] dark:text-[oklch(0.85_0.04_80)] transition-colors group-hover:text-[#C9A45C]">
              {streakDays}
            </p>
            <p className="text-xs text-[#8C7655] dark:text-[oklch(0.6_0.012_80)]">{t("dashboard.dayStreak")}</p>
          </div>
        </div>

        {/* Total quests — crystal core */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-[#925E46]/20 blur-md animate-glow-pulse" />
            <span className="relative flex h-10 w-10 items-center justify-center text-[#925E46]">
              {/* Crystal Core icon — 水晶核心 */}
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2 L18 9 L12 22 L6 9 Z" />
                <path d="M6 9 L18 9" strokeWidth="1" />
                <path d="M12 2 L12 22" strokeWidth="0.6" opacity="0.4" />
              </svg>
            </span>
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums text-[#4A3825] dark:text-[oklch(0.85_0.04_80)] transition-colors group-hover:text-[#C9A45C]">
              {totalQuests}
            </p>
            <p className="text-xs text-[#8C7655] dark:text-[oklch(0.6_0.012_80)]">{t("dashboard.questsCompleted")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
