"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useLocale } from "@/hooks/useLocale";
import { CivilizationCompass } from "./CivilizationCompass";
import { GrowthTimeline } from "./GrowthTimeline";
import { EmptyState } from "./EmptyState";
import { VintageShieldIcon } from "./VintageShieldIcon";
import {
  ERA_LABELS,
  CIVILIZATION_TIER_LABELS,
  LEVEL_LABELS,
} from "@/types/world";
import type {
  World,
  CivilizationDirection,
  UserBuilding,
  UserCompoundBuilding,
} from "@/types/world";

interface CivilizationOverviewTabProps {
  world: World;
  direction: CivilizationDirection | null;
  directionLoading: boolean;
}

/**
 * Civilization Overview — the default landing view for My World.
 *
 * Sections:
 * 1. Hero dual-column: era/tier/level stats (left) + exploration/index (right)
 * 2. Core Building — the highest-level building as civilization centerpiece
 * 3. Next Goal — what to build/unlock next
 * 4. Civilization Summary — stats grid
 * 5. Growth Timeline
 *
 * Design: warm cream/sage/gold, civilization builder feel.
 */
export function CivilizationOverviewTab({
  world,
  direction,
  directionLoading,
}: CivilizationOverviewTabProps) {
  const { t, locale } = useLocale();
  const eraInfo = ERA_LABELS[world.era] ?? ERA_LABELS.WILDERNESS;
  const tierInfo = CIVILIZATION_TIER_LABELS[world.tier] ?? CIVILIZATION_TIER_LABELS.SETTLER;

  const eraName = locale === "en" ? eraInfo.en : eraInfo.zh;
  const tierName = locale === "en" ? tierInfo.en : tierInfo.zh;

  // Era progress
  const eraProgress = world.next_era_at != null
    ? Math.min(100, Math.round((world.era_score / world.next_era_at) * 100))
    : 100;

  // Tier progress
  const tierProgress = world.next_tier_at > 0
    ? Math.min(100, Math.round((world.tier_score / world.next_tier_at) * 100))
    : 100;

  // ── Core Building: highest-level active compound, fallback to highest regular ──
  const coreBuilding = useMemo(() => {
    const activeCompounds = (world.compound_buildings ?? []).filter(
      (cb) => cb.status !== "LOCKED"
    );
    if (activeCompounds.length > 0) {
      return activeCompounds.reduce((a, b) => (b.level > a.level ? b : a));
    }
    const activeRegular = (world.buildings ?? []).filter(
      (b) => b.status !== "LOCKED"
    );
    if (activeRegular.length > 0) {
      return activeRegular.reduce((a, b) => (b.level > a.level ? b : a));
    }
    return null;
  }, [world.buildings, world.compound_buildings]);

  // ── Next Goal: find a locked compound building with the most prerequisites met ──
  const nextGoal = useMemo(() => {
    const lockedCompounds = (world.compound_buildings ?? []).filter(
      (cb) => cb.status === "LOCKED" && cb.template?.required_skills?.length
    );
    if (lockedCompounds.length === 0) {
      // No locked compounds — suggest upgrading the core building if not max
      if (coreBuilding && coreBuilding.level < (coreBuilding.template?.max_level ?? 10)) {
        return {
          type: "upgrade" as const,
          building: coreBuilding,
          targetLevel: coreBuilding.level + 1,
        };
      }
      return null;
    }
    // Pick the first locked compound as a goal (user can see prerequisites)
    return {
      type: "unlock" as const,
      building: lockedCompounds[0],
    };
  }, [world.compound_buildings, coreBuilding]);

  // Format large numbers
  const fmt = (n: number): string => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  // Exploration percentage
  const explorationPct = world.exploration_progress ?? 0;

  // If no buildings at all, show path direction or empty state
  if (world.buildings.length === 0 && world.compound_buildings.length === 0) {
    const hasActivePaths =
      direction &&
      direction.active_paths.length > 0 &&
      direction.active_paths.some((p) => p.targeted_buildings.length > 0);

    if (hasActivePaths) {
      return (
        <div className="space-y-6">
          {/* Minimal hero — no buildings yet, but civilization has direction */}
          <div className="rounded-2xl border border-[oklch(0.88_0.02_90)] bg-gradient-to-br from-[oklch(0.98_0.005_90)] to-[oklch(0.97_0.008_95)] p-6 shadow-card">
            <div className="text-center max-w-md mx-auto">
              <span className="text-4xl block mb-3">🚀</span>
              <h2 className="text-lg font-bold text-[oklch(0.3_0.02_80)]">
                {locale === "en" ? "Civilization Taking Shape" : "文明正在成形"}
              </h2>
              <p className="mt-2 text-sm text-[oklch(0.5_0.02_85)]">
                {locale === "en"
                  ? `Your ${direction.active_paths.length} active learning path(s) are charting the course. Complete quests to unlock your first buildings.`
                  : `你正在通过 ${direction.active_paths.length} 条学习路径规划文明方向。完成任务来解锁第一座建筑。`}
              </p>
              <Link
                href="/paths"
                className="mt-4 inline-block rounded-xl bg-[oklch(0.72_0.12_85)] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 transition-all"
              >
                {locale === "en" ? "Continue Learning →" : "继续学习 →"}
              </Link>
            </div>
          </div>

          {/* Show the compass with path directions */}
          <CivilizationCompass
            direction={direction}
            isLoading={directionLoading}
            size="md"
          />

          {/* Active path summary cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            {direction.active_paths.map((path) => (
              <Link
                key={path.path_id}
                href={`/paths/${path.path_id}`}
                className="rounded-xl border border-[oklch(0.88_0.02_90)] bg-[oklch(0.98_0.005_90)] p-4 shadow-card transition-all hover:shadow-card-hover hover:border-[oklch(0.72_0.12_85)]/30"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🛤️</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-[oklch(0.3_0.02_80)] truncate">
                      {path.path_title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 rounded-full bg-[oklch(0.88_0.02_90)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[oklch(0.65_0.05_145)] transition-all duration-700"
                          style={{ width: `${path.progress_pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-[oklch(0.5_0.02_85)] tabular-nums">
                        {path.progress_pct}%
                      </span>
                    </div>
                  </div>
                </div>
                {/* Targeted buildings */}
                {path.targeted_buildings.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {path.targeted_buildings.slice(0, 4).map((tb) => (
                      <span
                        key={tb.building_id}
                        className="text-[10px] bg-[oklch(0.72_0.12_85_/_0.08)] border border-[oklch(0.72_0.12_85_/_0.18)] rounded-full px-2 py-0.5 text-[oklch(0.4_0.03_80)]"
                      >
                        {tb.building_icon}{" "}
                        {locale === "en" && tb.building_name_en
                          ? tb.building_name_en
                          : tb.building_name}{" "}
                        Lv.{tb.projected_level}
                      </span>
                    ))}
                    {path.targeted_buildings.length > 4 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{path.targeted_buildings.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-dashed border-[oklch(0.85_0.02_90)] bg-[oklch(0.98_0.005_90)] p-12">
        <EmptyState
          title={t("world.emptyTitle")}
          description={t("world.emptyDesc")}
          actionLabel={t("world.startQuest")}
          actionHref="/quests"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ═══════ 1. Hero Section — dual column ═══════ */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Era + Tier + Level */}
        <div className="vintage-parchment-card p-6 shadow-md border-2 border-double border-[oklch(0.7_0.12_85_/_0.35)] relative overflow-hidden space-y-5">
          {/* Faint compass watermark */}
          <div className="absolute -bottom-10 -right-10 w-48 h-48 opacity-[0.03] dark:opacity-[0.05] pointer-events-none select-none">
            <svg viewBox="0 0 100 100" className="animate-rhumb-spin w-full h-full text-[oklch(0.7_0.12_85)]">
              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
              <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeWidth="0.75" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="0.75" />
            </svg>
          </div>

          {/* Civilization name */}
          <div>
            <p className="text-[10px] text-[oklch(0.55_0.02_85)] font-bold uppercase tracking-wider">
              {locale === "en" ? "My Civilization" : "我的文明领地"}
            </p>
            <h2 className="text-2xl font-bold font-civ-serif text-[oklch(0.3_0.02_80)] mt-0.5">
              {world.name}
            </h2>
          </div>

          {/* Era + Tier badges */}
          <div className="flex items-center gap-3 flex-wrap relative z-10">
            <div className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-[oklch(0.99_0.003_95)] to-[oklch(0.95_0.005_90)] dark:from-[oklch(0.25_0.008_85)] dark:to-[oklch(0.2_0.006_85)] border border-[oklch(0.88_0.02_90)] px-3.5 py-2.5 shadow-sm transition-all duration-300 hover:shadow-md flex-1 min-w-[140px]">
              <VintageShieldIcon icon={eraInfo.icon} size="sm" tier="gold" />
              <div className="leading-tight">
                <p className="text-[9px] text-[oklch(0.55_0.02_85)] font-bold uppercase tracking-wider">
                  {locale === "en" ? "Era" : "发展时代"}
                </p>
                <p className="text-base font-bold font-civ-serif text-[oklch(0.4_0.03_80)]">
                  {eraName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-[oklch(0.99_0.003_95)] to-[oklch(0.95_0.005_90)] dark:from-[oklch(0.25_0.008_85)] dark:to-[oklch(0.2_0.006_85)] border border-[oklch(0.88_0.02_90)] px-3.5 py-2.5 shadow-sm transition-all duration-300 hover:shadow-md flex-1 min-w-[140px]">
              <VintageShieldIcon icon={tierInfo.icon} size="sm" tier="silver" />
              <div className="leading-tight">
                <p className="text-[9px] text-[oklch(0.55_0.02_85)] font-bold uppercase tracking-wider">
                  {locale === "en" ? "Tier" : "文明等级"}
                </p>
                <p className="text-base font-bold font-civ-serif text-[oklch(0.4_0.03_80)]">
                  {tierName} Lv.{world.civilization_level}
                </p>
              </div>
            </div>
          </div>

          {/* Civilization Index */}
          <div className="flex items-center gap-3 rounded-xl bg-[oklch(0.95_0.005_90)]/50 dark:bg-[oklch(0.25_0.008_85)]/50 border border-[oklch(0.88_0.02_90)] px-3.5 py-2.5 relative z-10">
            <VintageShieldIcon icon="📊" size="sm" tier="bronze" />
            <div className="flex-1 min-w-0 leading-tight">
              <p className="text-[9px] text-[oklch(0.55_0.02_85)] font-bold uppercase tracking-wider">
                {locale === "en" ? "Civilization Index" : "文明实力总指数"}
              </p>
              <p className="text-xl font-bold font-mono text-[oklch(0.4_0.03_80)] tabular-nums">
                {fmt(world.tier_score)}
              </p>
            </div>
          </div>

          {/* Progress bars */}
          <div className="space-y-3 relative z-10 pt-2">
            {/* Era progress */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-[oklch(0.5_0.02_85)]">
                <span>{locale === "en" ? "Era Horizon" : "时代演进进度"}</span>
                <span className="font-mono tabular-nums">{eraProgress}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-[oklch(0.88_0.02_90)] overflow-hidden p-[1px] border border-[oklch(0.8_0.02_90)]/50">
                <div
                  className="h-full rounded-full bg-[oklch(0.72_0.12_85)] animate-route-flow transition-all duration-700"
                  style={{ width: `${eraProgress}%` }}
                />
              </div>
            </div>
            {/* Tier progress */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-[oklch(0.5_0.02_85)]">
                <span>{locale === "en" ? "Tier Expansion" : "领土扩张进度"}</span>
                <span className="font-mono tabular-nums">{tierProgress}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-[oklch(0.88_0.02_90)] overflow-hidden p-[1px] border border-[oklch(0.8_0.02_90)]/50">
                <div
                  className="h-full rounded-full bg-[oklch(0.65_0.05_145)] animate-route-flow transition-all duration-700"
                  style={{ width: `${tierProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Exploration + Compass mini */}
        <div className="space-y-4">
          {/* Exploration + Resources card */}
          <div className="vintage-parchment-card p-5 shadow-md border-2 border-double border-[oklch(0.7_0.12_85_/_0.35)] relative overflow-hidden space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 rounded-xl bg-[oklch(0.65_0.05_145_/_0.06)] border border-[oklch(0.65_0.05_145_/_0.2)] px-4 py-3 flex-1">
                <span className="text-2xl animate-gentle-float">🗺️</span>
                <div className="leading-tight min-w-0 flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-[9px] text-[oklch(0.55_0.02_85)] font-bold uppercase tracking-wider">
                      {locale === "en" ? "Exploration" : "未知疆域探索度"}
                    </p>
                    <span className="text-xs font-bold text-[oklch(0.4_0.03_80)] font-mono tabular-nums">
                      {explorationPct}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[oklch(0.88_0.02_90)] overflow-hidden p-[1px]">
                    <div
                      className="h-full rounded-full bg-[oklch(0.65_0.05_145)] animate-route-flow transition-all duration-700"
                      style={{ width: `${explorationPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Resource chips */}
            <div className="grid grid-cols-3 gap-2.5 pt-2">
              <ResourceChip
                icon="📚"
                label={locale === "en" ? "Knowledge" : "知识秘卷"}
                value={fmt(world.knowledge_points)}
                color="oklch(0.65 0.05 145)"
              />
              <ResourceChip
                icon="⚡"
                label={locale === "en" ? "Tech" : "科技火花"}
                value={fmt(world.tech_points)}
                color="oklch(0.55 0.12 250)"
              />
              <ResourceChip
                icon="👥"
                label={locale === "en" ? "Population" : "文明人口"}
                value={fmt(world.population)}
                color="oklch(0.55 0.08 25)"
              />
            </div>
          </div>

          {/* Civilization Compass mini */}
          <CivilizationCompass
            direction={direction}
            isLoading={directionLoading}
            size="sm"
          />
        </div>
      </div>

      {/* ═══════ 2. Core Building ═══════ */}
      {coreBuilding && (
        <div className="vintage-parchment-card p-6 shadow-md border-2 border-double border-[oklch(0.72_0.12_85_/_0.55)] animate-pedestal-glow relative overflow-hidden transition-all duration-300 hover:shadow-lg">
          {/* Subtle watermark */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-radial from-[oklch(0.72_0.12_85_/_0.08)] to-transparent pointer-events-none select-none" />

          <div className="relative flex items-start gap-5 z-10">
            <VintageShieldIcon icon={coreBuilding.template?.icon ?? "🏛️"} size="md" tier="gold" />
            <div className="flex-1 min-w-0">
              <p className="text-[9px] text-[oklch(0.55_0.02_85)] font-bold uppercase tracking-wider">
                {locale === "en" ? "Core Building" : "帝国核心建筑 centerpiece"}
              </p>
              <h3 className="text-lg font-bold font-civ-serif text-[oklch(0.3_0.02_80)] mt-0.5">
                {locale === "en" && coreBuilding.template?.name_en
                  ? coreBuilding.template.name_en
                  : coreBuilding.template?.name ?? "—"}
              </h3>
              <p className="text-sm text-[oklch(0.5_0.02_85)] mt-1.5 leading-relaxed">
                {locale === "en" && coreBuilding.template?.description_en
                  ? coreBuilding.template.description_en
                  : coreBuilding.template?.description ?? ""}
              </p>
              <div className="flex items-center gap-4 mt-4">
                <span className="text-xs font-bold bg-[oklch(0.72_0.12_85_/_0.15)] text-[oklch(0.35_0.03_80)] rounded-full px-3.5 py-1 border border-[oklch(0.72_0.12_85_/_0.25)]">
                  {LEVEL_LABELS[coreBuilding.level]?.[locale === "en" ? "en" : "zh"] ?? `Lv.${coreBuilding.level}`}
                </span>
                {coreBuilding.template?.region && (
                  <span className="text-xs text-[oklch(0.5_0.02_85)] font-medium">
                    📍 {coreBuilding.template.region}
                  </span>
                )}
                {"skill_id" in (coreBuilding.template ?? {}) && (
                  <Link
                    href={`/skills/${(coreBuilding.template as { skill_id: string }).skill_id}`}
                    className="text-xs text-[oklch(0.65_0.05_145)] hover:underline font-bold"
                  >
                    {locale === "en" ? "Forge Skill →" : "开发技能大树 →"}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ 3. Next Goal ═══════ */}
      {nextGoal && (
        <div className="vintage-parchment-card p-6 shadow-sm border border-dashed border-[oklch(0.7_0.12_85_/_0.4)] relative transition-all duration-300 hover:shadow-md">
          <div className="flex items-start gap-4">
            <VintageShieldIcon icon={nextGoal.type === "upgrade" ? "🚀" : "🎯"} size="sm" tier="gold" />
            <div className="flex-1 min-w-0">
              <p className="text-[9px] text-[oklch(0.55_0.02_85)] font-bold uppercase tracking-wider">
                {locale === "en" ? "Next Goal" : "下一个战略目标"}
              </p>
              {nextGoal.type === "upgrade" ? (
                <>
                  <h3 className="text-base font-bold font-civ-serif text-[oklch(0.3_0.02_80)] mt-0.5">
                    {locale === "en"
                      ? `Upgrade ${coreBuilding?.template?.name_en ?? coreBuilding?.template?.name ?? ""} to Lv.${nextGoal.targetLevel}`
                      : `将 ${coreBuilding?.template?.name ?? ""} 扩建至 Lv.${nextGoal.targetLevel}`}
                  </h3>
                  <p className="text-sm text-[oklch(0.5_0.02_85)] mt-1">
                    {locale === "en"
                      ? "Continue developing this core building to strengthen your civilization"
                      : "继续修建和升级核心地标建筑，以增强整座文明古国的底蕴实力"}
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-base font-bold font-civ-serif text-[oklch(0.3_0.02_80)] mt-0.5">
                    {locale === "en"
                      ? `Unlock ${nextGoal.building.template?.name_en ?? nextGoal.building.template?.name ?? ""}`
                      : `筹建并解锁新地标：${nextGoal.building.template?.name ?? ""}`}
                  </h3>
                  {nextGoal.building.template?.required_skills &&
                    nextGoal.building.template.required_skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {nextGoal.building.template.required_skills.map((rs) => (
                          <span
                            key={rs.skill_name}
                            className="text-xs bg-[oklch(0.95_0.005_90)] border border-[oklch(0.88_0.02_90)] rounded-full px-3 py-1 text-[oklch(0.4_0.02_80)] font-medium"
                          >
                            ⚙️ {rs.skill_name} Lv.{rs.min_level}
                          </span>
                        ))}
                      </div>
                    )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════ 4. Civilization Summary Stats ═══════ */}
      <div className="vintage-parchment-card p-6 shadow-md border-2 border-double border-[oklch(0.7_0.12_85_/_0.35)]">
        <h3 className="text-sm font-bold font-civ-serif text-[oklch(0.3_0.02_80)] mb-4 border-b border-[oklch(0.88_0.02_90)] pb-2">
          {locale === "en" ? "Civilization Ledger" : "文明疆域编年分类账"}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <SummaryCard
            icon="🏗️"
            label={locale === "en" ? "Buildings" : "总建筑数量"}
            value={String(world.stats.active_buildings)}
            sub={`+${world.stats.active_compound_buildings} ${locale === "en" ? "compound" : "复合建筑"}`}
          />
          <SummaryCard
            icon="🎯"
            label={locale === "en" ? "Milestones" : "里程碑解锁数"}
            value={`${world.stats.milestones_unlocked}/${world.stats.total_milestones}`}
          />
          <SummaryCard
            icon="📊"
            label={locale === "en" ? "Avg Level" : "领地平均等级"}
            value={world.stats.average_level.toFixed(1)}
          />
          <SummaryCard
            icon="⭐"
            label={locale === "en" ? "Highest" : "最高殿堂"}
            value={world.stats.highest_level_building_name ?? "—"}
            compact
          />
          <SummaryCard
            icon="🗺️"
            label={locale === "en" ? "Regions" : "已征服板块"}
            value={String(world.regions?.filter((r) => r.unlocked).length ?? 0)}
            sub={`/ ${world.regions?.length ?? 0} ${locale === "en" ? "plates" : "大区域"}`}
          />
          <SummaryCard
            icon="📚"
            label={locale === "en" ? "Knowledge" : "总知识储备"}
            value={fmt(world.knowledge_points)}
          />
          <SummaryCard
            icon="⚡"
            label={locale === "en" ? "Tech" : "科技点积累"}
            value={fmt(world.tech_points)}
          />
          <SummaryCard
            icon="👥"
            label={locale === "en" ? "Population" : "总人口总数"}
            value={fmt(world.population)}
          />
        </div>
      </div>

      {/* ═══════ 5. Growth Timeline ═══════ */}
      {world.stats.active_buildings > 0 && world.recent_events?.length > 0 && (
        <div className="vintage-parchment-card p-6 shadow-md border-2 border-double border-[oklch(0.7_0.12_85_/_0.35)]">
          <GrowthTimeline
            events={world.recent_events}
            unlockedCount={world.stats.milestones_unlocked}
            totalCount={world.stats.total_milestones}
          />
        </div>
      )}
    </div>
  );
}

// ── Resource Chip ──

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
  const getTier = () => {
    if (color.includes("250")) return "gold";
    if (color.includes("145")) return "silver";
    return "bronze";
  };

  return (
    <div
      className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-all duration-300 hover:scale-102 shadow-sm border"
      style={{
        background: `linear-gradient(135deg, oklch(0.99 0.003 95), ${color} / 0.03)`,
        borderColor: `${color} / 0.25`,
      }}
    >
      <VintageShieldIcon icon={icon} size="sm" tier={getTier()} />
      <div className="leading-tight min-w-0">
        <p className="text-[9px] text-[oklch(0.55_0.02_85)] font-bold uppercase tracking-wider leading-none">
          {label}
        </p>
        <p className="text-sm font-bold text-[oklch(0.35_0.02_80)] font-mono tabular-nums leading-tight mt-0.5">
          {value}
        </p>
      </div>
    </div>
  );
}

// ── Summary Card ──

function SummaryCard({
  icon,
  label,
  value,
  sub,
  compact,
}: {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[oklch(0.985_0.003_95)] border border-[oklch(0.88_0.02_90)] px-3.5 py-3 shadow-sm hover:border-[oklch(0.7_0.12_85_/_0.3)] hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
      <VintageShieldIcon icon={icon} size="sm" tier="sage" />
      <div className="min-w-0">
        <p className="text-[9px] text-[oklch(0.55_0.02_85)] font-bold uppercase tracking-wider leading-tight">
          {label}
        </p>
        <p
          className={`font-bold text-[oklch(0.35_0.02_80)] font-civ-serif tabular-nums leading-tight mt-0.5 ${
            compact ? "text-xs truncate" : "text-sm"
          }`}
          title={compact ? value : undefined}
        >
          {value}
        </p>
        {sub && (
          <p className="text-[9px] text-[oklch(0.5_0.02_85)] leading-tight mt-0.5 font-mono">
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}
