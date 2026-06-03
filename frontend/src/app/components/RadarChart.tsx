"use client";

import { DIMENSION_LABELS, type DimensionScores } from "@/types/assessment";

interface RadarChartProps {
  scores: DimensionScores;
  size?: number;
  showLabels?: boolean;
}

const DIMENSIONS: (keyof DimensionScores)[] = [
  "knowledge",
  "reasoning",
  "application",
  "creation",
];

/**
 * SVG-based 4-dimension radar chart for capability visualization.
 * Each axis represents one of: Knowledge, Reasoning, Application, Creation.
 * Scores are expected to be in 0–100 range.
 */
export function RadarChart({ scores, size = 200, showLabels = true }: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.38;
  const levels = 5;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="overflow-visible"
      role="img"
      aria-label="Capability radar chart"
    >
      {/* Grid rings */}
      {Array.from({ length: levels }, (_, i) => {
        const r = (radius * (i + 1)) / levels;
        const ringPoints = DIMENSIONS.map((_, j) => {
          const angle = (Math.PI * 2 * j) / 4 - Math.PI / 2;
          return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
        }).join(" ");
        return (
          <polygon
            key={`ring-${i}`}
            points={ringPoints}
            fill="none"
            stroke="oklch(0.922 0 0)"
            strokeWidth={1}
          />
        );
      })}

      {/* Axis lines */}
      {DIMENSIONS.map((_, i) => {
        const angle = (Math.PI * 2 * i) / 4 - Math.PI / 2;
        return (
          <line
            key={`axis-${i}`}
            x1={cx}
            y1={cy}
            x2={cx + radius * Math.cos(angle)}
            y2={cy + radius * Math.sin(angle)}
            stroke="oklch(0.922 0 0)"
            strokeWidth={1}
          />
        );
      })}

      {/* Score data polygon */}
      <polygon
        points={DIMENSIONS.map((_, i) => {
          const angle = (Math.PI * 2 * i) / 4 - Math.PI / 2;
          const r = (scores[DIMENSIONS[i]] / 100) * radius;
          return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
        }).join(" ")}
        fill="oklch(0.55 0.2 260 / 0.25)"
        stroke="oklch(0.55 0.2 260)"
        strokeWidth={2}
      />

      {/* Data points */}
      {DIMENSIONS.map((dim) => {
        const i = DIMENSIONS.indexOf(dim);
        const angle = (Math.PI * 2 * i) / 4 - Math.PI / 2;
        const r = (scores[dim] / 100) * radius;
        return (
          <circle
            key={`dot-${dim}`}
            cx={cx + r * Math.cos(angle)}
            cy={cy + r * Math.sin(angle)}
            r={4}
            fill="oklch(0.55 0.2 260)"
            stroke="white"
            strokeWidth={2}
          />
        );
      })}

      {/* Axis labels */}
      {showLabels &&
        DIMENSIONS.map((dim, i) => {
          const angle = (Math.PI * 2 * i) / 4 - Math.PI / 2;
          const labelR = radius + 20;
          const x = cx + labelR * Math.cos(angle);
          const y = cy + labelR * Math.sin(angle);
          return (
            <text
              key={`label-${dim}`}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-foreground text-[11px] font-medium"
            >
              {DIMENSION_LABELS[dim]}
            </text>
          );
        })}

      {/* Score values at points */}
      {DIMENSIONS.map((dim, i) => {
        const angle = (Math.PI * 2 * i) / 4 - Math.PI / 2;
        const r = (scores[dim] / 100) * radius;
        const x = cx + (r + 13) * Math.cos(angle);
        const y = cy + (r + 13) * Math.sin(angle);
        return (
          <text
            key={`score-${dim}`}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-foreground text-[10px] font-bold"
          >
            {scores[dim]}
          </text>
        );
      })}
    </svg>
  );
}
