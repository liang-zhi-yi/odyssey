"use client";

/**
 * Civilization Badge System — SVG geometric emblems for each civilization type.
 * Replaces emoji with unique rune-like icons inspired by fantasy tech trees.
 *
 * Design language: Geometric, symmetric, with inner glow and ornamental feel.
 * Each badge is a self-contained SVG with gradient + stroke styling.
 */

export type CivilizationType =
  | "AI"
  | "ENGINEERING"
  | "KNOWLEDGE"
  | "BUSINESS"
  | "DESIGN"
  | "SOCIAL"
  | "SCIENCE"
  | "LANGUAGE"
  | "HEALTH"
  | "FINANCE";

interface BadgeProps {
  type: CivilizationType;
  size?: number;
  className?: string;
  /** Add a soft glow effect */
  glow?: boolean;
}

/** Color per civilization type (OKLCH) */
const CIV_COLORS: Record<CivilizationType, { stroke: string; fill: string; glow: string }> = {
  AI:           { stroke: "oklch(0.62 0.15 270)",  fill: "oklch(0.45 0.10 270)",  glow: "oklch(0.62 0.15 270 / 0.25)" },
  ENGINEERING:  { stroke: "oklch(0.60 0.10 55)",   fill: "oklch(0.45 0.08 55)",   glow: "oklch(0.60 0.10 55 / 0.25)" },
  KNOWLEDGE:    { stroke: "oklch(0.55 0.12 145)",  fill: "oklch(0.42 0.09 145)",  glow: "oklch(0.55 0.12 145 / 0.25)" },
  BUSINESS:     { stroke: "oklch(0.65 0.13 40)",   fill: "oklch(0.48 0.10 40)",   glow: "oklch(0.65 0.13 40 / 0.25)" },
  DESIGN:       { stroke: "oklch(0.60 0.14 320)",  fill: "oklch(0.45 0.10 320)",  glow: "oklch(0.60 0.14 320 / 0.25)" },
  SOCIAL:       { stroke: "oklch(0.58 0.10 200)",  fill: "oklch(0.42 0.08 200)",  glow: "oklch(0.58 0.10 200 / 0.25)" },
  SCIENCE:      { stroke: "oklch(0.60 0.13 230)",  fill: "oklch(0.45 0.10 230)",  glow: "oklch(0.60 0.13 230 / 0.25)" },
  LANGUAGE:     { stroke: "oklch(0.58 0.11 90)",   fill: "oklch(0.42 0.08 90)",   glow: "oklch(0.58 0.11 90 / 0.25)" },
  HEALTH:       { stroke: "oklch(0.60 0.14 15)",   fill: "oklch(0.45 0.10 15)",   glow: "oklch(0.60 0.14 15 / 0.25)" },
  FINANCE:      { stroke: "oklch(0.62 0.12 140)",  fill: "oklch(0.46 0.09 140)",  glow: "oklch(0.62 0.12 140 / 0.25)" },
};

