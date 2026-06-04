"use client";
import type { SkillGrowthPoint } from "@/types/progress";

interface SparklineProps {
  points: SkillGrowthPoint[];
  width?: number;
  height?: number;
  className?: string;
}

export function Sparkline({ points, width = 80, height = 24, className = "" }: SparklineProps) {
  if (points.length < 2) return null;

  const scores = points.map(p => p.score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min || 1; // avoid div by 0

  const padding = 2;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;

  const xStep = chartW / (points.length - 1);

  const pathD = points
    .map((p, i) => {
      const x = padding + i * xStep;
      const y = padding + chartH - ((p.score - min) / range) * chartH;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  // Determine trend direction
  const firstScore = points[0].score;
  const lastScore = points[points.length - 1].score;
  const delta = lastScore - firstScore;
  const color = delta > 3 ? "var(--success, #22c55e)" : delta < -3 ? "var(--destructive, #ef4444)" : "var(--muted-foreground, #6b7280)";

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`inline-block ${className}`}
      aria-label={`Trend: ${delta > 0 ? "+" : ""}${delta}`}
    >
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
