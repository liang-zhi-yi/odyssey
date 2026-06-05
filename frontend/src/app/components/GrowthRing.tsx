"use client";

interface GrowthRingProps {
  /** Value 0-100 */
  value: number;
  size?: "sm" | "md" | "lg";
  /** Override ring color (defaults to value-based mastery color) */
  color?: string;
  /** Show percentage label in center */
  showLabel?: boolean;
}

const SIZES: Record<string, number> = { sm: 28, md: 36, lg: 48 };
const STROKE_WIDTH: Record<string, number> = { sm: 2.5, md: 3, lg: 3.5 };

/**
 * Organic growth ring — a circular progress indicator that replaces
 * traditional horizontal progress bars. The fill color intensifies
 * with mastery level: light sage → deep sage → warm gold.
 */
export function GrowthRing({ value, size = "md", color, showLabel = false }: GrowthRingProps) {
  const px = SIZES[size];
  const sw = STROKE_WIDTH[size];
  const radius = (px - sw) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

  const fillColor = color || masteryColor(value);
  const bgColor = "oklch(0.9 0.008 100)";

  const fontSize = size === "lg" ? "text-[10px]" : size === "md" ? "text-[8px]" : "text-[7px]";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: px, height: px }}>
      <svg
        className="h-full w-full -rotate-90"
        viewBox={`0 0 ${px} ${px}`}
        aria-label={`${value}%`}
      >
        {/* Background ring */}
        <circle
          cx={px / 2}
          cy={px / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={sw}
        />
        {/* Progress arc */}
        <circle
          cx={px / 2}
          cy={px / 2}
          r={radius}
          fill="none"
          stroke={fillColor}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {showLabel && (
        <span className={`absolute ${fontSize} font-bold tabular-nums text-foreground`}>
          {value}
        </span>
      )}
    </div>
  );
}

/** Mastery color — intensity grows with score. */
export function masteryColor(score: number): string {
  if (score >= 80) return "oklch(0.7 0.12 85)";    // Gold — master
  if (score >= 60) return "oklch(0.5 0.1 150)";    // Deep sage — proficient
  if (score >= 40) return "oklch(0.55 0.08 160)";  // Sage — developing
  if (score >= 20) return "oklch(0.6 0.06 155)";   // Light sage — beginner
  return "oklch(0.75 0.02 100)";                    // Warm light — just started
}
