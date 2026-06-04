"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { projectService } from "@/services/project.service";
import { Loading } from "@/app/components/Loading";
import { ErrorState } from "@/app/components/ErrorState";
import { BackButton } from "@/app/components/BackButton";

export default function ProjectDetailPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useLocale();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch all projects to find this one (backend doesn't have GET /projects/:id endpoint)
  const {
    data: projects = [],
    isLoading,
    error,
  } = useSWR(
    isAuthenticated ? "projects" : null,
    () => projectService.listProjects()
  );

  const project = projects.find((p) => p.id === projectId);

  if (authLoading || !isAuthenticated) {
    return <Loading text={t("auth.validating")} />;
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <Loading text={t("common.loading")} />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <ErrorState
          message={t("common.error")}
          detail={error instanceof Error ? error.message : "Project not found"}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      {/* Back navigation */}
      <BackButton href="/projects" label={t("projects.backToList")} />

      <div>
        <h1 className="text-2xl font-bold">{project.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("projects.detailTitle")}</p>
      </div>

      {/* Description */}
      {project.description && (
        <div className="rounded-xl border border-border bg-background p-6">
          <h2 className="text-sm font-semibold mb-3">{t("projects.descriptionSection")}</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {project.description}
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
                className="text-primary hover:underline"
              >
                {project.github_url}
              </a>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">{t("projects.noGithub")}</p>
          )}
          {project.demo_url ? (
            <div>
              <span className="text-muted-foreground">Demo: </span>
              <a
                href={project.demo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {project.demo_url}
              </a>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">{t("projects.noDemo")}</p>
          )}
        </div>
      </div>

      {/* Back links */}
      <div className="text-center space-x-4">
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
