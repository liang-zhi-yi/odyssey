"use client";

import Link from "next/link";
import { useLocale } from "@/hooks/useLocale";
import type { CivilizationDirection, TargetedBuilding } from "@/types/world";
import { CIVILIZATION_TIER_LABELS } from "@/types/world";
import { QuestScrollIcon } from "./QuestScrollIcon";
import { BuildingSealIcon, CIV_COLORS, inferSkillId } from "./CivArchiveTheme";

interface CivilizationCompassProps {
  direction: CivilizationDirection | null;
  isLoading: boolean;
  /** Compact size for dashboard widget */
  size?: "md" | "sm";
}

/** 区域配色 — 文明档案色系，无深绿色 */
const REGION_COLORS: Record<string, string> = {
  "核心区": CIV_COLORS.darkRed,
  "Core Region": CIV_COLORS.darkRed,
  "创意区": CIV_COLORS.gold,
  "Creative Region": CIV_COLORS.gold,
  "逻辑区": CIV_COLORS.border,
  "Logic Region": CIV_COLORS.border,
  "实践区": "#B87333",
  "Practice Region": "#B87333",
  "综合区": CIV_COLORS.darkRed,
  "Synthesis Region": CIV_COLORS.darkRed,
};

const DEFAULT_REGION_COLOR = CIV_COLORS.gold;

function regionColor(region: string): string {
  return REGION_COLORS[region] ?? DEFAULT_REGION_COLOR;
}

/**
 * CivilizationCompass — 文明星盘。
 *
 * 重新设计：
 *   - 建筑节点改用独特 BuildingSealIcon（禁止重复图标）
 *   - 移除所有呼吸/浮动/脉冲动画
 *   - 移除深绿色，采用文明档案配色
 *   - 无框透明背景图标 + hover 高亮放大
 *   - 可交互文字按键改斜体艺术字
 */
