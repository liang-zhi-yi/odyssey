"use client";

import type { UserBuilding } from "@/types/world";
import { LEVEL_LABELS, BUILDING_STATUS_LABELS } from "@/types/world";
import { useLocale } from "@/hooks/useLocale";

interface BuildingTileProps {
  building: UserBuilding;
  isSelected: boolean;
  onClick: () => void;
}

const REGION_COLORS: Record<string, { bg: string; border: string; glow: string }> = {
  "语言区": {
    bg: "from-blue-500/20 to-blue-600/10",
    border: "border-blue-500/50",
    glow: "shadow-blue-500/20",
  },
  "知识区": {
    bg: "from-emerald-500/20 to-emerald-600/10",
    border: "border-emerald-500/50",
    glow: "shadow-emerald-500/20",
  },
  "自动化区": {
    bg: "from-amber-500/20 to-amber-600/10",
    border: "border-amber-500/50",
    glow: "shadow-amber-500/20",
  },
  "智能体区": {
    bg: "from-purple-500/20 to-purple-600/10",
    border: "border-purple-500/50",
    glow: "shadow-purple-500/20",
  },
  "工程区": {
    bg: "from-rose-500/20 to-rose-600/10",
    border: "border-rose-500/50",
    glow: "shadow-rose-500/20",
  },
};

export function BuildingTile({ building, isSelected, onClick }: BuildingTileProps) {
  const { t, locale } = useLocale();
  const tpl = building.template;
  const isLocked = building.status === "LOCKED";
  const isUpgrading = building.status === "UPGRADING";
  const region = tpl?.region ?? "";
  const colors = REGION_COLORS[region] ?? REGION_COLORS["语言区"];

  // Building display name (localized)
  const displayName =
    locale === "en" && tpl?.name_en ? tpl.name_en : tpl?.name ?? "";
  const levelLabel =
    locale === "en"
      ? LEVEL_LABELS[building.level]?.en ?? `Lv.${building.level}`
      : LEVEL_LABELS[building.level]?.zh ?? `Lv.${building.level}`;

  return (
    <button
      onClick={onClick}
      className={`
        group relative flex flex-col items-center justify-center
        w-28 h-28 rounded-xl border-2 transition-all duration-300
        cursor-pointer select-none
        ${isLocked
          ? "border-dashed border-muted-foreground/30 bg-muted/20 opacity-50"
          : `bg-gradient-to-br ${colors.bg} ${colors.border}`
        }
        ${isSelected
          ? `ring-2 ring-primary ring-offset-2 ring-offset-background scale-110 z-10 shadow-lg ${colors.glow}`
          : "hover:scale-105 hover:shadow-md"
        }
        ${isUpgrading ? "animate-pulse" : ""}
      `}
      style={{
        // Level-based size scaling
        width: `${80 + building.level * 10}px`,
        height: `${80 + building.level * 10}px`,
      }}
      title={displayName}
    >
      {/* Lock indicator */}
      {isLocked && (
        <div className="absolute top-1 right-1 opacity-60">
          <svg
            className="w-4 h-4 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
      )}

      {/* Upgrading indicator */}
      {isUpgrading && (
        <div className="absolute -top-2 -right-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
            ⬆
          </span>
        </div>
      )}

      {/* Building icon */}
      <span
        className={`
          text-3xl transition-transform duration-300
          group-hover:scale-110
          ${isLocked ? "grayscale" : ""}
        `}
      >
        {tpl?.icon ?? "🏛️"}
      </span>

      {/* Building name */}
      <span
        className={`
          mt-1 text-xs font-semibold text-center leading-tight px-1
          ${isLocked ? "text-muted-foreground" : "text-foreground"}
        `}
      >
        {displayName}
      </span>

      {/* Level badge */}
      <span
        className={`
          mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium
          ${isLocked
            ? "bg-muted text-muted-foreground"
            : "bg-primary/10 text-primary"
          }
        `}
      >
        {levelLabel}
      </span>
    </button>
  );
}

export { REGION_COLORS };
