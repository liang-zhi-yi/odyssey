"use client";

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
 * Isometric 2.5D world map using mathematical projection.
 *
 * Grid positions (x, y) are mapped to screen coordinates:
 *   screenX = (x - y) * tileW/2 + offsetX
 *   screenY = (x + y) * tileH/2 + offsetY
 *
 * This creates a classic isometric diamond grid without CSS 3D transforms,
 * ensuring reliable rendering and click handling across all browsers.
 */
export function WorldMap({
  buildings,
  compoundBuildings = [],
  selectedBuildingId,
  onSelectBuilding,
}: WorldMapProps) {
  const TILE_W = 130;
  const TILE_H = 70;

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  // Compute positions for regular buildings
  const positions = buildings.map((b) => {
    const gx = b.template?.position_x ?? 0;
    const gy = b.template?.position_y ?? 0;
    const sx = (gx - gy) * (TILE_W / 2);
    const sy = (gx + gy) * (TILE_H / 2);
    if (sx < minX) minX = sx;
    if (sx > maxX) maxX = sx;
    if (sy < minY) minY = sy;
    if (sy > maxY) maxY = sy;
    return { building: b, sx, sy, isCompound: false };
  });

  // Compute positions for compound buildings
  const compoundPositions = compoundBuildings.map((cb) => {
    const gx = cb.template?.position_x ?? 0;
    const gy = cb.template?.position_y ?? 0;
    const sx = (gx - gy) * (TILE_W / 2);
    const sy = (gx + gy) * (TILE_H / 2);
    if (sx < minX) minX = sx;
    if (sx > maxX) maxX = sx;
    if (sy < minY) minY = sy;
    if (sy > maxY) maxY = sy;
    return { building: cb, sx, sy, isCompound: true };
  });

  const allPositions = [...positions, ...compoundPositions];

  const mapWidth = maxX - minX + TILE_W + 60;
  const mapHeight = maxY - minY + TILE_H + 60;
  const offsetX = -minX + TILE_W / 2 + 30;
  const offsetY = -minY + TILE_H / 2 + 30;

  if (buildings.length === 0 && compoundBuildings.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 rounded-xl border border-dashed border-border bg-muted/20">
        <p className="text-sm text-muted-foreground">No buildings yet</p>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center p-4">
      <div
        className="relative"
        style={{
          width: `${mapWidth}px`,
          height: `${mapHeight}px`,
        }}
      >
        {/* Ground grid (decorative diamond tiles for empty spaces) */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={mapWidth}
          height={mapHeight}
        >
          {/* Connection lines between buildings */}
          {allPositions.map((pos, i) => {
            const lines: React.ReactNode[] = [];
            for (let j = i + 1; j < allPositions.length; j++) {
              const other = allPositions[j];
              const dx = (pos.sx + offsetX) - (other.sx + offsetX);
              const dy = (pos.sy + offsetY) - (other.sy + offsetY);
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < 250) {
                const isCompoundLine = pos.isCompound || other.isCompound;
                lines.push(
                  <line
                    key={`${i}-${j}`}
                    x1={pos.sx + offsetX}
                    y1={pos.sy + offsetY}
                    x2={other.sx + offsetX}
                    y2={other.sy + offsetY}
                    stroke={isCompoundLine ? "#f59e0b" : "currentColor"}
                    strokeOpacity={isCompoundLine ? 0.2 : 0.08}
                    strokeWidth={isCompoundLine ? 2 : 1.5}
                    strokeDasharray="4 4"
                  />
                );
              }
            }
            return lines;
          })}
        </svg>

        {/* Building tiles */}
        {allPositions.map(({ building, sx, sy, isCompound }) => (
          <div
            key={building.id}
            className="absolute transition-all duration-300"
            style={{
              left: `${sx + offsetX}px`,
              top: `${sy + offsetY}px`,
              transform: "translate(-50%, -50%)",
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
