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

  // Analytics summary (for streak, etc.)
  const {
    data: analyticsSummary,
  } = useSWR(isAuthenticated ? "analytics-summary" : null, () =>
    analyticsService.getSummary().catch(() => null)
  );

  // ─── Derived values ──────────────────────────────────────

  const questsCompleted = userQuests.filter(
    (q) => q.status === "PASSED"
  ).length;

  const activePathCount = allPaths.filter((p) => p.status === "ACTIVE").length;

  const worldTier = (worldData?.tier ? parseInt(worldData.tier_score as unknown as string, 10) || 1 : 0);
  const buildingCount = (worldData?.buildings?.length ?? 0) + (worldData?.compound_buildings?.length ?? 0);
  const regionCount = worldData?.regions?.length ?? 0;

  // ─── Auth guard ──────────────────────────────────────────

  if (authLoading || !isAuthenticated) {
    return <Loading text={t("auth.validating")} />;
  }

  const isAnyLoading = skillsLoading || allPathsLoading;

  // ─── Render ──────────────────────────────────────────────

  return (
    <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8 animate-fade-in">
      {/* ── Subtle page background texture ── */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.4] dark:opacity-[0.2]" aria-hidden="true">
        <svg className="w-full h-full">
          <defs>
            <pattern id="dash-bg-hex" width="80" height="138" patternUnits="userSpaceOnUse" patternTransform="scale(0.8)">
              <path d="M40 5 L72 22 L72 56 L40 73 L8 56 L8 22 Z" fill="none" stroke="oklch(0.55 0.08 160 / 0.04)" strokeWidth="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dash-bg-hex)" />
        </svg>
      </div>

      <div className="relative space-y-7">
        {/* ── Hero: Civilization Nexus ───────────────────── */}
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

        {/* ── Section: Capability Domain (核心能力) ─────── */}
        <section className="space-y-3">
          <SectionHeader
            icon="domain"
            title={t("dashboard.sections.capabilityDomain")}
            desc={t("dashboard.sections.capabilityDomainDesc")}
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Large: Skill radar (2 cols) */}
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
          </div>
        </section>

        {/* ── Section: Growth Trajectory (成长轨迹) ─────── */}
        <section className="space-y-3">
          <SectionHeader
            icon="trajectory"
            title={t("dashboard.sections.growthTrajectory")}
            desc={t("dashboard.sections.growthTrajectoryDesc")}
          />
          <PathProgressTimeline
            allPaths={allPaths}
            selectedPathId={selectedPathId}
            onSelectPath={setSelectedPathId}
            pathDatasets={pathDatasets}
            pathName={pathGrowth?.path_name}
            isLoading={pathGrowthLoading || allPathsLoading}
          />
        </section>

        {/* ── Section: Civilization World (文明世界) ────── */}
        <section className="space-y-3">
          <SectionHeader
            icon="world"
            title={t("dashboard.sections.civilizationWorld")}
            desc={t("dashboard.sections.civilizationWorldDesc")}
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                streakDays={analyticsSummary?.streak_days ?? 0}
                totalQuests={questsCompleted}
                isLoading={questsLoading}
              />
            </div>

            {/* Medium: Recent skills / Skill Codex (2 cols) */}
            <div className="md:col-span-2 lg:col-span-2">
              <SkillCodexCard
                userSkills={userSkills}
                isLoading={skillsLoading}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */

