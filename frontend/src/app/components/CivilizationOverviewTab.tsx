"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useLocale } from "@/hooks/useLocale";
import { skillDisplayName } from "@/lib/skillNames";
import { CivilizationCompass } from "./CivilizationCompass";
import { GrowthTimeline } from "./GrowthTimeline";
import { EmptyState } from "./EmptyState";
import { QuestScrollIcon, resolveScrollIconName } from "./QuestScrollIcon";
import {
  CIV_COLORS,
  CopperDivider,
  SealRing,
  BuildingSealIcon,
  EraStoneIcon,
  ParchmentBackground,
  inferSkillId,
} from "./CivArchiveTheme";
import {
  ERA_LABELS,
  CIVILIZATION_TIER_LABELS,
  getBuildingLevelLabel,
} from "@/types/world";
import type {
  World,
  CivilizationDirection,
} from "@/types/world";

interface CivilizationOverviewTabProps {
  world: World;
  direction: CivilizationDirection | null;
  directionLoading: boolean;
}

/**
 * Civilization Overview — "文明领地总览" (My Civilization Territory Overview).
 *
 * Refactored to the Odyssey Civilization Archive visual system:
 *   - Parchment cards with gold/dark-red palette
 *   - Era stone icons + building seal SVGs replace generic shield icons
 *   - No green/tech-blue; copper dividers and seal decorations
 *
 * Sections (data flow preserved):
 * 1. Hero dual-column: era/tier/level stats (left) + exploration/index (right)
 * 2. Core Building — civilization centerpiece with seal icon
 * 3. Next Goal — strategic target
 * 4. Civilization Summary — stats grid (文明遗迹记录)
 * 5. Growth Timeline
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
      if (coreBuilding && coreBuilding.level < (coreBuilding.template?.max_level ?? 10)) {
        return {
          type: "upgrade" as const,
          building: coreBuilding,
          targetLevel: coreBuilding.level + 1,
        };
      }
      return null;
    }
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
          <div
            className="civ-archive-card p-6 relative overflow-hidden"
            style={{ borderColor: CIV_COLORS.gold + "80", borderWidth: "2px" }}
          >
            <ParchmentBackground opacity={0.4} />
            <div className="text-center max-w-md mx-auto relative z-10">
              <span
                className="block mb-3 inline-flex justify-center"
                style={{ color: CIV_COLORS.gold }}
              >
                <QuestScrollIcon name="rocket" size={40} />
              </span>
              <h2
                className="civ-archive-title text-lg"
                style={{ color: CIV_COLORS.textPrimary }}
              >
                {locale === "en" ? "Civilization Taking Shape" : "文明正在成形"}
              </h2>
              <p
                className="mt-2 text-sm"
                style={{ color: CIV_COLORS.textSecondary }}
              >
                {locale === "en"
                  ? `Your ${direction.active_paths.length} active learning path(s) are charting the course. Complete quests to unlock your first buildings.`
                  : `你正在通过 ${direction.active_paths.length} 条学习路径规划文明方向。完成任务来解锁第一座建筑。`}
              </p>
              <Link
                href="/paths"
                className="mt-4 inline-block rounded-xl px-5 py-2 text-sm font-civ-serif italic font-semibold transition-all civ-archive-seal-hover"
                style={{
                  backgroundColor: CIV_COLORS.darkRed,
                  color: CIV_COLORS.bgContent,
                  border: `1px solid ${CIV_COLORS.gold}`,
                }}
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
                className="civ-archive-card p-4 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="text-xl inline-flex"
                    style={{ color: CIV_COLORS.gold }}
                  >
                    <QuestScrollIcon name="path" size={20} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4
                      className="text-sm font-semibold civ-archive-title truncate"
                      style={{ color: CIV_COLORS.textPrimary }}
                    >
                      {path.path_title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className="flex-1 h-1.5 rounded-full overflow-hidden"
                        style={{ backgroundColor: CIV_COLORS.bgContent, border: `1px solid ${CIV_COLORS.border}` }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${path.progress_pct}%`,
                            background: `linear-gradient(90deg, ${CIV_COLORS.gold}, ${CIV_COLORS.darkRed})`,
                          }}
                        />
                      </div>
                      <span
                        className="text-xs font-mono tabular-nums"
                        style={{ color: CIV_COLORS.textSecondary }}
                      >
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
                        className="text-[10px] rounded-full px-2 py-0.5"
                        style={{
                          backgroundColor: CIV_COLORS.gold + "15",
                          border: `1px solid ${CIV_COLORS.gold}40`,
                          color: CIV_COLORS.darkRed,
                        }}
                      >
                        {tb.building_icon}{" "}
                        {locale === "en" && tb.building_name_en
                          ? tb.building_name_en
                          : tb.building_name}{" "}
                        Lv.{tb.projected_level}
                      </span>
                    ))}
                    {path.targeted_buildings.length > 4 && (
                      <span className="text-[10px]" style={{ color: CIV_COLORS.textSecondary }}>
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
      <div
        className="civ-archive-card p-12"
        style={{ borderStyle: "dashed", borderColor: CIV_COLORS.border }}
      >
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
        {/* Left: Era + Tier + Level — 文明档案封面 */}
        <div
          className="civ-archive-card p-6 relative overflow-hidden space-y-5"
          style={{ borderColor: CIV_COLORS.gold + "80", borderWidth: "2px" }}
        >
          <ParchmentBackground opacity={0.4} />

          {/* Seal watermark */}
          <div className="absolute -bottom-12 -right-12 w-56 h-56 opacity-[0.05] pointer-events-none select-none">
            <SealRing size={224} />
          </div>

          {/* Civilization name */}
          <div className="relative z-10">
            <p
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: CIV_COLORS.textSecondary }}
            >
              {locale === "en" ? "My Civilization" : "我的文明领地"}
            </p>
            <h2
              className="civ-archive-title text-2xl mt-0.5"
              style={{ color: CIV_COLORS.textPrimary }}
            >
              {world.name}
            </h2>
          </div>

          {/* Era + Tier badges — using stone/seal icons, no rounded frame, no float */}
          <div className="flex items-center gap-3 flex-wrap relative z-10">
            <div
              className="flex items-center gap-3 px-3.5 py-2.5 transition-all duration-300 hover:scale-[1.02] flex-1 min-w-[140px]"
              style={{ backgroundColor: "transparent" }}
            >
              <EraStoneIcon era={world.era} size={36} />
              <div className="leading-tight">
                <p
                  className="text-[9px] font-bold uppercase tracking-wider"
                  style={{ color: CIV_COLORS.textSecondary }}
                >
                  {locale === "en" ? "Era" : "发展时代"}
                </p>
                <p
                  className="text-base font-bold civ-archive-title"
                  style={{ color: CIV_COLORS.darkRed }}
                >
                  {eraName}
                </p>
              </div>
            </div>

            <div
              className="flex items-center gap-3 px-3.5 py-2.5 transition-all duration-300 hover:scale-[1.02] flex-1 min-w-[140px]"
              style={{ backgroundColor: "transparent" }}
            >
              <span className="inline-flex shrink-0" style={{ color: CIV_COLORS.gold }}>
                <QuestScrollIcon name={resolveScrollIconName(tierInfo.icon)} size={28} strokeWidth={1.5} />
              </span>
              <div className="leading-tight">
                <p
                  className="text-[9px] font-bold uppercase tracking-wider"
                  style={{ color: CIV_COLORS.textSecondary }}
                >
                  {locale === "en" ? "Tier" : "文明等级"}
                </p>
                <p
                  className="text-base font-bold civ-archive-title"
                  style={{ color: CIV_COLORS.darkRed }}
                >
                  {tierName} Lv.{world.civilization_level}
                </p>
              </div>
            </div>
          </div>

          {/* Civilization Index */}
          <div
            className="flex items-center gap-3 px-3.5 py-2.5 relative z-10"
            style={{ backgroundColor: "transparent" }}
          >
            <span className="inline-flex shrink-0" style={{ color: CIV_COLORS.gold }}>
              <QuestScrollIcon name="chart" size={26} strokeWidth={1.5} />
            </span>
            <div className="flex-1 min-w-0 leading-tight">
              <p
                className="text-[9px] font-bold uppercase tracking-wider"
                style={{ color: CIV_COLORS.textSecondary }}
              >
                {locale === "en" ? "Civilization Index" : "文明实力总指数"}
              </p>
              <p
                className="text-xl font-bold font-mono tabular-nums"
                style={{ color: CIV_COLORS.darkRed }}
              >
                {fmt(world.tier_score)}
              </p>
            </div>
          </div>

          {/* Progress bars */}
          <div className="space-y-3 relative z-10 pt-2">
            {/* Era progress */}
            <div className="space-y-1">
              <div
                className="flex justify-between text-[10px] font-bold"
                style={{ color: CIV_COLORS.textSecondary }}
              >
                <span>{locale === "en" ? "Era Horizon" : "时代演进进度"}</span>
                <span className="font-mono tabular-nums">{eraProgress}%</span>
              </div>
              <div
                className="h-2.5 rounded-full overflow-hidden p-[1px]"
                style={{
                  backgroundColor: CIV_COLORS.bgContent,
                  border: `1px solid ${CIV_COLORS.border}80`,
                }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${eraProgress}%`,
                    background: `linear-gradient(90deg, ${CIV_COLORS.gold}, ${CIV_COLORS.darkRed})`,
                  }}
                />
              </div>
            </div>
            {/* Tier progress */}
            <div className="space-y-1">
              <div
                className="flex justify-between text-[10px] font-bold"
                style={{ color: CIV_COLORS.textSecondary }}
              >
                <span>{locale === "en" ? "Tier Expansion" : "领土扩张进度"}</span>
                <span className="font-mono tabular-nums">{tierProgress}%</span>
              </div>
              <div
                className="h-2.5 rounded-full overflow-hidden p-[1px]"
                style={{
                  backgroundColor: CIV_COLORS.bgContent,
                  border: `1px solid ${CIV_COLORS.border}80`,
                }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${tierProgress}%`,
                    background: `linear-gradient(90deg, ${CIV_COLORS.gold}, ${CIV_COLORS.darkRed})`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Exploration + Compass mini */}
        <div className="space-y-4">
          {/* Exploration + Resources card */}
          <div
            className="civ-archive-card p-5 relative overflow-hidden space-y-4"
            style={{ borderColor: CIV_COLORS.gold + "80", borderWidth: "2px" }}
          >
            <ParchmentBackground opacity={0.4} />
            <div className="flex items-center gap-3 relative z-10">
              <div
                className="flex items-center gap-3 px-4 py-3 flex-1"
                style={{ backgroundColor: "transparent" }}
              >
                <span
                  className="text-2xl inline-flex"
                  style={{ color: CIV_COLORS.gold }}
                >
                  <QuestScrollIcon name="map" size={28} />
                </span>
                <div className="leading-tight min-w-0 flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <p
                      className="text-[9px] font-bold uppercase tracking-wider"
                      style={{ color: CIV_COLORS.textSecondary }}
                    >
                      {locale === "en" ? "Exploration" : "未知疆域探索度"}
                    </p>
                    <span
                      className="text-xs font-bold font-mono tabular-nums"
                      style={{ color: CIV_COLORS.darkRed }}
                    >
                      {explorationPct}%
                    </span>
                  </div>
                  <div
                    className="h-2 rounded-full overflow-hidden p-[1px]"
                    style={{ backgroundColor: CIV_COLORS.bgCard, border: `1px solid ${CIV_COLORS.border}` }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${explorationPct}%`,
                        background: `linear-gradient(90deg, ${CIV_COLORS.gold}, ${CIV_COLORS.darkRed})`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Resource chips */}
            <div className="grid grid-cols-3 gap-2.5 pt-2 relative z-10">
              <ResourceChip
                icon="knowledge"
                label={locale === "en" ? "Knowledge" : "知识秘卷"}
                value={fmt(world.knowledge_points)}
              />
              <ResourceChip
                icon="application"
                label={locale === "en" ? "Tech" : "科技火花"}
                value={fmt(world.tech_points)}
              />
              <ResourceChip
                icon="population"
                label={locale === "en" ? "Population" : "文明人口"}
                value={fmt(world.population)}
              />
            </div>
          </div>

          {/* Civilization Compass mini — "文明星盘" */}
          <CivilizationCompass
            direction={direction}
            isLoading={directionLoading}
            size="sm"
          />
        </div>
      </div>

      <CopperDivider />

      {/* ═══════ 2. Core Building — 文明核心建筑 ═══════ */}
      {coreBuilding && (
        <div
          className="civ-archive-card p-6 relative overflow-hidden transition-all duration-300"
          style={{ borderColor: CIV_COLORS.gold, borderWidth: "2px" }}
        >
          <ParchmentBackground opacity={0.5} />

          {/* Seal watermark */}
          <div className="absolute top-0 right-0 w-40 h-40 opacity-[0.05] pointer-events-none select-none">
            <SealRing size={160} />
          </div>

          <div className="relative flex items-start gap-5 z-10">
            {/* Building seal icon — unique per building using inferSkillId */}
            <div className="shrink-0 civ-archive-seal-hover">
              <BuildingSealIcon
                type={inferSkillId(
                  coreBuilding.template?.name ?? "",
                  coreBuilding.id
                )}
                size={64}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-[9px] font-bold uppercase tracking-wider"
                style={{ color: CIV_COLORS.textSecondary }}
              >
                {locale === "en" ? "Core Building · Centerpiece" : "帝国核心建筑"}
              </p>
              <h3
                className="civ-archive-title text-lg mt-0.5"
                style={{ color: CIV_COLORS.textPrimary }}
              >
                {locale === "en" && coreBuilding.template?.name_en
                  ? coreBuilding.template.name_en
                  : coreBuilding.template?.name ?? "—"}
              </h3>
              <p
                className="text-sm mt-1.5 leading-relaxed"
                style={{ color: CIV_COLORS.textSecondary }}
              >
                {locale === "en" && coreBuilding.template?.description_en
                  ? coreBuilding.template.description_en
                  : coreBuilding.template?.description ?? ""}
              </p>
              <div className="flex items-center gap-4 mt-4 flex-wrap">
                <span
                  className="text-xs font-bold rounded-full px-3.5 py-1"
                  style={{
                    backgroundColor: CIV_COLORS.gold + "20",
                    color: CIV_COLORS.darkRed,
                    border: `1px solid ${CIV_COLORS.gold}60`,
                  }}
                >
                  {getBuildingLevelLabel(coreBuilding.level, coreBuilding.template?.level_names, locale === "en" ? "en" : "zh")}
                </span>
                {coreBuilding.template?.region && (
                  <span
                    className="text-xs font-medium inline-flex items-center gap-1"
                    style={{ color: CIV_COLORS.textSecondary }}
                  >
                    <QuestScrollIcon name="location" size={12} className="inline-block" />
                    {coreBuilding.template.region}
                  </span>
                )}

              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ 3. Next Goal ═══════ */}
      {(direction?.suggested_focus || nextGoal) && (
        <div
          className="civ-archive-card p-6 relative transition-all duration-300"
          style={{ borderStyle: "dashed", borderColor: CIV_COLORS.gold + "80" }}
        >
          <div className="flex items-start gap-4">
            <span className="inline-flex shrink-0" style={{ color: CIV_COLORS.gold }}>
              <QuestScrollIcon
                name={direction?.suggested_focus ? "compass" : nextGoal?.type === "upgrade" ? "rocket" : "mission"}
                size={26}
                strokeWidth={1.5}
              />
            </span>
            <div className="flex-1 min-w-0">
              <p
                className="text-[9px] font-bold uppercase tracking-wider"
                style={{ color: CIV_COLORS.textSecondary }}
              >
                {locale === "en" ? "Next Goal" : "下一个战略目标"}
              </p>
              {direction?.suggested_focus ? (
                <>
                  <h3
                    className="civ-archive-title text-base mt-0.5"
                    style={{ color: CIV_COLORS.textPrimary }}
                  >
                    {direction.suggested_focus}
                  </h3>
                  {direction.summary && (
                    <p
                      className="text-sm mt-1"
                      style={{ color: CIV_COLORS.textSecondary }}
                    >
                      {direction.summary}
                    </p>
                  )}
                </>
              ) : nextGoal?.type === "upgrade" ? (
                <>
                  <h3
                    className="civ-archive-title text-base mt-0.5"
                    style={{ color: CIV_COLORS.textPrimary }}
                  >
                    {locale === "en"
                      ? `Upgrade ${coreBuilding?.template?.name_en ?? coreBuilding?.template?.name ?? ""} to Lv.${nextGoal.targetLevel}`
                      : `将 ${coreBuilding?.template?.name ?? ""} 扩建至 Lv.${nextGoal.targetLevel}`}
                  </h3>
                  <p
                    className="text-sm mt-1"
                    style={{ color: CIV_COLORS.textSecondary }}
                  >
                    {locale === "en"
                      ? "Continue developing this core building to strengthen your civilization"
                      : "继续修建和升级核心地标建筑，以增强整座文明古国的底蕴实力"}
                  </p>
                </>
              ) : nextGoal ? (
                <>
                  <h3
                    className="civ-archive-title text-base mt-0.5"
                    style={{ color: CIV_COLORS.textPrimary }}
                  >
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
                            className="text-xs rounded-full px-3 py-1 font-medium inline-flex items-center gap-1"
                            style={{
                              backgroundColor: CIV_COLORS.bgContent,
                              border: `1px solid ${CIV_COLORS.border}`,
                              color: CIV_COLORS.darkRed,
                            }}
                          >
                            <QuestScrollIcon name="application" size={12} className="inline-block" />
                            {skillDisplayName(rs.skill_name, undefined, locale)} Lv.{rs.min_level}
                          </span>
                        ))}
                      </div>
                    )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* ═══════ 4. Civilization Summary Stats — 文明遗迹记录 ═══════ */}
      <div
        className="civ-archive-card p-6"
        style={{ borderColor: CIV_COLORS.gold + "80", borderWidth: "2px" }}
      >
        <h3
          className="civ-archive-title text-base mb-4 pb-2"
          style={{
            color: CIV_COLORS.textPrimary,
            borderBottom: `1px solid ${CIV_COLORS.border}`,
          }}
        >
          {locale === "en" ? "Civilization Archive Ledger" : "文明疆域编年账册"}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <SummaryCard
            icon="crane"
            label={locale === "en" ? "Buildings" : "总建筑数量"}
            value={String(world.stats.active_buildings)}
            sub={`+${world.stats.active_compound_buildings} ${locale === "en" ? "compound" : "复合建筑"}`}
          />
          <SummaryCard
            icon="mission"
            label={locale === "en" ? "Milestones" : "里程碑解锁数"}
            value={`${world.stats.milestones_unlocked}/${world.stats.total_milestones}`}
          />
          <SummaryCard
            icon="chart"
            label={locale === "en" ? "Avg Level" : "领地平均等级"}
            value={world.stats.average_level.toFixed(1)}
          />
          <SummaryCard
            icon="star"
            label={locale === "en" ? "Highest" : "最高殿堂"}
            value={world.stats.highest_level_building_name ?? "—"}
            compact
          />
          <SummaryCard
            icon="map"
            label={locale === "en" ? "Regions" : "已征服板块"}
            value={String(world.regions?.filter((r) => r.unlocked).length ?? 0)}
            sub={`/ ${world.regions?.length ?? 0} ${locale === "en" ? "plates" : "大区域"}`}
          />
          <SummaryCard
            icon="knowledge"
            label={locale === "en" ? "Knowledge" : "总知识储备"}
            value={fmt(world.knowledge_points)}
          />
          <SummaryCard
            icon="application"
            label={locale === "en" ? "Tech" : "科技点积累"}
            value={fmt(world.tech_points)}
          />
          <SummaryCard
            icon="population"
            label={locale === "en" ? "Population" : "总人口总数"}
            value={fmt(world.population)}
          />
        </div>
      </div>

      {/* ═══════ 5. Growth Timeline ═══════ */}
      {world.stats.active_buildings > 0 && world.recent_events?.length > 0 && (
        <div
          className="civ-archive-card p-6"
          style={{ borderColor: CIV_COLORS.gold + "80", borderWidth: "2px" }}
        >
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

// ── Resource Chip — civilization archive styled ──

function ResourceChip({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div
      className="flex items-center gap-2.5 px-2.5 py-2.5 transition-all duration-300 hover:scale-[1.03]"
      style={{ backgroundColor: "transparent" }}
    >
      <span className="inline-flex shrink-0" style={{ color: CIV_COLORS.gold }}>
        <QuestScrollIcon name={resolveScrollIconName(icon)} size={22} strokeWidth={1.5} />
      </span>
      <div className="leading-tight min-w-0">
        <p
          className="text-[9px] font-bold uppercase tracking-wider leading-none"
          style={{ color: CIV_COLORS.textSecondary }}
        >
          {label}
        </p>
        <p
          className="text-sm font-bold font-mono tabular-nums leading-tight mt-0.5"
          style={{ color: CIV_COLORS.darkRed }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

// ── Summary Card — civilization archive styled ──

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
    <div
      className="flex items-center gap-3 px-3.5 py-3 transition-all duration-300 hover:scale-[1.03]"
      style={{ backgroundColor: "transparent" }}
    >
      <span className="inline-flex shrink-0" style={{ color: CIV_COLORS.gold }}>
        <QuestScrollIcon name={resolveScrollIconName(icon)} size={24} strokeWidth={1.5} />
      </span>
      <div className="min-w-0">
        <p
          className="text-[9px] font-bold uppercase tracking-wider leading-tight"
          style={{ color: CIV_COLORS.textSecondary }}
        >
          {label}
        </p>
        <p
          className={`font-bold civ-archive-title tabular-nums leading-tight mt-0.5 ${
            compact ? "text-xs truncate" : "text-sm"
          }`}
          style={{ color: CIV_COLORS.textPrimary }}
          title={compact ? value : undefined}
        >
          {value}
        </p>
        {sub && (
          <p
            className="text-[9px] leading-tight mt-0.5 font-mono"
            style={{ color: CIV_COLORS.textSecondary }}
          >
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}
