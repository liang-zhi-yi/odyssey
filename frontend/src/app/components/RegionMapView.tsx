"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useLocale } from "@/hooks/useLocale";
import { LEVEL_LABELS } from "@/types/world";
import type {
  World,
  UserBuilding,
  UserCompoundBuilding,
  RegionInfo,
} from "@/types/world";

interface RegionMapViewProps {
  world: World;
  selectedBuildingId?: string;
  onSelectBuilding: (building: UserBuilding | UserCompoundBuilding) => void;
}

/**
 * Region Map View — civilization territory board with regional plates.
 *
 * Layout concept (Monument Valley / board game feel):
 * - Central Hub card: core civilization building
 * - Region plates arranged in responsive grid around center
 * - Unlocked regions show building cards
 * - Locked regions show fog of war with "???" placeholders
 *
 * Design: warm parchment/cream with sage accents, card-based not database-view.
 */

// Fixed region position order for consistent layout
const REGION_ORDER = [
  "knowledge", "ai", "engineering", "business", "design", "language",
  "core", "creative", "logic", "practice", "synthesis",
];

export function RegionMapView({
  world,
  selectedBuildingId,
  onSelectBuilding,
}: RegionMapViewProps) {
  const { t, locale } = useLocale();

  // Group buildings by region
  const regionGroups = useMemo(() => {
    const map = new Map<string, {
      info: RegionInfo | undefined;
      buildings: UserBuilding[];
      compounds: UserCompoundBuilding[];
    }>();

    // Initialize from region info
    for (const r of world.regions ?? []) {
      map.set(r.key, { info: r, buildings: [], compounds: [] });
    }

    // Add regular buildings
    for (const b of world.buildings ?? []) {
      const regionKey = b.template?.region ?? "unknown";
      if (!map.has(regionKey)) {
        map.set(regionKey, { info: undefined, buildings: [], compounds: [] });
      }
      map.get(regionKey)!.buildings.push(b);
    }

    // Add compound buildings
    for (const cb of world.compound_buildings ?? []) {
      const regionKey = cb.template?.region ?? "unknown";
      if (!map.has(regionKey)) {
        map.set(regionKey, { info: undefined, buildings: [], compounds: [] });
      }
      map.get(regionKey)!.compounds.push(cb);
    }

    // Convert to array and sort by region order
    const entries = Array.from(map.entries());
    entries.sort((a, b) => {
      const idxA = REGION_ORDER.indexOf(a[0].toLowerCase());
      const idxB = REGION_ORDER.indexOf(b[0].toLowerCase());
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });

    return entries;
  }, [world.regions, world.buildings, world.compound_buildings]);

  // Find core building (highest level compound or regular)
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

  // Count unlocked regions
  const unlockedCount = world.regions?.filter((r) => r.unlocked).length ?? 0;
  const totalRegions = regionGroups.length;

  // Region display name helper
  const regionDisplayName = (key: string, info?: RegionInfo): string => {
    const name = info?.name ?? key;
    return locale === "en" ? name.replace(/区$/, " Region") : name;
  };

  return (
    <div className="space-y-4">
      {/* Map header */}
      <div className="rounded-2xl border border-[oklch(0.88_0.02_90)] bg-gradient-to-br from-[oklch(0.98_0.005_90)] to-[oklch(0.96_0.01_92)] p-4 shadow-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🗺️</span>
            <div>
              <h2 className="text-sm font-semibold text-[oklch(0.35_0.02_80)]">
                {world.name}
              </h2>
              <p className="text-xs text-[oklch(0.55_0.02_85)]">
                {locale === "en"
                  ? `${unlockedCount}/${totalRegions} regions explored`
                  : `已探索 ${unlockedCount}/${totalRegions} 个区域`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-[oklch(0.5_0.02_85)]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[oklch(0.65_0.05_145)]" />
              {locale === "en" ? "Unlocked" : "已解锁"}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[oklch(0.7_0.02_90)]" />
              {locale === "en" ? "Locked" : "未解锁"}
            </span>
          </div>
        </div>
      </div>

      {/* ═══════ Central Hub ═══════ */}
      {coreBuilding && (
        <div className="rounded-2xl border-2 border-[oklch(0.72_0.12_85_/_0.4)] bg-gradient-to-br from-[oklch(0.96_0.015_92)] via-[oklch(0.98_0.005_90)] to-[oklch(0.97_0.008_95)] p-5 shadow-card relative overflow-hidden">
          {/* Subtle glow behind core building */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-radial from-[oklch(0.72_0.12_85_/_0.1)] to-transparent pointer-events-none" />

          <div className="relative flex items-center gap-4">
            <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-[oklch(0.72_0.12_85_/_0.15)] border-2 border-[oklch(0.72_0.12_85_/_0.35)] shrink-0 shadow-lg">
              <span className="text-4xl">
                {coreBuilding.template?.icon ?? "🏛️"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-[oklch(0.55_0.02_85)] font-medium uppercase tracking-wider">
                {locale === "en" ? "Civilization Core" : "文明核心"}
              </p>
              <h3 className="text-lg font-bold text-[oklch(0.3_0.02_80)]">
                {locale === "en" && coreBuilding.template?.name_en
                  ? coreBuilding.template.name_en
                  : coreBuilding.template?.name ?? "—"}
              </h3>
              <p className="text-sm text-[oklch(0.5_0.02_85)] mt-0.5">
                {locale === "en" && coreBuilding.template?.description_en
                  ? coreBuilding.template.description_en
                  : coreBuilding.template?.description ?? ""}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-semibold bg-[oklch(0.72_0.12_85_/_0.18)] text-[oklch(0.35_0.03_80)] rounded-full px-3 py-0.5">
                  {LEVEL_LABELS[coreBuilding.level]?.[locale === "en" ? "en" : "zh"] ?? `Lv.${coreBuilding.level}`}
                </span>
                <button
                  onClick={() => onSelectBuilding(coreBuilding)}
                  className="text-xs text-[oklch(0.65_0.05_145)] hover:underline font-medium"
                >
                  {locale === "en" ? "View Details →" : "查看详情 →"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ Region Plates Grid ═══════ */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {regionGroups.map(([regionKey, group]) => {
          const isUnlocked = group.info?.unlocked ?? true;
          const allBuildings = [
            ...group.buildings.map((b) => ({ ...b, isCompound: false as const })),
            ...group.compounds.map((cb) => ({ ...cb, isCompound: true as const })),
          ];

          return (
            <div
              key={regionKey}
              className={`rounded-2xl border p-4 transition-all ${
                isUnlocked
                  ? "border-[oklch(0.88_0.02_90)] bg-gradient-to-br from-[oklch(0.98_0.005_90)] to-[oklch(0.97_0.008_95)] shadow-card"
                  : "border-dashed border-[oklch(0.85_0.02_90)] bg-[oklch(0.97_0.003_90)]/60"
              }`}
            >
              {/* Region header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isUnlocked
                        ? "bg-[oklch(0.65_0.05_145)] shadow-sm"
                        : "bg-[oklch(0.6_0.01_85)]/40"
                    }`}
                  />
                  <h4 className="text-sm font-semibold text-[oklch(0.35_0.02_80)]">
                    {regionDisplayName(regionKey, group.info)}
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-[oklch(0.55_0.02_85)]">
                  {isUnlocked
                    ? `${allBuildings.length} ${locale === "en" ? "buildings" : "座建筑"}`
                    : "🔒"}
                </span>
              </div>

              {/* Region content */}
              {isUnlocked ? (
                allBuildings.length > 0 ? (
                  <div className="space-y-2">
                    {allBuildings.map((b) => {
                      const template = b.template;
                      const name =
                        locale === "en" && template?.name_en
                          ? template.name_en
                          : template?.name ?? "—";
                      const isSelected = selectedBuildingId === b.id;
                      const isLocked = b.status === "LOCKED";

                      return (
                        <button
                          key={b.id}
                          onClick={() => onSelectBuilding(b as UserBuilding | UserCompoundBuilding)}
                          className={`w-full flex items-center gap-3 rounded-xl p-2.5 text-left transition-all ${
                            isSelected
                              ? "bg-[oklch(0.72_0.12_85_/_0.15)] border border-[oklch(0.72_0.12_85_/_0.3)]"
                              : isLocked
                                ? "bg-[oklch(0.97_0.003_90)] border border-dashed border-[oklch(0.88_0.02_90)] opacity-50"
                                : "bg-[oklch(0.97_0.005_92)] border border-[oklch(0.88_0.02_90)] hover:border-[oklch(0.72_0.12_85_/_0.3)] hover:bg-[oklch(0.96_0.008_92)]"
                          }`}
                        >
                          <span className={`text-xl ${isLocked ? "grayscale" : ""}`}>
                            {template?.icon ?? (b.isCompound ? "⭐" : "🏗️")}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-[oklch(0.35_0.02_80)] truncate">
                              {name}
                            </p>
                            {!isLocked && (
                              <p className="text-[10px] text-[oklch(0.5_0.02_85)]">
                                {LEVEL_LABELS[b.level]?.[locale === "en" ? "en" : "zh"] ?? `Lv.${b.level}`}
                              </p>
                            )}
                          </div>
                          {b.isCompound && !isLocked && (
                            <span className="text-yellow-500 text-xs">⭐</span>
                          )}
                          {isSelected && (
                            <span className="text-[oklch(0.65_0.05_145)] text-xs">→</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-[oklch(0.5_0.02_85)] text-center py-4">
                    {locale === "en" ? "No buildings yet" : "暂无建筑"}
                  </p>
                )
              ) : (
                /* Fog of war for locked regions */
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-2 opacity-50">
                  <div className="text-3xl filter blur-[2px]">🏔️</div>
                  <p className="text-xs text-[oklch(0.5_0.02_85)]">
                    {locale === "en" ? "Unexplored Territory" : "未探索区域"}
                  </p>
                  <p className="text-[10px] text-[oklch(0.55_0.02_85)]">
                    {locale === "en"
                      ? "Complete quests to unlock this region"
                      : "完成任务以解锁此区域"}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Map footer — legend / stats */}
      <div className="flex items-center justify-center gap-6 text-xs text-[oklch(0.5_0.02_85)] py-3">
        <span>
          {locale === "en" ? "Buildings" : "建筑"}: {world.buildings.length + world.compound_buildings.length}
        </span>
        <span>
          {locale === "en" ? "Active" : "已激活"}: {world.stats.active_buildings}
        </span>
        <span>
          {locale === "en" ? "Regions" : "区域"}: {unlockedCount}/{totalRegions}
        </span>
        <Link
          href="/skills"
          className="text-[oklch(0.65_0.05_145)] hover:underline font-medium"
        >
          {locale === "en" ? "View All Skills →" : "查看全部技能 →"}
        </Link>
      </div>
    </div>
  );
}
