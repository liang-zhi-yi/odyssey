"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { projectService } from "@/services/project.service";
import { worldService } from "@/services/world.service";
import { ProjectGrowthGraph } from "@/app/components/ProjectGrowthGraph";
import { Loading } from "@/app/components/Loading";
import { ErrorState } from "@/app/components/ErrorState";
import { BackButton } from "@/app/components/BackButton";
import type { Project } from "@/types/project";
import type { World } from "@/types/world";

export default function ProjectDetailPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useLocale();

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch single project with enriched relations
  const {
    data: project,
    isLoading,
    error,
  } = useSWR<Project | null>(
    isAuthenticated && projectId ? `project-${projectId}` : null,
    () => projectService.getProject(projectId).catch(() => null)
  );

  // Fetch world for building context
  const { data: world } = useSWR<World | null>(
    isAuthenticated ? "world" : null,
    () => worldService.getWorld().catch(() => null),
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  const handleDelete = async () => {
    if (!projectId) return;
    setDeleting(true);
    try {
      await projectService.deleteProject(projectId);
      // Invalidate both the project list and the detail cache
      mutate("projects");
      mutate(`project-${projectId}`, null);
      router.replace("/projects");
    } catch {
      setDeleting(false);
      alert(t("projects.deleteError"));
    }
  };

  if (authLoading || !isAuthenticated) {
    return <Loading text={t("auth.validating")} />;
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8">
        <Loading text={t("common.loading")} />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8">
        <ErrorState
          message={t("common.error")}
          detail={error instanceof Error ? error.message : "Project not found"}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
      {/* Back navigation */}
      <BackButton href="/projects" label={t("projects.backToList")} />

      {/* Header + Delete */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{project.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("projects.detailTitle")}
          </p>
        </div>

        {/* Delete button */}
        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 hover:border-destructive/50 flex-shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {t("projects.delete")}
          </button>
        ) : (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 flex-shrink-0 max-w-xs">
            <p className="text-sm font-medium text-destructive">
              {t("projects.deleteConfirm")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("projects.deleteConfirmDesc")}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {deleting ? t("projects.deleting") : t("projects.deleteConfirmBtn")}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-50"
              >
                {t("projects.deleteCancel")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dual-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Project content (3/5) */}
        <div className="lg:col-span-3 space-y-5">
          {/* Description */}
          {project.description ? (
            <div className="rounded-xl border border-border bg-background p-6">
              <h2 className="text-sm font-semibold mb-3">
                {t("projects.descriptionSection")}
              </h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {project.description}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-border/60 bg-background/50 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                {t("projects.noDescription") ?? "No description provided"}
              </p>
            </div>
          )}

          {/* Links */}
          <div className="rounded-xl border border-border bg-background p-6">
            <h2 className="text-sm font-semibold mb-3">{t("projects.links")}</h2>
            <div className="space-y-2 text-sm">
              {project.github_url ? (
                <div>
                  <span className="text-muted-foreground">GitHub: </span>
                  <a
                    href={project.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline break-all"
                  >
                    {project.github_url}
                  </a>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {t("projects.noGithub")}
                </p>
              )}
              {project.demo_url ? (
                <div>
                  <span className="text-muted-foreground">Demo: </span>
                  <a
                    href={project.demo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline break-all"
                  >
                    {project.demo_url}
                  </a>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {t("projects.noDemo")}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Growth graph (2/5) */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-6 space-y-5">
            <ProjectGrowthGraph
              project={project}
              worldBuildings={world?.buildings ?? []}
            />
          </div>
        </div>
      </div>

      {/* Back links */}
      <div className="text-center space-x-4 pt-4">
        <Link
          href="/projects"
          className="text-sm text-primary hover:underline"
        >
          ← {t("projects.backToList")}
        </Link>
      </div>
    </div>
  );
}
