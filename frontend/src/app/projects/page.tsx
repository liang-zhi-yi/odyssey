"use client";

import useSWR from "swr";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { projectService } from "@/services/project.service";
import { ProjectCard } from "@/app/components/ProjectCard";
import { Loading } from "@/app/components/Loading";
import { EmptyState } from "@/app/components/EmptyState";

export default function ProjectsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const {
    data: projects = [],
    isLoading,
    error,
  } = useSWR(isAuthenticated ? "projects" : null, () =>
    projectService.listProjects()
  );

  if (authLoading) {
    return <Loading text="Loading..." />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">项目</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            展示你的作品与成果
          </p>
        </div>
        <Link
          href="/projects/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
        >
          + 新建项目
        </Link>
      </div>

      {isLoading ? (
        <Loading text="Loading projects..." />
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          加载项目失败
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          title="暂无项目"
          description="完成Quest后，将你的成果展示在这里"
          actionLabel="浏览 Quests"
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
