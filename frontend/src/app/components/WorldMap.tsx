"use client";

import { useMemo } from "react";
import { BuildingTile } from "./BuildingTile";
import { CompoundBuildingTile } from "./CompoundBuildingTile";
import type { UserBuilding, UserCompoundBuilding } from "@/types/world";

interface WorldMapProps {
  buildings: UserBuilding[];
  compoundBuildings?: UserCompoundBuilding[];
  selectedBuildingId?: string;
  onSelectBuilding: (building: UserBuilding | UserCompoundBuilding) => void;
}

/**
 * Game-style isometric world map.
 *
 * Features:
 * - Terrain tiles with grass/parchment texture
 * - Subtle grid overlay
 * - Connection lines between nearby buildings
 * - Decorative ambient elements
 */
export function WorldMap({
  buildings,
  compoundBuildings = [],
  selectedBuildingId,
  onSelectBuilding,
}: WorldMapProps) {
  const TILE_W = 150;
  const TILE_H = 86;

  // Compute isometric positions
  const allPositions = useMemo(() => {
    const positions: {
      building: UserBuilding | UserCompoundBuilding;
      sx: number;
      sy: number;
      isCompound: boolean;
      gx: number;
      gy: number;
    }[] = [];

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    for (const b of buildings) {
      const gx = b.template?.position_x ?? 0;
      const gy = b.template?.position_y ?? 0;
      const sx = (gx - gy) * (TILE_W / 2);
      const sy = (gx + gy) * (TILE_H / 2);
      if (sx < minX) minX = sx; if (sx > maxX) maxX = sx;
      if (sy < minY) minY = sy; if (sy > maxY) maxY = sy;
      positions.push({ building: b, sx, sy, isCompound: false, gx, gy });
    }

    for (const cb of compoundBuildings) {
      const gx = cb.template?.position_x ?? 0;
      const gy = cb.template?.position_y ?? 0;
      const sx = (gx - gy) * (TILE_W / 2);
      const sy = (gx + gy) * (TILE_H / 2);
      if (sx < minX) minX = sx; if (sx > maxX) maxX = sx;
      if (sy < minY) minY = sy; if (sy > maxY) maxY = sy;
      positions.push({ building: cb, sx, sy, isCompound: true, gx, gy });
    }

    return { positions, minX, maxX, minY, maxY };
  }, [buildings, compoundBuildings]);

  const { positions, minX, maxX, minY, maxY } = allPositions;

  const mapWidth = maxX - minX + TILE_W + 80;
  const mapHeight = maxY - minY + TILE_H + 80;
  const offsetX = -minX + TILE_W / 2 + 40;
  const offsetY = -minY + TILE_H / 2 + 40;

  if (buildings.length === 0 && compoundBuildings.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 rounded-xl border border-dashed border-border bg-muted/20">
        <div className="text-center space-y-2">
          <span className="text-5xl">🗺️</span>
          <p className="text-sm text-muted-foreground">No buildings yet — complete quests to build your world</p>
        </div>
      </div>
    );
  }

  // Terrain colors for ground tiles
  const terrainColors = [
    "from-emerald-900/20 to-emerald-800/10",
    "from-green-800/15 to-emerald-900/8",
    "from-teal-900/20 to-green-800/10",
    "from-stone-800/15 to-stone-700/8",
  ];

  return (
    <div className="relative flex items-center justify-center p-6 overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none" />

      <div
        className="relative"
        style={{ width: `${mapWidth}px`, height: `${mapHeight}px` }}
      >
        {/* ── SVG Layer: Ground tiles, grid, and connections ── */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={mapWidth}
          height={mapHeight}
          style={{ overflow: "visible" }}
        >
          <defs>
            {/* Grid pattern */}
            <pattern id="gameGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1" fill="currentColor" opacity="0.06" />
            </pattern>
            {/* Glow filter for compound buildings */}
            <filter id="compoundGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Shadow filter */}
            <filter id="tileShadow">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Grid overlay */}
          <rect width={mapWidth} height={mapHeight} fill="url(#gameGrid)" />

          {/* Ground tiles at each building position */}
          {positions.map(({ sx, sy, gx, gy, isCompound }) => {
            const terrainIdx = (gx + gy * 3) % terrainColors.length;
            const cx = sx + offsetX;
            const cy = sy + offsetY;
            const size = isCompound ? 44 : 38;
            return (
              <g key={`ground-${gx}-${gy}`}>
                {/* Terrain diamond */}
                <polygon
                  points={`${cx},${cy - size} ${cx + size * 1.3},${cy} ${cx},${cy + size} ${cx - size * 1.3},${cy}`}
                  fill="currentColor"
                  className={terrainColors[terrainIdx].replace("from-", "text-").split(" ")[0]}
                  opacity="0.15"
                  stroke="currentColor"
                  strokeOpacity="0.08"
                  strokeWidth="1"
                />
                {/* Inner highlight diamond */}
                <polygon
                  points={`${cx},${cy - size * 0.5} ${cx + size * 0.6},${cy} ${cx},${cy + size * 0.5} ${cx - size * 0.6},${cy}`}
                  fill="currentColor"
                  className={terrainColors[terrainIdx].replace("from-", "text-").split(" ")[0]}
                  opacity="0.08"
                />
              </g>
            );
          })}

          {/* Compound building glow circles */}
          {positions
            .filter((p) => p.isCompound && (p.building as UserCompoundBuilding).status !== "LOCKED")
            .map(({ sx, sy, gx, gy }) => (
              <circle
                key={`glow-${gx}-${gy}`}
                cx={sx + offsetX}
                cy={sy + offsetY}
                r={55}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeOpacity="0.15"
                strokeDasharray="6 12"
                filter="url(#compoundGlow)"
              >
                <animate
                  attributeName="stroke-opacity"
                  values="0.15;0.3;0.15"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </circle>
            ))}

          {/* Connection lines between nearby buildings */}
          {positions.map((pos, i) => {
            const lines: React.ReactNode[] = [];
            for (let j = i + 1; j < positions.length; j++) {
              const other = positions[j];
              const dx = pos.sx - other.sx;
              const dy = pos.sy - other.sy;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < 280) {
                const isCompoundLine = pos.isCompound || other.isCompound;
                const bothActive =
                  pos.building.status !== "LOCKED" && other.building.status !== "LOCKED";
                lines.push(
                  <line
                    key={`${i}-${j}`}
                    x1={pos.sx + offsetX}
                    y1={pos.sy + offsetY}
                    x2={other.sx + offsetX}
                    y2={other.sy + offsetY}
                    stroke={isCompoundLine ? "#f59e0b" : "currentColor"}
                    strokeOpacity={isCompoundLine ? (bothActive ? 0.35 : 0.12) : bothActive ? 0.12 : 0.05}
                    strokeWidth={isCompoundLine ? 2 : 1}
                    strokeDasharray={bothActive ? "6 3" : "4 6"}
                  />
                );
              }
            }
            return lines;
          })}
        </svg>

        {/* ── Building tiles ── */}
        {positions.map(({ building, sx, sy, isCompound }) => (
          <div
            key={building.id}
            className="absolute will-change-transform"
            style={{
              left: `${sx + offsetX}px`,
              top: `${sy + offsetY}px`,
              transform: "translate(-50%, -50%)",
              zIndex:
                selectedBuildingId === building.id
                  ? 50
                  : isCompound
                    ? 20
                    : 10,
            }}
          >
            {isCompound ? (
              <CompoundBuildingTile
                building={building as UserCompoundBuilding}
                isSelected={selectedBuildingId === building.id}
                onClick={() => onSelectBuilding(building as UserCompoundBuilding)}
              />
            ) : (
              <BuildingTile
                building={building as UserBuilding}
                isSelected={selectedBuildingId === building.id}
                onClick={() => onSelectBuilding(building)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
