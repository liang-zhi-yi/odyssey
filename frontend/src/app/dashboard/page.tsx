"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { skillDisplayName } from "@/lib/skillNames";
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
import { CivilizationArchive } from "@/app/components/CivilizationArchive";
import { Loading } from "@/app/components/Loading";
import { BuildingSealIcon, inferSkillId } from "@/app/components/CivArchiveTheme";
import type { UserSkill } from "@/types/skill";
import type { LearningPath } from "@/types/learningPath";

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, locale } = useLocale();
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
  const buildingCount = (worldData?.buildings?.filter(b => b.status !== "LOCKED")?.length ?? 0) + (worldData?.compound_buildings?.filter(b => b.status !== "LOCKED")?.length ?? 0);
  const regionCount = worldData?.regions?.length ?? 0;

  // ─── Auth guard ──────────────────────────────────────────

  if (authLoading || !isAuthenticated) {
    return <Loading text={t("auth.validating")} />;
  }

  const isAnyLoading = skillsLoading || allPathsLoading;

  // ─── Render ──────────────────────────────────────────────

  return (
    <div className="relative animate-fade-in">
      {/* ── 暖色档案纹理背景 ── */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.35] dark:opacity-[0.18]" aria-hidden="true">
        <svg className="w-full h-full">
          <defs>
            <pattern id="dash-bg-hex" width="80" height="138" patternUnits="userSpaceOnUse" patternTransform="scale(0.8)">
              <path d="M40 5 L72 22 L72 56 L40 73 L8 56 L8 22 Z" fill="none" stroke="#C9A45C33" strokeWidth="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dash-bg-hex)" />
        </svg>
      </div>

      <div className="relative space-y-5 sm:space-y-7">
        {/* ── Hero: Civilization Nexus ───────────────────── */}
        <DashboardHero
          userSkills={userSkills}
          currentPath={currentPath}
          worldTier={worldTier}
          questsCompleted={questsCompleted}
          isLoading={isAnyLoading}
        />

        {/* ── Civilization Archive — 文明成长记录 ──────────── */}
        <CivilizationArchive
          insights={insightsData?.insights || []}
          analyticsSummary={analyticsSummary}
          userSkills={userSkills}
          isLoading={insightsLoading}
        />

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
                paths={allPaths}
                isLoading={allPathsLoading}
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
            worldTier={worldTier}
            worldEra={worldData?.era}
            buildingCount={buildingCount}
            questsCompleted={questsCompleted}
            userSkills={userSkills}
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
      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-[#F7F2E8]/60 to-[#F0E8D8]/40 dark:from-[oklch(0.22_0.008_85)] dark:to-[oklch(0.2_0.006_85)]"
        style={{ clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))" }}
      >
        <svg className="w-4 h-4 text-[#C9A45C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          {/* Crystal Core — 能力领域 */}
          {icon === "domain" && <><path d="M12 2 L18 9 L12 22 L6 9 Z" /><path d="M6 9 L18 9" strokeWidth="1" /><path d="M12 2 L12 22" strokeWidth="0.6" opacity="0.4" /></>}
          {/* Star Map — 成长轨迹 */}
          {icon === "trajectory" && <><path d="M3 17 L9 11 L13 15 L21 7" strokeWidth="1.4" /><circle cx="3" cy="17" r="1" fill="currentColor" stroke="none" /><circle cx="9" cy="11" r="0.8" fill="currentColor" stroke="none" opacity="0.7" /><circle cx="13" cy="15" r="0.8" fill="currentColor" stroke="none" opacity="0.7" /><circle cx="21" cy="7" r="1.2" fill="currentColor" stroke="none" /></>}
          {/* Civilization Building — 文明世界 */}
          {icon === "world" && <><path d="M7 21V8l5-4 5 4v13M7 21h10M9 21v-4h2v4M13 21v-4h2v4M9 12h2M13 12h2" /></>}
        </svg>
      </div>
      <div className="flex-1">
        <h2 className="text-base font-bold font-civ-serif text-[#4A3825] dark:text-[oklch(0.85_0.04_80)] tracking-tight">
          {title}
        </h2>
        <p className="text-[11px] text-[#8C7655] dark:text-[oklch(0.6_0.012_80)] font-civ-serif italic">
          {desc}
        </p>
      </div>
      <div className="flex-1 max-w-[120px] h-px bg-gradient-to-r from-[#C9A45C]/30 to-transparent" />
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
  const { t, locale } = useLocale();

  return (
    <div
      className="relative bg-gradient-to-br from-[#F7F2E8]/70 to-[#F0E8D8]/40 dark:from-[oklch(0.22_0.008_85)] dark:to-[oklch(0.2_0.006_85)] p-5 overflow-hidden h-full transition-all duration-300 hover:from-[#F7F2E8]/90 hover:to-[#F0E8D8]/60"
      style={{ clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))" }}
    >
      {/* Top accent — gold gradient line */}
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-[#C9A45C]/40 to-transparent" />
      {/* Coordinates stamp */}
      <div className="absolute top-2 right-3 text-[8px] font-mono opacity-25 text-[#8C7655] dark:text-[oklch(0.6_0.012_80)] select-none">
        [S 12° 04' / E 77° 35']
      </div>

      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        {/* Stone Tablet icon — 石碑 */}
        <svg className="w-4 h-4 text-[#C9A45C] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 3 L18 3 L18 21 L6 21 Z" />
          <line x1="9" y1="8" x2="15" y2="8" strokeWidth="0.8" opacity="0.6" />
          <line x1="9" y1="12" x2="15" y2="12" strokeWidth="0.8" opacity="0.6" />
          <line x1="9" y1="16" x2="13" y2="16" strokeWidth="0.8" opacity="0.6" />
        </svg>
        <h3 className="text-base font-bold font-civ-serif text-[#4A3825] dark:text-[oklch(0.85_0.04_80)] truncate">
          {t("dashboard.sections.skillCodex")}
        </h3>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 w-full bg-[#C9A45C]/15 skeleton-shimmer" />
          ))}
        </div>
      ) : userSkills.length === 0 ? (
        <div className="py-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 mb-3">
            {/* Inactive stone tablet */}
            <svg className="w-6 h-6 text-[#C9A45C]/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 3 L18 3 L18 21 L6 21 Z" />
              <line x1="9" y1="8" x2="15" y2="8" strokeWidth="0.8" opacity="0.5" />
              <line x1="9" y1="12" x2="15" y2="12" strokeWidth="0.8" opacity="0.5" />
            </svg>
          </div>
          <p className="text-sm text-[#8C7655] dark:text-[oklch(0.6_0.012_80)]">
            {t("dashboard.noSkillData")}
          </p>
        </div>
      ) : (
        <div className="space-y-2 relative z-10">
          {userSkills.slice(0, 5).map((skill, i) => (
            <div
              key={skill.skill_id}
              className="group flex items-center justify-between px-3 py-2 hover:bg-[#C9A45C]/8 transition-all duration-300 hover:translate-x-0.5"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Skill Ruin — BuildingSealIcon 技能遗迹 */}
                <BuildingSealIcon type={inferSkillId(skill.skill_name || "", skill.skill_id)} size={28} className="flex-shrink-0" />
                <span className="text-sm font-semibold text-[#4A3825] dark:text-[oklch(0.85_0.04_80)] truncate group-hover:text-[#C9A45C] transition-colors">
                  {skillDisplayName(skill.skill_name, undefined, locale)}
                </span>
              </div>
              <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                {/* Rank badge — stone seal style */}
                <span
                  className="text-[9px] font-bold tracking-wider px-1.5 py-0.5"
                  style={{
                    color: skillMasteryColor(skill.overall),
                    backgroundColor: `${skillMasteryColor(skill.overall).replace(")", " / 0.08)")}`,
                  }}
                >
                  {skill.rank ? t(`dashboard.ranks.${skill.rank}`) : t("dashboard.ranks.NOVICE")}
                </span>
                {/* Score */}
                <span className="text-sm font-bold font-mono tabular-nums text-[#4A3825] dark:text-[oklch(0.85_0.04_80)]">
                  {skill.overall}
                  <span className="text-[10px] text-[#8C7655] dark:text-[oklch(0.6_0.012_80)]">%</span>
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
  if (score >= 75) return "#C9A45C";   // Gold — master
  if (score >= 50) return "#A08850";   // Bronze — proficient
  if (score >= 25) return "#8C7655";   // Warm gray — developing
  return "#B8A888";                     // Light warm gray — beginner
}
