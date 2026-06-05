"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { skillService } from "@/services/skill.service";
import { progressService } from "@/services/progress.service";
import { questService } from "@/services/quest.service";
import { learningPathService } from "@/services/learningPath.service";
import { worldService } from "@/services/world.service";
import { analyticsService } from "@/services/analytics.service";
import { DashboardHero } from "@/app/components/DashboardHero";
import { SkillGrowthRadar } from "@/app/components/SkillGrowthRadar";
import { ActiveQuestsWidget } from "@/app/components/ActiveQuestsWidget";
import { GrowthInsightsWidget } from "@/app/components/GrowthInsightsWidget";
import { PathProgressTimeline } from "@/app/components/PathProgressTimeline";
import { WorldSnapshotWidget } from "@/app/components/WorldSnapshotWidget";
import { StreakWidget } from "@/app/components/StreakWidget";
import { InsightCard } from "@/app/components/InsightCard";
import { Loading } from "@/app/components/Loading";
import type { UserSkill } from "@/types/skill";
import type { LearningPath } from "@/types/learningPath";

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // ─── Data fetching ───────────────────────────────────────

  // User skills
  const {
    data: userSkills = [],
    isLoading: skillsLoading,
    error: skillsError,
  } = useSWR(isAuthenticated ? "user-skills" : null, () =>
    skillService.listUserSkills()
  );

  // Skill trends for sparklines
  const skillIds = userSkills.map(s => s.skill_id);
  const { data: trendsData } = useSWR(
    skillIds.length > 0 ? `skill-trends-${skillIds.join("-")}` : null,
    async () => {
      const results = await Promise.all(
        skillIds.map(id => skillService.getSkillTrend(id, 30).catch(() => []))
      );
      return Object.fromEntries(skillIds.map((id, i) => [id, results[i]]));
    }
  );

  // Learning paths
  const {
    data: allPaths = [],
    isLoading: allPathsLoading,
  } = useSWR(isAuthenticated ? "all-paths" : null, () =>
    learningPathService.listPaths()
  );

  const currentPath: LearningPath | null =
    allPaths.find((p) => p.status === "ACTIVE") ?? allPaths[0] ?? null;

  useEffect(() => {
    if (currentPath?.id && !selectedPathId) {
      setSelectedPathId(currentPath.id);
    }
  }, [currentPath, selectedPathId]);

  // Path growth data
  const {
    data: pathGrowth,
    isLoading: pathGrowthLoading,
  } = useSWR(
    selectedPathId ? `path-growth-${selectedPathId}` : null,
    () => progressService.getPathGrowth(selectedPathId!)
  );

  const pathDatasets = pathGrowth?.skills
    .filter((s) => s.points.length > 0)
    .map((s) => ({
      name: s.skill_name,
      points: s.points,
    })) || [];

  // User quests (for active quests widget)
  const {
    data: userQuests = [],
    isLoading: questsLoading,
  } = useSWR(isAuthenticated ? "user-quests-dashboard" : null, () =>
    questService.listUserQuests().catch(() => [])
  );

  // World data
  const {
    data: worldData,
    isLoading: worldLoading,
  } = useSWR(isAuthenticated ? "world-dashboard" : null, () =>
    worldService.getWorld().catch(() => null)
  );

  // AI insights
  const {
    data: insightsData,
    isLoading: insightsLoading,
  } = useSWR(isAuthenticated ? "analytics-insights" : null, () =>
    analyticsService.getInsights().catch(() => null)
  );

  // ─── Derived values ──────────────────────────────────────

  const questsCompleted = userQuests.filter(
    (q) => q.status === "PASSED"
  ).length;

  const activePathCount = allPaths.filter((p) => p.status === "ACTIVE").length;

  const worldTier = (worldData?.tier ? parseInt(worldData.tier_score as unknown as string, 10) || 1 : 0);
  const buildingCount = worldData?.buildings?.length ?? 0;
  const regionCount = worldData?.regions?.length ?? 0;

  // ─── Auth guard ──────────────────────────────────────────

  if (authLoading || !isAuthenticated) {
    return <Loading text={t("auth.validating")} />;
  }

  const isAnyLoading = skillsLoading || allPathsLoading;

  // ─── Render ──────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-8 animate-fade-in">
      {/* ── Hero Section ─────────────────────────────────── */}
      <DashboardHero
        userSkills={userSkills}
        currentPath={currentPath}
        worldTier={worldTier}
        questsCompleted={questsCompleted}
        isLoading={isAnyLoading}
      />

      {/* ── AI Insights (conditional) ─────────────────────── */}
      {!insightsLoading &&
        insightsData?.insights &&
        insightsData.insights.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {insightsData.insights.slice(0, 3).map((insight, i) => (
              <InsightCard key={i} insight={insight} />
            ))}
          </div>
        )}

      {/* ── Bento Grid ────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Large: Skill radar (2 cols × 1 row) */}
        <div className="md:col-span-2 lg:col-span-2">
          <SkillGrowthRadar
            userSkills={userSkills}
            isLoading={skillsLoading}
          />
        </div>

        {/* Medium: Active quests (1 col) */}
        <div className="lg:col-span-1">
          <ActiveQuestsWidget
            quests={userQuests}
            isLoading={questsLoading}
          />
        </div>

        {/* Medium: Growth insights (1 col) */}
        <div className="lg:col-span-1">
          <GrowthInsightsWidget
            insights={insightsData?.insights || []}
            isLoading={insightsLoading}
          />
        </div>

        {/* Wide: Path progress timeline (full row) */}
        <div className="md:col-span-2 lg:col-span-4">
          <PathProgressTimeline
            allPaths={allPaths}
            selectedPathId={selectedPathId}
            onSelectPath={setSelectedPathId}
            pathDatasets={pathDatasets}
            pathName={pathGrowth?.path_name}
            isLoading={pathGrowthLoading || allPathsLoading}
          />
        </div>

        {/* Small: World snapshot (1 col) */}
        <div className="lg:col-span-1">
          <WorldSnapshotWidget
            worldTier={worldTier}
            buildingCount={buildingCount}
            regionCount={regionCount}
            activePathCount={activePathCount}
            isLoading={worldLoading}
          />
        </div>

        {/* Small: Streak / activity (1 col) */}
        <div className="lg:col-span-1">
          <StreakWidget
            streakDays={0}
            totalQuests={questsCompleted}
            isLoading={questsLoading}
          />
        </div>

        {/* Medium: Recent skills (2 cols) */}
        <div className="md:col-span-2 lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h3 className="text-lg font-semibold mb-4">{t("dashboard.recentSkills")}</h3>
            {skillsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-4 w-full rounded-md bg-muted skeleton-shimmer" />
                ))}
              </div>
            ) : userSkills.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {t("dashboard.noSkillData")}
              </p>
            ) : (
              <div className="space-y-2">
                {userSkills.slice(0, 5).map((skill) => (
                  <div
                    key={skill.skill_id}
                    className="flex items-center justify-between rounded-xl px-3 py-2 transition-colors hover:bg-secondary/50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="h-2 w-2 flex-shrink-0 rounded-full"
                        style={{
                          backgroundColor: skillMasteryColor(skill.overall),
                        }}
                      />
                      <span className="text-sm font-medium text-foreground truncate">
                        {skill.skill_name}
                      </span>
                    </div>
                    <span className="ml-2 text-sm font-semibold tabular-nums text-muted-foreground flex-shrink-0">
                      {skill.overall}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Return a mastery-level color based on score percentage. */
function skillMasteryColor(score: number): string {
  if (score >= 75) return "oklch(0.7 0.12 85)";   // Gold — master
  if (score >= 50) return "oklch(0.55 0.08 160)";   // Sage — proficient
  if (score >= 25) return "oklch(0.6 0.1 155)";     // Light sage — developing
  return "oklch(0.85 0.005 90)";                     // Warm gray — beginner
}
