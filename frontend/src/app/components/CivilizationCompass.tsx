"use client";

import Link from "next/link";
import { useLocale } from "@/hooks/useLocale";
import type { CivilizationDirection, TargetedBuilding } from "@/types/world";
import { CIVILIZATION_TIER_LABELS } from "@/types/world";

interface CivilizationCompassProps {
  direction: CivilizationDirection | null;
  isLoading: boolean;
  /** Compact size for dashboard widget */
  size?: "md" | "sm";
}

/** Region color mapping — matches BuildingTile region themes */
const REGION_COLORS: Record<string, string> = {
  "核心区": "oklch(0.55 0.08 160)",      // sage
  "Core Region": "oklch(0.55 0.08 160)",
  "创意区": "oklch(0.7 0.12 85)",        // gold
  "Creative Region": "oklch(0.7 0.12 85)",
  "逻辑区": "oklch(0.55 0.1 150)",       // moss
  "Logic Region": "oklch(0.55 0.1 150)",
  "实践区": "oklch(0.65 0.12 45)",       // terracotta
  "Practice Region": "oklch(0.65 0.12 45)",
  "综合区": "oklch(0.5 0.15 25)",        // soft red
  "Synthesis Region": "oklch(0.5 0.15 25)",
};

const DEFAULT_REGION_COLOR = "oklch(0.55 0.08 160)";

function regionColor(region: string): string {
  return REGION_COLORS[region] ?? DEFAULT_REGION_COLOR;
}

/**
 * CivilizationCompass — SVG circular visualization showing how
 * active learning paths are driving world development.
 *
 * Center: civilization tier badge
 * Ring: target buildings as compass nodes with level projections
 */
