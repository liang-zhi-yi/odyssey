"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";
import type { Project } from "@/types/project";
import { useLocale } from "@/hooks/useLocale";
import { projectService } from "@/services/project.service";
import { BuildingSealIcon, inferSkillId } from "@/app/components/CivArchiveTheme";
import { skillDisplayName } from "@/lib/skillNames";
import Link from "next/link";
import { QuestScrollIcon } from "@/app/components/QuestScrollIcon";

interface ProjectCardProps {
  project: Project;
  index?: number;
}

/** Grade badge styles */
const GRADE_STYLE: Record<string, string> = {
  S: "bg-[#C4A77D]/15 text-[#C4A77D] border-[#C4A77D]/30",
  A: "bg-[#8B9D83]/15 text-[#8B9D83] border-[#8B9D83]/30",
  B: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-500/30",
  C: "bg-[#D4C9BE]/30 text-muted-foreground border-[#D4C9BE]/40",
  D: "bg-muted/30 text-muted-foreground border-muted/20",
};

const STATUS_STYLE: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  PASSED: { bg: "bg-success/10", text: "text-success", icon: <QuestScrollIcon name="checklist" size={12} /> },
  SUBMITTED: { bg: "bg-warning/10", text: "text-warning", icon: (<svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M7 8l5-5 5 5M5 21h14" /></svg>) },
  ASSESSING: { bg: "bg-warning/10", text: "text-warning", icon: (<svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-5-5" /></svg>) },
  FAILED: { bg: "bg-destructive/10", text: "text-destructive", icon: (<svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18" /></svg>) },
};

function formatDate(dateStr: string | null, locale: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return locale === "zh" ? `${y}.${m}.${day}` : `${y}-${m}-${day}`;
}

/**
 * 文明档案记录节点 — 每个项目作为一条文明 LOG 记录，强调探索档案感。
 */
export function ProjectCard({ project, index = 0 }: ProjectCardProps) {
  const { locale, t } = useLocale();
  const { mutate } = useSWRConfig();

  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const grade = project.quest_submission?.assessment_grade;
  const gradeStyle = grade ? GRADE_STYLE[grade] ?? "" : "";
  const status = project.quest_submission?.status;
  const statusInfo = status ? STATUS_STYLE[status] ?? null : null;

  const logNo = String(index + 1).padStart(3, "0");

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
      <div className="relative rounded-lg border border-destructive/30 bg-destructive/5 p-4 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-destructive/40 to-transparent" />
        <p className="text-sm font-medium text-destructive">{t("projects.deleteConfirm")}</p>
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
      className="relative block rounded-lg border border-[oklch(0.88_0.02_90)] bg-gradient-to-br from-[oklch(0.99_0.003_95)] to-[oklch(0.975_0.005_92)] dark:from-[oklch(0.22_0.008_85)] dark:to-[oklch(0.2_0.006_85)] p-4 transition-all duration-300 hover:shadow-md hover:border-[oklch(0.7_0.12_85)] group overflow-hidden"
    >
      {/* 顶部金色渐变细线 */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[oklch(0.7_0.12_85_/_0.45)] to-transparent" />

      {/* 文明档案坐标水印 */}
      <div className="absolute -bottom-1 -right-1 text-[8px] font-mono opacity-[0.06] pointer-events-none select-none text-[oklch(0.3_0.02_80)]">
        [SEC {project.id.slice(0, 4).toUpperCase()}]
      </div>

      {/* 删除触发 — hover 显示 */}
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

      {/* LOG 编号 + 等级徽章 */}
      <div className="flex items-center justify-between mb-2">
        <span className="inline-flex items-center gap-1.5">
          <QuestScrollIcon name="scroll" size={13} className="text-[oklch(0.55_0.10_85)] dark:text-[oklch(0.72_0.12_82)]" />
          <span className="text-[10px] font-mono font-bold tracking-widest text-[oklch(0.5_0.03_75)] dark:text-[oklch(0.6_0.02_80)]">
            {locale === "zh" ? "遗迹记录" : "RUIN"} · {logNo}
          </span>
        </span>
        {statusInfo && (
          <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0 text-[9px] ${statusInfo.bg} ${statusInfo.text}`}>
            <span className="flex items-center gap-0.5">{statusInfo.icon} {status}</span>
          </span>
        )}
      </div>

      {/* 标题 + 评分等级 */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-bold font-civ-serif text-sm truncate text-[oklch(0.3_0.02_80)] group-hover:text-[oklch(0.35_0.12_85)] transition-colors pr-6">
          {project.title}
        </h4>
        {grade && (
          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full border text-xs font-bold font-civ-serif flex-shrink-0 shadow-inner ${gradeStyle}`}>
            {grade}
          </span>
        )}
      </div>

      {/* 创造领域 — 能力印记图标 */}
      {project.related_skill && (
        <div className="flex items-center gap-2 mb-2">
          <BuildingSealIcon type={inferSkillId(project.related_skill.name, project.related_skill.id)} size={24} />
          <span className="text-[11px] font-medium text-[oklch(0.45_0.03_75)] dark:text-[oklch(0.7_0.02_80)]">
            {skillDisplayName(project.related_skill.name, undefined, locale)}
          </span>
        </div>
      )}

      {/* 描述 */}
      {project.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {project.description}
        </p>
      )}

      {/* 建筑来源 */}
      {project.related_building && (
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-2">
          <span>{project.related_building.icon}</span>
          <span>{project.related_building.name}</span>
          <span>Lv.{project.related_building.level}</span>
        </div>
      )}

      {/* 底部：建立时间 + 查看档案 */}
      <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground pt-2 border-t border-[oklch(0.72_0.06_80_/_0.18)]">
        <span className="inline-flex items-center gap-1">
          <QuestScrollIcon name="hourglass" size={11} className="opacity-70" />
          {formatDate(project.created_at, locale)}
        </span>
        <span className="inline-flex items-center gap-1 font-civ-serif italic font-semibold text-[oklch(0.55_0.10_85)] dark:text-[oklch(0.72_0.12_82)] group-hover:text-[oklch(0.45_0.12_85)] transition-colors">
          {t("projects.archive_viewDetail")}
          <QuestScrollIcon name="arrow-right" size={11} />
        </span>
      </div>
    </Link>
  );
}