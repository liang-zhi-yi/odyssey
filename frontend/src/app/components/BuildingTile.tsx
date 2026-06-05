"use client";

import type { UserBuilding } from "@/types/world";
import { LEVEL_LABELS } from "@/types/world";
import { useLocale } from "@/hooks/useLocale";

interface BuildingTileProps {
  building: UserBuilding;
  isSelected: boolean;
  onClick: () => void;
}

const REGION_STYLES: Record<string, {
  bg: string; border: string; glow: string; accent: string;
  tileBg: string;
}> = {
  "语言区": {
    bg: "from-blue-600/30 to-indigo-700/20",
    border: "border-blue-400/50",
    glow: "shadow-blue-400/25",
    accent: "bg-blue-400",
    tileBg: "bg-blue-950/40",
  },
  "知识区": {
    bg: "from-emerald-600/30 to-green-700/20",
    border: "border-emerald-400/50",
    glow: "shadow-emerald-400/25",
    accent: "bg-emerald-400",
    tileBg: "bg-emerald-950/40",
  },
  "自动化区": {
    bg: "from-amber-600/30 to-orange-700/20",
    border: "border-amber-400/50",
    glow: "shadow-amber-400/25",
    accent: "bg-amber-400",
    tileBg: "bg-amber-950/40",
  },
  "智能体区": {
    bg: "from-purple-600/30 to-violet-700/20",
    border: "border-purple-400/50",
    glow: "shadow-purple-400/25",
    accent: "bg-purple-400",
    tileBg: "bg-purple-950/40",
  },
  "工程区": {
    bg: "from-rose-600/30 to-pink-700/20",
    border: "border-rose-400/50",
    glow: "shadow-rose-400/25",
    accent: "bg-rose-400",
    tileBg: "bg-rose-950/40",
  },
};

const DEFAULT_STYLE = REGION_STYLES["语言区"];

export function BuildingTile({ building, isSelected, onClick }: BuildingTileProps) {
  const { t, locale } = useLocale();
  const tpl = building.template;
  const isLocked = building.status === "LOCKED";
  const isUpgrading = building.status === "UPGRADING";
  const isStable = building.status === "STABLE";
  const region = tpl?.region ?? "";
  const styles = REGION_STYLES[region] ?? DEFAULT_STYLE;

  const displayName =
    locale === "en" && tpl?.name_en ? tpl.name_en : tpl?.name ?? "";
  const levelLabel =
    locale === "en"
      ? LEVEL_LABELS[building.level]?.en ?? `Lv.${building.level}`
      : LEVEL_LABELS[building.level]?.zh ?? `Lv.${building.level}`;

  const size = 80 + building.level * 8;

  return (
    <button
      onClick={onClick}
      className={`
        group relative flex flex-col items-center justify-center
        border-2 transition-all duration-300
        cursor-pointer select-none
        ${isLocked
          ? "border-dashed border-muted-foreground/25 bg-muted/15 opacity-45"
          : `bg-gradient-to-br ${styles.bg} ${styles.border} ${styles.tileBg}`
        }
        ${isSelected
          ? `ring-2 ring-primary ring-offset-4 ring-offset-background scale-115 z-50 shadow-xl shadow-black/40 ${styles.glow}`
          : "hover:scale-108 hover:shadow-lg hover:shadow-black/30 hover:z-30"
        }
        ${isUpgrading ? "animate-pulse" : ""}
        ${isStable && !isLocked ? "shadow-md shadow-black/20" : ""}
      `}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        // Game-style isometric platform shape
        clipPath: `polygon(
          50% 3%, 95% 30%, 95% 75%,
          50% 97%, 5% 75%, 5% 30%
        )`,
      }}
      title={displayName}
    >
      {/* ── Top edge highlight (3D platform effect) ── */}
      {!isLocked && (
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 h-[3px] w-[65%] rounded-full opacity-60"
          style={{
            background: `linear-gradient(90deg, transparent, ${regionColorToHex(region)}, transparent)`,
          }}
        />
      )}

      {/* Lock indicator */}
      {isLocked && (
        <div className="absolute top-3 right-3 opacity-50">
          <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
      )}

      {/* Upgrading indicator */}
      {isUpgrading && (
        <div className="absolute -top-1 -right-1 z-10">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground shadow-md animate-bounce">
            ⬆
          </span>
        </div>
      )}

      {/* Active status dot */}
      {!isLocked && (
        <div className="absolute top-3 right-3">
          <span className={`flex h-2 w-2 rounded-full ${isUpgrading ? "bg-yellow-400 animate-pulse" : "bg-green-400"}`} />
        </div>
      )}

      {/* ── Building icon ── */}
      <span
        className={`
          text-3xl transition-transform duration-300
          group-hover:scale-115
          ${isLocked ? "grayscale opacity-40" : "drop-shadow-md"}
        `}
        style={{ filter: !isLocked ? "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" : undefined }}
      >
        {tpl?.icon ?? "🏛️"}
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
            : `${styles.accent} bg-opacity-20 text-white`
          }
        `}
      >
        {levelLabel}
      </span>

      {/* ── Selection glow ring ── */}
      {isSelected && (
        <div className="absolute inset-0 rounded-xl ring-4 ring-primary/30 animate-pulse pointer-events-none" />
      )}
    </button>
  );
}

/** Helper: map region name to a hex color for the top-edge highlight */
function regionColorToHex(region: string): string {
  const map: Record<string, string> = {
    "语言区": "#60a5fa",
    "知识区": "#34d399",
    "自动化区": "#fbbf24",
    "智能体区": "#a78bfa",
    "工程区": "#fb7185",
  };
  return map[region] ?? "#60a5fa";
}

export { REGION_STYLES };
