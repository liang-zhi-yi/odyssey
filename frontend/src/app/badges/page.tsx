"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { badgeService } from "@/services/badge.service";
import { Loading } from "@/app/components/Loading";
import { ErrorState } from "@/app/components/ErrorState";
import { EmptyState } from "@/app/components/EmptyState";
import { BadgeCard } from "@/app/components/BadgeCard";
import type { BadgeDefinition, UserBadge } from "@/types/badge";

export default function BadgesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState<"earned" | "all">("earned");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const {
    data: allBadges = [],
    isLoading: catalogLoading,
    error: catalogError,
  } = useSWR(isAuthenticated ? "badges-catalog" : null, () =>
    badgeService.listBadges()
  );

  const {
    data: userBadges = [],
    isLoading: userBadgesLoading,
    error: userBadgesError,
  } = useSWR(isAuthenticated ? "user-badges" : null, () =>
    badgeService.listUserBadges()
  );

  if (authLoading || !isAuthenticated) {
    return <Loading text={t("auth.validating")} />;
  }

  const isLoading = catalogLoading || userBadgesLoading;
  const error = catalogError || userBadgesError;

  // Map user badges by badge_id for quick lookup
  const userBadgeMap = new Map<string, UserBadge>(
    userBadges.map((ub) => [ub.badge_id, ub])
  );

  const earnedBadges = allBadges.filter((b) => userBadgeMap.get(b.id)?.earned);
  const displayBadges = activeTab === "earned" ? earnedBadges : allBadges;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t("badges.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("badges.subtitle")}
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 rounded-lg bg-secondary p-1 w-fit">
        <button
          onClick={() => setActiveTab("earned")}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
            activeTab === "earned"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("badges.myBadges")}
          {earnedBadges.length > 0 && (
            <span className="ml-1.5 tabular-nums text-xs">
              ({earnedBadges.length})
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
            activeTab === "all"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("badges.allBadges")}
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <Loading variant="skeleton-cards" cardCount={3} />
      ) : error ? (
        <ErrorState message={t("common.error")} />
      ) : activeTab === "earned" && earnedBadges.length === 0 ? (
        <EmptyState
          title={t("badges.noBadges")}
          description={t("badges.noBadgesDesc")}
          actionLabel={t("badges.browseQuests")}
          actionHref="/quests"
        />
      ) : displayBadges.length === 0 ? (
        <EmptyState
          title={t("badges.noBadges")}
          description={t("badges.noBadgesDesc")}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayBadges.map((badge: BadgeDefinition) => (
            <BadgeCard
              key={badge.id}
              badge={badge}
              userBadge={userBadgeMap.get(badge.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
