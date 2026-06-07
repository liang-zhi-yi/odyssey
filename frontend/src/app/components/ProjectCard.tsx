"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";
import type { Project } from "@/types/project";
import { useLocale } from "@/hooks/useLocale";
import { projectService } from "@/services/project.service";
import Link from "next/link";

interface ProjectCardProps {
  project: Project;
}

/** Grade badge styles */
const GRADE_STYLE: Record<string, string> = {
  S: "bg-[#C4A77D]/15 text-[#C4A77D] border-[#C4A77D]/30",
  A: "bg-[#8B9D83]/15 text-[#8B9D83] border-[#8B9D83]/30",
  B: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-500/30",
  C: "bg-[#D4C9BE]/30 text-muted-foreground border-[#D4C9BE]/40",
  D: "bg-muted/30 text-muted-foreground border-muted/20",
};

const STATUS_STYLE: Record<string, { bg: string; text: string; icon: string }> = {
  PASSED: { bg: "bg-success/10", text: "text-success", icon: "✅" },
  SUBMITTED: { bg: "bg-warning/10", text: "text-warning", icon: "📤" },
  ASSESSING: { bg: "bg-warning/10", text: "text-warning", icon: "🔍" },
  FAILED: { bg: "bg-destructive/10", text: "text-destructive", icon: "❌" },
};

function timeAgo(dateStr: string | null, locale: string): string {
  if (!dateStr) return "";
  const then = new Date(dateStr).getTime();
  const now = Date.now();
  const diffDays = Math.floor((now - then) / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return locale === "zh" ? "今天" : "Today";
  if (diffDays < 2) return locale === "zh" ? "昨天" : "Yesterday";
  if (diffDays < 7) return locale === "zh" ? `${diffDays}天前` : `${diffDays}d ago`;
  if (diffDays < 30) return locale === "zh" ? `${Math.floor(diffDays / 7)}周前` : `${Math.floor(diffDays / 7)}w ago`;
  return locale === "zh" ? `${Math.floor(diffDays / 30)}个月前` : `${Math.floor(diffDays / 30)}mo ago`;
}

/**
 * Rich project card — displays skill badge, building source, assessment grade,
 * submission status, and completion time. Hover reveals a delete button.
 */
export function ProjectCard({ project }: ProjectCardProps) {
  const { locale, t } = useLocale();
  const { mutate } = useSWRConfig();

  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const grade = project.quest_submission?.assessment_grade;
  const gradeStyle = grade ? GRADE_STYLE[grade] ?? "" : "";
  const status = project.quest_submission?.status;
  const statusInfo = status ? STATUS_STYLE[status] ?? null : null;

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!project.id) return;
    setDeleting(true);
    try {
      await projectService.deleteProject(project.id);
      mutate("projects");
    } catch {
      setDeleting(false);
    }
  };

  // Inline delete confirmation
  if (showDelete) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 shadow-card">
        <p className="text-sm font-medium text-destructive">
          {t("projects.deleteConfirm")}
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
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowDelete(false);
            }}
            disabled={deleting}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-50"
          >
            {t("projects.deleteCancel")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={`/projects/${project.id}`}
      className="relative block rounded-xl border border-border bg-card p-4 shadow-card transition-all duration-300 hover:shadow-card-hover hover:border-primary/20 group"
    >
      {/* Delete trigger — appears on hover */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowDelete(true);
        }}
        title={t("projects.delete")}
        className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-muted/60 hover:bg-destructive/20 hover:text-destructive text-muted-foreground/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Title + Grade */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-semibold text-sm truncate group-hover:text-primary transition-colors pr-6">
          {project.title}
        </h4>
        {grade && (
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold flex-shrink-0 ${gradeStyle}`}
          >
            {grade}
          </span>
        )}
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {project.description}
        </p>
      )}

      {/* Skill badge */}
      {project.related_skill && (
        <div className="mb-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#8B9D83]/10 border border-[#8B9D83]/20 px-2 py-0.5 text-[10px] font-medium text-[#8B9D83]">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            {project.related_skill.name}
          </span>
        </div>
      )}

      {/* Building source */}
      {project.related_building && (
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-2">
          <span>{project.related_building.icon}</span>
          <span>{project.related_building.name}</span>
          <span>Lv.{project.related_building.level}</span>
        </div>
      )}

      {/* Footer: status + time */}
      <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground pt-2 border-t border-border/60">
        <div className="flex items-center gap-2">
          {statusInfo && (
            <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0 text-[9px] ${statusInfo.bg} ${statusInfo.text}`}>
              {statusInfo.icon} {status}
            </span>
          )}
          {!statusInfo && project.quest_submission && (
            <span className="text-[10px] text-muted-foreground">
              {project.quest_submission.status}
            </span>
          )}
          {!project.quest_submission && (
            <span className="text-[10px] text-muted-foreground/60">
              {locale === "zh" ? "独立项目" : "Standalone"}
            </span>
          )}
        </div>
        <span>{timeAgo(project.created_at, locale)}</span>
      </div>
    </Link>
  );
}
