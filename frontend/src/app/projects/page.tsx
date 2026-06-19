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
import type { Project } from "@/types/project";
import type { UserQuest } from "@/types/quest";
import type { World } from "@/types/world";

export default function ProjectsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, locale } = useLocale();
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
      <div className="flex items-center justify-between relative z-10">
        <div>
          <h1 className="text-2xl font-bold font-civ-serif text-[oklch(0.3_0.02_80)]">{t("projects.title")}</h1>
          <p className="mt-1 text-sm font-civ-serif text-[oklch(0.5_0.02_85)]">
            {t("projects.subtitle")}
          </p>
        </div>
        <Link
          href="/projects/new"
          className="rounded-lg bg-[oklch(0.72_0.12_82)] hover:bg-[oklch(0.7_0.12_85)] text-white border border-[oklch(0.72_0.12_82)] px-4 py-2 text-sm font-bold font-civ-serif transition-all hover:opacity-90 shadow-sm"
        >
          + {t("projects.newProject")}
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

              {/* Antique Drawing style SVG: Sailing Ship & Island */}
              <div className="mb-6 relative w-36 h-36 flex items-center justify-center relative z-10">
                <svg
                  className="w-full h-full text-[oklch(0.7_0.12_85)] dark:text-[oklch(0.72_0.12_82)] opacity-80"
                  viewBox="0 0 100 100"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                >
                  {/* Wave arcs */}
                  <path d="M 10,75 Q 20,70 30,75 T 50,75 T 70,75 T 90,75" strokeDasharray="2 2" />
                  <path d="M 5,83 Q 15,78 25,83 T 45,83 T 65,83 T 85,83 T 95,83" />
                  
                  {/* Uncharted Island outlines */}
                  <path d="M 65,75 C 65,65 72,60 80,60 C 85,60 90,68 90,75 Z" fill="currentColor" opacity="0.08" />
                  <line x1="78" y1="58" x2="78" y2="75" strokeDasharray="3 3" strokeWidth="0.8" />
                  <text x="74" y="55" className="text-[6px] font-bold font-civ-serif" fill="currentColor">📍</text>

                  {/* Sailing Ship / Caravel */}
                  <g transform="translate(15, 25)">
                    {/* Hull */}
                    <path d="M 10,35 L 45,35 L 40,43 C 35,46 20,46 15,43 Z" fill="currentColor" opacity="0.15" />
                    <path d="M 10,35 L 45,35 L 42,43 C 37,46 18,46 13,43 Z" strokeWidth="1.5" />
                    <line x1="27" y1="12" x2="27" y2="35" strokeWidth="1.5" />
                    <line x1="17" y1="18" x2="17" y2="35" />
                    <line x1="37" y1="20" x2="37" y2="35" />
                    
                    {/* Sails */}
                    <path d="M 27,12 Q 22,20 27,30 Q 32,20 27,12 Z" fill="currentColor" opacity="0.25" stroke="currentColor" />
                    <path d="M 17,18 Q 13,23 17,31 Q 21,23 17,18 Z" fill="currentColor" opacity="0.2" stroke="currentColor" />
                    
                    {/* Flags */}
                    <path d="M 27,12 L 32,14 L 27,16 Z" fill="currentColor" />
                  </g>
                </svg>
              </div>

              <h3 className="text-xl font-bold font-civ-serif text-[oklch(0.3_0.02_80)] relative z-10">
                ⚓ {t("projects.noProjects")}
              </h3>
              <p className="mt-2 text-sm font-civ-serif text-[oklch(0.5_0.02_85)] leading-relaxed max-w-md relative z-10">
                {locale === "zh"
                  ? "文明的大海平缓而辽阔，你的航行里程碑大本营目前还没有登录作品。一旦你征服任意 Quest 并提报交付成果，它将立刻化为这一张张闪耀的文明拓荒徽章陈列于此！"
                  : t("projects.noProjectsDesc")}
              </p>
              
              <Link
                href="/quests"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[oklch(0.72_0.12_82)] hover:bg-[oklch(0.7_0.12_85)] text-white border border-[oklch(0.72_0.12_82)] px-6 py-2.5 text-sm font-bold font-civ-serif transition-all hover:opacity-90 shadow-md relative z-10 btn-press"
              >
                🧭 {t("projects.browseQuests")}
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
                <h3 className="text-sm font-semibold mb-3">
                  {locale === "zh" ? "📁 全部成果" : "📁 All Achievements"}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 animate-stagger">
                  {projects.map((project) => (
                    <div key={project.id} className="card-hover">
                      <ProjectCard project={project} />
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
