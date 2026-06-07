"use client";

import { useLocale } from "@/hooks/useLocale";
import type { Project } from "@/types/project";
import type { UserBuilding } from "@/types/world";

interface ProjectGrowthGraphProps {
  project: Project;
  worldBuildings: UserBuilding[];
}

const GRADE_STYLE: Record<string, string> = {
  S: "bg-[#C4A77D]/15 text-[#C4A77D] border-[#C4A77D]/30",
  A: "bg-[#8B9D83]/15 text-[#8B9D83] border-[#8B9D83]/30",
  B: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-500/30",
  C: "bg-[#D4C9BE]/30 text-muted-foreground border-[#D4C9BE]/40",
  D: "bg-muted/30 text-muted-foreground border-muted/20",
};

/**
 * Growth graph for the project detail page — right panel.
 *
 * Shows the complete relationship chain:
 *   Project → Quest (grade) → Skill → Building → Learning Path
 *
 * Each step is a connected node in a vertical flow.
 */
export function ProjectGrowthGraph({ project }: ProjectGrowthGraphProps) {
  const { locale } = useLocale();

  const hasAnyRelation =
    project.quest_submission ||
    project.related_skill ||
    project.related_building ||
    project.source_path;

  if (!hasAnyRelation) {
    return (
      <div className="rounded-xl border border-border/60 bg-card/50 p-6 text-center">
        <span className="text-3xl">🔗</span>
        <p className="mt-2 text-sm text-muted-foreground">
          {locale === "zh"
            ? "暂无成长关联数据"
            : "No growth relations yet"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          {locale === "zh"
            ? "完成 Quest 后创建项目，将自动建立关联"
            : "Complete a Quest and create a project to establish relations"}
        </p>
      </div>
    );
  }

  const grade = project.quest_submission?.assessment_grade;
  const gradeStyle = grade ? GRADE_STYLE[grade] ?? "" : "";
  const score = project.quest_submission?.assessment_score;
  const status = project.quest_submission?.status;

  // Build the chain nodes
  interface ChainNode {
    icon: string;
    label: string;
    detail: string;
    detailExtra?: string;
    badge?: { text: string; style: string };
  }

  const nodes: ChainNode[] = [];

  // 1. Current project (always first)
  nodes.push({
    icon: "📁",
    label: locale === "zh" ? "当前项目" : "Current Project",
    detail: project.title,
  });

  // 2. Quest submission
  if (project.quest_submission) {
    nodes.push({
      icon: "✅",
      label: locale === "zh" ? "完成 Quest" : "Completed Quest",
      detail: project.quest_submission.quest_title,
      detailExtra:
        status && status !== "PASSED"
          ? `${locale === "zh" ? "状态" : "Status"}: ${status}`
          : undefined,
      badge: grade
        ? {
            text: score !== null ? `${grade} (${score}分)` : grade,
            style: gradeStyle,
          }
        : undefined,
    });
  }

  // 3. Related skill
  if (project.related_skill) {
    nodes.push({
      icon: "🧠",
      label: locale === "zh" ? "关联技能" : "Related Skill",
      detail: project.related_skill.name,
      detailExtra: project.related_skill.category
        ? `${locale === "zh" ? "领域" : "Domain"}: ${project.related_skill.category}`
        : undefined,
    });
  }

  // 4. Related building
  if (project.related_building) {
    nodes.push({
      icon: project.related_building.icon,
      label: locale === "zh" ? "关联建筑" : "Related Building",
      detail: `${project.related_building.name} Lv.${project.related_building.level}`,
    });
  }

  // 5. Source learning path
  if (project.source_path) {
    nodes.push({
      icon: "📋",
      label: locale === "zh" ? "来源学习路径" : "Source Path",
      detail: project.source_path.title,
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <h3 className="text-sm font-semibold mb-4">
        {locale === "zh" ? "🌱 成长关系图" : "🌱 Growth Graph"}
      </h3>

      <div className="relative">
        {nodes.map((node, idx) => {
          const isLast = idx === nodes.length - 1;
          return (
            <div
              key={idx}
              className={`relative pl-8 ${isLast ? "" : "pb-4"}`}
            >
              {/* Connector line */}
              {!isLast && (
                <div className="absolute left-[13px] top-8 bottom-0 w-0.5 bg-[#8B9D83]/25" />
              )}

              {/* Node circle */}
              <div
                className={`absolute left-0 top-1 w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                  idx === 0
                    ? "bg-[#8B9D83]/15 ring-2 ring-[#8B9D83]/30"
                    : "bg-[#C4A77D]/10 ring-1 ring-[#C4A77D]/20"
                }`}
              >
                <span>{node.icon}</span>
              </div>

              {/* Content */}
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  {node.label}
                </p>
                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                  <span className="text-sm font-medium truncate">
                    {node.detail}
                  </span>
                  {node.badge && (
                    <span
                      className={`inline-flex items-center rounded-full border px-1.5 py-0 text-[10px] font-bold flex-shrink-0 ${node.badge.style}`}
                    >
                      {node.badge.text}
                    </span>
                  )}
                </div>
                {node.detailExtra && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {node.detailExtra}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
