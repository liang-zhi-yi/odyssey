"use client";

import type { SkillGrowthPoint } from "@/types/progress";

interface ProgressTimelineProps {
  points: SkillGrowthPoint[];
  skillName?: string;
  isLoading: boolean;
}

/**
 * Growth curve chart showing score progression over time.
 * Renders an SVG line chart from SkillGrowthPoint data.
 */
export function ProgressTimeline({
  points,
  skillName,
  isLoading,
}: ProgressTimelineProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-1/3 rounded bg-secondary" />
        <div className="h-40 rounded-xl bg-secondary" />
      </div>
    );
  }

  if (points.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground">暂无成长数据</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          完成Quest评估后将生成成长曲线
        </p>
      </div>
    );
  }

  const w = 600;
  const h = 200;
  const pad = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;

  const scores = points.map((p) => p.score);
  const minScore = Math.max(0, Math.min(...scores) - 10);
  const maxScore = Math.min(100, Math.max(...scores) + 10);
  const scoreRange = maxScore - minScore || 1;

  const xScale = (i: number) => pad.left + (i / Math.max(points.length - 1, 1)) * chartW;
  const yScale = (score: number) =>
    pad.top + chartH - ((score - minScore) / scoreRange) * chartH;

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${xScale(i)},${yScale(p.score)}`)
    .join(" ");

  const areaPath = `${linePath} L${xScale(points.length - 1)},${pad.top + chartH} L${xScale(0)},${pad.top + chartH} Z`;

  // Y-axis ticks
  const yTicks = 4;
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) =>
    Math.round(minScore + (scoreRange * i) / yTicks)
  );

  return (
    <div>
      {skillName && (
        <h4 className="text-sm font-semibold mb-3">{skillName} 成长曲线</h4>
      )}
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="w-full min-w-[300px]"
          role="img"
          aria-label={`Growth chart${skillName ? ` for ${skillName}` : ""}`}
        >
          {/* Grid lines */}
          {yLabels.map((val, i) => (
            <g key={`grid-${i}`}>
              <line
                x1={pad.left}
                y1={yScale(val)}
                x2={w - pad.right}
                y2={yScale(val)}
                stroke="oklch(0.922 0 0)"
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

          {/* Area fill */}
          <path d={areaPath} fill="oklch(0.55 0.2 260 / 0.1)" />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke="oklch(0.55 0.2 260)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {points.map((p, i) => (
            <g key={`pt-${i}`}>
              <circle
                cx={xScale(i)}
                cy={yScale(p.score)}
                r={3}
                fill="oklch(0.55 0.2 260)"
                stroke="white"
                strokeWidth={2}
              />
              {/* Date label every few points */}
              {i % Math.ceil(points.length / 5) === 0 && (
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
        </svg>
      </div>
    </div>
  );
}
