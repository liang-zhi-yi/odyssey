"use client";

import { useLocale } from "@/hooks/useLocale";
import type { PathStatsSummary } from "@/types/learningPath";

interface CivilizationStatsBarProps {
  stats: PathStatsSummary | null;
  isLoading: boolean;
}

/**
 * Top stats bar for the paths page — 4 horizontal cards showing
 * civilization level, unlocked buildings, completed quests, and total skill value.
 * Design: Civilization simulator / strategy game style.
 */
export function CivilizationStatsBar({ stats, isLoading }: CivilizationStatsBarProps) {
  const { t, locale } = useLocale();

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="h-3 w-16 rounded-md bg-muted skeleton-shimmer mb-2" />
            <div className="h-7 w-20 rounded-md bg-muted skeleton-shimmer" />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      icon: "🏛️",
      label: locale === "zh" ? "文明等级" : "Civ Level",
      value: `Lv.${stats.civilization_level}`,
      sub: `${stats.era_icon} ${locale === "zh" ? stats.civilization_name : stats.era}`,
      accent: "from-[#C4A77D]/20 to-[#C4A77D]/5 border-[#C4A77D]/20",
    },
    {
      icon: "🏗️",
      label: locale === "zh" ? "已解锁建筑" : "Buildings",
      value: `${stats.unlocked_buildings}`,
      sub: `${locale === "zh" ? "共" : "of"} ${stats.total_buildings}`,
      accent: "from-[#8B9D83]/20 to-[#8B9D83]/5 border-[#8B9D83]/20",
    },
    {
      icon: "📋",
      label: locale === "zh" ? "完成Quest" : "Quests Done",
      value: `${stats.completed_quests}`,
      sub: locale === "zh" ? "次任务完成" : "completed",
      accent: "from-[#D4A76A]/20 to-[#D4A76A]/5 border-[#D4A76A]/20",
    },
    {
      icon: "⭐",
      label: locale === "zh" ? "总技能值" : "Skill Power",
      value: `${stats.total_skill_value}`,
      sub: locale === "zh" ? "累计能力值" : "total XP",
      accent: "from-[#B8A88A]/20 to-[#B8A88A]/5 border-[#B8A88A]/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-2xl border bg-gradient-to-br ${card.accent} p-4 shadow-card transition-all duration-300`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{card.icon}</span>
            <span className="text-xs font-medium text-muted-foreground">{card.label}</span>
          </div>
          <p className="text-2xl font-bold text-foreground tracking-tight">{card.value}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
