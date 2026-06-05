"use client";

import useSWR from "swr";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { projectService } from "@/services/project.service";
import { ProjectCard } from "@/app/components/ProjectCard";
import { Loading } from "@/app/components/Loading";
import { ErrorState } from "@/app/components/ErrorState";
import { EmptyState } from "@/app/components/EmptyState";

export default function ProjectsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useLocale();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const {
    data: projects = [],
    isLoading,
    error,
  } = useSWR(isAuthenticated ? "projects" : null, () =>
    projectService.listProjects()
  );

  if (authLoading || !isAuthenticated) {
    return <Loading text={t("auth.validating")} />;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-8">
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

      {isLoading ? (
        <Loading text={t("common.loading")} />
      ) : error ? (
        <ErrorState message={t("projects.loadError")} />
      ) : projects.length === 0 ? (
        <EmptyState
          title={t("projects.noProjects")}
          description={t("projects.noProjectsDesc")}
          actionLabel={t("projects.browseQuests")}
          actionHref="/quests"
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 animate-stagger">
          {projects.map((project) => (
            <div key={project.id} className="card-hover">
              <ProjectCard project={project} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
