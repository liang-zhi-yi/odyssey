"use client";

import { useLocale } from "@/hooks/useLocale";
import type { Project } from "@/types/project";

interface GrowthRelationProps {
  projects: Project[];
  isLoading: boolean;
}

/** Grade badge styles */
const GRADE_STYLE: Record<string, string> = {
  S: "bg-[#C4A77D]/15 text-[#C4A77D] border-[#C4A77D]/30",
  A: "bg-[#8B9D83]/15 text-[#8B9D83] border-[#8B9D83]/30",
  B: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-500/30",
  C: "bg-[#D4C9BE]/30 text-muted-foreground border-[#D4C9BE]/40",
  D: "bg-muted/30 text-muted-foreground border-muted/20",
};

function timeAgo(dateStr: string | null, locale: string): string {
  if (!dateStr) return "";
  const then = new Date(dateStr).getTime();
  const now = Date.now();
  const diffMs = now - then;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return locale === "zh" ? "今天" : "Today";
  if (diffDays < 2) return locale === "zh" ? "昨天" : "Yesterday";
  if (diffDays < 7) return locale === "zh" ? `${diffDays}天前` : `${diffDays}d ago`;
  if (diffDays < 30) return locale === "zh" ? `${Math.floor(diffDays / 7)}周前` : `${Math.floor(diffDays / 7)}w ago`;
  return locale === "zh" ? `${Math.floor(diffDays / 30)}个月前` : `${Math.floor(diffDays / 30)}mo ago`;
}

/**
 * Second layer — growth relation timeline.
 *
 * Shows recent projects (up to 5) with their source chain:
 * Project ← Quest (grade) ← Learning Path ← Building
 */
export function GrowthRelation({ projects, isLoading }: GrowthRelationProps) {
  const { locale } = useLocale();

  // Take only projects that have quest submission data for the timeline
  const linkedProjects = projects
    .filter((p) => p.quest_submission || p.related_skill || p.source_path)
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="h-4 w-24 rounded bg-muted skeleton-shimmer mb-4" />
        <div className="space-y-4 pl-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="relative pl-6">
              <div className="absolute left-0 top-2 w-2.5 h-2.5 rounded-full bg-muted skeleton-shimmer" />
              <div className="h-3 w-48 rounded bg-muted skeleton-shimmer mb-1" />
              <div className="h-3 w-32 rounded bg-muted skeleton-shimmer" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (linkedProjects.length === 0) {
    return null; // Don't show if no linked projects
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <h3 className="text-sm font-semibold mb-4">
        {locale === "zh" ? "📜 成长关联" : "📜 Growth Relations"}
      </h3>

      <div className="relative">
        {linkedProjects.map((project, idx) => {
          const isLast = idx === linkedProjects.length - 1;
          const grade = project.quest_submission?.assessment_grade;
          const gradeStyle = grade ? GRADE_STYLE[grade] ?? "" : "";

          return (
            <div
              key={project.id}
              className={`relative pl-6 ${isLast ? "" : "pb-5"}`}
            >
              {/* Timeline line */}
              {!isLast && (
                <div className="absolute left-[4px] top-3 bottom-0 w-0.5 bg-[#8B9D83]/20" />
              )}

              {/* Timeline node */}
              <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-[#C4A77D] ring-2 ring-[#C4A77D]/20" />

              {/* Content */}
              <div className="space-y-1">
                {/* Project title */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{project.title}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {timeAgo(project.created_at, locale)}
                  </span>
                </div>

                {/* Chain: Quest → Path → Building */}
                <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-muted-foreground">
                  {project.quest_submission && (
                    <>
                      <span className="text-muted-foreground/60">
                        {locale === "zh" ? "完成 Quest" : "from Quest"}
                      </span>
                      <span className="font-medium text-foreground/70">
                        {project.quest_submission.quest_title}
                      </span>
                      {grade && (
                        <span
                          className={`inline-flex items-center rounded-full border px-1.5 py-0 text-[9px] font-bold ${gradeStyle}`}
                        >
                          {grade}
                        </span>
                      )}
                    </>
                  )}

                  {project.source_path && (
                    <>
                      <span className="text-muted-foreground/60">·</span>
                      <span className="text-muted-foreground/60">
                        {locale === "zh" ? "来自路径" : "from"}
                      </span>
                      <span className="font-medium text-foreground/70">
                        {project.source_path.title}
                      </span>
                    </>
                  )}

                  {project.related_building && (
                    <>
                      <span className="text-muted-foreground/60">·</span>
                      <span className="text-muted-foreground/60">
                        {locale === "zh" ? "解锁" : "unlocks"}
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium text-foreground/70">
                        <span>{project.related_building.icon}</span>
                        {project.related_building.name} Lv.{project.related_building.level}
                      </span>
                    </>
                  )}
                </div>

                {/* Fallback: only skill */}
                {!project.quest_submission && !project.source_path && project.related_skill && (
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span className="text-muted-foreground/60">
                      {locale === "zh" ? "关联技能" : "Related skill"}
                    </span>
                    <span className="font-medium text-foreground/70">
                      {project.related_skill.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
