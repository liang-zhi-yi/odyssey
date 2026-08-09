"use client";

import { useMemo } from "react";
import { useLocale } from "@/hooks/useLocale";

/* ═══════════════════════════════════════════════════════════════
   文明演化轨迹 — Civilization Evolution Trajectory
   ───────────────────────────────────────────────────────────────
   将「路径综合能力成长曲线 / 数据折线图」重构为「文明演化轨迹」：
   - 取消传统 XY 坐标系 / 网格 / 纵向阶段带
   - 一条具有生命感的横向文明轨迹（从文明火种到未来）
   - 每个阶段使用独特文明印记（非圆点）：火种 / 探索 / 积累 / 建造 / 智能化 / 未来
   - 已解锁节点 = 古金色 + 轻微光晕；未解锁节点 = 降低透明度
   - 当前阶段 = 「文明核心」：小型金色晶体核心 + 呼吸动画 + 微弱粒子扩散
   - 数据不足时显示「文明火种阶段 / 正在记录你的第一次探索」
   - 当前阶段由后端 World 真实 era 推导，数据越多文明越向前演化
   禁止：普通折线图、Excel 坐标轴、网格背景、绿色元素、大型圆形节点
   ═══════════════════════════════════════════════════════════════ */

/* ── Odyssey 颜色（米白 / 古金 / 青铜 / 深棕 / 黑） ── */
const C = {
  gold: "#C9A45C",
  goldLight: "#D4B068",
  goldDark: "#A08850",
  deepBrown: "#3A3028",
  warmBrown: "#8B8068",
  dimGold: "#C9A45C40",
  faintGold: "#C9A45C14",
} as const;

/** 文明阶段（演化顺序：诞生 → 探索 → 积累 → 建造 → 智能化 → 未来） */
const STAGE_COUNT = 6;

/** 阶段节点在轨迹上的坐标（轻微上升的弧形文明路径，非直线） */
const NODES = [
  { x: 64, y: 190 },
  { x: 185, y: 162 },
  { x: 306, y: 136 },
  { x: 427, y: 113 },
  { x: 548, y: 94 },
  { x: 656, y: 84 },
];

/** 由后端 World era 推导当前阶段索引（与「我的世界」保持一致） */
function eraToStage(era?: string): number {
  switch (era) {
    case "AGRICULTURE":
      return 1;
    case "ACADEMY":
      return 2;
    case "INDUSTRY":
      return 3;
    case "INFORMATION":
      return 4;
    case "AI":
      return 4;
    case "INTELLIGENCE":
    case "DIGITAL":
    case "FUTURE":
      return 5;
    default:
      return 0; // WILDERNESS
  }
}

/* ── 平滑曲线（Catmull-Rom → Bezier） ───────────────────── */
function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2)
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

interface CivilizationEvolutionProps {
  worldEra?: string;
  /** 是否存在任何成长数据（技能 / 建筑 / 任务 / 轨迹点） */
  hasAnyData: boolean;
  isLoading: boolean;
}