export function CivilizationCompass({
  direction,
  isLoading,
  size = "md",
}: CivilizationCompassProps) {
  const { locale } = useLocale();

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (
    !direction ||
    direction.active_paths.length === 0 ||
    direction.active_paths.every((p) => p.targeted_buildings.length === 0)
  ) {
    return (
      <div className="rounded-xl border-2 border-dashed border-border/60 bg-muted/10 p-5 text-center">
        <span className="text-3xl block mb-2">🧭</span>
        <p className="text-xs text-muted-foreground">
          {locale === "en"
            ? "Create a learning path to set your civilization's direction"
            : "创建学习路径来设定文明方向"}
        </p>
        <Link
          href="/paths"
          className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
        >
          {locale === "en" ? "Go to Learning Paths" : "前往学习路径"}
        </Link>
      </div>
    );
  }

  // Collect all targeted buildings across all active paths
  const allTargeted: (TargetedBuilding & { pathTitle: string })[] = [];
  for (const p of direction.active_paths) {
    for (const b of p.targeted_buildings) {
      allTargeted.push({ ...b, pathTitle: p.path_title });
    }
  }

  // Deduplicate by building_id, keep first path reference
  const seen = new Set<string>();
  const uniqueBuildings = allTargeted.filter((b) => {
    if (seen.has(b.building_id)) return false;
    seen.add(b.building_id);
    return true;
  });

  // Limit to 8 buildings for visual clarity
  const displayBuildings = uniqueBuildings.slice(0, 8);

  // SVG dimensions
  const isSm = size === "sm";
  const viewSize = isSm ? 200 : 320;
  const centerX = viewSize / 2;
  const centerY = viewSize / 2;
  const ringRadius = isSm ? 70 : 110;
  const nodeRadius = isSm ? 16 : 22;

  // Compute node positions around the ring
  const n = displayBuildings.length;
  const nodes = displayBuildings.map((b, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2; // start from top
    return {
      building: b,
      x: centerX + ringRadius * Math.cos(angle),
      y: centerY + ringRadius * Math.sin(angle),
      angle,
    };
  });

  // Tier display
  const activeTier = "SETTLER"; // Not available here — skip tier-specific display

  return (
    <div className="vintage-parchment-card p-4 transition-all duration-300 hover:shadow-lg">
      <div className="flex items-center gap-2 mb-3 border-b border-[oklch(0.88_0.02_90)] pb-2">
        <span className="text-lg animate-rhumb-spin inline-block">🧭</span>
        <h3 className="text-sm font-bold font-civ-serif text-[oklch(0.3_0.02_80)]">
          {locale === "en" ? "Civilization Compass" : "文明导航罗盘"}
        </h3>
        <span className="text-[10px] bg-[oklch(0.72_0.12_85_/_0.12)] border border-[oklch(0.72_0.12_85_/_0.25)] text-[oklch(0.35_0.12_85)] rounded-full px-2 py-0.5 font-bold ml-auto">
          {direction.active_paths.length}{" "}
          {locale === "en" ? "paths" : "条路径"}
        </span>
      </div>
 
      {/* SVG Compass */}
      <div className="flex justify-center relative py-2">
        <svg
          viewBox={`0 0 ${viewSize} ${viewSize}`}
          width={viewSize}
          height={viewSize}
          className="overflow-visible"
        >
          {/* Faint grid lines in background */}
          <circle
            cx={centerX}
            cy={centerY}
            r={ringRadius * 1.3}
            fill="none"
            stroke="oklch(0.7 0.12 85 / 0.04)"
            strokeWidth={1}
          />

          {/* Wind Rose group - ancient marine chart styling */}
          <g className="origin-center transition-transform duration-1000 ease-out hover:rotate-12">
            {/* Degree ticks outer circle */}
            <circle
              cx={centerX}
              cy={centerY}
              r={ringRadius + 8}
              fill="none"
              stroke="oklch(0.7 0.12 85 / 0.2)"
              strokeWidth={2}
              strokeDasharray="1 4"
            />
            {/* Faint inner guides */}
            <circle
              cx={centerX}
              cy={centerY}
              r={ringRadius}
              fill="none"
              stroke="oklch(0.7 0.12 85 / 0.08)"
              strokeWidth={1}
            />
            <circle
              cx={centerX}
              cy={centerY}
              r={ringRadius * 0.5}
              fill="none"
              stroke="oklch(0.7 0.12 85 / 0.08)"
              strokeWidth={0.5}
              strokeDasharray="2 2"
            />
            {/* Cardinal cross lines */}
            <line
              x1={centerX}
              y1={centerY - ringRadius - 15}
              x2={centerX}
              y2={centerY + ringRadius + 15}
              stroke="oklch(0.7 0.12 85 / 0.15)"
              strokeWidth={1}
            />
            <line
              x1={centerX - ringRadius - 15}
              y1={centerY}
              x2={centerX + ringRadius + 15}
              y2={centerY}
              stroke="oklch(0.7 0.12 85 / 0.15)"
              strokeWidth={1}
            />
            {/* Diagonal cross lines */}
            <line
              x1={centerX - ringRadius * 0.7}
              y1={centerY - ringRadius * 0.7}
              x2={centerX + ringRadius * 0.7}
              y2={centerY + ringRadius * 0.7}
              stroke="oklch(0.7 0.12 85 / 0.1)"
              strokeWidth={0.5}
              strokeDasharray="2 2"
            />
            <line
              x1={centerX + ringRadius * 0.7}
              y1={centerY - ringRadius * 0.7}
              x2={centerX - ringRadius * 0.7}
              y2={centerY + ringRadius * 0.7}
              stroke="oklch(0.7 0.12 85 / 0.1)"
              strokeWidth={0.5}
              strokeDasharray="2 2"
            />
            {/* Wind rose star points (SVG path polygons) */}
            {/* North point */}
            <polygon
              points={`${centerX},${centerY} ${centerX - 5},${centerY} ${centerX},${centerY - ringRadius - 5}`}
              fill="oklch(0.7 0.12 85 / 0.18)"
            />
            <polygon
              points={`${centerX},${centerY} ${centerX + 5},${centerY} ${centerX},${centerY - ringRadius - 5}`}
              fill="oklch(0.7 0.12 85 / 0.08)"
            />
            {/* South point */}
            <polygon
              points={`${centerX},${centerY} ${centerX - 5},${centerY} ${centerX},${centerY + ringRadius + 5}`}
              fill="oklch(0.7 0.12 85 / 0.08)"
            />
            <polygon
              points={`${centerX},${centerY} ${centerX + 5},${centerY} ${centerX},${centerY + ringRadius + 5}`}
              fill="oklch(0.7 0.12 85 / 0.18)"
            />
            {/* East point */}
            <polygon
              points={`${centerX},${centerY} ${centerX},${centerY - 5} ${centerX + ringRadius + 5},${centerY}`}
              fill="oklch(0.7 0.12 85 / 0.18)"
            />
            <polygon
              points={`${centerX},${centerY} ${centerX},${centerY + 5} ${centerX + ringRadius + 5},${centerY}`}
              fill="oklch(0.7 0.12 85 / 0.08)"
            />
            {/* West point */}
            <polygon
              points={`${centerX},${centerY} ${centerX},${centerY - 5} ${centerX - ringRadius - 5},${centerY}`}
              fill="oklch(0.7 0.12 85 / 0.08)"
            />
            <polygon
              points={`${centerX},${centerY} ${centerX},${centerY + 5} ${centerX - ringRadius - 5},${centerY}`}
              fill="oklch(0.7 0.12 85 / 0.18)"
            />
            
            {/* Direction labels (N, S, E, W) */}
            <text x={centerX} y={centerY - ringRadius - 8} textAnchor="middle" fontSize={isSm ? 8 : 10} fontWeight="bold" fill="oklch(0.7 0.12 85 / 0.8)">N</text>
            <text x={centerX} y={centerY + ringRadius + 14} textAnchor="middle" fontSize={isSm ? 8 : 10} fontWeight="bold" fill="oklch(0.7 0.12 85 / 0.6)">S</text>
            <text x={centerX + ringRadius + 10} y={centerY + 3} textAnchor="middle" fontSize={isSm ? 8 : 10} fontWeight="bold" fill="oklch(0.7 0.12 85 / 0.6)">E</text>
            <text x={centerX - ringRadius - 10} y={centerY + 3} textAnchor="middle" fontSize={isSm ? 8 : 10} fontWeight="bold" fill="oklch(0.7 0.12 85 / 0.6)">W</text>
          </g>

          {/* Connection lines from center to each node */}
          {nodes.map((node, i) => {
            const color = regionColor(node.building.region);
            return (
              <line
                key={`line-${i}`}
                x1={centerX}
                y1={centerY}
                x2={node.x}
                y2={node.y}
                stroke={color}
                strokeWidth={1}
                strokeDasharray="3 3"
                opacity={0.35}
              />
            );
          })}

          {/* Center badge */}
          <circle
            cx={centerX}
            cy={centerY}
            r={isSm ? 24 : 32}
            fill="oklch(0.99 0.003 95)"
            stroke="oklch(0.7 0.12 85 / 0.4)"
            strokeWidth={1.5}
            className="shadow-sm animate-glow-pulse"
          />
          <text
            x={centerX}
            y={centerY - (isSm ? 4 : 6)}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={isSm ? 16 : 22}
          >
            🧭
          </text>
          <text
            x={centerX}
            y={centerY + (isSm ? 14 : 20)}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={isSm ? 8 : 10}
            fill="oklch(0.5 0.01 90)"
            fontWeight={600}
          >
            {locale === "en" ? "Direction" : "方向"}
          </text>

          {/* Building nodes */}
          {nodes.map((node, i) => {
            const b = node.building;
            const color = regionColor(b.region);
            const hasGrowth = b.projected_level > b.current_level;
            const displayName =
              locale === "en" && b.building_name_en
                ? b.building_name_en
                : b.building_name;

            return (
              <g key={`node-${i}`} className="group cursor-pointer">
                {/* Pulsing ring glow for buildings with projected growth */}
                {hasGrowth && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={nodeRadius + 6}
                    fill="none"
                    stroke={color}
                    strokeWidth={1}
                    opacity={0.2}
                    className="animate-warm-pulse"
                  />
                )}

                {/* Node background */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={nodeRadius}
                  fill="oklch(0.99 0.003 95)"
                  stroke={color}
                  strokeWidth={1.5}
                  className="transition-all duration-300"
                />
                {/* Dark mode fill */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={nodeRadius}
                  fill="oklch(0.22 0.008 85)"
                  className="hidden dark:inline"
                />

                {/* Building icon */}
                <text
                  x={node.x}
                  y={node.y - (isSm ? 2 : 3)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={isSm ? 12 : 16}
                >
                  {b.building_icon}
                </text>

                {/* Level badge */}
                <circle
                  cx={node.x + nodeRadius * 0.7}
                  cy={node.y - nodeRadius * 0.7}
                  r={isSm ? 7 : 9}
                  fill={color}
                  opacity={0.9}
                />
                <text
                  x={node.x + nodeRadius * 0.7}
                  y={node.y - nodeRadius * 0.7}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={isSm ? 7 : 9}
                  fill="white"
                  fontWeight={700}
                >
                  {b.current_level}
                </text>

                {/* Projected level arrow (if growth expected) */}
                {hasGrowth && (
                  <>
                    <text
                      x={node.x + nodeRadius * 1.3}
                      y={node.y - nodeRadius * 0.7}
                      textAnchor="start"
                      dominantBaseline="middle"
                      fontSize={isSm ? 8 : 10}
                      fill={color}
                      fontWeight={700}
                    >
                      →{b.projected_level}
                    </text>
                  </>
                )}

                {/* Building name label */}
                <text
                  x={node.x}
                  y={node.y + nodeRadius + (isSm ? 12 : 14)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={isSm ? 8 : 10}
                  fill="oklch(0.45 0.01 90)"
                  fontWeight={500}
                  className="transition-colors"
                >
                  {displayName.length > (isSm ? 8 : 10)
                    ? displayName.slice(0, isSm ? 7 : 9) + "…"
                    : displayName}
                </text>

                {/* Hover tooltip circle (invisible, for hit area) */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={nodeRadius + 4}
                  fill="transparent"
                />
                <title>
                  {displayName} Lv.{b.current_level}
                  {hasGrowth ? ` → Lv.${b.projected_level}` : ""}
                  {"\n"}{b.pathTitle}
                </title>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Summary text */}
      <p className="text-xs text-muted-foreground text-center mt-3 leading-relaxed">
        {direction.summary}
      </p>

      {direction.suggested_focus && (
        <p className="text-[11px] text-primary text-center mt-1 font-medium">
          💡 {direction.suggested_focus}
        </p>
      )}
    </div>
  );
}
