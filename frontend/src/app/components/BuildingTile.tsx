"use client";

import type { UserBuilding } from "@/types/world";
import { LEVEL_LABELS } from "@/types/world";
import { useLocale } from "@/hooks/useLocale";

interface BuildingTileProps {
  building: UserBuilding;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * Warm-theme region styles (奶油白/鼠尾草绿/暖灰/浅金 palette).
 * Each region gets a distinct warm accent for differentiation.
 */
const REGION_STYLES: Record<string, {
  bg: string; border: string; glow: string; accent: string;
  tileBg: string; accentHex: string;
}> = {
  "语言区": {
    bg: "from-[oklch(0.85_0.04_250_/_0.25)] to-[oklch(0.8_0.03_240_/_0.15)]",
    border: "border-[oklch(0.75_0.06_250_/_0.45)]",
    glow: "shadow-[oklch(0.7_0.08_250_/_0.25)]",
    accent: "bg-[oklch(0.7_0.08_250)]",
    tileBg: "bg-[oklch(0.9_0.02_250_/_0.3)]",
    accentHex: "#7eb8da",
  },
  "知识区": {
    bg: "from-[oklch(0.78_0.06_145_/_0.25)] to-[oklch(0.73_0.05_150_/_0.15)]",
    border: "border-[oklch(0.68_0.07_145_/_0.45)]",
    glow: "shadow-[oklch(0.65_0.08_145_/_0.25)]",
    accent: "bg-[oklch(0.65_0.08_145)]",
    tileBg: "bg-[oklch(0.88_0.03_145_/_0.3)]",
    accentHex: "#7db892",
  },
  "自动化区": {
    bg: "from-[oklch(0.82_0.08_80_/_0.25)] to-[oklch(0.77_0.07_75_/_0.15)]",
    border: "border-[oklch(0.72_0.1_85_/_0.45)]",
    glow: "shadow-[oklch(0.72_0.12_85_/_0.25)]",
    accent: "bg-[oklch(0.72_0.12_85)]",
    tileBg: "bg-[oklch(0.9_0.04_85_/_0.3)]",
    accentHex: "#d4a843",
  },
  "智能体区": {
    bg: "from-[oklch(0.78_0.06_310_/_0.25)] to-[oklch(0.73_0.05_300_/_0.15)]",
    border: "border-[oklch(0.68_0.08_310_/_0.45)]",
    glow: "shadow-[oklch(0.65_0.08_310_/_0.25)]",
    accent: "bg-[oklch(0.65_0.08_310)]",
    tileBg: "bg-[oklch(0.88_0.03_310_/_0.3)]",
    accentHex: "#b88dc4",
  },
  "工程区": {
    bg: "from-[oklch(0.78_0.07_15_/_0.25)] to-[oklch(0.73_0.06_20_/_0.15)]",
    border: "border-[oklch(0.68_0.08_20_/_0.45)]",
    glow: "shadow-[oklch(0.65_0.09_20_/_0.25)]",
    accent: "bg-[oklch(0.65_0.09_20)]",
    tileBg: "bg-[oklch(0.88_0.03_20_/_0.3)]",
    accentHex: "#c47d7d",
  },
};

const DEFAULT_STYLE = REGION_STYLES["语言区"];

/**
 * Determine the building tier category for visual scaling.
 * Lv1: Foundation, Lv2-4: Regional, Lv5-7: Civilization, Lv8-10: World-class
 */
function getLevelTier(level: number): "foundation" | "regional" | "civilization" | "world" {
  if (level >= 8) return "world";
  if (level >= 5) return "civilization";
  if (level >= 2) return "regional";
  return "foundation";
}

const LEVEL_TIER_CONFIG = {
  foundation: { sizeBase: 76, sizePerLevel: 4, borderWidth: "border-2", iconScale: "text-2xl", glowIntensity: 0 },
  regional: { sizeBase: 82, sizePerLevel: 5, borderWidth: "border-2", iconScale: "text-3xl", glowIntensity: 1 },
  civilization: { sizeBase: 90, sizePerLevel: 6, borderWidth: "border-[2.5px]", iconScale: "text-4xl", glowIntensity: 2 },
  world: { sizeBase: 100, sizePerLevel: 6, borderWidth: "border-[3px]", iconScale: "text-5xl", glowIntensity: 3 },
} as const;

export function BuildingTile({ building, isSelected, onClick }: BuildingTileProps) {
  const { t, locale } = useLocale();
  const tpl = building.template;
  const isLocked = building.status === "LOCKED";
  const isConstructing = building.status === "CONSTRUCTING";
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

  const levelTier = getLevelTier(building.level);
  const tierConfig = LEVEL_TIER_CONFIG[levelTier];
  const size = tierConfig.sizeBase + building.level * tierConfig.sizePerLevel;

  return (
    <button
      onClick={onClick}
      className={`
        group relative flex flex-col items-center justify-center
        ${tierConfig.borderWidth} transition-all duration-300
        cursor-pointer select-none
        ${isLocked
          ? "border-dashed border-[oklch(0.75_0.01_85_/_0.3)] bg-[oklch(0.92_0.005_90_/_0.3)] opacity-45"
          : `bg-gradient-to-br ${styles.bg} ${styles.border} ${styles.tileBg}`
        }
        ${isSelected
          ? `ring-2 ring-[oklch(0.72_0.12_85)] ring-offset-4 ring-offset-[oklch(0.98_0.005_90)] scale-115 z-50 shadow-xl ${styles.glow}`
          : "hover:scale-108 hover:shadow-lg hover:shadow-black/20 hover:z-30"
        }
        ${isConstructing ? "animate-constructing border-dashed" : ""}
        ${isUpgrading ? "animate-warm-pulse" : ""}
        ${isStable && !isLocked ? "shadow-md shadow-black/10" : ""}
        ${levelTier === "world" && !isLocked ? "shadow-[oklch(0.72_0.12_85_/_0.2)] shadow-lg" : ""}
        ${levelTier === "civilization" && !isLocked ? "shadow-[oklch(0.65_0.05_145_/_0.15)] shadow-md" : ""}
      `}
      style={{
        width: `${size}px`,
        height: `${size}px`,
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
          className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full opacity-60"
          style={{
            height: levelTier === "world" ? "4px" : levelTier === "civilization" ? "3px" : "2px",
            width: levelTier === "world" ? "70%" : "65%",
            background: `linear-gradient(90deg, transparent, ${styles.accentHex}, transparent)`,
          }}
        />
      )}

      {/* Lock indicator — fog of war effect */}
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-[oklch(0.9_0.005_90_/_0.5)] rounded-inherit">
          <svg className="w-5 h-5 text-[oklch(0.65_0.02_85)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
      )}

