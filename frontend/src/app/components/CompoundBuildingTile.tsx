"use client";

import type { UserCompoundBuilding } from "@/types/world";
import { LEVEL_LABELS } from "@/types/world";
import { useLocale } from "@/hooks/useLocale";

interface CompoundBuildingTileProps {
  building: UserCompoundBuilding;
  isSelected: boolean;
  onClick: () => void;
}

/** Gold/amber gradient for compound buildings (Synthesis Region). */
const COMPOUND_COLORS = {
  bg: "from-yellow-500/20 to-amber-600/10",
  border: "border-yellow-500/60",
  glow: "shadow-yellow-500/30",
};

export function CompoundBuildingTile({
  building,
  isSelected,
  onClick,
}: CompoundBuildingTileProps) {
  const { locale } = useLocale();
  const tpl = building.template;
  const isLocked = building.status === "LOCKED";
  const isUpgrading = building.status === "UPGRADING";

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
        w-32 h-32 border-2 transition-all duration-300
        cursor-pointer select-none
        ${isLocked
          ? "border-dashed border-muted-foreground/30 bg-muted/20 opacity-50"
          : `bg-gradient-to-br ${COMPOUND_COLORS.bg} ${COMPOUND_COLORS.border}`
        }
        ${isSelected
          ? `ring-2 ring-yellow-500 ring-offset-2 ring-offset-background scale-110 z-10 shadow-lg ${COMPOUND_COLORS.glow}`
          : "hover:scale-105 hover:shadow-md"
        }
        ${isUpgrading ? "animate-pulse" : ""}
      `}
      style={{
        width: `${88 + building.level * 10}px`,
        height: `${88 + building.level * 10}px`,
        // Hexagonal shape via clip-path
        clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
      }}
      title={displayName}
    >
      {/* Lock indicator */}
      {isLocked && (
        <div className="absolute top-2 right-2 opacity-60">
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
        <div className="absolute -top-1 right-0">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500 text-[10px] text-white">
            ⬆
          </span>
        </div>
      )}

      {/* Compound icon badge */}
      <div className="absolute -top-1 -left-1">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500/20 text-[10px]">
          🔗
        </span>
      </div>

      {/* Building icon */}
      <span
        className={`
          text-3xl transition-transform duration-300
          group-hover:scale-110
          ${isLocked ? "grayscale" : ""}
        `}
      >
        {tpl?.icon ?? "🏰"}
      </span>

      {/* Building name */}
      <span
        className={`
          mt-1 text-[11px] font-semibold text-center leading-tight px-1
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
            : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
          }
        `}
      >
        {levelLabel}
      </span>
    </button>
  );
}
