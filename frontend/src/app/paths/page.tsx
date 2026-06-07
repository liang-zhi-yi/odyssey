"use client";

import { useState, useEffect, useCallback } from "react";
import useSWR, { useSWRConfig } from "swr";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { learningPathService } from "@/services/learningPath.service";
import { questService } from "@/services/quest.service";
import { worldService } from "@/services/world.service";
import { LearningPathCard } from "@/app/components/LearningPathCard";
import { QuestCard } from "@/app/components/QuestCard";
import { PathGeneratorForm } from "@/app/components/PathGeneratorForm";
import { CivilizationPlanner } from "@/app/components/CivilizationPlanner";
import { CivilizationStatsBar } from "@/app/components/CivilizationStatsBar";
import { Loading } from "@/app/components/Loading";
import { ErrorState } from "@/app/components/ErrorState";
import { EmptyState } from "@/app/components/EmptyState";
import type { LearningPath, NextCheckpoint, PathStatsSummary } from "@/types/learningPath";
import type { QuestListItem, UserQuest } from "@/types/quest";
import type { World, CivilizationDirection } from "@/types/world";

type TabId = "my" | "preset" | "create" | "checkpoint";

const TABS: { id: TabId; key: string }[] = [
  { id: "my", key: "paths.tabs.my" },
  { id: "preset", key: "paths.tabs.preset" },
  { id: "create", key: "paths.tabs.create" },
  { id: "checkpoint", key: "paths.tabs.checkpoint" },
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

  // Fetch preset paths
  const {
    data: presetPaths = [],
    isLoading: presetPathsLoading,
    error: presetPathsError,
  } = useSWR(
    isAuthenticated && activeTab === "preset" ? "preset-learning-paths" : null,
    () => learningPathService.listPresetPaths().catch(() => [])
  );

  // Fetch next checkpoint (for checkpoint tab)
  const {
    data: nextCheckpoint,
    isLoading: checkpointLoading,
    error: checkpointError,
  } = useSWR<NextCheckpoint | null>(
    isAuthenticated && activeTab === "checkpoint" ? "next-checkpoint" : null,
    () => learningPathService.getNextCheckpoint().catch(() => null)
  );
  const hasActivePath = !!(nextCheckpoint && nextCheckpoint.path_id);

  // Fetch path node quests (for checkpoint tab)
  const {
    data: pathNodeQuests = [],
    isLoading: pathNodeLoading,
    error: pathNodeError,
  } = useSWR(
    isAuthenticated && activeTab === "checkpoint" ? "path-node-quests" : null,
    () => questService.listPathNodeQuests().catch(() => [])
  );

  // Fetch user quests for status badges on checkpoint quests
  const { data: userQuests = [] } = useSWR(
    isAuthenticated && activeTab === "checkpoint" ? "user-quests" : null,
    () => questService.listUserQuests().catch(() => [])
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

  const handleSelectPreset = useCallback(
    (pathId: string) => {
      router.push(`/paths/${pathId}`);
    },
    [router]
  );

  const handlePathCreated = useCallback(
    (_pathId: string) => {
      // Revalidate checkpoint-related caches so the checkpoint tab reflects new data
      mutate("next-checkpoint");
      mutate("path-node-quests");
      // Also revalidate user paths list
      mutate("user-learning-paths");
      // Auto-switch to checkpoint tab after a brief delay (let SWR revalidate)
      setTimeout(() => setActiveTab("checkpoint"), 500);
    },
    [mutate]
  );

  if (authLoading || !isAuthenticated) {
    return <Loading text={t("auth.validating")} />;
  }

  const acceptedQuestIds = new Set(userQuests.map((uq: UserQuest) => uq.quest_id));
  const userQuestMap = new Map(
    userQuests.map((uq: UserQuest) => [uq.quest_id, uq])
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold">{t("paths.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("paths.subtitle")}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-secondary p-1 w-fit flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(tab.key)}
          </button>
        ))}
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

      {/* ── Tab: Preset Paths ──────────────────────────────── */}
      {activeTab === "preset" &&
        (presetPathsLoading ? (
          <Loading variant="skeleton-cards" cardCount={4} />
        ) : presetPathsError ? (
          <ErrorState message={t("paths.loadPresetError")} />
        ) : presetPaths.length === 0 ? (
          <EmptyState
            title={t("paths.noAvailablePaths")}
            description={t("paths.comingSoon")}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 animate-stagger">
            {presetPaths.map((path: LearningPath) => (
              <div key={path.id} className="card-hover">
                <LearningPathCard
                  path={path}
                  onSelect={handleSelectPreset}
                  worldBuildings={worldBuildings}
                />
              </div>
            ))}
          </div>
        ))}

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

      {/* ── Tab: Path Checkpoints ──────────────────────────── */}
      {activeTab === "checkpoint" && (
        <>
          {checkpointLoading ? (
            <Loading text={t("common.loading")} />
          ) : checkpointError ? (
            <ErrorState message={t("quests.loadPathQuestsError")} />
          ) : !hasActivePath ? (
            <EmptyState
              title={t("quests.noPathSelected")}
              description={t("quests.noPathSelectedDesc")}
              actionLabel={t("paths.goSelectPath")}
              actionHref="/paths"
            />
          ) : (
            <>
              {/* Current checkpoint info */}
              {nextCheckpoint && (
                <div className="rounded-xl border border-border bg-background p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <svg
                      className="h-5 w-5 text-primary flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <h3 className="text-sm font-semibold">
                      {nextCheckpoint.path_title}
                    </h3>
                  </div>

                  {/* Path breadcrumb */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                    <span className="rounded-md bg-secondary px-2 py-0.5">
                      {nextCheckpoint.path_title}
                    </span>
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    <span className="rounded-md bg-secondary px-2 py-0.5">
                      {locale === "en" && nextCheckpoint.milestone_title_en
                        ? nextCheckpoint.milestone_title_en
                        : nextCheckpoint.milestone_title}
                    </span>
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    <span className="font-medium text-foreground">
                      {locale === "en" && nextCheckpoint.checkpoint_title_en
                        ? nextCheckpoint.checkpoint_title_en
                        : nextCheckpoint.checkpoint_title}
                    </span>
                  </div>

                  {/* Current checkpoint highlight */}
                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-medium text-primary">
                          {t("paths.currentCheckpoint")}：
                          {locale === "en" && nextCheckpoint.checkpoint_title_en
                            ? nextCheckpoint.checkpoint_title_en
                            : nextCheckpoint.checkpoint_title}
                        </span>
                        {nextCheckpoint.skill_name && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {t("paths.skill")}:{" "}
                            {nextCheckpoint.skill_name}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {t("quests.requiredScore")} ≥ {nextCheckpoint.required_score}
                      </span>
                    </div>
                  </div>

                  {/* Navigate to full path */}
                  <a
                    href={`/paths/${nextCheckpoint.path_id}`}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    {t("paths.viewFullPath")}
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </div>
              )}

              {/* Path node quests */}
              {pathNodeLoading ? (
                <Loading variant="skeleton-cards" cardCount={4} />
              ) : pathNodeError ? (
                <ErrorState message={t("quests.loadPathQuestsError")} />
              ) : pathNodeQuests.length === 0 ? (
                <EmptyState
                  title={t("quests.noPathNode")}
                  description={t("quests.noPathNodeDesc")}
                />
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 animate-stagger">
                  {pathNodeQuests.map((quest: QuestListItem) => (
                    <div key={quest.id} className="relative card-hover">
                      {acceptedQuestIds.has(quest.id) && (
                        <span className="absolute -top-1 -right-1 z-10 rounded-full bg-success px-2 py-0.5 text-[10px] font-medium text-success-foreground shadow-sm">
                          {userQuestMap.get(quest.id)?.status || "ACCEPTED"}
                        </span>
                      )}
                      <QuestCard quest={quest} />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
