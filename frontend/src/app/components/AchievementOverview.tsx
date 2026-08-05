"use client";

import { useLocale } from "@/hooks/useLocale";
import { CIVILIZATION_TIER_LABELS } from "@/types/world";
import type { CivilizationTierValue } from "@/types/world";
import { QuestScrollIcon } from "@/app/components/QuestScrollIcon";

interface AchievementOverviewProps {
  totalProjects: number;
  completedQuests: number;
  activeBuildings: number;
  civilizationLevel: number;
  tier: CivilizationTierValue | null;
  isLoading: boolean;
}

/** 文明印记图标 — 每项使用象征性文明符号 */
const STAT_ICONS = [
  // 作品记录 — 石碑/档案碑
  { icon: "seal", key: "totalProjects" },
  // 探索完成 — 文明印章
  { icon: "checklist", key: "completedQuests" },
  // 激活领域 — 城市节点/文明核心
  { icon: "world-core", key: "activeBuildings" },
  // 当前时代 — 文明徽章
  { icon: "building-emblem", key: "civilizationLevel" },
] as const;

/**
 * 文明印记铭牌 — 横向排列的碑文记录，用细金线分隔，去除独立卡片。
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

  // 文明时代标签
  const tierLabel =
    tier && CIVILIZATION_TIER_LABELS[tier]
      ? locale === "en"
        ? (CIVILIZATION_TIER_LABELS[tier] as { en: string; zh: string }).en
        : (CIVILIZATION_TIER_LABELS[tier] as { en: string; zh: string }).zh
      : "";

  const values = {
    totalProjects: String(totalProjects),
    completedQuests: String(completedQuests),
    activeBuildings: String(activeBuildings),
    civilizationLevel: tierLabel ? `${tierLabel} Lv.${civilizationLevel}` : `Lv.${civilizationLevel}`,
  };

  const labels = {
    totalProjects: t("projects.overview_totalProjects"),
    completedQuests: t("projects.overview_completedQuests"),
    activeBuildings: t("projects.overview_activeBuildings"),
    civilizationLevel: t("projects.overview_civLevel"),
  };

  if (isLoading) {
    return (
      <div className="relative rounded-lg border border-[oklch(0.72_0.06_80_/_0.18)] bg-[oklch(0.99_0.003_95_/_0.5)] px-4 py-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-muted skeleton-shimmer" />
              <div className="space-y-1.5">
                <div className="h-4 w-12 rounded bg-muted skeleton-shimmer" />
                <div className="h-2.5 w-16 rounded bg-muted skeleton-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg border border-[oklch(0.72_0.06_80_/_0.18)] bg-gradient-to-br from-[oklch(0.99_0.003_95_/_0.6)] to-[oklch(0.975_0.005_92_/_0.4)] dark:from-[oklch(0.22_0.008_85_/_0.5)] dark:to-[oklch(0.2_0.006_85_/_0.5)] px-5 py-4 overflow-hidden">
      {/* 顶部金色渐变细线 */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[oklch(0.7_0.12_85_/_0.5)] to-transparent" />

      {/* 网格：横向排列 + 细线分隔 */}
      <div className="grid grid-cols-2 lg:grid-cols-4">
        {STAT_ICONS.map((stat, idx) => {
          // idx1/3：始终有左分隔线；idx2：桌面 4 列时才有左分隔线
          const baseBorder = "border-[oklch(0.72_0.06_80_/_0.18)] dark:border-[oklch(0.3_0.04_85_/_0.25)]";
          return (
            <div
              key={stat.key}
              className={`flex items-center gap-3 px-2 lg:px-4 py-3 ${
                idx === 1 || idx === 3
                  ? `border-l ${baseBorder}`
                  : idx === 2
                    ? `lg:border-l lg:${baseBorder}`
                    : ""
              }`}
            >
              <span className="flex-shrink-0 w-9 h-9 rounded-full border border-[oklch(0.7_0.12_85_/_0.35)] bg-[oklch(0.7_0.12_85_/_0.08)] dark:bg-[oklch(0.7_0.12_85_/_0.12)] flex items-center justify-center text-[oklch(0.55_0.10_85)] dark:text-[oklch(0.72_0.12_82)]">
                <QuestScrollIcon name={stat.icon} size={18} strokeWidth={1.4} />
              </span>
              <div className="min-w-0">
                <p className="text-lg font-bold font-civ-serif text-[oklch(0.3_0.02_80)] dark:text-[oklch(0.9_0.02_85)] tabular-nums leading-tight truncate">
                  {values[stat.key as keyof typeof values]}
                </p>
                <p className="text-[10px] text-[oklch(0.5_0.03_75)] dark:text-[oklch(0.62_0.02_80)] font-bold uppercase tracking-wide mt-0.5 font-civ-serif">
                  {labels[stat.key as keyof typeof labels]}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}