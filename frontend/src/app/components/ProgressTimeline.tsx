"use client";

import type { SkillGrowthPoint } from "@/types/progress";
import { useLocale } from "@/hooks/useLocale";

interface SkillDataset {
  name: string;
  points: SkillGrowthPoint[];
  color?: string;
}

interface ProgressTimelineProps {
  /** Single skill mode (backward-compatible) */
  points?: SkillGrowthPoint[];
  /** Multi-skill comparison mode */
  datasets?: SkillDataset[];
  skillName?: string;
  isLoading: boolean;
}

const DEFAULT_COLORS = [
  "oklch(0.55 0.08 160)",   // Sage/Primary
  "oklch(0.7 0.12 85)",     // Gold/Accent
  "oklch(0.55 0.1 150)",    // Moss/Success
  "oklch(0.65 0.12 45)",    // Terracotta/Warning
  "oklch(0.5 0.15 25)",     // Red-terracotta/Destructive
];

/**
 * Growth curve chart showing score progression over time.
 * Supports single-skill (points prop) and multi-skill comparison (datasets prop).
 */
export function ProgressTimeline({
  points,
  datasets,
  skillName,
  isLoading,
}: ProgressTimelineProps) {
  const { t } = useLocale();

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-1/3 rounded bg-secondary" />
        <div className="h-40 rounded-xl bg-secondary" />
      </div>
    );
  }

  // Normalize to datasets array
  const allDatasets: SkillDataset[] = datasets
    ? datasets
    : points && points.length > 0
    ? [{ name: skillName || "Skill", points, color: DEFAULT_COLORS[0] }]
    : [];

  if (allDatasets.length === 0 || allDatasets.every((ds) => ds.points.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground">{t("skills.noGrowthData")}</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          {t("skills.noGrowthDesc")}
        </p>
      </div>
    );
  }

  const w = 600;
  const h = 220;
  const pad = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;

  // Compute global min/max across all datasets
  const allScores = allDatasets.flatMap((ds) => ds.points.map((p) => p.score));
  const minScore = Math.max(0, Math.min(...allScores) - 10);
  const maxScore = Math.min(100, Math.max(...allScores) + 10);
  const scoreRange = maxScore - minScore || 1;

  const yScale = (score: number) =>
    pad.top + chartH - ((score - minScore) / scoreRange) * chartH;

  // Y-axis ticks
  const yTicks = 4;
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) =>
    Math.round(minScore + (scoreRange * i) / yTicks)
  );

  const hasMultiple = allDatasets.length > 1 && allDatasets.every((ds) => ds.points.length > 0);

  return (
    <div>
      {/* Header with legend */}
      {hasMultiple && (
        <div className="flex flex-wrap items-center gap-4 mb-3">
          <span className="text-sm font-semibold">{t("skills.growthComparison")}</span>
          <div className="flex flex-wrap gap-3">
            {allDatasets.map((ds, i) => {
              const color = ds.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
              return (
                <div key={ds.name} className="flex items-center gap-1.5 text-xs">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-muted-foreground">{ds.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!hasMultiple && skillName && (
        <h4 className="text-sm font-semibold mb-3">{t("skills.growthCurve", { name: skillName })}</h4>
      )}

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="w-full min-w-[300px]"
          role="img"
          aria-label={`Growth chart${skillName ? ` for ${skillName}` : ""}`}
        >
          <style>
            {`
              @keyframes line-draw {
                from { stroke-dashoffset: var(--line-len); }
                to { stroke-dashoffset: 0; }
              }
              @keyframes area-fade {
                from { opacity: 0; }
                to { opacity: 0.1; }
              }
              @keyframes dot-appear {
                from { r: 0; opacity: 0; }
                to { opacity: 1; }
              }
              .growth-line {
                animation: line-draw 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                stroke-dasharray: var(--line-len);
                stroke-dashoffset: var(--line-len);
              }
              .growth-area {
                animation: area-fade 0.8s ease-out 0.4s forwards;
                opacity: 0;
              }
              .growth-dot {
                animation: dot-appear 0.3s ease-out forwards;
                opacity: 0;
              }
            `}
          </style>

          {/* Grid lines */}
          {yLabels.map((val, i) => (
            <g key={`grid-${i}`}>
              <line
                x1={pad.left}
                y1={yScale(val)}
                x2={w - pad.right}
                y2={yScale(val)}
                stroke="oklch(0.9 0.008 100)"
                strokeWidth={1}
              />
              <text
                x={pad.left - 6}
                y={yScale(val) + 4}
                textAnchor="end"
                className="fill-muted-foreground text-[9px]"
              >
                {val}
              </text>
            </g>
          ))}

          {/* Draw each dataset's area + line + dots */}
          {allDatasets.map((ds, dsIdx) => {
            const color = ds.color || DEFAULT_COLORS[dsIdx % DEFAULT_COLORS.length];
            const pts = ds.points;

            if (pts.length === 0) return null;

            const xScale = (i: number) =>
              pad.left + (i / Math.max(pts.length - 1, 1)) * chartW;

            const linePath = pts
              .map((p, i) => `${i === 0 ? "M" : "L"}${xScale(i)},${yScale(p.score)}`)
              .join(" ");

            const areaPath = `${linePath} L${xScale(pts.length - 1)},${pad.top + chartH} L${xScale(0)},${pad.top + chartH} Z`;

            // Estimate line length for dash animation
            const lineLen = pts.length > 1
              ? pts.reduce((sum, p, i) => {
                  if (i === 0) return 0;
                  const dx = xScale(i) - xScale(i - 1);
                  const dy = yScale(p.score) - yScale(pts[i - 1].score);
                  return sum + Math.sqrt(dx * dx + dy * dy);
                }, 0)
              : 100;

            return (
              <g key={ds.name}>
                {/* Area fill */}
                <path
                  className="growth-area"
                  d={areaPath}
                  fill={color}
                  style={{ animationDelay: `${0.4 + dsIdx * 0.15}s` }}
                />

                {/* Line */}
                <path
                  className="growth-line"
                  d={linePath}
                  fill="none"
                  stroke={color}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    ["--line-len" as string]: lineLen,
                    animationDelay: `${dsIdx * 0.2}s`,
                  } as React.CSSProperties}
                />

                {/* Data points */}
                {pts.map((p, i) => (
                  <g key={`pt-${ds.name}-${i}`}>
                    <circle
                      className="growth-dot"
                      cx={xScale(i)}
                      cy={yScale(p.score)}
                      r={3}
                      fill={color}
                      stroke="white"
                      strokeWidth={2}
                      style={{
                        animationDelay: `${0.6 + dsIdx * 0.15 + i * 0.05}s`,
                      }}
                    />
                    {/* Date labels only for first dataset every ~5th point */}
                    {dsIdx === 0 &&
                      i % Math.ceil(pts.length / 5) === 0 && (
                        <text
                          x={xScale(i)}
                          y={h - 6}
                          textAnchor="middle"
                          className="fill-muted-foreground text-[9px]"
                        >
                          {new Date(p.date).toLocaleDateString("zh-CN", {
                            month: "numeric",
                            day: "numeric",
                          })}
                        </text>
                      )}
                  </g>
                ))}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
