"use client";

import { useLocale } from "@/hooks/useLocale";
import type { PathStatsSummary } from "@/types/learningPath";
import { QuestScrollIcon, type ScrollIconName } from "./QuestScrollIcon";

interface CivilizationStatsBarProps {
  stats: PathStatsSummary | null;
  isLoading: boolean;
}

/**
 * Top metrics strip for the paths page — 4 growth indicators in a single
 * horizontal band, separated by thin warm-gold lines.
 * Design: explorer ledger / civilization annals — no independent cards.
 */
export function CivilizationStatsBar({ stats, isLoading }: CivilizationStatsBarProps) {
  const { t, locale } = useLocale();

  if (isLoading || !stats) {
    return (
      <div className="flex flex-col divide-y sm:divide-y-0 sm:divide-x sm:flex-row divide-[oklch(0.7_0.12_85_/_0.18)] border-y border-[oklch(0.7_0.12_85_/_0.25)]">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-1 px-4 py-4">
            <div className="h-3 w-16 rounded-md bg-muted/70 skeleton-shimmer mb-2" />
            <div className="h-6 w-20 rounded-md bg-muted/70 skeleton-shimmer" />
          </div>
        ))}
      </div>
    );
  }

  const items = [
    {
      icon: "building" as ScrollIconName,
      label: locale === "zh" ? "文明等级" : "Civ Level",
      value: `Lv.${stats.civilization_level}`,
      sub: `${locale === "zh" ? stats.civilization_name : stats.era}`,
    },
    {
      icon: "crane" as ScrollIconName,
      label: locale === "zh" ? "已解锁建筑" : "Buildings",
      value: `${stats.unlocked_buildings}`,
      sub: `${locale === "zh" ? "共" : "of"} ${stats.total_buildings}`,
    },
    {
      icon: "checklist" as ScrollIconName,
      label: locale === "zh" ? "完成Quest" : "Quests Done",
      value: `${stats.completed_quests}`,
      sub: locale === "zh" ? "次任务完成" : "completed",
    },
    {
      icon: "star" as ScrollIconName,
      label: locale === "zh" ? "总技能值" : "Skill Power",
      value: `${stats.total_skill_value}`,
      sub: locale === "zh" ? "累计能力值" : "total XP",
    },
  ];

  return (
    <div className="flex flex-col divide-y sm:divide-y-0 sm:divide-x sm:flex-row divide-[oklch(0.6_0.10_85_/_0.22)] border-y border-[oklch(0.6_0.10_85_/_0.35)]">
      {items.map((it) => (
        <div key={it.label} className="relative flex items-center gap-3 flex-1 px-4 py-4">
          <span className="shrink-0 inline-flex text-[oklch(0.6_0.10_85)] dark:text-[oklch(0.72_0.12_82)]">
            <QuestScrollIcon name={it.icon} size={18} strokeWidth={1.4} />
          </span>
          <div className="min-w-0">
            <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {it.label}
            </div>
            <div className="mt-0.5 font-mono text-xl font-bold leading-tight text-[oklch(0.3_0.02_80)] dark:text-[oklch(0.85_0.04_80)]">
              {it.value}
            </div>
            <div className="text-[10px] text-muted-foreground/80 truncate">{it.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}