/** 文明印记图标（每个阶段独特符号，非圆点） */
function StageIcon({ type, isCurrent }: { type: number; isCurrent: boolean }) {
  const s = isCurrent ? 1.12 : 1;
  const stroke = C.gold;
  const w = isCurrent ? 1.5 : 1.2;
  return (
    <g transform={`scale(${s})`} stroke={stroke} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* 文明火种：火焰晶体 */}
      {type === 0 && (
        <>
          <path d="M0 -9 C 5.2 -4 7 1.5 4.2 7 C 2.6 10 -2.6 10 -4.2 7 C -7 1.5 -5.2 -4 0 -9 Z" />
          <path d="M0 -5 C 2.6 -1.5 3.4 1.5 2 5 C 1.2 6.6 -1.2 6.6 -2 5 C -3.4 1.5 -2.6 -1.5 0 -5 Z" opacity="0.75" />
        </>
      )}
      {/* 探索：指南针 / 星图 */}
      {type === 1 && (
        <>
          <circle r="9" />
          <path d="M0 -8 L2.4 -2.4 L8 0 L2.4 2.4 L0 8 L-2.4 2.4 L-8 0 L-2.4 -2.4 Z" />
          <circle r="1" fill={C.gold} stroke="none" />
        </>
      )}
      {/* 积累：书卷 */}
      {type === 2 && (
        <>
          <path d="M-9 -6.5 H9 V5 Q9 7.5 7 7.5 H-7 Q-9 7.5 -9 5 Z" />
          <path d="M-9 -6.5 Q-6 -9 -2 -6.5 M9 -6.5 Q6 -9 2 -6.5" />
          <line x1="-4" y1="-1" x2="4" y2="-1" opacity="0.6" />
          <line x1="-4" y1="2.5" x2="4" y2="2.5" opacity="0.6" />
        </>
      )}
      {/* 建造：建筑 / 齿轮 */}
      {type === 3 && (
        <>
          <path d="M-7.5 8.5 V-2.5 L0 -8.5 L7.5 -2.5 V8.5 Z" />
          <path d="M-2.6 8.5 V1.5 H2.6 V8.5" />
          <circle cx="0" cy="-11" r="2.4" opacity="0.7" />
        </>
      )}
      {/* 智能化：AI 核心晶体 */}
      {type === 4 && (
        <>
          <path d="M0 -9.5 L8.2 -4.8 L8.2 4.8 L0 9.5 L-8.2 4.8 L-8.2 -4.8 Z" />
          <circle cx="0" cy="0" r="2.6" />
          <line x1="0" y1="-9.5" x2="0" y2="-2.6" opacity="0.7" />
          <line x1="0" y1="2.6" x2="0" y2="9.5" opacity="0.7" />
          <line x1="-8.2" y1="-4.8" x2="-2.6" y2="0" opacity="0.7" />
          <line x1="8.2" y1="-4.8" x2="2.6" y2="0" opacity="0.7" />
        </>
      )}
      {/* 未来：未来文明徽章 */}
      {type === 5 && (
        <>
          <circle r="8.5" />
          <path d="M0 -5.5 L1.6 -1.8 L5.6 -1.8 L2.4 0.8 L3.4 4.7 L0 2.4 L-3.4 4.7 L-2.4 0.8 L-5.6 -1.8 L-1.6 -1.8 Z" fill={C.gold} stroke="none" />
        </>
      )}
    </g>
  );
}

/** 当前节点「文明核心」：金色晶体核心 + 呼吸动画 + 微弱粒子扩散 */
function CurrentCore() {
  return (
    <g>
      <circle className="evo-ring" r="8" fill="none" stroke={C.gold} strokeWidth="1" />
      <circle className="evo-ring evo-ring2" r="8" fill="none" stroke={C.gold} strokeWidth="0.6" />
      <g className="evo-breathe">
        <path d="M0 -8 L7 0 L0 8 L-7 0 Z" fill="none" stroke={C.goldLight} strokeWidth="1.5" filter="url(#evo-glow)" />
        <circle r="2.3" fill={C.gold} />
      </g>
      {/* 微弱粒子扩散 */}
      <g className="evo-particle" style={{ "--dx": "-12px", "--dy": "-15px", animationDelay: "0s" } as React.CSSProperties}>
        <circle r="1.4" fill={C.gold} />
      </g>
      <g className="evo-particle" style={{ "--dx": "13px", "--dy": "-9px", animationDelay: "0.8s" } as React.CSSProperties}>
        <circle r="1.1" fill={C.goldLight} />
      </g>
      <g className="evo-particle" style={{ "--dx": "9px", "--dy": "14px", animationDelay: "1.5s" } as React.CSSProperties}>
        <circle r="1.2" fill={C.gold} />
      </g>
      <g className="evo-particle" style={{ "--dx": "-8px", "--dy": "13px", animationDelay: "2.1s" } as React.CSSProperties}>
        <circle r="0.9" fill={C.goldLight} />
      </g>
    </g>
  );
}

