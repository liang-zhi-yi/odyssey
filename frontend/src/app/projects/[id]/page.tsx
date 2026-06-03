"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { projectService } from "@/services/project.service";
import { Loading } from "@/app/components/Loading";

export default function ProjectDetailPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

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

  if (authLoading) {
    return <Loading text="Loading..." />;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <Loading text="Loading project..." />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm font-medium text-destructive">加载失败</p>
          <p className="text-xs text-muted-foreground mt-1">
            {error instanceof Error ? error.message : "Project not found"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold">{project.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">项目详情</p>
      </div>

      {/* Description */}
      {project.description && (
        <div className="rounded-xl border border-border bg-background p-6">
          <h2 className="text-sm font-semibold mb-3">描述</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {project.description}
          </p>
        </div>
      )}

      {/* Links */}
      <div className="rounded-xl border border-border bg-background p-6">
        <h2 className="text-sm font-semibold mb-3">链接</h2>
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
            <p className="text-xs text-muted-foreground">暂无GitHub链接</p>
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
            <p className="text-xs text-muted-foreground">暂无Demo链接</p>
          )}
        </div>
      </div>

      {/* Back links */}
      <div className="text-center space-x-4">
        <Link
          href="/projects"
          className="text-sm text-primary hover:underline"
        >
          ← 返回项目列表
        </Link>
      </div>
    </div>
  );
}
