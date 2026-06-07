"use client";

import { useLocale } from "@/hooks/useLocale";
import { RoadmapNode } from "./RoadmapNode";
import type { MilestoneNode } from "@/types/learningPath";

interface PathRoadmapProps {
  nodes: MilestoneNode[];
  pathId: string;
}

/**
 * Vertical timeline roadmap for the civilization development view.
 * Renders a vertical connector line with RoadmapNode cards at each milestone.
 * Design: Civilization 6 / Anno 1800 inspired strategy-game roadmap.
 */
export function PathRoadmap({ nodes, pathId }: PathRoadmapProps) {
  const { locale } = useLocale();

  if (!nodes || nodes.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <span className="text-3xl">🗺️</span>
        <p className="mt-3 text-sm text-muted-foreground">
          {locale === "zh" ? "暂无路线图节点" : "No roadmap nodes yet"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {locale === "zh"
            ? "完成AI生成或选择预设路径后将显示文明发展路线图"
            : "The civilization roadmap will appear after AI generation or selecting a preset path"}
        </p>
      </div>
    );
  }

  // Find the active node index for the "current milestone" label
  const activeIndex = nodes.findIndex((n) => n.status === "ACTIVE");
  const completedCount = nodes.filter((n) => n.status === "COMPLETED").length;
  const totalCount = nodes.length;

  return (
    <div className="space-y-1">
      {/* Roadmap header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🗺️</span>
          <h3 className="text-sm font-semibold">
            {locale === "zh" ? "文明发展路线图" : "Civilization Roadmap"}
          </h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {completedCount}/{totalCount}{" "}
          {locale === "zh" ? "已完成" : "done"}
        </span>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#C4A77D]" />
          {locale === "zh" ? "已完成" : "Done"}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#8B9D83] animate-warm-pulse" />
          {locale === "zh" ? "进行中" : "Active"}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#D4C9BE]" />
          {locale === "zh" ? "待解锁" : "Locked"}
        </span>
      </div>

      {/* Timeline nodes */}
      <div className="relative">
        {nodes.map((node, idx) => (
          <RoadmapNode
            key={node.id}
            node={node}
            isLast={idx === nodes.length - 1}
            pathId={pathId}
          />
        ))}
      </div>

      {/* Completion message */}
      {completedCount === totalCount && totalCount > 0 && (
        <div className="mt-4 rounded-2xl border border-[#C4A77D]/30 bg-gradient-to-br from-[#C4A77D]/10 to-[#C4A77D]/5 p-4 text-center animate-fade-in-up">
          <span className="text-2xl">🎉</span>
          <p className="mt-2 text-sm font-semibold text-[#8B7355]">
            {locale === "zh" ? "路径完成！" : "Path Complete!"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {locale === "zh"
              ? "恭喜你完成了这条学习路径！建筑已升级，文明已成长。"
              : "Congratulations! Buildings upgraded, civilization advanced."}
          </p>
        </div>
      )}
    </div>
  );
}
