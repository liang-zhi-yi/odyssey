"use client";

import { useEffect } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { questService } from "@/services/quest.service";
import { QuestCenterCard } from "@/app/components/QuestCenterCard";
import { Loading } from "@/app/components/Loading";
import { ErrorState } from "@/app/components/ErrorState";
import { EmptyState } from "@/app/components/EmptyState";
import type { QuestListItem, UserQuest } from "@/types/quest";

export default function QuestsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useLocale();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch recommended quests
  const {
    data: recommendedQuests = [],
    isLoading: recommendedLoading,
    error: recommendedError,
  } = useSWR(
    isAuthenticated ? "recommended-quests" : null,
    () => questService.listRecommendedQuests()
  );

  // Fetch user's quests (for status badges on recommended cards)
  const {
    data: userQuests = [],
  } = useSWR(
    isAuthenticated ? "user-quests" : null,
    () => questService.listUserQuests()
  );

  if (authLoading || !isAuthenticated) {
    return <Loading text={t("auth.validating")} />;
  }

  const acceptedQuestIds = new Set(userQuests.map((uq: UserQuest) => uq.quest_id));
  const userQuestMap = new Map(
    userQuests.map((uq: UserQuest) => [uq.quest_id, uq])
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-8 relative overflow-hidden">
      <div>
        <h1 className="text-2xl font-bold font-civ-serif text-[oklch(0.3_0.02_80)]">{t("quests.title")}</h1>
        <p className="mt-1 text-sm font-civ-serif text-[oklch(0.5_0.02_85)]">
          {t("quests.subtitle")}
        </p>
      </div>

      {/* Daily Recommendations header */}
      <div className="rounded-2xl border border-border bg-primary/5 p-5">
        <div className="flex items-center gap-2">
          <svg
            className="h-5 w-5 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <div>
            <h2 className="text-sm font-semibold">{t("quests.todayRecommendation")}</h2>
            <p className="text-xs text-muted-foreground">
              {t("quests.dailyDesc")}
            </p>
          </div>
        </div>
      </div>

      {recommendedLoading ? (
        <Loading variant="skeleton-cards" cardCount={4} />
      ) : recommendedError ? (
        <ErrorState message={t("quests.loadRecommendedError")} />
      ) : recommendedQuests.length === 0 ? (
        <EmptyState
          title={t("quests.noRecommended")}
          description={t("quests.allAccepted")}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-stagger">
          {recommendedQuests.map((quest: QuestListItem) => (
            <div key={quest.id} className="card-hover">
              <QuestCenterCard
                quest={quest}
                userQuest={
                  acceptedQuestIds.has(quest.id)
                    ? userQuestMap.get(quest.id)
                    : undefined
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
