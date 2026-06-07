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
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("projects.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("projects.subtitle")}
          </p>
        </div>
        <Link
          href="/projects/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
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
            <EmptyState
              title={t("projects.noProjects")}
              description={t("projects.noProjectsDesc")}
              actionLabel={t("projects.browseQuests")}
              actionHref="/quests"
            />
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
