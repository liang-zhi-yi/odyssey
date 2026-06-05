"use client";

import { DIMENSION_LABELS, type DimensionScores } from "@/types/assessment";
import { useLocale } from "@/hooks/useLocale";

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
 * Features animated polygon fill-in and staggered data-point reveal.
 */
export function RadarChart({ scores, size = 200, showLabels = true }: RadarChartProps) {
  const { t } = useLocale();
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
      <style>
        {`
          @keyframes radar-fill-in {
            0% { transform: scale(0); opacity: 0; }
            60% { transform: scale(1.08); opacity: 0.9; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes radar-dot-pop {
            0% { r: 0; opacity: 0; }
            70% { r: 5; opacity: 0.8; }
            100% { r: 4; opacity: 1; }
          }
          @keyframes radar-score-fade {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
          .radar-polygon {
            transform-origin: ${cx}px ${cy}px;
            animation: radar-fill-in 600ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          .radar-dot {
            opacity: 0;
            animation: radar-dot-pop 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          .radar-score-label {
            opacity: 0;
            animation: radar-score-fade 300ms ease-out forwards;
          }
        `}
      </style>

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
            stroke="oklch(0.9 0.008 100)"
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
            stroke="oklch(0.9 0.008 100)"
            strokeWidth={1}
          />
        );
      })}

      {/* Score data polygon with animation */}
      <polygon
        className="radar-polygon"
        points={DIMENSIONS.map((_, i) => {
          const angle = (Math.PI * 2 * i) / 4 - Math.PI / 2;
          const r = (scores[DIMENSIONS[i]] / 100) * radius;
          return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
        }).join(" ")}
        fill="oklch(0.55 0.08 160 / 0.25)"
        stroke="oklch(0.55 0.08 160)"
        strokeWidth={2}
      />

      {/* Data points with staggered animation */}
      {DIMENSIONS.map((dim, i) => {
        const angle = (Math.PI * 2 * i) / 4 - Math.PI / 2;
        const r = (scores[dim] / 100) * radius;
        return (
          <circle
            key={`dot-${dim}`}
            className="radar-dot"
            cx={cx + r * Math.cos(angle)}
            cy={cy + r * Math.sin(angle)}
            r={4}
            fill="oklch(0.55 0.08 160)"
            stroke="white"
            strokeWidth={2}
            style={{ animationDelay: `${500 + i * 100}ms` }}
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
              {t(`skills.dimensions.${dim}`) || DIMENSION_LABELS[dim]}
            </text>
          );
        })}

      {/* Score values at points with staggered animation */}
      {DIMENSIONS.map((dim, i) => {
        const angle = (Math.PI * 2 * i) / 4 - Math.PI / 2;
        const r = (scores[dim] / 100) * radius;
        const x = cx + (r + 13) * Math.cos(angle);
        const y = cy + (r + 13) * Math.sin(angle);
        return (
          <text
            key={`score-${dim}`}
            className="radar-score-label fill-foreground text-[10px] font-bold"
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ animationDelay: `${600 + i * 100}ms` }}
          >
            {scores[dim]}
          </text>
        );
      })}
    </svg>
  );
}
