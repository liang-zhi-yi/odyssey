"use client";

import { useState, useEffect, useCallback } from "react";
import useSWR, { useSWRConfig } from "swr";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { learningPathService } from "@/services/learningPath.service";
import { worldService } from "@/services/world.service";
import { LearningPathCard } from "@/app/components/LearningPathCard";
import { CivilizationPlanner } from "@/app/components/CivilizationPlanner";
import { CivilizationStatsBar } from "@/app/components/CivilizationStatsBar";
import { Loading } from "@/app/components/Loading";
import { ErrorState } from "@/app/components/ErrorState";
import { EmptyState } from "@/app/components/EmptyState";
import type { LearningPath, PathStatsSummary } from "@/types/learningPath";
import type { World, CivilizationDirection } from "@/types/world";

type TabId = "my" | "create";

const TABS: { id: TabId; key: string }[] = [
  { id: "my", key: "paths.tabs.my" },
  { id: "create", key: "paths.tabs.create" },
];

export default function PathsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, locale } = useLocale();
  const { mutate } = useSWRConfig();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("my");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch user's learning paths
  const {
    data: userPaths = [],
    isLoading: userPathsLoading,
    error: userPathsError,
  } = useSWR(
    isAuthenticated && activeTab === "my" ? "user-learning-paths" : null,
    () => learningPathService.listPaths().catch(() => [])
  );

  // Fetch world state for building pills on learning path cards
  const {
    data: worldData,
    isLoading: worldLoading,
  } = useSWR<World | null>(
    isAuthenticated ? "world" : null,
    () => worldService.getWorld().catch(() => null),
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );
  const worldBuildings = worldData?.buildings ?? [];

  // Fetch civilization direction for planner
  const {
    data: directionData,
    isLoading: directionLoading,
  } = useSWR<CivilizationDirection | null>(
    isAuthenticated ? "civilization-direction" : null,
    () => worldService.getCivilizationDirection().catch(() => null),
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  // Fetch path stats summary for civilization overview bar
  const {
    data: pathStats,
    isLoading: statsLoading,
  } = useSWR<PathStatsSummary | null>(
    isAuthenticated ? "path-stats-summary" : null,
    () => learningPathService.getPathStatsSummary().catch(() => null),
    { revalidateOnFocus: true, dedupingInterval: 30000 }
  );

  const handlePathCreated = useCallback(
    (_pathId: string) => {
      // Revalidate user paths list
      mutate("user-learning-paths");
      // Auto-switch to My Paths tab after a brief delay (let SWR revalidate)
      setTimeout(() => setActiveTab("my"), 500);
    },
    [mutate]
  );

  if (authLoading || !isAuthenticated) {
    return <Loading text={t("auth.validating")} />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-8">
      <div>
        <h1 className="text-2xl font-bold font-civ-serif text-[oklch(0.35_0.12_85)] dark:text-[oklch(0.85_0.04_80)] flex items-center gap-2">
          <span>📜</span> {t("paths.title")}
        </h1>
        <p className="mt-1.5 text-xs italic text-[oklch(0.5_0.02_85)]">
          {t("paths.subtitle")}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-double border-[oklch(0.7_0.12_85_/_0.55)] w-full gap-2">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-t-xl px-5 py-2 text-sm font-bold font-civ-serif transition-all duration-300 relative border-x border-t -mb-[1px] ${
                isActive
                  ? "bg-gradient-to-t from-[oklch(0.99_0.003_95)] to-[oklch(0.975_0.005_92)] dark:from-[oklch(0.22_0.008_85)] dark:to-[oklch(0.2_0.006_85)] text-[oklch(0.35_0.12_85)] border-[oklch(0.7_0.12_85_/_0.55)] shadow-sm"
                  : "text-muted-foreground hover:text-foreground border-transparent hover:bg-secondary/40"
              }`}
            >
              {tab.id === "my" ? "🧭 " : "🛠️ "}
              {t(tab.key)}
            </button>
          );
        })}
      </div>

      {/* ── Tab: My Paths ──────────────────────────────────── */}
      {activeTab === "my" && (
        <>
          {/* Civilization Stats Overview — only on My Paths tab */}
          <CivilizationStatsBar stats={pathStats ?? null} isLoading={statsLoading} />
          {userPathsLoading ? (
          <Loading variant="skeleton-cards" cardCount={4} />
        ) : userPathsError ? (
          <ErrorState message={t("paths.loadMyError")} />
        ) : userPaths.length === 0 ? (
          <EmptyState
            title={t("paths.noPaths")}
            description={t("paths.noPathsDesc")}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 animate-stagger">
            {userPaths.map((path: LearningPath) => (
              <div key={path.id} className="card-hover">
                <LearningPathCard path={path} worldBuildings={worldBuildings} />
              </div>
            ))}
          </div>
        )}
        </>
      )}

      {/* ── Tab: Create Path (Civilization Planner) ──────────── */}
      {activeTab === "create" && (
        <CivilizationPlanner
          world={worldData ?? null}
          direction={directionData ?? null}
          isWorldLoading={worldLoading}
          isDirectionLoading={directionLoading}
          activePathsCount={(userPaths as LearningPath[]).filter(
            (p) => p.status === "ACTIVE"
          ).length}
          onPathCreated={handlePathCreated}
        />
      )}

    </div>
  );
}
