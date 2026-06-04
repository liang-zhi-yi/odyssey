"use client";

import { BuildingTile } from "./BuildingTile";
import type { UserBuilding } from "@/types/world";

interface WorldMapProps {
  buildings: UserBuilding[];
  selectedBuildingId?: string;
  onSelectBuilding: (building: UserBuilding) => void;
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
  selectedBuildingId,
  onSelectBuilding,
}: WorldMapProps) {
  const TILE_W = 130; // Tile width in px (horizontal span)
  const TILE_H = 70;  // Tile height in px (vertical span)

  // Calculate map bounds to center the grid
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  const positions = buildings.map((b) => {
    const gx = b.template?.position_x ?? 0;
    const gy = b.template?.position_y ?? 0;
    const sx = (gx - gy) * (TILE_W / 2);
    const sy = (gx + gy) * (TILE_H / 2);
    if (sx < minX) minX = sx;
    if (sx > maxX) maxX = sx;
    if (sy < minY) minY = sy;
    if (sy > maxY) maxY = sy;
    return { building: b, sx, sy };
  });

  const mapWidth = maxX - minX + TILE_W + 40;
  const mapHeight = maxY - minY + TILE_H + 40;
  const offsetX = -minX + TILE_W / 2 + 20;
  const offsetY = -minY + TILE_H / 2 + 20;

  if (buildings.length === 0) {
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
          {positions.map((pos, i) => {
            // Draw lines to nearby buildings for visual connection
            const lines: React.ReactNode[] = [];
            for (let j = i + 1; j < positions.length; j++) {
              const other = positions[j];
              const dx = (pos.sx + offsetX) - (other.sx + offsetX);
              const dy = (pos.sy + offsetY) - (other.sy + offsetY);
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < 200) {
                lines.push(
                  <line
                    key={`${i}-${j}`}
                    x1={pos.sx + offsetX}
                    y1={pos.sy + offsetY}
                    x2={other.sx + offsetX}
                    y2={other.sy + offsetY}
                    stroke="currentColor"
                    strokeOpacity={0.08}
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                  />
                );
              }
            }
            return lines;
          })}
        </svg>

        {/* Building tiles */}
        {positions.map(({ building, sx, sy }) => (
          <div
            key={building.id}
            className="absolute transition-all duration-300"
            style={{
              left: `${sx + offsetX}px`,
              top: `${sy + offsetY}px`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <BuildingTile
              building={building}
              isSelected={selectedBuildingId === building.id}
              onClick={() => onSelectBuilding(building)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
