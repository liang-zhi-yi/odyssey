"use client";

import { useLocale } from "@/hooks/useLocale";
import { CIVILIZATION_TIER_LABELS } from "@/types/world";
import type { CivilizationTierValue } from "@/types/world";

interface AchievementOverviewProps {
  totalProjects: number;
  completedQuests: number;
  activeBuildings: number;
  civilizationLevel: number;
  tier: CivilizationTierValue | null;
  isLoading: boolean;
}

/** Grade → color mapping for the stat cards */
const STAT_STYLES = [
  { icon: "📁", key: "totalProjects", bg: "from-[#8B9D83]/10 to-[#8B9D83]/5", border: "border-[#8B9D83]/20" },
  { icon: "✅", key: "completedQuests", bg: "from-emerald-500/10 to-emerald-500/5", border: "border-emerald-500/20" },
  { icon: "🏗️", key: "activeBuildings", bg: "from-[#C4A77D]/10 to-[#C4A77D]/5", border: "border-[#C4A77D]/20" },
  { icon: "🏛️", key: "civilizationLevel", bg: "from-amber-500/10 to-amber-500/5", border: "border-amber-500/20" },
];

/**
 * First layer — horizontal stat cards showing civilization achievement overview.
 *
 * Shows: total projects, completed quests, active buildings, civilization tier + level.
 */
export function AchievementOverview({
  totalProjects,
  completedQuests,
  activeBuildings,
  civilizationLevel,
  tier,
  isLoading,
}: AchievementOverviewProps) {
  const { t, locale } = useLocale();

  // Build tier label
  const tierLabel =
    tier && CIVILIZATION_TIER_LABELS[tier]
      ? locale === "en"
        ? (CIVILIZATION_TIER_LABELS[tier] as { en: string; zh: string }).en
        : (CIVILIZATION_TIER_LABELS[tier] as { en: string; zh: string }).zh
      : "";

  const values = {
    totalProjects,
    completedQuests,
    activeBuildings,
    civilizationLevel: tierLabel ? `${tierLabel} Lv.${civilizationLevel}` : `Lv.${civilizationLevel}`,
  };

  const labels = {
    totalProjects: locale === "zh" ? "项目作品" : "Projects",
    completedQuests: locale === "zh" ? "完成 Quest" : "Quests Done",
    activeBuildings: locale === "zh" ? "激活建筑" : "Active Buildings",
    civilizationLevel: locale === "zh" ? "文明等级" : "Civ Level",
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-4 shadow-card"
          >
            <div className="h-6 w-6 rounded-full bg-muted skeleton-shimmer mb-2" />
            <div className="h-5 w-12 rounded bg-muted skeleton-shimmer mb-1" />
            <div className="h-3 w-16 rounded bg-muted skeleton-shimmer" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {STAT_STYLES.map((stat) => (
        <div
          key={stat.key}
          className={`rounded-xl border ${stat.border} bg-gradient-to-br ${stat.bg} p-4 shadow-card`}
        >
          <span className="text-2xl">{stat.icon}</span>
          <p className="mt-2 text-xl font-bold tabular-nums">
            {String(values[stat.key as keyof typeof values])}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">
            {labels[stat.key as keyof typeof labels]}
          </p>
        </div>
      ))}
    </div>
  );
}
