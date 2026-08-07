"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useLocale } from "@/hooks/useLocale";
import { BuildingSealIcon, CIV_COLORS, inferSkillId } from "./CivArchiveTheme";
import { CivIcon } from "./CivIcon";
import { QuestScrollIcon } from "./QuestScrollIcon";
import { getBuildingLevelLabel } from "@/types/world";
import type {
  World,
  UserBuilding,
  UserCompoundBuilding,
  RegionInfo,
} from "@/types/world";

interface RegionMapViewProps {
  world: World;
  selectedBuildingId?: string;
  onSelectBuilding: (building: UserBuilding | UserCompoundBuilding) => void;
  /** 右侧档案碑栏底部的附加内容（建筑档案卷宗） */
  detailSlot?: React.ReactNode;
}

/**
 * 文明探索地图 — Frontier Cartography
 * ─────────────────────────────────────────────
 * 视觉理念：用户正在探索未知大陆，并逐步建立属于自己的文明疆域。
 * 古文明地图 × 水墨探索 × 未来文明档案 × 三体式星图感。
 *
 * 布局：
 *  - 左：文明探索地图（已探索领地 + 未探索 Terra Incognita 迷雾大陆）
 *  - 右：文明档案碑（文明名称 / 建筑数量 / 坐标 + 文明建筑节点）
 *
 * 仅前端视觉与交互层优化，数据读取 / 解锁逻辑 / 状态判定均未改动。
 * 所有样式以 fm- 前缀作用域注入，不污染其他页面。
 */
