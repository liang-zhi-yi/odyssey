"use client";

import { useLocale } from "@/hooks/useLocale";
import { QuestScrollIcon } from "./QuestScrollIcon";
import type { AssociatedBuilding, QuestRewardPreview } from "@/types/quest";

interface CivilizationBuildingCardProps {
  building: AssociatedBuilding | null;
  reward: QuestRewardPreview | null;
}

/**
 * CivilizationBuildingCard — 文明建筑成长模块.
 *
 * Shows the building impact of completing this quest:
 *   - Building emblem icon + name + level badge
 *   - After completion: building EXP gain + next stage unlock
 *
 * Visual: RPG building upgrade panel with emblem + growth preview.
 * No emoji — uses QuestScrollIcon SVG system (building-emblem).
 */
export function CivilizationBuildingCard({
  building,
  reward,
}: CivilizationBuildingCardProps) {
  const { locale } = useLocale();

  if (!building) return null;

  const buildingName = locale === "en" && building.name_en ? building.name_en : building.name;
  const buildingExp = reward?.building_exp ?? 0;
  // Defensive: default to 0 if current_level is undefined/null (prevents
  // "Lv.NaN" when backend response is missing the field). This matches
  // the user's actual DB state (unconstructed building = Lv.0).
  const currentLevel = Number.isFinite(building.current_level)
    ? building.current_level
    : 0;
  const nextLevel = currentLevel + 1;
  const nextLevelAt = building.next_level_at ?? 0;
  // Rough progress toward next level (visual hint only)
  const progressPct = nextLevelAt > 0
    ? Math.min(100, Math.round(((buildingExp) / nextLevelAt) * 100))
    : 0;

  return (
    <div className="relative rounded-xl border border-[oklch(0.72_0.06_80_/_0.22)] dark:border-[oklch(0.50_0.05_80_/_0.28)] bg-gradient-to-br from-[oklch(0.95_0.025_85_/_0.55)] to-transparent dark:from-[oklch(0.24_0.02_80_/_0.45)] p-5 ornamental-border">
      {/* Section header */}
      <div className="flex items-center gap-2.5 mb-4">
        <QuestScrollIcon name="building-emblem" size={15} className="text-[oklch(0.50_0.06_75)] dark:text-[oklch(0.72_0.08_80)]" strokeWidth={1.4} />
        <h3 className="text-[13px] font-bold font-civ-serif text-[oklch(0.32_0.025_70)] dark:text-[oklch(0.85_0.04_80)] tracking-wide">
          {locale === "zh" ? "关联文明建筑" : "Associated Building"}
        </h3>
        <div className="flex-1 h-px bg-[oklch(0.72_0.06_80_/_0.18)] dark:bg-[oklch(0.55_0.05_80_/_0.20)]" />
      </div>

      {/* Building row — emblem + name + level badge */}
      <div className="flex items-center gap-4 mb-4">
        {/* Building emblem */}
        <div className="badge-emblem flex items-center justify-center w-14 h-14 rounded-lg flex-shrink-0">
          <QuestScrollIcon name="building-emblem" size={28} strokeWidth={1.3} />
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <p className="font-civ-serif text-[15px] font-bold text-[oklch(0.30_0.03_70)] dark:text-[oklch(0.88_0.04_80)] truncate leading-tight">
            {buildingName}
          </p>
          <p className="text-[10px] text-[oklch(0.50_0.04_75)] dark:text-[oklch(0.62_0.045_80)] uppercase tracking-[0.16em] mt-1 font-civ-serif">
            {locale === "zh" ? "当前等级" : "Current Level"}
          </p>
        </div>

        {/* Level badge */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-lg border border-[oklch(0.65_0.08_75_/_0.35)] dark:border-[oklch(0.60_0.07_80_/_0.40)] bg-[oklch(0.92_0.04_80_/_0.50)] dark:bg-[oklch(0.26_0.025_75_/_0.50)]">
          <span className="text-[9px] text-[oklch(0.50_0.05_75)] dark:text-[oklch(0.68_0.06_80)] font-civ-serif tabular-nums leading-none">
            Lv.
          </span>
          <span className="text-[20px] font-bold font-civ-serif text-[oklch(0.42_0.06_72)] dark:text-[oklch(0.82_0.07_80)] tabular-nums leading-none mt-0.5">
            {currentLevel}
          </span>
        </div>
      </div>

      {/* Growth preview — after completion */}
      <div className="rounded-lg bg-[oklch(0.96_0.015_85_/_0.55)] dark:bg-[oklch(0.20_0.012_78_/_0.50)] border border-[oklch(0.72_0.06_80_/_0.15)] dark:border-[oklch(0.45_0.04_80_/_0.20)] p-3.5 space-y-3 relative z-10">
        <p className="text-[10px] font-medium text-[oklch(0.50_0.04_75)] dark:text-[oklch(0.65_0.045_80)] uppercase tracking-[0.18em] font-civ-serif">
          {locale === "zh" ? "完成任务后" : "After Completion"}
        </p>

        {/* Building EXP gain */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QuestScrollIcon name="sparkle" size={13} className="text-[oklch(0.45_0.09_145)] dark:text-[oklch(0.62_0.10_145)]" />
            <span className="text-[12px] text-[oklch(0.40_0.025_72)] dark:text-[oklch(0.72_0.035_82)] font-civ-serif">
              {locale === "zh" ? "建筑经验" : "Building EXP"}
            </span>
          </div>
          <span className="text-[15px] font-bold font-civ-serif text-[oklch(0.45_0.09_145)] dark:text-[oklch(0.68_0.10_145)] tabular-nums">
            +{buildingExp}
          </span>
        </div>

        {/* Growth progress bar (visual hint) */}
        {nextLevelAt > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 rounded-full bg-[oklch(0.88_0.02_80_/_0.60)] dark:bg-[oklch(0.28_0.015_78_/_0.60)] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[oklch(0.55_0.09_145)] to-[oklch(0.65_0.10_145)] transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-[9px] text-muted-foreground tabular-nums font-civ-serif flex-shrink-0">
              +{buildingExp}/{nextLevelAt}
            </span>
          </div>
        )}

        {/* Unlock hint */}
        <div className="flex items-center justify-between pt-1 border-t border-[oklch(0.72_0.06_80_/_0.12)] dark:border-[oklch(0.45_0.04_80_/_0.15)]">
          <div className="flex items-center gap-2">
            <QuestScrollIcon name="lock" size={13} className="text-[oklch(0.60_0.06_75_/_0.70)] dark:text-[oklch(0.65_0.06_80_/_0.70)]" />
            <span className="text-[12px] text-[oklch(0.40_0.025_72)] dark:text-[oklch(0.72_0.035_82)] font-civ-serif">
              {locale === "zh" ? "解锁" : "Unlock"}
            </span>
          </div>
          <span className="text-[12px] font-bold font-civ-serif text-[oklch(0.42_0.06_72)] dark:text-[oklch(0.78_0.07_80)]">
            {locale === "zh" ? `Lv.${nextLevel} 能力` : `Lv.${nextLevel} Ability`}
          </span>
        </div>
      </div>
    </div>
  );
}
