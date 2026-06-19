"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useLocale } from "@/hooks/useLocale";
import { VintageShieldIcon } from "./VintageShieldIcon";
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
  const regionCoords: Record<string, string> = {
    "knowledge": "42° N, 12° E",
    "ai": "55° N, 40° E",
    "engineering": "34° N, 108° E",
    "business": "15° S, 48° W",
    "design": "30° S, 115° E",
    "language": "48° N, 2° E",
    "core": "0° N, 0° E",
    "creative": "12° N, 68° W",
    "logic": "51° N, 0° W",
    "practice": "23° S, 43° W",
    "synthesis": "8° S, 140° E",
  };

  return (
    <div className="space-y-6">
      {/* Map header */}
      <div className="vintage-parchment-card p-4 shadow-md border-2 border-double border-[oklch(0.7_0.12_85_/_0.35)] relative overflow-hidden">
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-gentle-float">🗺️</span>
            <div>
              <h2 className="text-base font-bold font-civ-serif text-[oklch(0.3_0.02_80)]">
                {world.name}
              </h2>
              <p className="text-xs text-[oklch(0.55_0.02_85)]">
                {locale === "en"
                  ? `${unlockedCount}/${totalRegions} regions conquered & charted`
                  : `已征服并勘探 ${unlockedCount}/${totalRegions} 个领地板块`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold text-[oklch(0.5_0.02_85)]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[oklch(0.65_0.05_145)] shadow-sm animate-node-pulse" />
              {locale === "en" ? "Charted" : "已征服"}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[oklch(0.6_0.01_85)]/40 border border-dashed border-[oklch(0.7_0.12_85_/_0.3)]" />
              {locale === "en" ? "Terra Incognita" : "未知疆域"}
            </span>
          </div>
        </div>
      </div>

      {/* ═══════ Central Hub (Civilization Capital) ═══════ */}
      {coreBuilding && (
        <div className="vintage-parchment-card p-5 border-2 border-double border-[oklch(0.72_0.12_85_/_0.65)] shadow-lg relative overflow-hidden animate-pedestal-glow transition-all duration-300 hover:shadow-xl">
          {/* Subtle glow behind core building */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-radial from-[oklch(0.72_0.12_85_/_0.15)] to-transparent pointer-events-none select-none" />

          <div className="relative flex items-center gap-5 z-10">
            <VintageShieldIcon icon={coreBuilding.template?.icon ?? "🏛️"} size="lg" tier="gold" />
            <div className="flex-1 min-w-0">
              <p className="text-[9px] text-[oklch(0.55_0.02_85)] font-bold uppercase tracking-wider">
                {locale === "en" ? "Civilization Capital" : "文明核心帝国要塞"}
              </p>
              <h3 className="text-lg font-bold font-civ-serif text-[oklch(0.3_0.02_80)]">
                {locale === "en" && coreBuilding.template?.name_en
                  ? coreBuilding.template.name_en
                  : coreBuilding.template?.name ?? "—"}
              </h3>
              <p className="text-sm text-[oklch(0.5_0.02_85)] mt-1 leading-relaxed">
                {locale === "en" && coreBuilding.template?.description_en
                  ? coreBuilding.template.description_en
                  : coreBuilding.template?.description ?? ""}
              </p>
              <div className="flex items-center gap-3 mt-3">
                <span className="text-xs font-bold bg-[oklch(0.72_0.12_85_/_0.18)] text-[oklch(0.35_0.03_80)] rounded-full px-3 py-0.5 border border-[oklch(0.72_0.12_85_/_0.25)]">
                  {LEVEL_LABELS[coreBuilding.level]?.[locale === "en" ? "en" : "zh"] ?? `Lv.${coreBuilding.level}`}
                </span>
                <button
                  onClick={() => onSelectBuilding(coreBuilding)}
                  className="text-xs text-[oklch(0.65_0.05_145)] hover:underline font-bold"
                >
                  {locale === "en" ? "Inspect Capital →" : "视察核心要塞 →"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ Region Plates Grid ═══════ */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {regionGroups.map(([regionKey, group]) => {
          const isUnlocked = group.info?.unlocked ?? true;
          const allBuildings = [
            ...group.buildings.map((b) => ({ ...b, isCompound: false as const })),
            ...group.compounds.map((cb) => ({ ...cb, isCompound: true as const })),
          ];
          const coordStamp = regionCoords[regionKey.toLowerCase()] ?? "0° N, 0° E";

          return (
            <div
              key={regionKey}
              className={`rounded-2xl transition-all duration-300 flex flex-col justify-between ${
                isUnlocked
                  ? "vintage-parchment-card p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 border-[oklch(0.88_0.02_90)]"
                  : "border-2 border-dashed border-[oklch(0.7_0.12_85_/_0.3)] bg-[oklch(0.95_0.005_90)]/75 dark:bg-[oklch(0.25_0.008_85)]/40 p-4 min-h-[170px]"
              }`}
            >
              {isUnlocked ? (
                <>
                  {/* Region header */}
                  <div className="flex items-center justify-between mb-3 border-b border-[oklch(0.88_0.02_90)] pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[oklch(0.65_0.05_145)] shadow-sm animate-node-pulse" />
                      <h4 className="text-sm font-bold font-civ-serif text-[oklch(0.35_0.02_80)]">
                        {regionDisplayName(regionKey, group.info)}
                      </h4>
                    </div>
                    <span className="text-[8px] font-mono text-[oklch(0.55_0.02_85)]/50">
                      {coordStamp}
                    </span>
                  </div>

                  {/* Region content */}
                  {allBuildings.length > 0 ? (
                    <div className="space-y-2 flex-1">
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
                            className={`w-full flex items-center gap-3 rounded-xl p-2 text-left transition-all duration-200 btn-press ${
                              isSelected
                                ? "bg-[oklch(0.72_0.12_85_/_0.15)] border border-[oklch(0.72_0.12_85_/_0.35)] shadow-sm"
                                : isLocked
                                  ? "bg-[oklch(0.97_0.003_90)]/50 border border-dashed border-[oklch(0.88_0.02_90)] opacity-40 hover:opacity-60"
                                  : "bg-[oklch(0.97_0.005_92)] border border-[oklch(0.88_0.02_90)] hover:border-[oklch(0.72_0.12_85_/_0.3)] hover:bg-[oklch(0.98_0.005_95)]"
                            }`}
                          >
                            <VintageShieldIcon 
                              icon={template?.icon ?? (b.isCompound ? "⭐" : "🏗️")} 
                              size="sm" 
                              tier={isLocked ? "sage" : b.isCompound ? "silver" : "bronze"} 
                              className={isLocked ? "grayscale opacity-50" : ""}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-[oklch(0.35_0.02_80)] truncate">
                                {name}
                              </p>
                              {!isLocked && (
                                <p className="text-[10px] font-mono text-[oklch(0.5_0.02_85)]">
                                  {LEVEL_LABELS[b.level]?.[locale === "en" ? "en" : "zh"] ?? `Lv.${b.level}`}
                                </p>
                              )}
                            </div>
                            {b.isCompound && !isLocked && (
                              <span className="text-yellow-500 text-xs shrink-0">⭐</span>
                            )}
                            {isSelected && (
                              <span className="text-[oklch(0.65_0.05_145)] text-xs font-bold animate-pulse">→</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center py-6">
                      <p className="text-xs text-[oklch(0.5_0.02_85)] italic">
                        {locale === "en" ? "Untapped land..." : "尚无开发的荒地..."}
                      </p>
                    </div>
                  )}
                  
                  {/* Card bottom count */}
                  <div className="text-[9px] text-[oklch(0.5_0.02_85)] text-right mt-2 pt-1.5 border-t border-[oklch(0.9_0.005_90)]">
                    {allBuildings.length} {locale === "en" ? "structures" : "座建筑群"}
                  </div>
                </>
              ) : (
                /* Fog of war for locked regions - Terra Incognita chart grid */
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-2 relative overflow-hidden flex-1">
                  <VintageShieldIcon icon="🐉" size="md" tier="sage" className="grayscale opacity-25 filter blur-[1px] select-none" />
                  <p className="text-xs font-civ-serif font-bold text-[oklch(0.45_0.02_85)] uppercase tracking-wider relative z-10">
                    {locale === "en" ? "Terra Incognita" : "未知疆域 (Terra)"}
                  </p>
                  <p className="text-[9px] text-[oklch(0.55_0.02_85)] font-medium max-w-[150px] leading-normal relative z-10">
                    {locale === "en"
                      ? "Complete quests in this domain to charter these lands"
                      : "攻克对应领域的 Quest 任务以开辟此地"}
                  </p>
                  <div className="text-[8px] font-mono text-[oklch(0.55_0.02_85)]/40 mt-1 relative z-10">
                    {coordStamp}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Map footer — legend / stats */}
      <div className="flex items-center justify-center gap-6 text-xs text-[oklch(0.5_0.02_85)] py-4 border-t border-double border-[oklch(0.7_0.12_85_/_0.25)]">
        <span>
          {locale === "en" ? "Charted structures" : "文明总建筑数"}: <span className="font-bold font-mono">{world.buildings.filter(b => b.status !== "LOCKED").length + world.compound_buildings.filter(b => b.status !== "LOCKED").length}</span>
        </span>
        <span>
          {locale === "en" ? "Active" : "已激活建筑"}: <span className="font-bold font-mono">{world.stats.active_buildings}</span>
        </span>
        <span>
          {locale === "en" ? "Explored domains" : "大板块勘探度"}: <span className="font-bold font-mono">{unlockedCount}/{totalRegions}</span>
        </span>
        <Link
          href="/skills"
          className="text-[oklch(0.65_0.05_145)] hover:underline font-bold"
        >
          {locale === "en" ? "View Charted Skills →" : "查阅文明科技与技能 →"}
        </Link>
      </div>
    </div>
  );
}