/** Unique SVG path for each civilization type — geometric rune-like emblems */
function CivilizationPath({ type }: { type: CivilizationType }) {
  const paths: Record<CivilizationType, JSX.Element> = {
    AI: (
      <>
        {/* Neural network nodes + connections */}
        <circle cx="12" cy="6" r="2" />
        <circle cx="6" cy="14" r="2" />
        <circle cx="18" cy="14" r="2" />
        <circle cx="12" cy="18" r="2" />
        <line x1="12" y1="8" x2="6" y2="12" />
        <line x1="12" y1="8" x2="18" y2="12" />
        <line x1="6" y1="16" x2="12" y2="16" />
        <line x1="18" y1="16" x2="12" y2="16" />
        <line x1="12" y1="16" x2="12" y2="16" />
      </>
    ),
    ENGINEERING: (
      <>
        {/* Gear/cog with center hole */}
        <circle cx="12" cy="12" r="4" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const x1 = 12 + Math.cos(rad) * 5;
          const y1 = 12 + Math.sin(rad) * 5;
          const x2 = 12 + Math.cos(rad) * 7.5;
          const y2 = 12 + Math.sin(rad) * 7.5;
          return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="2" />;
        })}
      </>
    ),
    KNOWLEDGE: (
      <>
        {/* Open book with pages */}
        <path d="M12 5 C 9 3, 5 3, 3 5 L 3 17 C 5 15, 9 15, 12 17 C 15 15, 19 15, 21 17 L 21 5 C 19 3, 15 3, 12 5 Z" />
        <line x1="12" y1="5" x2="12" y2="17" />
        <line x1="5" y1="8" x2="10" y2="7" strokeWidth="0.8" opacity="0.6" />
        <line x1="5" y1="11" x2="10" y2="10" strokeWidth="0.8" opacity="0.6" />
        <line x1="14" y1="7" x2="19" y2="8" strokeWidth="0.8" opacity="0.6" />
        <line x1="14" y1="10" x2="19" y2="11" strokeWidth="0.8" opacity="0.6" />
      </>
    ),
    BUSINESS: (
      <>
        {/* Scales of trade */}
        <line x1="12" y1="4" x2="12" y2="20" />
        <line x1="6" y1="8" x2="18" y2="8" />
        <path d="M 4 8 L 6 13 L 8 13 L 6 8 Z" fill="currentColor" stroke="none" opacity="0.4" />
        <path d="M 16 8 L 18 13 L 20 13 L 18 8 Z" fill="currentColor" stroke="none" opacity="0.4" />
        <circle cx="12" cy="5" r="1.5" />
        <line x1="10" y1="20" x2="14" y2="20" strokeWidth="2" />
      </>
    ),
    DESIGN: (
      <>
        {/* Compass / design spiral */}
        <circle cx="12" cy="12" r="8" strokeWidth="0.6" opacity="0.4" />
        <path d="M12 4 L 12 20" strokeWidth="0.6" opacity="0.4" />
        <path d="M4 12 L 20 12" strokeWidth="0.6" opacity="0.4" />
        <path d="M12 6 L 16 12 L 12 18 L 8 12 Z" />
        <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
      </>
    ),
    SOCIAL: (
      <>
        {/* Interconnected circles */}
        <circle cx="8" cy="9" r="3" />
        <circle cx="16" cy="9" r="3" />
        <circle cx="12" cy="16" r="3" />
        <line x1="10" y1="11" x2="10.5" y2="13.5" strokeWidth="1.2" />
        <line x1="14" y1="11" x2="13.5" y2="13.5" strokeWidth="1.2" />
        <line x1="11" y1="9" x2="13" y2="9" strokeWidth="1.2" opacity="0.5" />
      </>
    ),
    SCIENCE: (
      <>
        {/* Atom orbits */}
        <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
        <ellipse cx="12" cy="12" rx="8" ry="3" />
        <ellipse cx="12" cy="12" rx="8" ry="3" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="8" ry="3" transform="rotate(120 12 12)" />
      </>
    ),
    LANGUAGE: (
      <>
        {/* Rune characters / speech */}
        <path d="M4 6 L 12 4 L 20 6 L 20 16 L 12 18 L 4 16 Z" strokeWidth="0.8" opacity="0.5" />
        <path d="M8 9 L 8 13 M 8 11 L 11 11 M 11 9 L 11 13" />
        <path d="M14 9 L 14 13 M 14 9 L 16 9 M 14 11 L 15.5 11" strokeWidth="0.8" />
      </>
    ),
    HEALTH: (
      <>
        {/* Heart pulse line */}
        <path d="M3 12 L 8 12 L 10 7 L 13 17 L 15 12 L 21 12" strokeWidth="2" />
        <path d="M8 12 L 8 10 M 15 12 L 15 14" strokeWidth="0.8" opacity="0.4" />
      </>
    ),
    FINANCE: (
      <>
        {/* Coin stack / ledger */}
        <ellipse cx="12" cy="6" rx="6" ry="2" />
        <path d="M6 6 L 6 10 C 6 11.1, 8.5 12, 12 12 C 15.5 12, 18 11.1, 18 10 L 18 6" />
        <path d="M6 10 L 6 14 C 6 15.1, 8.5 16, 12 16 C 15.5 16, 18 15.1, 18 14 L 18 10" opacity="0.6" />
        <path d="M6 14 L 6 18 C 6 19.1, 8.5 20, 12 20 C 15.5 20, 18 19.1, 18 18 L 18 14" opacity="0.4" />
      </>
    ),
  };
  return paths[type];
}

export function CivilizationBadge({ type, size = 28, className = "", glow = false }: BadgeProps) {
  const colors = CIV_COLORS[type] || CIV_COLORS.KNOWLEDGE;
  const gid = `civ-grad-${type}`;

  return (
    <span
      className={`inline-flex items-center justify-center ${glow ? "civ-badge-glow" : ""} ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={colors.stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          filter: glow ? `drop-shadow(0 0 6px ${colors.glow})` : undefined,
        }}
      >
        <defs>
          <radialGradient id={gid} cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor={colors.fill} stopOpacity="0.15" />
            <stop offset="100%" stopColor={colors.fill} stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Background aura */}
        <circle cx="12" cy="12" r="11" fill={`url(#${gid})`} stroke="none" />
        {/* Ornamental ring */}
        <circle
          cx="12" cy="12" r="9.5"
          stroke={colors.stroke}
          strokeWidth="0.6"
          opacity="0.3"
          strokeDasharray="2 3"
        />
        {/* Main emblem */}
        <CivilizationPath type={type} />
      </svg>
    </span>
  );
}

/** Civilization display metadata */
export const CIVILIZATION_META: Record<CivilizationType, { zh: string; en: string }> = {
  AI:          { zh: "AI文明",     en: "AI Civilization" },
  ENGINEERING: { zh: "工程文明",    en: "Engineering Civ" },
  KNOWLEDGE:   { zh: "知识文明",    en: "Knowledge Civ" },
  BUSINESS:    { zh: "商业文明",    en: "Business Civ" },
  DESIGN:      { zh: "设计文明",    en: "Design Civ" },
  SOCIAL:      { zh: "社会文明",    en: "Social Civ" },
  SCIENCE:     { zh: "科学文明",    en: "Science Civ" },
  LANGUAGE:    { zh: "语言文明",    en: "Language Civ" },
  HEALTH:      { zh: "健康文明",    en: "Health Civ" },
  FINANCE:     { zh: "金融文明",    en: "Finance Civ" },
};
