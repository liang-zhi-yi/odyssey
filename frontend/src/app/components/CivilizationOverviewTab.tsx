"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useLocale } from "@/hooks/useLocale";
import { CivilizationCompass } from "./CivilizationCompass";
import { GrowthTimeline } from "./GrowthTimeline";
import { EmptyState } from "./EmptyState";
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

  // If no buildings at all, show empty state
  if (world.buildings.length === 0 && world.compound_buildings.length === 0) {
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
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Left: Era + Tier + Level */}
        <div className="rounded-2xl border border-[oklch(0.88_0.02_90)] bg-gradient-to-br from-[oklch(0.98_0.005_90)] via-[oklch(0.97_0.008_95)] to-[oklch(0.96_0.015_92)] p-6 shadow-card space-y-5">
          {/* Civilization name */}
          <div>
            <p className="text-xs text-[oklch(0.55_0.02_85)] font-medium uppercase tracking-wider">
              {locale === "en" ? "My Civilization" : "我的文明"}
            </p>
            <h2 className="text-xl font-bold text-[oklch(0.3_0.02_80)] mt-0.5">
              {world.name}
            </h2>
          </div>

          {/* Era + Tier badges */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 rounded-xl bg-[oklch(0.72_0.12_85_/_0.15)] border border-[oklch(0.72_0.12_85_/_0.3)] px-4 py-3">
              <span className="text-3xl">{eraInfo.icon}</span>
              <div className="leading-tight">
                <p className="text-[10px] text-[oklch(0.55_0.02_85)] font-medium uppercase tracking-wider">
                  {locale === "en" ? "Era" : "时代"}
                </p>
                <p className="text-base font-bold text-[oklch(0.4_0.03_80)]">
                  {eraName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-[oklch(0.65_0.05_145_/_0.1)] border border-[oklch(0.65_0.05_145_/_0.25)] px-4 py-3">
              <span className="text-3xl">{tierInfo.icon}</span>
              <div className="leading-tight">
                <p className="text-[10px] text-[oklch(0.55_0.02_85)] font-medium uppercase tracking-wider">
                  {locale === "en" ? "Tier" : "文明等级"}
                </p>
                <p className="text-base font-bold text-[oklch(0.4_0.03_80)]">
                  {tierName} Lv.{world.civilization_level}
                </p>
              </div>
            </div>
          </div>

          {/* Civilization Index */}
          <div className="flex items-center gap-2 rounded-xl bg-[oklch(0.97_0.003_90)] border border-[oklch(0.88_0.02_90)] px-4 py-3">
            <span className="text-2xl">📊</span>
            <div className="flex-1 min-w-0 leading-tight">
              <p className="text-[10px] text-[oklch(0.55_0.02_85)] font-medium uppercase tracking-wider">
                {locale === "en" ? "Civilization Index" : "文明指数"}
              </p>
              <p className="text-lg font-bold text-[oklch(0.4_0.03_80)] tabular-nums">
                {fmt(world.tier_score)}
              </p>
            </div>
          </div>

          {/* Progress bars */}
          <div className="space-y-2">
            {/* Era progress */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[oklch(0.5_0.02_85)] w-16 shrink-0">
                {locale === "en" ? "Era" : "时代进度"}
              </span>
              <div className="flex-1 h-2 rounded-full bg-[oklch(0.88_0.02_90)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[oklch(0.72_0.12_85)] transition-all duration-700"
                  style={{ width: `${eraProgress}%` }}
                />
              </div>
              <span className="text-xs font-mono text-[oklch(0.5_0.02_85)] w-10 text-right tabular-nums">
                {eraProgress}%
              </span>
            </div>
            {/* Tier progress */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[oklch(0.5_0.02_85)] w-16 shrink-0">
                {locale === "en" ? "Tier" : "等级进度"}
              </span>
              <div className="flex-1 h-2 rounded-full bg-[oklch(0.88_0.02_90)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[oklch(0.65_0.05_145)] transition-all duration-700"
                  style={{ width: `${tierProgress}%` }}
                />
              </div>
              <span className="text-xs font-mono text-[oklch(0.5_0.02_85)] w-10 text-right tabular-nums">
                {tierProgress}%
              </span>
            </div>
          </div>
        </div>

        {/* Right: Exploration + Compass mini */}
        <div className="space-y-4">
          {/* Exploration + Resources card */}
          <div className="rounded-2xl border border-[oklch(0.88_0.02_90)] bg-gradient-to-br from-[oklch(0.98_0.005_90)] to-[oklch(0.97_0.008_95)] p-5 shadow-card space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl bg-[oklch(0.65_0.05_145_/_0.08)] border border-[oklch(0.65_0.05_145_/_0.2)] px-3 py-2 flex-1">
                <span className="text-xl">🗺️</span>
                <div className="leading-tight min-w-0">
                  <p className="text-[10px] text-[oklch(0.55_0.02_85)] font-medium">
                    {locale === "en" ? "Exploration" : "探索进度"}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-[oklch(0.88_0.02_90)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[oklch(0.65_0.05_145)] transition-all duration-700"
                        style={{ width: `${explorationPct}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-[oklch(0.4_0.03_80)] tabular-nums">
                      {explorationPct}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Resource chips */}
            <div className="flex items-center gap-2 flex-wrap">
              <ResourceChip
                icon="📚"
                label={locale === "en" ? "Knowledge" : "知识点"}
                value={fmt(world.knowledge_points)}
                color="oklch(0.65 0.05 145)"
              />
              <ResourceChip
                icon="⚡"
                label={locale === "en" ? "Tech" : "科技点"}
                value={fmt(world.tech_points)}
                color="oklch(0.55 0.12 250)"
              />
              <ResourceChip
                icon="👥"
                label={locale === "en" ? "Population" : "人口"}
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
        <div className="rounded-2xl border border-[oklch(0.88_0.02_90)] bg-gradient-to-br from-[oklch(0.97_0.008_92)] via-[oklch(0.98_0.005_90)] to-[oklch(0.96_0.01_95)] p-6 shadow-card">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[oklch(0.72_0.12_85_/_0.12)] border border-[oklch(0.72_0.12_85_/_0.25)] shrink-0">
              <span className="text-3xl">
                {coreBuilding.template?.icon ?? "🏛️"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[oklch(0.55_0.02_85)] font-medium uppercase tracking-wider">
                {locale === "en" ? "Core Building" : "当前文明核心建筑"}
              </p>
              <h3 className="text-lg font-bold text-[oklch(0.3_0.02_80)] mt-0.5">
                {locale === "en" && coreBuilding.template?.name_en
                  ? coreBuilding.template.name_en
                  : coreBuilding.template?.name ?? "—"}
              </h3>
              <p className="text-sm text-[oklch(0.5_0.02_85)] mt-1">
                {locale === "en" && coreBuilding.template?.description_en
                  ? coreBuilding.template.description_en
                  : coreBuilding.template?.description ?? ""}
              </p>
              <div className="flex items-center gap-3 mt-3">
                <span className="text-xs font-medium bg-[oklch(0.72_0.12_85_/_0.12)] text-[oklch(0.4_0.03_80)] rounded-full px-3 py-1">
                  {LEVEL_LABELS[coreBuilding.level]?.[locale === "en" ? "en" : "zh"] ?? `Lv.${coreBuilding.level}`}
                </span>
                {coreBuilding.template?.region && (
                  <span className="text-xs text-[oklch(0.5_0.02_85)]">
                    {coreBuilding.template.region}
                  </span>
                )}
                {"skill_id" in (coreBuilding.template ?? {}) && (
                  <Link
                    href={`/skills/${(coreBuilding.template as { skill_id: string }).skill_id}`}
                    className="text-xs text-[oklch(0.65_0.05_145)] hover:underline font-medium"
                  >
                    {locale === "en" ? "View Skill →" : "查看技能 →"}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ 3. Next Goal ═══════ */}
      {nextGoal && (
        <div className="rounded-2xl border border-[oklch(0.88_0.02_90)] bg-gradient-to-br from-[oklch(0.96_0.015_92)] to-[oklch(0.97_0.008_95)] p-6 shadow-card">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">
              {nextGoal.type === "upgrade" ? "⬆️" : "🎯"}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[oklch(0.55_0.02_85)] font-medium uppercase tracking-wider">
                {locale === "en" ? "Next Goal" : "下一目标"}
              </p>
              {nextGoal.type === "upgrade" ? (
                <>
                  <h3 className="text-base font-bold text-[oklch(0.3_0.02_80)] mt-0.5">
                    {locale === "en"
                      ? `Upgrade ${coreBuilding?.template?.name_en ?? coreBuilding?.template?.name ?? ""} to Lv.${nextGoal.targetLevel}`
                      : `将 ${coreBuilding?.template?.name ?? ""} 升级至 Lv.${nextGoal.targetLevel}`}
                  </h3>
                  <p className="text-sm text-[oklch(0.5_0.02_85)] mt-1">
                    {locale === "en"
                      ? "Continue developing this core building to strengthen your civilization"
                      : "继续发展核心建筑，增强文明实力"}
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-base font-bold text-[oklch(0.3_0.02_80)] mt-0.5">
                    {locale === "en"
                      ? `Unlock ${nextGoal.building.template?.name_en ?? nextGoal.building.template?.name ?? ""}`
                      : `解锁 ${nextGoal.building.template?.name ?? ""}`}
                  </h3>
                  {nextGoal.building.template?.required_skills &&
                    nextGoal.building.template.required_skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {nextGoal.building.template.required_skills.map((rs) => (
                          <span
                            key={rs.skill_name}
                            className="text-xs bg-[oklch(0.97_0.003_90)] border border-[oklch(0.88_0.02_90)] rounded-full px-3 py-1 text-[oklch(0.45_0.02_80)]"
                          >
                            {rs.skill_name} Lv.{rs.min_level}
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
      <div className="rounded-2xl border border-[oklch(0.88_0.02_90)] bg-gradient-to-br from-[oklch(0.98_0.005_90)] to-[oklch(0.97_0.008_95)] p-6 shadow-card">
        <h3 className="text-sm font-semibold text-[oklch(0.35_0.02_80)] mb-4">
          {locale === "en" ? "Civilization Summary" : "文明发展摘要"}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <SummaryCard
            icon="🏗️"
            label={locale === "en" ? "Buildings" : "建筑数"}
            value={String(world.stats.active_buildings)}
            sub={`+${world.stats.active_compound_buildings} ${locale === "en" ? "compound" : "复合"}`}
          />
          <SummaryCard
            icon="🎯"
            label={locale === "en" ? "Milestones" : "里程碑"}
            value={`${world.stats.milestones_unlocked}/${world.stats.total_milestones}`}
          />
          <SummaryCard
            icon="📊"
            label={locale === "en" ? "Avg Level" : "平均等级"}
            value={world.stats.average_level.toFixed(1)}
          />
          <SummaryCard
            icon="⭐"
            label={locale === "en" ? "Highest" : "最高建筑"}
            value={world.stats.highest_level_building_name ?? "—"}
            compact
          />
          <SummaryCard
            icon="🗺️"
            label={locale === "en" ? "Regions" : "已解锁区域"}
            value={String(world.regions?.filter((r) => r.unlocked).length ?? 0)}
            sub={`/ ${world.regions?.length ?? 0}`}
          />
          <SummaryCard
            icon="📚"
            label={locale === "en" ? "Knowledge" : "知识点"}
            value={fmt(world.knowledge_points)}
          />
          <SummaryCard
            icon="⚡"
            label={locale === "en" ? "Tech" : "科技点"}
            value={fmt(world.tech_points)}
          />
          <SummaryCard
            icon="👥"
            label={locale === "en" ? "Population" : "人口"}
            value={fmt(world.population)}
          />
        </div>
      </div>

      {/* ═══════ 5. Growth Timeline ═══════ */}
      {world.stats.active_buildings > 0 && world.recent_events?.length > 0 && (
        <div className="rounded-2xl border border-[oklch(0.88_0.02_90)] bg-gradient-to-br from-[oklch(0.98_0.005_90)] to-[oklch(0.97_0.008_95)] p-6 shadow-card">
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
  return (
    <div
      className="flex items-center gap-1.5 rounded-lg px-3 py-2"
      style={{
        background: `${color} / 0.08`,
        border: `1px solid ${color} / 0.18`,
      }}
    >
      <span className="text-base">{icon}</span>
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
    <div className="flex items-center gap-3 rounded-xl bg-[oklch(0.97_0.003_90)] border border-[oklch(0.88_0.02_90)] px-4 py-3">
      <span className="text-2xl shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] text-[oklch(0.55_0.02_85)] font-medium leading-tight">
          {label}
        </p>
        <p
          className={`font-bold text-[oklch(0.35_0.02_80)] tabular-nums leading-tight ${
            compact ? "text-xs truncate" : "text-base"
          }`}
          title={compact ? value : undefined}
        >
          {value}
        </p>
        {sub && (
          <p className="text-[10px] text-[oklch(0.5_0.02_85)] leading-tight">
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}
