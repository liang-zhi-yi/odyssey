"use client";

import { useLocale } from "@/hooks/useLocale";
import { skillDisplayName } from "@/lib/skillNames";
import type { Project } from "@/types/project";
import type { UserBuilding } from "@/types/world";
import type { ReactNode } from "react";
import { QuestScrollIcon, resolveScrollIconName } from "@/app/components/QuestScrollIcon";
import { CivIcon } from "@/app/components/CivIcon";
import { BuildingSealIcon, inferSkillId } from "@/app/components/CivArchiveTheme";

interface ProjectGrowthGraphProps {
  project: Project;
  worldBuildings: UserBuilding[];
}

/** 等级印记配色 — 仅使用暖金/灰褐，禁止蓝色与深绿 */
const GRADE_STYLE: Record<string, string> = {
  S: "bg-[#C89B45]/15 text-[#B07A2E] border-[#C89B45]/45",
  A: "bg-[#8B9D83]/15 text-[#5F6B52] border-[#8B9D83]/40",
  B: "bg-[#C4A77D]/15 text-[#8C7650] border-[#C4A77D]/40",
  C: "bg-[#D4C9BE]/20 text-[#8C7650] border-[#D4C9BE]/45",
  D: "bg-[#E3DCCF]/25 text-[#A89F90] border-[#E3DCCF]/50",
};

/**
 * 文明演化路径 — 成长科技树。
 *
 * 展示完整的演化链条（纵向科技树）：
 *   当前项目 → Quest → 关联技能 → 关联建筑 → 来源学习路径
 *
 * 每个节点以「圆形印记」呈现，沿金色脊柱线逐级点亮。
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
      <div className="relative rounded-lg border border-dashed border-[#C89B45]/40 bg-[#FCF5E7]/60 dark:bg-[oklch(0.20_0.012_70)/0.5] px-6 py-10 text-center">
        {/* 空态 — 沉睡的演化节点 */}
        <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
          <span className="absolute inset-0 rounded-full border border-[#C89B45]/30" />
          <span className="absolute inset-2 rounded-full border border-dashed border-[#C89B45]/25" />
          <span className="text-[#A89F90]">
            <QuestScrollIcon name="path" size={24} strokeWidth={1.3} />
          </span>
        </div>
        <p className="mt-4 font-civ-serif text-sm text-[#8C7650]">
          {locale === "zh" ? "暂无成长关联数据" : "No growth relations yet"}
        </p>
        <p className="mt-1 text-xs text-[#A89F90]">
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

  // 根节点印记 — 从关联技能或项目名称推导唯一图标
  const rootSealType = inferSkillId(
    project.related_skill?.name ?? project.title,
    project.related_skill?.id
  );

  interface ChainNode {
    icon: ReactNode;
    label: string;
    detail: string;
    detailExtra?: string;
    badge?: { text: string; style: string };
  }

  const nodes: ChainNode[] = [];

  // 1. 当前项目（根节点，始终存在）
  nodes.push({
    icon: (
      <BuildingSealIcon type={rootSealType} size={30} />
    ),
    label: locale === "zh" ? "当前项目" : "Current Project",
    detail: project.title,
  });

  // 2. Quest submission
  if (project.quest_submission) {
    nodes.push({
      icon: <QuestScrollIcon name="checklist" size={16} />,
      label: locale === "zh" ? "完成 Quest" : "Completed Quest",
      detail: project.quest_submission.quest_title,
      detailExtra:
        status && status !== "PASSED"
          ? `${locale === "zh" ? "状态" : "Status"}: ${status}`
          : undefined,
      badge: grade
        ? {
            text: score !== null ? `${grade} · ${score}分` : grade,
            style: gradeStyle,
          }
        : undefined,
    });
  }

  // 3. Related skill
  if (project.related_skill) {
    nodes.push({
      icon: <QuestScrollIcon name="creation" size={16} />,
      label: locale === "zh" ? "关联技能" : "Related Skill",
      detail: skillDisplayName(project.related_skill.name, undefined, locale),
      detailExtra: project.related_skill.category
        ? `${locale === "zh" ? "领域" : "Domain"}: ${project.related_skill.category}`
        : undefined,
    });
  }

  // 4. Related building
  if (project.related_building) {
    nodes.push({
      icon: (
        <CivIcon
          type="building"
          name={project.related_building.name}
          size={26}
          alt={project.related_building.name}
          fallback={
            <QuestScrollIcon
              name={resolveScrollIconName(project.related_building.icon)}
              size={20}
              strokeWidth={1.4}
            />
          }
        />
      ),
      label: locale === "zh" ? "关联建筑" : "Related Building",
      detail: `${project.related_building.name} Lv.${project.related_building.level}`,
    });
  }

  // 5. Source learning path
  if (project.source_path) {
    nodes.push({
      icon: <QuestScrollIcon name="path" size={16} />,
      label: locale === "zh" ? "来源学习路径" : "Source Path",
      detail: project.source_path.title,
    });
  }

  return (
    <div className="relative rounded-lg border border-[#D8C29A] dark:border-[oklch(0.26_0.012_75)] bg-[#FCF5E7] dark:bg-[oklch(0.20_0.012_70)] px-5 sm:px-6 py-6 overflow-hidden">
      {/* 顶部金色线 */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C89B45]/55 to-transparent" />

      <div className="relative">
        {/* 金色脊柱线 */}
        <div className="absolute left-[26px] top-6 bottom-6 w-px bg-gradient-to-b from-[#C89B45]/70 via-[#C89B45]/30 to-transparent civ-spine-grow" />

        <div className="space-y-0">
          {nodes.map((node, idx) => {
            const isLast = idx === nodes.length - 1;
            const isRoot = idx === 0;
            return (
              <div
                key={idx}
                className={`civ-node-ignite relative pl-[64px] ${isLast ? "" : "pb-7"}`}
                style={{ animationDelay: `${300 + idx * 260}ms` }}
              >
                {/* 节点印记 — 统一 52px，与脊柱线对齐；根节点突出 */}
                <div
                  className={`absolute left-0 top-0 flex w-[52px] h-[52px] items-center justify-center rounded-full border ${
                    isRoot
                      ? "border-[#C89B45]/65 bg-[#F8F3E8] dark:bg-[oklch(0.22_0.012_75)] text-[#C89B45] civ-archive-breathe civ-node-glow"
                      : "border-[#C89B45]/35 bg-[#F8F3E8] dark:bg-[oklch(0.22_0.012_75)] text-[#C89B45]"
                  }`}
                >
                  <span className={isRoot ? "" : "opacity-80"}>{node.icon}</span>
                </div>

                {/* 内容 */}
                <div className="min-w-0 pt-1">
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#A89F90]">
                    {node.label}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    <span className="font-civ-serif text-sm font-semibold text-[#34291F] dark:text-[oklch(0.91_0.018_85)] truncate">
                      {node.detail}
                    </span>
                    {node.badge && (
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0 text-[10px] font-bold flex-shrink-0 ${node.badge.style}`}
                      >
                        {node.badge.text}
                      </span>
                    )}
                  </div>
                  {node.detailExtra && (
                    <p className="text-[11px] text-[#8C7650] mt-0.5">
                      {node.detailExtra}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}