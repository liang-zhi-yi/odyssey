"use client";

import useSWR from "swr";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { projectService } from "@/services/project.service";
import { questService } from "@/services/quest.service";
import { worldService } from "@/services/world.service";
import { ProjectCard } from "@/app/components/ProjectCard";
import { AchievementOverview } from "@/app/components/AchievementOverview";
import { GrowthRelation } from "@/app/components/GrowthRelation";
import { Loading } from "@/app/components/Loading";
import { ErrorState } from "@/app/components/ErrorState";
import { EmptyState } from "@/app/components/EmptyState";
import { QuestScrollIcon } from "@/app/components/QuestScrollIcon";
import type { Project } from "@/types/project";
import type { UserQuest } from "@/types/quest";
import type { World } from "@/types/world";

export default function ProjectsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useLocale();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch enriched projects
  const {
    data: projects = [],
    isLoading: projectsLoading,
    error,
  } = useSWR<Project[]>(isAuthenticated ? "projects" : null, () =>
    projectService.listProjects()
  );

  // Fetch world state for civilization level + building stats
  const { data: world } = useSWR<World | null>(
    isAuthenticated ? "world" : null,
    () => worldService.getWorld().catch(() => null),
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  // Fetch user quests for completed quest count
  const { data: userQuests = [] } = useSWR<UserQuest[]>(
    isAuthenticated ? "user-quests" : null,
    () => questService.listUserQuests().catch(() => []),
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );

  if (authLoading || !isAuthenticated) {
    return <Loading text={t("auth.validating")} />;
  }

  // Compute overview stats
  const totalProjects = projects.length;
  const completedQuests = userQuests.filter(
    (uq: UserQuest) => uq.status === "PASSED"
  ).length;
  const activeBuildings = world
    ? world.buildings.filter(
        (b) => b.status === "STABLE" || b.status === "UPGRADING"
      ).length
    : 0;
  const civilizationLevel = world?.civilization_level ?? 1;
  const tier = world?.tier ?? null;

  const hasProjects = projects.length > 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between relative z-10 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold font-civ-serif text-[oklch(0.3_0.02_80)]">{t("projects.title")}</h1>
          <p className="mt-1 text-sm font-civ-serif text-[oklch(0.5_0.02_85)]">
            {t("projects.subtitle")}
          </p>
        </div>
        {/* 文明入口按钮 — 金色描边 + 徽章 + 微弱光晕 */}
        <Link
          href="/projects/new"
          className="group relative inline-flex items-center gap-2.5 rounded-lg border border-[oklch(0.7_0.12_85_/_0.5)] bg-[oklch(0.99_0.003_95_/_0.5)] dark:bg-[oklch(0.22_0.008_85_/_0.5)] px-5 py-2.5 text-sm font-bold font-civ-serif text-[oklch(0.45_0.10_85)] dark:text-[oklch(0.72_0.12_82)] transition-all duration-300 hover:border-[oklch(0.65_0.12_85)] hover:shadow-[0_0_20px_rgba(201,164,92,0.25)] hover:scale-[1.03]"
        >
          {/* 微弱光晕 */}
          <span className="absolute inset-0 rounded-lg bg-[oklch(0.7_0.12_85_/_0.08)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {/* 顶部金色线 */}
          <span className="absolute top-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-[oklch(0.7_0.12_85_/_0.5)] to-transparent" />
          {/* 小型徽章 */}
          <span className="relative flex-shrink-0 w-6 h-6 rounded-full border border-[oklch(0.7_0.12_85_/_0.5)] bg-[oklch(0.7_0.12_85_/_0.1)] flex items-center justify-center">
            <QuestScrollIcon name="seal" size={14} strokeWidth={1.5} />
          </span>
          <span className="relative">+ {t("projects.createArchive")}</span>
        </Link>
      </div>

      {/* Error state */}
      {error && !projectsLoading && (
        <ErrorState message={t("projects.loadError")} />
      )}

      {/* Layer 1: Achievement Overview stats (always visible) */}
      <AchievementOverview
        totalProjects={totalProjects}
        completedQuests={completedQuests}
        activeBuildings={activeBuildings}
        civilizationLevel={civilizationLevel}
        tier={tier}
        isLoading={projectsLoading}
      />

      {!error && (
        <>
          {projectsLoading ? (
            <Loading variant="skeleton-cards" cardCount={4} />
          ) : !hasProjects ? (
            <div className="flex flex-col items-center justify-center py-20 text-center relative max-w-lg mx-auto">
              {/* Compass Rose Watermark behind Empty State */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 opacity-[0.04] pointer-events-none select-none animate-rhumb-spin">
                <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.5">
                  <circle cx="50" cy="50" r="45" strokeDasharray="3 3" />
                  <path d="M 50,5 L 50,95 M 5,50 L 95,50" />
                  <polygon points="50,50 50,15 47,35" fill="currentColor" />
                  <polygon points="50,50 50,85 53,65" fill="currentColor" />
                  <polygon points="50,50 85,50 65,47" fill="currentColor" />
                  <polygon points="50,50 15,50 35,53" fill="currentColor" />
                </svg>
              </div>

              {/* 文明遗迹石碑图标 */}
              <div className="mb-6 relative w-28 h-28 flex items-center justify-center relative z-10">
                <div className="absolute inset-0 rounded-full border border-[oklch(0.7_0.12_85_/_0.2)]" />
                <div className="absolute inset-0 rounded-full border border-dashed border-[oklch(0.7_0.12_85_/_0.15)] animate-rhumb-spin" style={{ animationDuration: "80s" }} />
                <span className="w-16 h-16 rounded-full border border-[oklch(0.7_0.12_85_/_0.4)] bg-[oklch(0.7_0.12_85_/_0.08)] dark:bg-[oklch(0.7_0.12_85_/_0.12)] flex items-center justify-center text-[oklch(0.55_0.10_85)] dark:text-[oklch(0.72_0.12_82)]">
                  <QuestScrollIcon name="seal" size={32} strokeWidth={1.3} />
                </span>
              </div>

              <h3 className="text-xl font-bold font-civ-serif text-[oklch(0.3_0.02_80)] relative z-10">
                {t("projects.noProjects")}
              </h3>
              <p className="mt-2 text-sm font-civ-serif text-[oklch(0.5_0.02_85)] leading-relaxed max-w-md relative z-10">
                {t("projects.noProjectsDesc")}
              </p>

              {/* 阶梯式探索按钮 */}
              <Link
                href="/quests"
                className="group relative mt-6 inline-flex items-center gap-2 rounded-lg border border-[oklch(0.7_0.12_85_/_0.5)] bg-[oklch(0.99_0.003_95_/_0.5)] dark:bg-[oklch(0.22_0.008_85_/_0.5)] px-6 py-2.5 text-sm font-bold font-civ-serif text-[oklch(0.45_0.10_85)] dark:text-[oklch(0.72_0.12_82)] transition-all duration-300 hover:border-[oklch(0.65_0.12_85)] hover:shadow-[0_0_20px_rgba(201,164,92,0.25)] hover:scale-[1.03] relative z-10"
              >
                <span className="absolute top-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-[oklch(0.7_0.12_85_/_0.5)] to-transparent" />
                <span className="flex-shrink-0 w-5 h-5 rounded-full border border-[oklch(0.7_0.12_85_/_0.5)] bg-[oklch(0.7_0.12_85_/_0.1)] flex items-center justify-center">
                  <QuestScrollIcon name="compass" size={12} strokeWidth={1.5} />
                </span>
                <span className="relative">{t("projects.browseQuests")}</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Layer 2: Growth Relations timeline */}
              <GrowthRelation
                projects={projects}
                isLoading={false}
              />

              {/* Layer 3: Project card grid */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <QuestScrollIcon name="scroll" size={16} className="text-[oklch(0.55_0.10_85)] dark:text-[oklch(0.72_0.12_82)]" />
                  {t("projects.archive_allRecords")}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 animate-stagger">
                  {projects.map((project, idx) => (
                    <div key={project.id} className="card-hover">
                      <ProjectCard project={project} index={idx} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
