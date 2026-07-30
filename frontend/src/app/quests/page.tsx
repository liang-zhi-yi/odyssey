"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { questService } from "@/services/quest.service";
import { QuestCenterCard } from "@/app/components/QuestCenterCard";
import { Loading } from "@/app/components/Loading";
import { ErrorState } from "@/app/components/ErrorState";
import { EmptyState } from "@/app/components/EmptyState";
import {
  SUBMISSION_STATUS_LABELS,
  type QuestListItem,
  type UserQuest,
  type SubmissionStatus,
} from "@/types/quest";

type TabKey = "recommended" | "myQuests";

export default function QuestsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, locale } = useLocale();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("recommended");

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

  // Fetch user's quests (for status badges on recommended cards + my tasks tab)
  const {
    data: userQuests = [],
    isLoading: myQuestsLoading,
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

  // Status badge colors
  const statusBadgeClass = (status: SubmissionStatus): string => {
    switch (status) {
      case "PASSED":
        return "bg-[#8B9D83]/15 text-[#5C7A5C] border-[#8B9D83]/30";
      case "FAILED":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "ASSESSING":
      case "SUBMITTED":
        return "bg-[#C4A77D]/15 text-[#8B7355] border-[#C4A77D]/30";
      case "ACCEPTED":
      case "IN_PROGRESS":
        return "bg-primary/10 text-primary border-primary/20";
      case "ABANDONED":
        return "bg-muted text-muted-foreground border-border";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    {
      key: "recommended",
      label: t("quests.todayRecommendation"),
      icon: "💡",
    },
    {
      key: "myQuests",
      label: locale === "zh" ? "我的任务" : "My Tasks",
      icon: "📋",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8 relative overflow-hidden">
      <div>
        <h1 className="text-2xl font-bold font-civ-serif text-[oklch(0.3_0.02_80)]">{t("quests.title")}</h1>
        <p className="mt-1 text-sm font-civ-serif text-[oklch(0.5_0.02_85)]">
          {t("quests.subtitle")}
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex rounded-xl border border-border bg-card p-1 shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
              activeTab === tab.key
                ? "bg-gradient-to-br from-[#8B9D83]/15 to-[#8B9D83]/5 text-[#5C7A5C] border border-[#8B9D83]/30 shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 border border-transparent"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.key === "myQuests" && userQuests.length > 0 && (
              <span className="ml-1 rounded-full bg-[#8B9D83]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#5C7A5C]">
                {userQuests.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "recommended" && (
        <div className="space-y-4">
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
      )}

      {activeTab === "myQuests" && (
        <div className="space-y-4">
          {myQuestsLoading ? (
            <Loading variant="skeleton-cards" cardCount={3} />
          ) : userQuests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border rounded-2xl bg-card px-6">
              <div className="mb-4 flex items-center justify-center w-14 h-14 rounded-full bg-secondary/80 border border-border/40 text-2xl">
                📋
              </div>
              <h3 className="text-base font-bold">
                {locale === "zh" ? "暂无任务" : "No Tasks Yet"}
              </h3>
              <p className="mt-2 text-xs text-muted-foreground italic max-w-xs">
                {locale === "zh"
                  ? "你还没有接受任何任务，去每日推荐接受任务吧"
                  : "You haven't accepted any quests yet. Check the daily recommendations."}
              </p>
              <button
                onClick={() => setActiveTab("recommended")}
                className="mt-5 rounded-lg bg-primary text-primary-foreground border border-primary/20 px-5 py-2 text-xs font-bold tracking-wide hover:bg-primary/90 transition-all shadow-sm"
              >
                {locale === "zh" ? "去接受任务" : "Accept a Quest"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-stagger">
              {userQuests.map((uq: UserQuest) => (
                <Link
                  key={uq.quest_id}
                  href={`/quests/${uq.quest_id}`}
                  className="block rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:shadow-card-hover hover:border-[#8B9D83]/30 card-hover"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="text-sm font-semibold line-clamp-2 flex-1">
                      {locale === "en" && uq.quest_title_en
                        ? uq.quest_title_en
                        : uq.quest_title}
                    </h3>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusBadgeClass(
                        uq.status
                      )}`}
                    >
                      {SUBMISSION_STATUS_LABELS[uq.status] || uq.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>
                      {locale === "zh" ? "提交次数" : "Submissions"}:{" "}
                      {uq.submission_count}
                    </span>
                    <span className="text-[#8B9D83] font-medium">
                      {locale === "zh" ? "查看详情 →" : "View Details →"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