export function CivilizationEvolutionTrajectory({
  worldEra,
  hasAnyData,
  isLoading,
}: CivilizationEvolutionProps) {
  const { t } = useLocale();
  const txt = useMemo(() => {
    const tr = (k: string) => t(`skills.trajectory.${k}`);
    return {
      stage: tr("evoStage"),
      names: [
        tr("evoSpark"),
        tr("evoExplore"),
        tr("evoAccumulate"),
        tr("evoBuild"),
        tr("evoIntelligence"),
        tr("evoFuture"),
      ],
      unlocked: tr("evoUnlocked"),
      locked: tr("evoLocked"),
      current: tr("evoCurrent"),
      seedPhase: tr("seedPhase"),
      seedDesc: tr("seedDesc"),
      seedHint: tr("seedHint"),
    };
  }, [t]);

  if (isLoading) {
    return (
      <div className="h-64 w-full">
        <div className="h-64 w-full bg-[#C9A45C]/10 skeleton-shimmer" />
      </div>
    );
  }

  // 当前阶段：有数据则由 era 推导；无数据时处于「火种前的未开始」状态
  const currentStage = hasAnyData ? eraToStage(worldEra) : -1;

  // 已解锁（含当前）与未来虚线分段
  const solidPath = buildSmoothPath(
    currentStage >= 1 ? NODES.slice(0, currentStage + 1) : currentStage === 0 ? NODES.slice(0, 1) : []
  );
  const futurePath = buildSmoothPath(
    currentStage >= 0 ? NODES.slice(currentStage) : NODES
  );
  const isFull = currentStage === STAGE_COUNT - 1;

  return (
    <div className="relative">
      <div className="overflow-x-auto">
        <svg
          viewBox="0 0 720 250"
          className="w-full min-w-[560px]"
          role="img"
          aria-label={txt.stage}
        >
          <defs>
            <filter id="evo-glow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="evo-trail" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={C.goldDark} stopOpacity="0.55" />
              <stop offset="50%" stopColor={C.goldLight} stopOpacity="1" />
              <stop offset="100%" stopColor={C.gold} stopOpacity="0.95" />
            </linearGradient>
            <pattern id="evo-hex" width="80" height="138" patternUnits="userSpaceOnUse" patternTransform="scale(0.5)">
              <path d="M40 5 L72 22 L72 56 L40 73 L8 56 L8 22 Z" fill="none" stroke={C.dimGold} strokeWidth="0.4" />
            </pattern>
            <style>{`
              @keyframes evo-draw { from { stroke-dashoffset: var(--tl); } to { stroke-dashoffset: 0; } }
              @keyframes evo-fade { from { opacity: 0; } to { opacity: 1; } }
              @keyframes evo-node { 0% { opacity: 0; } 100% { opacity: 1; } }
              @keyframes evo-breathe { 0%,100% { opacity: 0.72; transform: scale(1); } 50% { opacity: 1; transform: scale(1.12); } }
              @keyframes evo-ring { 0% { opacity: 0.55; transform: scale(0.55); } 100% { opacity: 0; transform: scale(2.1); } }
              @keyframes evo-particle { 0% { opacity: 0.8; transform: translate(0,0); } 100% { opacity: 0; transform: translate(var(--dx), var(--dy)); } }
              .evo-line { animation: evo-draw 1.6s cubic-bezier(0.16,1,0.3,1) forwards; stroke-dasharray: var(--tl); stroke-dashoffset: var(--tl); }
              .evo-fade { animation: evo-fade 1s ease-out forwards; opacity: 0; }
              .evo-node { animation: evo-node .6s ease-out forwards; opacity: 0; }
              .evo-breathe { animation: evo-breathe 3.2s ease-in-out infinite; transform-origin: 0 0; }
              .evo-ring { animation: evo-ring 2.6s ease-out infinite; transform-origin: 0 0; }
              .evo-ring2 { animation-delay: 1.3s; }
              .evo-particle { animation: evo-particle 2.6s ease-out infinite; }
            `}</style>
          </defs>

          {/* 极低透明度星图 / 文明纹理背景 */}
          <rect x="0" y="0" width="720" height="250" fill="url(#evo-hex)" opacity="0.5" className="evo-fade" />

          {/* 背景星座微点（古文明星图） */}
          <g className="evo-fade" style={{ animationDelay: "0.2s" }}>
            {[
              { x: 120, y: 60 }, { x: 300, y: 40 }, { x: 470, y: 50 }, { x: 610, y: 42 },
              { x: 200, y: 220 }, { x: 400, y: 214 }, { x: 560, y: 220 }, { x: 90, y: 130 },
              { x: 520, y: 170 }, { x: 660, y: 150 },
            ].map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="0.8" fill={C.gold} opacity="0.35" />
            ))}
          </g>

          {/* 未来虚线轨迹（未到达部分，降低透明度） */}
          {futurePath && currentStage < STAGE_COUNT - 1 && (
            <path
              className="evo-fade"
              style={{ animationDelay: "0.5s" }}
              d={futurePath}
              fill="none"
              stroke={C.gold}
              strokeWidth="1.2"
              strokeDasharray="3 6"
              opacity="0.3"
            />
          )}

          {/* 已解锁实线轨迹（从左向右绘制） */}
          {solidPath && (
            <path
              className="evo-line"
              d={solidPath}
              fill="none"
              stroke="url(#evo-trail)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ ["--tl" as string]: isFull ? 720 : 900 } as React.CSSProperties}
            />
          )}

          {/* 文明印记节点 */}
          {txt.names.map((name, i) => {
            const isCurrent = i === currentStage;
            const isUnlocked = hasAnyData && i <= currentStage;
            const opacity = isCurrent ? 1 : isUnlocked ? 0.92 : 0.3;
            const x = NODES[i].x;
            const y = NODES[i].y;
            return (
              <g
                key={i}
                transform={`translate(${x} ${y})`}
                className="evo-node"
                style={{ animationDelay: `${0.6 + i * 0.14}s` } as React.CSSProperties}
              >
                <g opacity={opacity}>
                  <StageIcon type={i} isCurrent={isCurrent} />
                </g>

                {/* 已解锁：轻微光晕 */}
                {isUnlocked && !isCurrent && (
                  <circle r="14" fill="none" stroke={C.gold} strokeWidth="0.5" opacity="0.3" filter="url(#evo-glow)" />
                )}

                {/* 当前文明核心 */}
                {isCurrent && <CurrentCore />}

                {/* 阶段文字 */}
                <text
                  y={30}
                  textAnchor="middle"
                  className="font-mono"
                  fontSize="8.5"
                  letterSpacing="1.2"
                  fill={isCurrent ? C.gold : C.warmBrown}
                  opacity={isCurrent ? 1 : isUnlocked ? 0.85 : 0.45}
                >
                  {name}
                </text>
              </g>
            );
          })}

          {/* 左侧文明火种起点标记 */}
          <text x={NODES[0].x} y={NODES[0].y - 30} textAnchor="middle" fontSize="7" letterSpacing="1.5" fill={C.warmBrown} opacity="0.5" className="evo-fade" style={{ animationDelay: "0.6s" }}>
            ✦ {txt.names[0]}
          </text>
          {/* 右侧未来终点标记 */}
          <text x={NODES[5].x} y={NODES[5].y - 26} textAnchor="middle" fontSize="7" letterSpacing="1.5" fill={C.warmBrown} opacity="0.5" className="evo-fade" style={{ animationDelay: "1.4s" }}>
            ★ {txt.names[5]}
          </text>
        </svg>
      </div>

      {/* 图例：已解锁 / 未解锁 / 当前 */}
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 px-1">
        <span className="flex items-center gap-1.5 text-[10px] text-[#8B8068]">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#C9A45C] opacity-90" />
          {txt.unlocked}
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-[#8B8068]">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#C9A45C] opacity-30" />
          {txt.locked}
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-[#8B8068]">
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="#C9A45C" strokeWidth="1.5">
            <path d="M12 2 L18 9 L12 22 L6 9 Z" />
          </svg>
          {txt.current}
        </span>
      </div>

      {/* 数据不足：文明火种阶段 */}
      {!hasAnyData && (
        <div className="mt-4 border-t border-[#C9A45C]/15 pt-4 text-center">
          <p className="text-sm font-civ-serif font-semibold text-[#3A3028] dark:text-[oklch(0.85_0.04_80)]">
            {txt.seedPhase}
          </p>
          <p className="mt-1 text-xs text-[#8B8068]">{txt.seedDesc}</p>
          <p className="mt-1 text-[11px] text-[#8B8068]/60 font-civ-serif italic">{txt.seedHint}</p>
        </div>
      )}
    </div>
  );
}
