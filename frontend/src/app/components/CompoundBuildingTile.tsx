"use client";

import type { UserCompoundBuilding } from "@/types/world";
import { LEVEL_LABELS } from "@/types/world";
import { useLocale } from "@/hooks/useLocale";

interface CompoundBuildingTileProps {
  building: UserCompoundBuilding;
  isSelected: boolean;
  onClick: () => void;
}

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

  const size = 90 + building.level * 8;

  return (
    <button
      onClick={onClick}
      className={`
        group relative flex flex-col items-center justify-center
        border-2 transition-all duration-300
        cursor-pointer select-none
        ${isLocked
          ? "border-dashed border-muted-foreground/25 bg-muted/15 opacity-45"
          : "bg-gradient-to-br from-[oklch(0.78_0.1_85_/_0.25)] via-[oklch(0.75_0.08_80_/_0.2)] to-[oklch(0.72_0.06_75_/_0.15)] border-[oklch(0.72_0.12_85_/_0.5)] bg-[oklch(0.9_0.04_85_/_0.3)]"
        }
        ${isSelected
          ? "ring-2 ring-[oklch(0.72_0.12_85)] ring-offset-4 ring-offset-background scale-115 z-50 shadow-xl shadow-[oklch(0.72_0.12_85_/_0.2)] shadow-black/40"
          : "hover:scale-108 hover:shadow-lg hover:shadow-[oklch(0.72_0.12_85_/_0.1)] hover:shadow-black/30 hover:z-30"
        }
        ${isUpgrading ? "animate-warm-pulse" : ""}
        ${!isLocked ? "shadow-md shadow-black/20" : ""}
      `}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        // Regular hexagonal clip path
        clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
      }}
      title={displayName}
    >
      {/* ── Animated golden glow ring (unlocked only) ── */}
      {!isLocked && (
        <>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
              background:
                "conic-gradient(from 0deg, transparent, oklch(0.72 0.12 85 / 0.2), transparent, oklch(0.72 0.12 85 / 0.1), transparent)",
              animation: "spin 6s linear infinite",
            }}
          />
          {/* Top edge highlight */}
          <div className="absolute top-1 left-1/2 -translate-x-1/2 h-[2px] w-[55%] rounded-full bg-gradient-to-r from-transparent via-[oklch(0.72_0.12_85)]/60 to-transparent" />
        </>
      )}

      {/* Lock indicator */}
      {isLocked && (
        <div className="absolute top-3 right-3 opacity-50 z-10">
          <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
      )}

      {/* Upgrading indicator */}
      {isUpgrading && (
        <div className="absolute -top-1 -right-1 z-10">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[oklch(0.72_0.12_85)] text-[10px] text-white shadow-md animate-bounce">
            ⬆
          </span>
        </div>
      )}

      {/* Active status dot */}
      {!isLocked && (
        <div className="absolute top-3 right-3 z-10">
          <span className={`flex h-2 w-2 rounded-full ${isUpgrading ? "bg-[oklch(0.75_0.1_85)] animate-pulse" : "bg-[oklch(0.72_0.12_85)] shadow-sm shadow-[oklch(0.72_0.12_85_/_0.5)]"}`} />
        </div>
      )}

      {/* ── Compound synergy badge ── */}
      <div className="absolute -top-0.5 -left-0.5 z-10">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[oklch(0.72_0.12_85_/_0.15)] border border-[oklch(0.72_0.12_85_/_0.35)] text-xs shadow-sm">
          🔗
        </span>
      </div>

      {/* ── Building icon ── */}
      <span
        className={`
          text-3xl transition-transform duration-300
          group-hover:scale-115
          ${isLocked ? "grayscale opacity-40" : "drop-shadow-md"}
        `}
        style={{ filter: !isLocked ? "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" : undefined }}
      >
        {tpl?.icon ?? "🏰"}
      </span>

      {/* ── Building name ── */}
      <span
        className={`
          mt-1 text-[11px] font-bold text-center leading-tight px-1 max-w-full truncate
          ${isLocked ? "text-muted-foreground/60" : "text-foreground"}
        `}
      >
        {displayName}
      </span>

      {/* ── Level badge ── */}
      <span
        className={`
          mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold
          ${isLocked
            ? "bg-muted/30 text-muted-foreground/60"
            : "bg-[oklch(0.72_0.12_85_/_0.15)] text-[oklch(0.72_0.12_85)]"
          }
        `}
      >
        {levelLabel}
      </span>

      {/* ── Selection highlight ── */}
      {isSelected && (
        <div
          className="absolute inset-0 ring-4 ring-[oklch(0.72_0.12_85)]/40 animate-warm-pulse pointer-events-none"
          style={{
            clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
          }}
        />
      )}

      {/* ── Sparkle particles (unlocked, stable) ── */}
      {!isLocked && !isUpgrading && (
        <>
          <Sparkle delay="0s" top="8%" left="25%" />
          <Sparkle delay="1.5s" top="15%" right="20%" />
          <Sparkle delay="3s" bottom="20%" left="30%" />
        </>
      )}
    </button>
  );
}

/** Tiny animated sparkle dot for compound buildings */
function Sparkle({
  delay, top, left, right, bottom,
}: {
  delay: string;
  top?: string; left?: string; right?: string; bottom?: string;
}) {
  return (
    <div
      className="absolute w-1 h-1 rounded-full bg-[oklch(0.85_0.1_90)]/80 pointer-events-none"
      style={{
        top, left, right, bottom,
        animation: `sparkle 2s ${delay} ease-in-out infinite`,
      }}
    />
  );
}