export function CivilizationCompass({
  direction,
  isLoading,
  size = "md",
}: CivilizationCompassProps) {
  const { locale } = useLocale();

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center py-12">
          <div
            className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: CIV_COLORS.gold, borderTopColor: "transparent" }}
          />
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
      <div
        className="p-5 text-center"
        style={{ border: `2px dashed ${CIV_COLORS.border}` }}
      >
        <span
          className="block mb-2 inline-flex justify-center civ-archive-seal-hover"
          style={{ color: CIV_COLORS.gold }}
        >
          <QuestScrollIcon name="compass" size={32} />
        </span>
        <p className="text-xs" style={{ color: CIV_COLORS.textSecondary }}>
          {locale === "en"
            ? "Create a learning path to set your civilization's direction"
            : "创建学习路径来设定文明方向"}
        </p>
        <Link
          href="/paths"
          className="mt-2 inline-block text-xs font-civ-serif italic hover:underline"
          style={{ color: CIV_COLORS.darkRed }}
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
  const nodeSize = isSm ? 32 : 44;

  // Compute node positions around the ring
  const n = displayBuildings.length;
  const nodes = displayBuildings.map((b, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    return {
      building: b,
      x: centerX + ringRadius * Math.cos(angle),
      y: centerY + ringRadius * Math.sin(angle),
      angle,
    };
  });

  return (
    <div
      className="p-4 transition-all duration-300 hover:shadow-lg"
      style={{
        backgroundColor: CIV_COLORS.bgCard,
        border: `1.5px solid ${CIV_COLORS.border}`,
        borderRadius: "6px",
      }}
    >
      <div
        className="flex items-center gap-2 mb-3 pb-2"
        style={{ borderBottom: `1px solid ${CIV_COLORS.border}` }}
      >
        <span
          className="text-lg inline-block civ-archive-seal-hover"
          style={{ color: CIV_COLORS.gold }}
        >
          <QuestScrollIcon name="compass" size={18} />
        </span>
        <h3
          className="text-sm font-bold font-civ-serif"
          style={{ color: CIV_COLORS.textPrimary }}
        >
          {locale === "en" ? "Civilization Compass" : "文明导航罗盘"}
        </h3>
        <span
          className="text-[10px] rounded-full px-2 py-0.5 font-bold ml-auto"
          style={{
            backgroundColor: CIV_COLORS.gold + "20",
            color: CIV_COLORS.darkRed,
            border: `1px solid ${CIV_COLORS.gold}60`,
          }}
        >
          {direction.active_paths.length}{" "}
          {locale === "en" ? "paths" : "条路径"}
        </span>
      </div>

      {/* SVG Compass — 背景结构 + 连接线 */}
      <div className="flex justify-center py-2 px-6">
        <div className="relative mx-auto" style={{ width: viewSize, height: viewSize }}>
        <svg
          viewBox={`0 0 ${viewSize} ${viewSize}`}
          width={viewSize}
          height={viewSize}
          className="overflow-visible"
        >
          {/* 背景圆环 */}
          <circle
            cx={centerX}
            cy={centerY}
            r={ringRadius * 1.3}
            fill="none"
            stroke={CIV_COLORS.gold}
            strokeWidth={1}
            opacity={0.06}
          />

          {/* 外圈刻度 */}
          <circle
            cx={centerX}
            cy={centerY}
            r={ringRadius + 8}
            fill="none"
            stroke={CIV_COLORS.gold}
            strokeWidth={2}
            strokeDasharray="1 4"
            opacity={0.25}
          />
          {/* 内圈 */}
          <circle
            cx={centerX}
            cy={centerY}
            r={ringRadius}
            fill="none"
            stroke={CIV_COLORS.gold}
            strokeWidth={1}
            opacity={0.1}
          />
          <circle
            cx={centerX}
            cy={centerY}
            r={ringRadius * 0.5}
            fill="none"
            stroke={CIV_COLORS.gold}
            strokeWidth={0.5}
            strokeDasharray="2 2"
            opacity={0.1}
          />

          {/* 方位线 */}
          <line x1={centerX} y1={centerY - ringRadius - 15} x2={centerX} y2={centerY + ringRadius + 15} stroke={CIV_COLORS.gold} strokeWidth={1} opacity={0.18} />
          <line x1={centerX - ringRadius - 15} y1={centerY} x2={centerX + ringRadius + 15} y2={centerY} stroke={CIV_COLORS.gold} strokeWidth={1} opacity={0.18} />
          <line x1={centerX - ringRadius * 0.7} y1={centerY - ringRadius * 0.7} x2={centerX + ringRadius * 0.7} y2={centerY + ringRadius * 0.7} stroke={CIV_COLORS.gold} strokeWidth={0.5} strokeDasharray="2 2" opacity={0.12} />
          <line x1={centerX + ringRadius * 0.7} y1={centerY - ringRadius * 0.7} x2={centerX - ringRadius * 0.7} y2={centerY + ringRadius * 0.7} stroke={CIV_COLORS.gold} strokeWidth={0.5} strokeDasharray="2 2" opacity={0.12} />

          {/* 方位字母 */}
          <text x={centerX} y={centerY - ringRadius - 8} textAnchor="middle" fontSize={isSm ? 8 : 10} fontWeight="bold" fill={CIV_COLORS.gold} opacity={0.8}>N</text>
          <text x={centerX} y={centerY + ringRadius + 14} textAnchor="middle" fontSize={isSm ? 8 : 10} fontWeight="bold" fill={CIV_COLORS.gold} opacity={0.6}>S</text>
          <text x={centerX + ringRadius + 10} y={centerY + 3} textAnchor="middle" fontSize={isSm ? 8 : 10} fontWeight="bold" fill={CIV_COLORS.gold} opacity={0.6}>E</text>
          <text x={centerX - ringRadius - 10} y={centerY + 3} textAnchor="middle" fontSize={isSm ? 8 : 10} fontWeight="bold" fill={CIV_COLORS.gold} opacity={0.6}>W</text>

          {/* 中心到节点的连接线 */}
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
        </svg>

        {/* 中心徽章 — HTML 绝对定位 */}
        <div
          className="absolute flex flex-col items-center justify-center rounded-full civ-archive-seal-hover"
          style={{
            left: centerX - (isSm ? 24 : 32),
            top: centerY - (isSm ? 24 : 32),
            width: isSm ? 48 : 64,
            height: isSm ? 48 : 64,
            backgroundColor: CIV_COLORS.bgContent,
            border: `1.5px solid ${CIV_COLORS.gold}80`,
          }}
        >
          <svg width={isSm ? 18 : 22} height={isSm ? 18 : 22} viewBox="0 0 24 24" fill="none" stroke={CIV_COLORS.darkRed} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 4 L14 12 L12 15 L10 12 Z" fill={CIV_COLORS.darkRed} strokeWidth="0.8" />
            <path d="M12 20 L14 12 L12 9 L10 12 Z" strokeWidth="1" opacity="0.5" />
          </svg>
          <span
            className="text-[8px] font-bold uppercase tracking-wider mt-0.5"
            style={{ color: CIV_COLORS.textSecondary }}
          >
            {locale === "en" ? "Core" : "核心"}
          </span>
        </div>

        {/* 建筑节点 — HTML 绝对定位，每个用独特 BuildingSealIcon */}
        {nodes.map((node, i) => {
          const b = node.building;
          const color = regionColor(b.region);
          const hasGrowth = b.projected_level > b.current_level;
          const displayName =
            locale === "en" && b.building_name_en
              ? b.building_name_en
              : b.building_name;
          const skillId = inferSkillId(displayName, b.building_id);

          return (
            <div
              key={`node-${i}`}
              className="absolute flex flex-col items-center cursor-pointer group"
              style={{
                left: node.x - nodeSize / 2,
                top: node.y - nodeSize / 2,
                width: nodeSize,
                height: nodeSize,
              }}
            >
              {/* 成长指示环 */}
              {hasGrowth && (
                <span
                  className="absolute inset-0 rounded-full"
                  style={{
                    border: `1.5px solid ${color}`,
                    opacity: 0.4,
                    transform: "scale(1.15)",
                  }}
                />
              )}
              {/* 独特建筑印章图标 — 无框透明背景 */}
              <div
                className="relative civ-archive-seal-hover"
                style={{ filter: hasGrowth ? `drop-shadow(0 0 4px ${color}80)` : "none" }}
              >
                <BuildingSealIcon type={skillId} size={nodeSize} />
              </div>
              {/* 等级徽章 */}
              <span
                className="absolute -top-1 -right-1 text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center"
                style={{
                  backgroundColor: color,
                  color: "#FFF",
                }}
              >
                {b.current_level}
              </span>
              {/* 建筑名 — 水平居中于节点 */}
              <span
                className="absolute top-full mt-1 left-1/2 -translate-x-1/2 text-[9px] font-medium text-center whitespace-nowrap max-w-[80px] truncate"
                style={{ color: CIV_COLORS.textPrimary }}
              >
                {displayName.length > (isSm ? 6 : 8)
                  ? displayName.slice(0, isSm ? 5 : 7) + "…"
                  : displayName}
              </span>
              {hasGrowth && (
                <span
                  className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[9px] font-bold font-mono whitespace-nowrap"
                  style={{ color: CIV_COLORS.darkRed }}
                >
                  →{b.projected_level}
                </span>
              )}
              <title>
                {displayName} Lv.{b.current_level}
                {hasGrowth ? ` → Lv.${b.projected_level}` : ""}
                {"\n"}{b.pathTitle}
              </title>
            </div>
          );
        })}
        </div>
      </div>

      {/* Summary text */}
      {locale === "zh" ? (
        <>
          <p className="text-xs text-center mt-3 leading-relaxed" style={{ color: CIV_COLORS.textSecondary }}>
            你的文明正通过 {direction.active_paths.length} 条路径发展，驱动 {uniqueBuildings.length} 个建筑成长
          </p>
          {direction.active_paths[0]?.targeted_buildings[0] && (
            <p className="text-[11px] text-center mt-1 font-medium font-civ-serif italic inline-flex items-center justify-center gap-1 w-full" style={{ color: CIV_COLORS.darkRed }}>
              <QuestScrollIcon name="idea" size={12} className="inline-block" /> 优先推进「{direction.active_paths[0].path_title}」，达成 {direction.active_paths[0].targeted_buildings[0].building_name} Lv.{direction.active_paths[0].targeted_buildings[0].projected_level}
            </p>
          )}
        </>
      ) : (
        <>
          <p className="text-xs text-center mt-3 leading-relaxed" style={{ color: CIV_COLORS.textSecondary }}>
            {direction.summary}
          </p>
          {direction.suggested_focus && (
            <p className="text-[11px] text-center mt-1 font-medium font-civ-serif italic inline-flex items-center justify-center gap-1 w-full" style={{ color: CIV_COLORS.darkRed }}>
              <QuestScrollIcon name="idea" size={12} className="inline-block" /> {direction.suggested_focus}
            </p>
          )}
        </>
      )}
    </div>
  );
}
