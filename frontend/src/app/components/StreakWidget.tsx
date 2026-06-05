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
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="h-5 w-20 rounded-md bg-muted skeleton-shimmer mb-4" />
        <div className="h-12 w-16 rounded-md bg-muted skeleton-shimmer" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <h3 className="text-lg font-semibold mb-4">{t("dashboard.activity")}</h3>

      <div className="space-y-5">
        {/* Streak */}
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-lg">
            🔥
          </span>
          <div>
            <p className="text-2xl font-bold tabular-nums text-foreground">
              {streakDays}
            </p>
            <p className="text-xs text-muted-foreground">{t("dashboard.dayStreak")}</p>
          </div>
        </div>

        {/* Total quests */}
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg">
            ✨
          </span>
          <div>
            <p className="text-2xl font-bold tabular-nums text-foreground">
              {totalQuests}
            </p>
            <p className="text-xs text-muted-foreground">{t("dashboard.questsCompleted")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
