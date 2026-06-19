"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { badgeService } from "@/services/badge.service";
import { BadgeCard } from "@/app/components/BadgeCard";
import { Loading } from "@/app/components/Loading";
import { ErrorState } from "@/app/components/ErrorState";
import { EmptyState } from "@/app/components/EmptyState";
import type { BadgeDefinition, UserBadge } from "@/types/badge";

type CategoryId = "all" | "milestone" | "mastery" | "ranking";

const CATEGORIES: { id: CategoryId; key: string }[] = [
  { id: "all", key: "badges.allBadges" },
  { id: "milestone", key: "badges.categories.milestone" },
  { id: "mastery", key: "badges.categories.mastery" },
  { id: "ranking", key: "badges.categories.ranking" },
];

export default function BadgesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, locale } = useLocale();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<CategoryId>("all");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const { data: allBadges = [], isLoading: badgesLoading, error: badgesError } = useSWR(
    isAuthenticated ? "badges-catalog" : null,
    () => badgeService.listBadges().catch(() => [] as BadgeDefinition[]),
    { revalidateOnFocus: false, dedupingInterval: 300000 }
  );

  const { data: userBadges = [], isLoading: userBadgesLoading } = useSWR(
    isAuthenticated ? "user-badges-all" : null,
    () => badgeService.listUserBadges().catch(() => [] as UserBadge[]),
    { revalidateOnFocus: false, dedupingInterval: 120000 }
  );

  const userBadgeMap = useMemo(() => {
    const map = new Map<string, UserBadge>();
    for (const ub of userBadges) {
      map.set(ub.badge_id, ub);
    }
    return map;
  }, [userBadges]);

  const filteredBadges = useMemo(() => {
    if (activeCategory === "all") return allBadges;
    return allBadges.filter((b) => b.category === activeCategory);
  }, [allBadges, activeCategory]);

  const earnedCount = useMemo(
    () => allBadges.filter((b) => userBadgeMap.get(b.id)?.earned).length,
    [allBadges, userBadgeMap]
  );

  if (authLoading || !isAuthenticated) {
    return <Loading text={t("auth.validating")} />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 py-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">{t("badges.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("badges.subtitle")}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {earnedCount} / {allBadges.length} {locale === "en" ? "earned" : "已获得"}
        </p>
      </div>

      {/* Category filter tabs */}
      <div className="flex gap-1 rounded-lg bg-secondary p-1 w-fit flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
              activeCategory === cat.id
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(cat.key)}
          </button>
        ))}
      </div>

      {/* Badge grid */}
      {badgesLoading || userBadgesLoading ? (
        <Loading variant="skeleton-cards" cardCount={6} />
      ) : badgesError ? (
        <ErrorState message={t("badges.noBadgesDesc")} />
      ) : filteredBadges.length === 0 ? (
        <EmptyState
          title={t("badges.noBadges")}
          description={t("badges.noBadgesDesc")}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 animate-stagger">
          {filteredBadges.map((badge) => (
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
