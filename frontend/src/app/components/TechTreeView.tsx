"use client";

import useSWR from "swr";
import { worldService } from "@/services/world.service";
import { LEVEL_LABELS } from "@/types/world";
import type { TechTreeNode, TechTreeData } from "@/types/world";
import { useLocale } from "@/hooks/useLocale";

interface TechTreeViewProps {
  data?: TechTreeData;
}

export function TechTreeView({ data: initialData }: TechTreeViewProps) {
  const { locale } = useLocale();

  const { data, isLoading } = useSWR(
    "world-tech-tree",
    () => worldService.getTechTree(),
    { fallbackData: initialData }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!data || (data.regular_nodes.length === 0 && data.compound_nodes.length === 0)) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center">
        <p className="text-sm text-muted-foreground">No tech tree data available</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-16 py-8">
      {/* Top row: Compound buildings */}
      <div className="space-y-8">
        <div className="text-center">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {locale === "en" ? "Compound Buildings" : "复合建筑"}
          </span>
        </div>
        <div className="flex justify-center gap-12">
          {data.compound_nodes.map((node) => (
            <CompoundNode key={node.id} node={node} locale={locale} />
          ))}
        </div>
      </div>

      {/* Connector lines area */}
      <div className="relative flex justify-center">
        <div className="border-t-2 border-dashed border-muted-foreground/20 w-3/4" />
        <span className="absolute top-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground font-medium">
          {locale === "en" ? "Requires" : "需要前提技能"}
        </span>
      </div>

      {/* Bottom row: Regular skill buildings */}
      <div className="space-y-4">
        <div className="text-center">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {locale === "en" ? "Skill Buildings" : "技能建筑"}
          </span>
        </div>
        <div className="flex justify-center gap-6 flex-wrap">
          {data.regular_nodes.map((node) => (
            <RegularNode key={node.id} node={node} locale={locale} />
          ))}
        </div>
      </div>
    </div>
  );
}

function RegularNode({ node, locale }: { node: TechTreeNode; locale: string }) {
  const name =
    locale === "en" && node.name_en ? node.name_en : node.name;
  const levelLabel =
    locale === "en"
      ? LEVEL_LABELS[node.level]?.en ?? `Lv.${node.level}`
      : LEVEL_LABELS[node.level]?.zh ?? `Lv.${node.level}`;
  const isLocked = node.status === "LOCKED";

  return (
    <div
      className={`
        flex flex-col items-center gap-1 p-3 rounded-xl border-2 min-w-[90px]
        transition-all
        ${isLocked
          ? "border-dashed border-muted-foreground/20 bg-muted/10 opacity-50"
          : "border-primary/30 bg-primary/5"
        }
      `}
    >
      <span className={`text-2xl ${isLocked ? "grayscale" : ""}`}>
        {node.icon}
      </span>
      <span className="text-xs font-medium text-foreground text-center leading-tight">
        {name}
      </span>
      <span
        className={`text-[10px] rounded-full px-1.5 py-0.5 ${
          isLocked
            ? "bg-muted text-muted-foreground"
            : "bg-primary/10 text-primary"
        }`}
      >
        {levelLabel}
      </span>
    </div>
  );
}

function CompoundNode({ node, locale }: { node: TechTreeNode; locale: string }) {
  const name =
    locale === "en" && node.name_en ? node.name_en : node.name;
  const levelLabel =
    locale === "en"
      ? LEVEL_LABELS[node.level]?.en ?? `Lv.${node.level}`
      : LEVEL_LABELS[node.level]?.zh ?? `Lv.${node.level}`;
  const isLocked = node.status === "LOCKED";

  // Prerequisite progress
  const prereqs = node.prereq_progress ?? [];
  const metCount = prereqs.filter((p) => p.met).length;
  const totalCount = prereqs.length;

  return (
    <div
      className={`
        flex flex-col items-center gap-2 p-4 rounded-2xl border-2 min-w-[160px]
        transition-all
        ${isLocked
          ? "border-dashed border-muted-foreground/20 bg-muted/10 opacity-60"
          : "border-yellow-500/40 bg-yellow-500/5"
        }
      `}
    >
      <div className="flex items-center gap-2">
        <span className={`text-3xl ${isLocked ? "grayscale" : ""}`}>
          {node.icon}
        </span>
        {!isLocked && (
          <span className="text-yellow-500 text-lg">⭐</span>
        )}
      </div>

      <span className="text-sm font-semibold text-foreground text-center">
        {name}
      </span>

      <span
        className={`text-[10px] rounded-full px-2 py-0.5 ${
          isLocked
            ? "bg-muted text-muted-foreground"
            : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
        }`}
      >
        {levelLabel}
      </span>

      {/* Prerequisite checklist */}
      <div className="w-full space-y-0.5 pt-1 border-t border-border/50">
        {prereqs.map((p) => (
          <div key={p.skill_name} className="flex items-center justify-between text-[10px]">
            <span className={p.met ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
              {p.met ? "✓" : "○"} {p.skill_name}
            </span>
            <span className={p.met ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
              Lv.{p.current_level}/{p.required_level}
            </span>
          </div>
        ))}
      </div>

      {/* Overall prerequisite status */}
      <span className={`text-[10px] font-medium ${
        isLocked
          ? "text-muted-foreground"
          : "text-green-600 dark:text-green-400"
      }`}>
        {isLocked
          ? `${metCount}/${totalCount} ${locale === "en" ? "prerequisites" : "前提已就绪"}`
          : locale === "en" ? "All prerequisites met" : "全部前提已满足"
        }
      </span>
    </div>
  );
}
