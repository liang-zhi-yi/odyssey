"use client";

import { useLocale } from "@/hooks/useLocale";

interface GrowthPhaseIndicatorProps {
  progressPct: number;
  size?: "sm" | "md" | "lg";
}

/**
 * Growth phase indicator — a circular badge showing the user's current
 * growth stage based on overall progress percentage.
 *
 * Stages:
 *   "Settling In"     (0-20%)
 *   "Growth Spurt"    (21-40%)
 *   "Building Roots"  (41-60%)
 *   "Expanding Reach" (61-80%)
 *   "Mastery Forged"  (81-100%)
 */
export function GrowthPhaseIndicator({
  progressPct,
  size = "md",
}: GrowthPhaseIndicatorProps) {
  const { t } = useLocale();

  const phase = getPhase(progressPct);
  const phaseKey = `dashboard.phase.${phase.key}`;

  const sizes: Record<string, { container: string; ring: number; text: string }> = {
    sm: { container: "h-16 w-16", ring: 50, text: "text-[10px]" },
    md: { container: "h-24 w-24", ring: 72, text: "text-xs" },
    lg: { container: "h-32 w-32", ring: 96, text: "text-sm" },
  };

  const { container, ring, text } = sizes[size];
  const radius = (ring - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progressPct / 100) * circumference;

  return (
    <div className="relative inline-flex flex-col items-center gap-2">
      {/* Phase ring */}
      <div className={`relative ${container} flex-shrink-0`}>
        <svg
          className="h-full w-full -rotate-90"
          viewBox={`0 0 ${ring} ${ring}`}
        >
          {/* Background ring */}
          <circle
            cx={ring / 2}
            cy={ring / 2}
            r={radius}
            fill="none"
            stroke="oklch(0.95 0.005 90)"
            strokeWidth="4"
          />
          {/* Progress arc with warm gold gradient */}
          <circle
            cx={ring / 2}
            cy={ring / 2}
            r={radius}
            fill="none"
            stroke="oklch(0.7 0.12 85)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-bold leading-none tabular-nums ${size === "lg" ? "text-lg" : size === "md" ? "text-base" : "text-xs"}`}>
            {progressPct}%
          </span>
          {size !== "sm" && (
            <span className={`${text} mt-0.5 text-muted-foreground`}>
              {t(phaseKey) || phase.label}
            </span>
          )}
        </div>
      </div>
      {size === "sm" && (
        <span className={`${text} text-muted-foreground text-center leading-tight`}>
          {t(phaseKey) || phase.label}
        </span>
      )}
    </div>
  );
}

function getPhase(pct: number): { key: string; label: string } {
  if (pct <= 20) return { key: "settling", label: "Settling In" };
  if (pct <= 40) return { key: "sprouting", label: "Growth Spurt" };
  if (pct <= 60) return { key: "building", label: "Building Roots" };
  if (pct <= 80) return { key: "expanding", label: "Expanding Reach" };
  return { key: "mastery", label: "Mastery Forged" };
}
