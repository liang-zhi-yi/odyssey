"use client";

import Link from "next/link";
import { useLocale } from "@/hooks/useLocale";
import type { UserQuest } from "@/types/quest";

interface ActiveQuestsWidgetProps {
  quests: UserQuest[];
  isLoading: boolean;
}

/**
 * Compact active quests widget for the Bento Grid.
 * Shows a list of 3-4 active quests with status indicators.
 */
export function ActiveQuestsWidget({ quests, isLoading }: ActiveQuestsWidgetProps) {
  const { t, locale } = useLocale();
  const isEn = locale === "en";

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-[oklch(0.88_0.02_90)] dark:border-[oklch(0.3_0.01_80)] bg-gradient-to-br from-[oklch(0.99_0.003_95)] to-[oklch(0.975_0.005_92)] dark:from-[oklch(0.22_0.008_85)] dark:to-[oklch(0.2_0.006_85)] p-6 shadow-card h-full">
        <div className="h-5 w-28 rounded-md bg-muted skeleton-shimmer mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 w-full rounded-md bg-muted skeleton-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  const active = quests.filter((q) => q.status === "ACCEPTED" || q.status === "IN_PROGRESS").slice(0, 4);

  return (
    <div className="group relative rounded-2xl border border-[oklch(0.88_0.02_90)] dark:border-[oklch(0.3_0.01_80)] bg-gradient-to-br from-[oklch(0.99_0.003_95)] to-[oklch(0.975_0.005_92)] dark:from-[oklch(0.22_0.008_85)] dark:to-[oklch(0.2_0.006_85)] p-5 shadow-card h-full overflow-hidden transition-all duration-300 hover:shadow-card-hover hover:border-[oklch(0.7_0.12_85_/_0.3)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <svg className="w-4 h-4 text-accent flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 22V4a1 1 0 011-1h12l-2 4 2 4H5" />
          </svg>
          <h3 className="text-base font-civ-serif font-bold text-[oklch(0.3_0.02_80)] dark:text-[oklch(0.85_0.04_80)] truncate">
            {t("dashboard.sections.activeExpeditions")}
          </h3>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[oklch(0.7_0.12_85_/_0.2)] bg-accent/[0.06] px-2.5 py-0.5 text-xs font-semibold text-accent font-mono">
          {active.length}
        </span>
      </div>
      {active.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-full bg-accent/[0.06] blur-xl animate-glow-pulse" />
            <div className="relative w-16 h-16 rounded-full border border-[oklch(0.7_0.12_85_/_0.2)] bg-gradient-to-br from-[oklch(0.99_0.003_95)] to-[oklch(0.96_0.008_88)] flex items-center justify-center">
              <svg className="w-7 h-7 text-accent/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2 L22 8.5 L22 15.5 L12 22 L2 15.5 L2 8.5 Z" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{t("dashboard.noActiveQuests")}</p>
          <Link
            href="/quests"
            className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
          >
            {t("dashboard.browseQuests")}
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {active.map((quest) => (
            <li key={quest.quest_id}>
              <Link
                href={`/quests/${quest.quest_id}`}
                className="group flex items-start gap-3 rounded-xl p-2 -mx-2 transition-all duration-300 hover:bg-secondary/50 hover:translate-x-0.5"
              >
                {/* Hexagon status icon */}
                <svg
                  className={`mt-1 h-3 w-3 flex-shrink-0 ${quest.status === "IN_PROGRESS" ? "animate-warm-pulse" : ""}`}
                  viewBox="0 0 24 24"
                  fill={quest.status === "IN_PROGRESS" ? "oklch(0.55 0.15 280)" : "oklch(0.7 0.12 85)"}
                  stroke="none"
                >
                  <path d="M12 2 L22 8.5 L22 15.5 L12 22 L2 15.5 L2 8.5 Z" />
                </svg>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {isEn && quest.quest_title_en ? quest.quest_title_en : quest.quest_title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {quest.submission_count > 0
                      ? `${quest.submission_count} ${t("dashboard.submissions")}`
                      : t("dashboard.noSubmissions")}
                  </p>
                </div>
                <svg className="h-4 w-4 flex-shrink-0 text-muted-foreground/40 mt-0.5 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