export function RegionMapView({
  world,
  selectedBuildingId,
  onSelectBuilding,
  detailSlot,
}: RegionMapViewProps) {
  const { locale } = useLocale();

  // ── 分组逻辑（与原有数据读取一致）────────────────────────────
  const regionGroups = useMemo(() => {
    const map = new Map<string, {
      info: RegionInfo | undefined;
      buildings: UserBuilding[];
      compounds: UserCompoundBuilding[];
    }>();

    for (const r of world.regions ?? []) {
      map.set(r.key, { info: r, buildings: [], compounds: [] });
    }
    for (const b of world.buildings ?? []) {
      const regionKey = b.template?.region ?? "unknown";
      if (!map.has(regionKey)) {
        map.set(regionKey, { info: undefined, buildings: [], compounds: [] });
      }
      map.get(regionKey)!.buildings.push(b);
    }
    for (const cb of world.compound_buildings ?? []) {
      const regionKey = cb.template?.region ?? "unknown";
      if (!map.has(regionKey)) {
        map.set(regionKey, { info: undefined, buildings: [], compounds: [] });
      }
      map.get(regionKey)!.compounds.push(cb);
    }

    const entries = Array.from(map.entries());
    entries.sort((a, b) => {
      const idxA = REGION_ORDER.indexOf(a[0].toLowerCase());
      const idxB = REGION_ORDER.indexOf(b[0].toLowerCase());
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
    return entries;
  }, [world.regions, world.buildings, world.compound_buildings]);

  // ── 核心建筑（最高等级）──────────────────────────────────────
  const coreBuilding = useMemo(() => {
    const activeCompounds = (world.compound_buildings ?? []).filter(
      (cb) => cb.status !== "LOCKED"
    );
    if (activeCompounds.length > 0) {
      return activeCompounds.reduce((a, b) => (b.level > a.level ? b : a));
    }
    const activeRegular = (world.buildings ?? []).filter(
      (b) => b.status !== "LOCKED"
    );
    if (activeRegular.length > 0) {
      return activeRegular.reduce((a, b) => (b.level > a.level ? b : a));
    }
    return null;
  }, [world.buildings, world.compound_buildings]);

  const unlockedCount = world.regions?.filter((r) => r.unlocked).length ?? 0;
  const totalRegions = regionGroups.length;

  // ── 当前活动的文明（用于右侧档案碑）─────────────────────────
  const [activeRegionKey, setActiveRegionKey] = useState<string | null>(null);

  const activeRegion = useMemo(() => {
    // 优先：由已选中建筑推断其所属疆域
    if (selectedBuildingId) {
      const all = [
        ...(world.buildings ?? []),
        ...(world.compound_buildings ?? []),
      ];
      const sel = all.find((b) => b.id === selectedBuildingId);
      if (sel?.template?.region) {
        return regionGroups.find(([k]) => k === sel.template!.region) ?? null;
      }
    }
    if (activeRegionKey) {
      const found = regionGroups.find(([k]) => k === activeRegionKey);
      if (found) return found;
    }
    // 默认第一个已解锁疆域
    const unlocked = regionGroups.find(([, g]) => g.info?.unlocked);
    return unlocked ?? regionGroups[0] ?? null;
  }, [selectedBuildingId, activeRegionKey, regionGroups, world]);

  // ── 名称 / 坐标辅助 ──────────────────────────────────────────
  const regionDisplayName = (key: string, info?: RegionInfo): string => {
    if (locale === "en" && info?.name_en) return info.name_en;
    const name = info?.name ?? key;
    return locale === "en" ? name.replace(/区$/, " Region") : name;
  };

  const civDisplayName = (key: string, info?: RegionInfo): string => {
    const base = regionDisplayName(key, info);
    if (locale === "en") return base.replace(/ Region$/, " Civilization");
    return base.replace(/区$/, "文明");
  };

  const regionCoords: Record<string, string> = {
    "知识区": "42° N, 12° E",
    "AI区": "55° N, 40° E",
    "工程区": "34° N, 108° E",
    "商业区": "15° S, 48° W",
    "设计区": "30° S, 115° E",
    "语言区": "48° N, 2° E",
    "媒体区": "45° N, 74° W",
    "科学区": "52° N, 13° E",
    "健康区": "19° N, 99° W",
    "金融区": "40° N, 74° W",
    "数字区": "37° N, 122° W",
    "社会区": "51° N, 0° W",
    "智能体区": "35° N, 139° E",
    "自动化区": "59° N, 18° E",
    "综合区": "8° S, 140° E",
  };

  const coordStampFor = (key: string) => regionCoords[key] ?? "0° N, 0° E";

  // ── 右侧档案碑：当前文明建筑节点 ────────────────────────────
  const activeBuildings = useMemo(() => {
    if (!activeRegion) return [];
    const [, group] = activeRegion;
    return [
      ...group.buildings.map((b) => ({ ...b, isCompound: false as const })),
      ...group.compounds.map((cb) => ({ ...cb, isCompound: true as const })),
    ];
  }, [activeRegion]);

  const activeCount = activeBuildings.filter((b) => b.status !== "LOCKED").length;

  return (
    <div className="fm-root">
      <FrontierMapStyles />

      {/* ── 顶部图例条 ─────────────────────────────────────────── */}
      <div className="fm-header">
        <div className="fm-header-left">
          <span className="fm-compass" aria-hidden>
            <QuestScrollIcon name="map" size={22} />
          </span>
          <div>
            <h2 className="fm-header-title">{world.name}</h2>
            <p className="fm-header-sub">
              {locale === "en"
                ? `${unlockedCount} / ${totalRegions} regions conquered & charted`
                : `已勘定 ${unlockedCount} / ${totalRegions} 个文明疆域`}
            </p>
          </div>
        </div>
        <div className="fm-legend">
          <span className="fm-legend-item">
            <i className="fm-dot gold" />
            {locale === "en" ? "Established" : "已建立"}
          </span>
          <span className="fm-legend-item">
            <i className="fm-dot building" />
            {locale === "en" ? "Under Construction" : "建设中"}
          </span>
          <span className="fm-legend-item">
            <i className="fm-dot fog" />
            {locale === "en" ? "Terra Incognita" : "未知疆域"}
          </span>
        </div>
      </div>

      {/* ── 左右分栏 ───────────────────────────────────────────── */}
      <div className="fm-layout">
        {/* ═══════════ 左 · 文明探索地图 ═══════════ */}
        <div className="fm-map">
          {/* 水墨迷雾背景 */}
          <div className="fm-ink" aria-hidden />
          {/* 经纬网格 */}
          <div className="fm-grid" aria-hidden />
          {/* 地形轮廓 */}
          <div className="fm-terrain" aria-hidden />
          {/* 地图角标 */}
          <span className="fm-north" aria-hidden>N</span>
          <span className="fm-scale" aria-hidden>SCALE 1:∞</span>

          {/* 核心要塞标记 */}
          {coreBuilding && (
            <div className="fm-capital">
              <div className="fm-capital-ring" />
              <div className="fm-capital-icon">
                <CivIcon
                  type="building"
                  name={coreBuilding.template?.name ?? ""}
                  size={40}
                  alt=""
                  fallback={<BuildingSealIcon type={inferSkillId(coreBuilding.template?.name ?? "", coreBuilding.id)} size={40} />}
                />
              </div>
              <div className="fm-capital-label">
                {locale === "en"
                  ? coreBuilding.template?.name_en ?? "Capital"
                  : (coreBuilding.template?.name ?? "文明核心")}
              </div>
            </div>
          )}

          {/* 疆域板块 */}
          <div className="fm-plates">
            {regionGroups.map(([regionKey, group], i) => {
              const isUnlocked = group.info?.unlocked ?? true;
              const isActive = activeRegion?.[0] === regionKey;
              const allBuildings = [
                ...group.buildings.map((b) => ({ ...b, isCompound: false as const })),
                ...group.compounds.map((cb) => ({ ...cb, isCompound: true as const })),
              ];
              const coord = coordStampFor(regionKey);

              return (
                <button
                  key={regionKey}
                  onClick={() => {
                    setActiveRegionKey(regionKey);
                    const first = allBuildings.find((b) => b.status !== "LOCKED") ?? allBuildings[0];
                    if (first) onSelectBuilding(first as UserBuilding | UserCompoundBuilding);
                  }}
                  className={`fm-plate ${isUnlocked ? "unlocked" : "incognita"} ${isActive ? "active" : ""}`}
                  style={{ animationDelay: `${i * 120}ms` }}
                >
                  {isUnlocked ? (
                    <>
                      {/* 探索路径线（延伸向未知） */}
                      <span className="fm-path" aria-hidden />
                      <div className="fm-plate-head">
                        <span className="fm-plate-name">{regionDisplayName(regionKey, group.info)}</span>
                        <span className="fm-plate-coord">{coord}</span>
                      </div>
                      <div className="fm-plate-seal">
                        <BuildingSealIcon type="default" size={30} className={allBuildings.length ? "" : "fm-dormant"} />
                      </div>
                      <div className="fm-plate-count">
                        {allBuildings.length} {locale === "en" ? "nodes" : "建筑节点"}
                      </div>
                    </>
                  ) : (
                    /* Terra Incognita — 未探索文明大陆 */
                    <>
                      <div className="fm-fog" aria-hidden />
                      <div className="fm-incognita-node">
                        <div className="fm-breathe" aria-hidden />
                        <span className="fm-incognita-terra">
                          {locale === "en" ? "TERRA" : "未知疆域"}
                        </span>
                        <span className="fm-incognita-label">
                          {locale === "en" ? "Awaiting connection" : "等待探索者建立连接"}
                        </span>
                      </div>
                      <span className="fm-incognita-coord">{coord}</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>

          {/* 地图底注 */}
          <div className="fm-map-foot">
            <span>
              {locale === "en"
                ? "Venture into unknown lands to establish your civilization"
                : "深入未知大陆，建立属于你的文明"}
            </span>
          </div>
        </div>

        {/* ═══════════ 右 · 文明档案碑 ═══════════ */}
        <div className="fm-archive">
          {activeRegion && (() => {
            const [, group] = activeRegion;
            const info = group.info;
            const civName = civDisplayName(activeRegion[0], info);
            const buildings = activeBuildings;

            return (
              <>
                {/* 档案碑头 */}
                <div className="fm-archive-plaque">
                  <div className="fm-plaque-diamond" aria-hidden />
                  <span className="fm-plaque-overline">
                    {locale === "en" ? "Civilization Archive" : "文明档案"}
                  </span>
                  <h3 className="fm-plaque-name">{civName}</h3>
                  <div className="fm-plaque-meta">
                    <span>
                      <QuestScrollIcon name="building" size={12} />
                      {activeCount} {locale === "en" ? "nodes" : "建筑"}
                    </span>
                    <span>
                      <QuestScrollIcon name="map" size={12} />
                      {coordStampFor(activeRegion[0])}
                    </span>
                  </div>
                </div>

                {/* 档案分割线 */}
                <div className="fm-archive-divider" aria-hidden />

                {/* 建筑节点列表 */}
                <div className="fm-node-list">
                  {buildings.length === 0 && (
                    <div className="fm-node-empty">
                      {locale === "en" ? "No structures yet in this domain" : "此疆域尚无建筑"}
                    </div>
                  )}
                  {buildings.map((b) => (
                    <BuildingNode
                      key={b.id}
                      building={b}
                      locale={locale}
                      selected={selectedBuildingId === b.id}
                      onSelect={() => onSelectBuilding(b as UserBuilding | UserCompoundBuilding)}
                    />
                  ))}
                </div>
              </>
            );
          })()}

          {/* 建筑档案卷宗（点击建筑后的详情） */}
          {detailSlot && (
            <div className="fm-archive-detail">
              {detailSlot}
            </div>
          )}

          {/* 档案碑注脚 */}
          <div className="fm-archive-foot">
            <Link href="/skills" className="fm-foot-link">
              {locale === "en" ? "Charter new skills →" : "开拓新的文明技能 →"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 文明建筑节点 — 档案样式而非按钮。
 * 已解锁：古金 · 图标亮起
 * 未解锁：灰金 · 沉睡
 * 建设中：暖金 · 轻微流光
 */
function BuildingNode({
  building,
  locale,
  selected,
  onSelect,
}: {
  building: (UserBuilding | UserCompoundBuilding) & { isCompound?: boolean };
  locale: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const template = building.template;
  const name =
    locale === "en" && template?.name_en
      ? template.name_en
      : template?.name ?? "—";
  const isLocked = building.status === "LOCKED";
  const isConstructing =
    building.status === "CONSTRUCTING" || building.status === "UPGRADING";

  const statusClass = isLocked
    ? "locked"
    : isConstructing
      ? "building"
      : "established";

  return (
    <button
      onClick={onSelect}
      className={`fm-node ${statusClass} ${selected ? "selected" : ""}`}
    >
      <span className={`fm-node-icon ${isLocked ? "dormant" : ""}`}>
        <CivIcon
          type="building"
          name={template?.name ?? ""}
          size={30}
          alt={name}
          fallback={<BuildingSealIcon type={inferSkillId(template?.name ?? "", building.id)} size={30} />}
        />
        {isConstructing && <i className="fm-shimmer" aria-hidden />}
      </span>
      <span className="fm-node-body">
        <span className="fm-node-name">{name}</span>
        <span className="fm-node-status">
          {isLocked
            ? locale === "en" ? "Dormant" : "沉睡"
            : getBuildingLevelLabel(building.level, building.template?.level_names, locale === "en" ? "en" : "zh")}
        </span>
      </span>
      {building.isCompound && (
        <QuestScrollIcon name="star" size={12} className="fm-node-star" />
      )}
    </button>
  );
}

// ── 固定疆域排序 ────────────────────────────────────────────────
const REGION_ORDER = [
  "knowledge", "ai", "engineering", "business", "design", "language",
  "core", "creative", "logic", "practice", "synthesis",
];

/**
 * 作用域样式 — 仅作用于 fm- 前缀，避免污染其他页面。
 * 文明地图配色：宣纸白 / 文明古金 / 墨黑 / 辅助灰，无绿色。
 */
function FrontierMapStyles() {
  return (
    <style dangerouslySetInnerHTML={{ __html: `
      .fm-root {
        --fm-bg: #F5F0E6;
        --fm-gold: #C8A45D;
        --fm-gold-soft: #D9BE8A;
        --fm-gold-dim: rgba(200,164,93,0.35);
        --fm-ink: #2B2721;
        --fm-ink-soft: #6B6458;
        --fm-gray: #A89F90;
        --fm-line: rgba(200,164,93,0.28);
        color: var(--fm-ink);
        font-family: "HarmonyOS Sans","Noto Sans SC",sans-serif;
      }
      .dark .fm-root {
        --fm-bg: #1E1A14;
        --fm-gold: #C8A45D;
        --fm-gold-soft: #A98A55;
        --fm-ink: #EDE3CF;
        --fm-ink-soft: #B7AC97;
        --fm-gray: #8A8172;
        --fm-line: rgba(200,164,93,0.22);
      }

      /* ── 整体容器 ─────────────────────────── */
      .fm-root {
        margin: -4px;
      }

      /* ── 顶部图例 ─────────────────────────── */
      .fm-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
        padding: 6px 4px 16px;
        border-bottom: 1px solid var(--fm-line);
        margin-bottom: 18px;
      }
      .fm-header-left { display: flex; align-items: center; gap: 12px; }
      .fm-compass {
        width: 40px; height: 40px; border-radius: 50%;
        display: inline-flex; align-items: center; justify-content: center;
        color: var(--fm-gold);
        border: 1px solid var(--fm-line);
        background: transparent;
        animation: fm-rotate 60s linear infinite;
      }
      @keyframes fm-rotate { to { transform: rotate(360deg); } }
      .fm-header-title {
        font-family: "Noto Serif SC","Source Han Serif SC","思源宋体","Songti SC",serif;
        font-size: 18px; font-weight: 800; letter-spacing: 0.12em; color: var(--fm-ink);
        margin: 0;
      }
      .fm-header-sub { margin: 2px 0 0; font-size: 11px; color: var(--fm-gray); letter-spacing: 0.06em; }
      .fm-legend { display: flex; gap: 16px; flex-wrap: wrap; }
      .fm-legend-item { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; color: var(--fm-ink-soft); }
      .fm-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
      .fm-dot.gold { background: var(--fm-gold); box-shadow: 0 0 6px var(--fm-gold-dim); }
      .fm-dot.building { background: #D9A45D; box-shadow: 0 0 6px rgba(217,164,93,0.4); }
      .fm-dot.fog { background: transparent; border: 1px dashed var(--fm-gray); }

      /* ── 左右分栏 ─────────────────────────── */
      .fm-layout {
        display: grid;
        grid-template-columns: minmax(0, 1.9fr) minmax(0, 1fr);
        gap: 20px;
        align-items: stretch;
      }
      @media (max-width: 900px) {
        .fm-layout { grid-template-columns: 1fr; }
      }

      /* ══ 左 · 文明探索地图 ══ */
      .fm-map {
        position: relative;
        overflow: hidden;
        border: 1px solid var(--fm-line);
        outline: 1px solid rgba(200,164,93,0.12);
        outline-offset: 3px;
        background: var(--fm-bg);
        padding: 22px 18px 30px;
        min-height: 420px;
      }
      /* 水墨迷雾 */
      .fm-ink {
        position: absolute; inset: 0; pointer-events: none;
        opacity: 0.5;
        background:
          radial-gradient(ellipse 60% 45% at 18% 22%, rgba(107,100,88,0.10), transparent 70%),
          radial-gradient(ellipse 55% 40% at 82% 30%, rgba(139,128,110,0.08), transparent 70%),
          radial-gradient(ellipse 70% 55% at 60% 80%, rgba(120,110,95,0.10), transparent 70%);
        animation: fm-drift 26s ease-in-out infinite alternate;
      }
      @keyframes fm-drift {
        from { transform: translate3d(0,0,0) scale(1); opacity: 0.45; }
        to { transform: translate3d(-14px,-10px,0) scale(1.06); opacity: 0.6; }
      }
      /* 经纬网格 */
      .fm-grid {
        position: absolute; inset: 0; pointer-events: none; opacity: 0.4;
        background:
          linear-gradient(to right, var(--fm-line) 1px, transparent 1px),
          linear-gradient(to bottom, var(--fm-line) 1px, transparent 1px);
        background-size: 64px 64px;
        -webkit-mask-image: radial-gradient(ellipse at center, #000 40%, transparent 85%);
        mask-image: radial-gradient(ellipse at center, #000 40%, transparent 85%);
      }
      /* 地形轮廓 */
      .fm-terrain {
        position: absolute; inset: 0; pointer-events: none; opacity: 0.16;
        background:
          radial-gradient(ellipse 40% 30% at 30% 40%, var(--fm-gold) 0%, transparent 60%),
          radial-gradient(ellipse 35% 28% at 70% 60%, var(--fm-gold-soft) 0%, transparent 60%);
        filter: blur(6px);
      }
      .fm-north { position: absolute; top: 10px; left: 14px; font-size: 22px; font-weight: 700; color: var(--fm-gold); opacity: 0.5; letter-spacing: 0.1em; }
      .fm-scale { position: absolute; bottom: 8px; left: 14px; font-size: 8px; letter-spacing: 0.2em; color: var(--fm-gray); }

      /* 核心要塞 */
      .fm-capital {
        position: absolute; top: 40px; left: 50%; transform: translateX(-50%);
        display: flex; flex-direction: column; align-items: center; gap: 4px;
        z-index: 3; opacity: 0;
        animation: fm-appear 1.2s ease-out 0.4s forwards;
      }
      .fm-capital-ring {
        position: absolute; top: 6px; left: 50%; transform: translateX(-50%);
        width: 64px; height: 64px; border-radius: 50%;
        border: 1px dashed var(--fm-gold-dim);
        animation: fm-breathe 5s ease-in-out infinite;
      }
      .fm-capital-icon {
        width: 56px; height: 56px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        background: radial-gradient(circle, rgba(200,164,93,0.18), transparent 70%);
        filter: drop-shadow(0 0 10px var(--fm-gold-dim));
      }
      .fm-capital-label {
        font-family: "Noto Serif SC",serif; font-size: 11px; font-weight: 700;
        color: var(--fm-ink-soft); letter-spacing: 0.14em;
        background: linear-gradient(transparent 60%, var(--fm-gold-dim) 60%);
      }

      /* 疆域板块网格 */
      .fm-plates {
        position: relative;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
        gap: 14px;
        margin-top: 96px;
        z-index: 2;
      }
      .fm-plate {
        position: relative;
        text-align: left;
        border: none;
        background: transparent;
        padding: 0;
        cursor: pointer;
        opacity: 0;
        animation: fm-appear 0.9s ease-out forwards;
        transition: transform 220ms ease;
      }
      @media (hover: hover) {
        .fm-plate:hover { transform: translateY(-2px); }
      }
      @keyframes fm-appear {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      /* 已解锁疆域 */
      .fm-plate.unlocked {
        border: 1px solid var(--fm-line);
        background: linear-gradient(160deg, rgba(245,240,230,0.5), rgba(200,164,93,0.06));
        padding: 12px 12px 10px;
        position: relative;
      }
      .dark .fm-plate.unlocked { background: linear-gradient(160deg, rgba(30,26,20,0.4), rgba(200,164,93,0.05)); }
      .fm-plate.unlocked.active {
        border-color: var(--fm-gold);
        box-shadow: 0 0 0 1px var(--fm-gold-dim), 0 0 18px rgba(200,164,93,0.18);
      }
      .fm-plate.unlocked.active::after {
        content: "";
        position: absolute; inset: -1px;
        border: 1px solid var(--fm-gold);
        opacity: 0.5;
        animation: fm-ring 2.4s ease-out infinite;
        pointer-events: none;
      }
      @keyframes fm-ring {
        0% { inset: -1px; opacity: 0.5; }
        70% { inset: -8px; opacity: 0; }
        100% { opacity: 0; }
      }
      .fm-plate-head { display: flex; align-items: baseline; justify-content: space-between; gap: 6px; }
      .fm-plate-name {
        font-family: "Noto Serif SC","Source Han Serif SC",serif;
        font-size: 13px; font-weight: 700; color: var(--fm-ink); letter-spacing: 0.06em;
      }
      .fm-plate-coord { font-family: monospace; font-size: 8px; color: var(--fm-gray); }
      .fm-plate-seal { margin-top: 10px; opacity: 0.9; }
      .fm-plate-count { margin-top: 8px; font-size: 9px; letter-spacing: 0.12em; color: var(--fm-gray); }
      .fm-plate-seal .fm-dormant { opacity: 0.35; filter: grayscale(0.6); }

      /* 探索路径线（从已探索延伸） */
      .fm-path {
        position: absolute; top: -12px; left: 50%;
        width: 1px; height: 12px;
        background: repeating-linear-gradient(to bottom, var(--fm-gold), var(--fm-gold) 3px, transparent 3px, transparent 6px);
        opacity: 0.5;
        animation: fm-path-flow 3s linear infinite;
      }
      @keyframes fm-path-flow { to { transform: translateY(6px); } }

      /* 未探索疆域 — Terra Incognita */
      .fm-plate.incognita {
        border: 1px dashed rgba(168,159,144,0.5);
        background: rgba(168,159,144,0.05);
        min-height: 150px;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        overflow: hidden;
      }
      .fm-fog {
        position: absolute; inset: 0; pointer-events: none;
        background:
          radial-gradient(ellipse 70% 60% at 50% 50%, rgba(107,100,88,0.12), transparent 70%);
        animation: fm-fog-drift 16s ease-in-out infinite alternate;
      }
      @keyframes fm-fog-drift { from { opacity: 0.4; } to { opacity: 0.7; } }
      .fm-incognita-node {
        position: relative; z-index: 2;
        display: flex; flex-direction: column; align-items: center; gap: 6px;
      }
      .fm-breathe {
        width: 34px; height: 34px; border-radius: 50%;
        border: 1px solid var(--fm-gray);
        position: relative;
        animation: fm-breathe 4.5s ease-in-out infinite;
      }
      .fm-breathe::after {
        content: ""; position: absolute; inset: 6px; border-radius: 50%;
        border: 1px dashed var(--fm-gray); opacity: 0.6;
      }
      @keyframes fm-breathe {
        0%,100% { transform: scale(1); opacity: 0.5; box-shadow: 0 0 0 rgba(168,159,144,0); }
        50% { transform: scale(1.12); opacity: 0.9; box-shadow: 0 0 14px rgba(200,164,93,0.15); }
      }
      .fm-incognita-terra {
        font-family: "Noto Serif SC","Source Han Serif SC","Songti SC",serif;
        font-size: 12px; font-weight: 800; letter-spacing: 0.3em; color: var(--fm-gray);
      }
      .fm-incognita-label { font-size: 9px; color: var(--fm-gray); letter-spacing: 0.08em; }
      .fm-incognita-coord { position: absolute; bottom: 8px; right: 10px; font-family: monospace; font-size: 8px; color: var(--fm-gray); opacity: 0.6; }

      .fm-map-foot {
        position: relative; z-index: 2; margin-top: 18px; text-align: center;
        font-size: 10px; letter-spacing: 0.18em; color: var(--fm-gray);
        font-family: "Noto Serif SC",serif;
      }

      /* ══ 右 · 文明档案碑 ══ */
      .fm-archive {
        position: relative;
        border: 1px solid var(--fm-line);
        background: linear-gradient(175deg, rgba(245,240,230,0.6), rgba(245,240,230,0.25));
        padding: 22px 18px 18px;
        display: flex; flex-direction: column;
      }
      .dark .fm-archive { background: linear-gradient(175deg, rgba(30,26,20,0.5), rgba(30,26,20,0.2)); }
      .fm-archive-plaque { position: relative; text-align: center; padding-top: 16px; opacity: 0; animation: fm-appear 0.8s ease-out 0.2s forwards; }
      .fm-plaque-diamond {
        position: absolute; top: -4px; left: 50%; transform: translateX(-50%) rotate(45deg);
        width: 12px; height: 12px; border: 1px solid var(--fm-gold); background: var(--fm-bg);
      }
      .fm-plaque-overline { font-size: 9px; letter-spacing: 0.3em; color: var(--fm-gold); text-transform: uppercase; }
      .fm-plaque-name {
        font-family: "Noto Serif SC","Source Han Serif SC",serif;
        font-size: 22px; font-weight: 800; color: var(--fm-ink); margin: 6px 0 10px; letter-spacing: 0.1em;
      }
      .fm-plaque-meta { display: flex; align-items: center; justify-content: center; gap: 18px; font-size: 11px; color: var(--fm-ink-soft); }
      .fm-plaque-meta span { display: inline-flex; align-items: center; gap: 5px; }
      .fm-plaque-meta svg { color: var(--fm-gold); }

      .fm-archive-divider {
        height: 1px; margin: 18px 0;
        background: linear-gradient(90deg, transparent, var(--fm-gold) 40%, var(--fm-gold) 60%, transparent);
      }

      .fm-node-list { display: flex; flex-direction: column; gap: 8px; flex: 1; }
      .fm-node-empty { text-align: center; color: var(--fm-gray); font-size: 12px; padding: 24px 0; font-style: italic; }

      .fm-node {
        display: flex; align-items: center; gap: 12px;
        width: 100%; text-align: left;
        border: 1px solid var(--fm-line);
        background: transparent;
        padding: 9px 12px;
        cursor: pointer;
        transition: all 200ms ease;
        opacity: 0;
        animation: fm-appear 0.6s ease-out forwards;
      }
      /* 建筑蓝图生成 — 已解锁节点以线稿绘制方式显现 */
      .fm-node.established {
        border-color: rgba(200,164,93,0.4);
        position: relative;
      }
      .fm-node.established::before {
        content: ""; position: absolute; inset: 0; pointer-events: none;
        border: 1px solid var(--fm-gold);
        opacity: 0;
        animation: fm-blueprint-draw 1.4s ease-out 0.15s forwards;
      }
      @keyframes fm-blueprint-draw {
        0% { inset: 0; opacity: 0; clip-path: inset(0 100% 0 0); }
        40% { opacity: 0.9; clip-path: inset(0 0 0 0); }
        100% { opacity: 0; clip-path: inset(0 0 0 0); }
      }
      .fm-node.established .fm-node-icon {
        opacity: 1;
        filter: drop-shadow(0 0 6px rgba(200,164,93,0.35));
        animation: fm-blueprint-icon 1.4s ease-out 0.1s both;
      }
      @keyframes fm-blueprint-icon {
        0% { opacity: 0; transform: scale(0.7); }
        45% { opacity: 1; transform: scale(1.08); }
        100% { opacity: 1; transform: scale(1); }
      }
      .fm-node.locked { opacity: 0.45; border-color: rgba(168,159,144,0.3); }
      .fm-node.locked .fm-node-icon { filter: grayscale(0.7); }
      .fm-node.building { border-color: rgba(217,164,93,0.5); }
      .fm-node.selected {
        border-color: var(--fm-gold);
        box-shadow: 0 0 0 1px var(--fm-gold-dim), 0 0 14px rgba(200,164,93,0.14);
      }
      @media (hover: hover) {
        .fm-node:hover { transform: translateX(3px); border-color: var(--fm-gold); }
      }
      .fm-node-icon { position: relative; display: inline-flex; flex-shrink: 0; }
      .fm-node-icon.dormant { opacity: 0.5; }
      .fm-archive-detail { margin-top: 16px; }
      .fm-archive-foot { margin-top: 16px; text-align: center; }
      .fm-foot-link {
        font-family: "Noto Serif SC",serif; font-style: italic; font-size: 12px;
        color: var(--fm-gold); text-decoration: none; letter-spacing: 0.06em;
      }
      .fm-foot-link:hover { text-decoration: underline; }

      /* 建设流光 */
      .fm-shimmer {
        position: absolute; inset: -2px; border-radius: 4px;
        background: linear-gradient(115deg, transparent 20%, rgba(217,164,93,0.22) 50%, transparent 80%);
        background-size: 200% 100%;
        animation: fm-shimmer 2.6s linear infinite;
        pointer-events: none;
      }
      @keyframes fm-shimmer { to { background-position: -200% 0; } }

      .fm-node-star { color: var(--fm-gold); flex-shrink: 0; }
    ` }} />
  );
}