      {/* Constructing indicator */}
      {isConstructing && (
        <div className="absolute -top-1 -right-1 z-10">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[oklch(0.65_0.05_145)] text-[10px] text-white shadow-md animate-spin" style={{ animationDuration: "3s" }}>
            🔨
          </span>
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

      {/* Active status dot — level-based color */}
      {!isLocked && (
        <div className="absolute top-3 right-3">
          <span
            className={`flex rounded-full ${
              isUpgrading
                ? "h-2.5 w-2.5 bg-[oklch(0.72_0.12_85)] animate-pulse"
                : levelTier === "world"
                  ? "h-2.5 w-2.5 bg-[oklch(0.72_0.12_85)] shadow-[oklch(0.72_0.12_85_/_0.5)] shadow-sm"
                  : levelTier === "civilization"
                    ? "h-2 w-2 bg-[oklch(0.65_0.05_145)] shadow-[oklch(0.65_0.05_145_/_0.5)] shadow-sm"
                    : "h-2 w-2 bg-[oklch(0.55_0.04_130)]"
            }`}
          />
        </div>
      )}

      {/* ── Building icon ── */}
      <span
        className={`
          ${tierConfig.iconScale} transition-transform duration-300
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
          ${isLocked ? "text-[oklch(0.6_0.02_85)]/60" : "text-[oklch(0.28_0.02_80)]"}
        `}
      >
        {displayName}
      </span>

      {/* ── Level badge ── */}
      <span
        className={`
          mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold
          ${isLocked
            ? "bg-[oklch(0.9_0.005_90)]/30 text-[oklch(0.6_0.02_85)]/60"
            : `${styles.accent} text-white bg-opacity-85`
          }
        `}
      >
        {levelLabel}
      </span>

      {/* ── Selection glow ring ── */}
      {isSelected && (
        <div className="absolute inset-0 rounded-xl ring-4 ring-[oklch(0.72_0.12_85)]/30 animate-warm-pulse pointer-events-none" />
      )}
    </button>
  );
}

export { REGION_STYLES };
