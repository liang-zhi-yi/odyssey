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
  const { t } = useLocale();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
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
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{t("dashboard.activeQuests")}</h3>
        <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
          {active.length}
        </span>
      </div>
      {active.length === 0 ? (
        <div className="py-4 text-center">
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
                className="group flex items-start gap-3 rounded-xl p-2 -mx-2 transition-colors hover:bg-secondary/50"
              >
                {/* Status dot */}
                <span
                  className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${
                    quest.status === "IN_PROGRESS" ? "bg-primary animate-warm-pulse" : "bg-accent"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {quest.quest_title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {quest.submission_count > 0 && `${quest.submission_count} submissions`}
                  </p>
                </div>
                <svg className="h-4 w-4 flex-shrink-0 text-muted-foreground/40 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
