"use client";

import { useLocale } from "@/hooks/useLocale";

interface StreakWidgetProps {
  streakDays: number;
  totalQuests: number;
  isLoading: boolean;
}

/**
 * Streak / activity snapshot widget for the Bento Grid.
 */
export function StreakWidget({ streakDays, totalQuests, isLoading }: StreakWidgetProps) {
  const { t } = useLocale();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-[oklch(0.88_0.02_90)] dark:border-[oklch(0.3_0.01_80)] bg-gradient-to-br from-[oklch(0.99_0.003_95)] to-[oklch(0.975_0.005_92)] dark:from-[oklch(0.22_0.008_85)] dark:to-[oklch(0.2_0.006_85)] p-6 shadow-card h-full">
        <div className="h-5 w-20 rounded-md bg-muted skeleton-shimmer mb-4" />
        <div className="h-12 w-16 rounded-md bg-muted skeleton-shimmer" />
      </div>
    );
  }

  return (
    <div className="group relative rounded-2xl border border-[oklch(0.88_0.02_90)] dark:border-[oklch(0.3_0.01_80)] bg-gradient-to-br from-[oklch(0.99_0.003_95)] to-[oklch(0.975_0.005_92)] dark:from-[oklch(0.22_0.008_85)] dark:to-[oklch(0.2_0.006_85)] p-5 shadow-card h-full overflow-hidden transition-all duration-300 hover:shadow-card-hover hover:border-[oklch(0.7_0.12_85_/_0.3)]">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-4 h-4 text-accent flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2C8 6 6 10 8 14a4 4 0 008 0c0-4-2-8-4-12z" />
        </svg>
        <h3 className="text-base font-civ-serif font-bold text-[oklch(0.3_0.02_80)] dark:text-[oklch(0.85_0.04_80)] truncate">
          {t("dashboard.sections.explorationActivity")}
        </h3>
      </div>

      <div className="space-y-5">
        {/* Streak */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-accent/20 blur-md animate-glow-pulse" />
            <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-lg">
              🔥
            </span>
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums text-foreground transition-colors group-hover:text-accent">
              {streakDays}
            </p>
            <p className="text-xs text-muted-foreground">{t("dashboard.dayStreak")}</p>
          </div>
        </div>

        {/* Total quests */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-md animate-glow-pulse" />
            <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg">
              ✨
            </span>
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums text-foreground transition-colors group-hover:text-accent">
              {totalQuests}
            </p>
            <p className="text-xs text-muted-foreground">{t("dashboard.questsCompleted")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