/** Section header with icon, title, and description — establishes visual hierarchy. */
function SectionHeader({
  icon,
  title,
  desc,
}: {
  icon: "domain" | "trajectory" | "world";
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-center gap-3 px-1">
      <div className="flex items-center justify-center w-8 h-8 rounded-lg border border-[oklch(0.7_0.12_85_/_0.25)] bg-gradient-to-br from-[oklch(0.99_0.003_95)] to-[oklch(0.96_0.008_88)] dark:from-[oklch(0.22_0.008_85)] dark:to-[oklch(0.2_0.006_85)] shadow-sm">
        <svg className="w-4 h-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          {icon === "domain" && <path d="M12 2 L22 8.5 L22 15.5 L12 22 L2 15.5 L2 8.5 Z M12 2 L12 22 M2 8.5 L22 15.5" strokeWidth="1" />}
          {icon === "trajectory" && <path d="M3 17 L9 11 L13 15 L21 7 M21 7 L15 7 M21 7 L21 13" />}
          {icon === "world" && <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" strokeWidth="1" /></>}
        </svg>
      </div>
      <div className="flex-1">
        <h2 className="text-base font-bold font-civ-serif text-[oklch(0.3_0.02_80)] dark:text-[oklch(0.85_0.04_80)] tracking-tight">
          {title}
        </h2>
        <p className="text-[11px] text-muted-foreground/70 font-civ-serif italic">
          {desc}
        </p>
      </div>
      <div className="flex-1 max-w-[120px] h-px bg-gradient-to-r from-[oklch(0.7_0.12_85_/_0.2)] to-transparent" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */

/** Skill Codex card — enhanced "recent skills" with civilization framing. */
function SkillCodexCard({
  userSkills,
  isLoading,
}: {
  userSkills: UserSkill[];
  isLoading: boolean;
}) {
  const { t } = useLocale();

  return (
    <div className="vintage-parchment-card rounded-2xl border border-[oklch(0.88_0.02_90)] dark:border-[oklch(0.3_0.01_80)] p-5 shadow-sm relative overflow-hidden h-full">
      {/* Coordinates stamp */}
      <div className="absolute top-2 right-3 text-[8px] font-mono opacity-25 text-[oklch(0.3_0.02_80)] select-none">
        [S 12° 04' / E 77° 35']
      </div>

      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-4 h-4 text-accent flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2M4 4h16v16H4z M8 8h8M8 12h8M8 16h5" />
        </svg>
        <h3 className="text-base font-bold font-civ-serif text-[oklch(0.3_0.02_80)] dark:text-[oklch(0.85_0.04_80)] truncate">
          {t("dashboard.sections.skillCodex")}
        </h3>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 w-full rounded-md bg-muted skeleton-shimmer" />
          ))}
        </div>
      ) : userSkills.length === 0 ? (
        <div className="py-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/[0.06] mb-3">
            <svg className="w-5 h-5 text-accent/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2M4 4h16v16H4z M8 8h8M8 12h8M8 16h5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-sm text-[oklch(0.55_0.02_85)]">
            {t("dashboard.noSkillData")}
          </p>
        </div>
      ) : (
        <div className="space-y-2 relative z-10">
          {userSkills.slice(0, 5).map((skill, i) => (
            <div
              key={skill.skill_id}
              className="group flex items-center justify-between rounded-xl px-3 py-2 border border-transparent hover:border-[oklch(0.88_0.02_90)] hover:bg-[oklch(0.95_0.005_90_/_0.5)] dark:hover:bg-[oklch(0.25_0.008_85_/_0.5)] transition-all duration-300 hover:translate-x-0.5"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Hexagonal bullet */}
                <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2 L22 8.5 L22 15.5 L12 22 L2 15.5 L2 8.5 Z"
                    fill={skillMasteryColor(skill.overall)}
                    opacity="0.15"
                    stroke={skillMasteryColor(skill.overall)}
                    strokeWidth="1.5"
                  />
                </svg>
                <span className="text-sm font-semibold text-[oklch(0.3_0.02_80)] dark:text-[oklch(0.85_0.04_80)] truncate group-hover:text-accent transition-colors">
                  {skill.skill_name}
                </span>
              </div>
              <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                {/* Rank badge */}
                <span
                  className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded"
                  style={{
                    color: skillMasteryColor(skill.overall),
                    backgroundColor: `${skillMasteryColor(skill.overall).replace(")", " / 0.08)")}`,
                  }}
                >
                  {skill.rank ? t(`dashboard.ranks.${skill.rank}`) : t("dashboard.ranks.NOVICE")}
                </span>
                {/* Score */}
                <span className="text-sm font-bold font-mono tabular-nums text-[oklch(0.4_0.02_80)] dark:text-[oklch(0.75_0.04_80)]">
                  {skill.overall}
                  <span className="text-[10px] text-muted-foreground">%</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
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
