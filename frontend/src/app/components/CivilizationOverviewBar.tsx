"use client";

import { useLocale } from "@/hooks/useLocale";
import { ERA_LABELS, CIVILIZATION_TIER_LABELS } from "@/types/world";
import type { World } from "@/types/world";

interface CivilizationOverviewBarProps {
  world: World;
}

/**
 * Top-layer civilization overview bar.
 *
 * Design: warm cream/sage/gold theme per docs/world-design.md.
 * Shows: era badge, tier, resources (knowledge/tech/population),
 * exploration progress, era score.
 */
export function CivilizationOverviewBar({ world }: CivilizationOverviewBarProps) {
  const { t, locale } = useLocale();
  const eraInfo = ERA_LABELS[world.era] ?? ERA_LABELS.WILDERNESS;
  const tierInfo = CIVILIZATION_TIER_LABELS[world.tier] ?? CIVILIZATION_TIER_LABELS.SETTLER;

  const eraName = locale === "en" ? eraInfo.en : eraInfo.zh;
  const tierName = locale === "en" ? tierInfo.en : tierInfo.zh;

  // Era progress
  const eraProgress = world.next_era_at != null
    ? Math.min(100, Math.round((world.era_score / world.next_era_at) * 100))
    : 100;

  // Exploration progress
  const explorationPct = world.exploration_progress ?? 0;

  // Format large numbers
  const fmt = (n: number): string => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  return (
    <div className="rounded-2xl border border-[oklch(0.88_0.02_90)] bg-gradient-to-br from-[oklch(0.98_0.005_90)] via-[oklch(0.97_0.008_95)] to-[oklch(0.96_0.015_92)] p-5 shadow-card space-y-4">
      {/* ── Row 1: Era + Tier Badges ── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Era badge */}
        <div className="flex items-center gap-2 rounded-xl bg-[oklch(0.72_0.12_85_/_0.15)] border border-[oklch(0.72_0.12_85_/_0.3)] px-3 py-2">
          <span className="text-2xl">{eraInfo.icon}</span>
          <div className="leading-tight">
            <p className="text-[10px] text-[oklch(0.55_0.02_85)] font-medium uppercase tracking-wider">
              {locale === "en" ? "Era" : "时代"}
            </p>
            <p className="text-sm font-bold text-[oklch(0.4_0.03_80)]">
              {eraName}
            </p>
          </div>
        </div>

        {/* Tier badge */}
        <div className="flex items-center gap-2 rounded-xl bg-[oklch(0.65_0.05_145_/_0.1)] border border-[oklch(0.65_0.05_145_/_0.25)] px-3 py-2">
          <span className="text-2xl">{tierInfo.icon}</span>
          <div className="leading-tight">
            <p className="text-[10px] text-[oklch(0.55_0.02_85)] font-medium uppercase tracking-wider">
              {locale === "en" ? "Tier" : "文明等级"}
            </p>
            <p className="text-sm font-bold text-[oklch(0.4_0.03_80)]">
              {tierName}
            </p>
          </div>
        </div>

        {/* Civilization Level */}
        <div className="flex items-center gap-2 rounded-xl bg-[oklch(0.97_0.003_90)] border border-[oklch(0.88_0.02_90)] px-3 py-2">
          <span className="text-xl">🏛️</span>
          <div className="leading-tight">
            <p className="text-[10px] text-[oklch(0.55_0.02_85)] font-medium uppercase tracking-wider">
              {locale === "en" ? "Level" : "等级"}
            </p>
            <p className="text-sm font-bold text-[oklch(0.4_0.03_80)] tabular-nums">
              Lv.{world.civilization_level}
            </p>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1 min-w-0" />

        {/* Era score progress */}
        <div className="hidden sm:flex items-center gap-2 rounded-xl bg-[oklch(0.97_0.003_90)] border border-[oklch(0.88_0.02_90)] px-3 py-2 min-w-[160px]">
          <div className="flex-1 min-w-0 leading-tight">
            <p className="text-[10px] text-[oklch(0.55_0.02_85)] font-medium uppercase tracking-wider">
              {locale === "en" ? "Era Score" : "时代分数"}
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-[oklch(0.88_0.02_90)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[oklch(0.72_0.12_85)] transition-all duration-700"
                  style={{ width: `${eraProgress}%` }}
                />
              </div>
              <span className="text-xs font-mono text-[oklch(0.55_0.02_85)] tabular-nums">
                {world.era_score}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 2: Resources + Exploration ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Knowledge Points */}
        <ResourceChip
          icon="📚"
          label={locale === "en" ? "Knowledge" : "知识点"}
          value={fmt(world.knowledge_points)}
          color="oklch(0.65 0.05 145)"
        />

        {/* Tech Points */}
        <ResourceChip
          icon="⚡"
          label={locale === "en" ? "Tech" : "科技点"}
          value={fmt(world.tech_points)}
          color="oklch(0.55 0.12 250)"
        />

        {/* Population */}
        <ResourceChip
          icon="👥"
          label={locale === "en" ? "Population" : "人口"}
          value={fmt(world.population)}
          color="oklch(0.55 0.08 25)"
        />

        {/* Divider */}
        <div className="w-px h-8 bg-[oklch(0.88_0.02_90)] mx-1 hidden sm:block" />

        {/* Exploration progress */}
        <div className="flex items-center gap-2 rounded-lg bg-[oklch(0.97_0.003_90)] border border-[oklch(0.88_0.02_90)] px-3 py-2 min-w-[180px]">
          <span className="text-lg">🗺️</span>
          <div className="flex-1 min-w-0 leading-tight">
            <p className="text-[10px] text-[oklch(0.55_0.02_85)] font-medium">
              {locale === "en" ? "Exploration" : "探索进度"}
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-[oklch(0.88_0.02_90)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[oklch(0.65_0.05_145)] transition-all duration-700"
                  style={{ width: `${explorationPct}%` }}
                />
              </div>
              <span className="text-xs font-mono text-[oklch(0.55_0.02_85)] tabular-nums">
                {explorationPct}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Single resource chip with icon, label, value. */
function ResourceChip({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      className="flex items-center gap-1.5 rounded-lg px-3 py-2 min-w-[80px]"
      style={{
        background: `${color} / 0.08`,
        border: `1px solid ${color} / 0.18`,
      }}
    >
      <span className="text-lg">{icon}</span>
      <div className="leading-tight min-w-0">
        <p className="text-[10px] text-[oklch(0.55_0.02_85)] font-medium leading-none">
          {label}
        </p>
        <p className="text-sm font-bold text-[oklch(0.35_0.02_80)] tabular-nums leading-tight">
          {value}
        </p>
      </div>
    </div>
  );
}
