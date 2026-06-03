"use client";

import type { Project } from "@/types/project";
import Link from "next/link";

interface ProjectCardProps {
  project: Project;
}

/**
 * Compact card for displaying a project in a list.
 */
export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="block rounded-xl border border-border bg-background p-4 transition-all hover:shadow-md hover:border-primary/30"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-semibold text-sm truncate">{project.title}</h4>
      </div>

      {project.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {project.description}
        </p>
      )}

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {project.github_url && (
          <span className="truncate">🔗 {project.github_url}</span>
        )}
        {project.demo_url && (
          <span className="truncate">🌐 {project.demo_url}</span>
        )}
      </div>
    </Link>
  );
}
