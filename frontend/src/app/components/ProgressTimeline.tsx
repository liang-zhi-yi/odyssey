"use client";

import { useMemo } from "react";
import type { SkillGrowthPoint } from "@/types/progress";
import { useLocale } from "@/hooks/useLocale";

interface SkillDataset {
  name: string;
  points: SkillGrowthPoint[];
  color?: string;
}

interface ProgressTimelineProps {
  points?: SkillGrowthPoint[];
  datasets?: SkillDataset[];
  skillName?: string;
  isLoading: boolean;
}

/* ═══════════════════════════════════════════════════════════════
   Civilization Chronicle — 文明成长纪年轴
   ───────────────────────────────────────────────────────────────
   将「数据折线图」重构为「记录个人文明演化的纪年档案」。
   - 无 Y 轴数字、无网格、无普通折线
   - 横向文明路径（轻微弧线），如探索迁徙路线
   - 节点 = 文明印记，按事件类型显示不同符号：
       文明火种 / 学习 / 技能 / 创造 / 当前
   - 三态自动切换（新用户 / 成长中 / 成熟）
   - 所有数据来自真实成长记录，不写死
   ═══════════════════════════════════════════════════════════════ */

/* ── Odyssey 颜色（米白 / 古金 / 深棕 / 森林灰绿） ────── */
const C = {
  gold: "#C9A45C",
  goldLight: "#D4B068",
  goldDark: "#A08850",
  deepBrown: "#3A3028",
  warmBrown: "#8B8068",
  parchment: "#F8F4EA",
  forest: "#6D8068",
  dimGold: "#C9A45C40",
  faintGold: "#C9A45C14",
} as const;

interface TrajectoryText {
  stageOrigin: string;
  stageForm: string;
  stageAccumulate: string;
  stageExplore: string;
  zoneExplore: string;
  zoneGrowth: string;
  zoneCreate: string;
  phaseSeed: string;
  phaseSprout: string;
  phaseGrow: string;
  phaseAdvance: string;
  phaseBloom: string;
  phaseCurrent: string;
  emptyTitle: string;
  emptyDesc: string;
  emptyHint: string;
  predictedPath: string;
  legendTrajectory: string;
  nodeOrigin: string;
  nodeLearn: string;
  nodeSkill: string;
  nodeProject: string;
  nodeCurrent: string;
  noPathTitle: string;
  noPathDesc: string;
  noPathHint: string;
  eraWild: string;
  eraAgri: string;
  eraAcademy: string;
  eraIndustry: string;
  eraInfo: string;
  eraAi: string;
}

/* ── 节点事件类型（由真实分数推导，非写死） ───────────── */
type NodeType = "origin" | "learn" | "skill" | "project" | "current";

function nodeTypeOf(score: number, index: number, total: number): NodeType {
  if (index === 0) return "origin";
  if (index === total - 1) return "current";
  if (score >= 70) return "project"; // 创造 / 建设
  if (score >= 35) return "skill"; // 技能形成
  return "learn"; // 学习 / 探索
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

/* ── 文明印记节点（按事件类型） ──────────────────────── */
function ChronicleNode({
  type,
  x,
  y,
  isCurrent,
  txt,
  delay,
}: {
  type: NodeType;
  x: number;
  y: number;
  isCurrent: boolean;
  txt: TrajectoryText;
  delay: number;
}) {
  const label =
    type === "origin"
      ? txt.nodeOrigin
      : type === "learn"
        ? txt.nodeLearn
        : type === "skill"
          ? txt.nodeSkill
          : type === "project"
            ? txt.nodeProject
            : txt.nodeCurrent;

  const stroke = isCurrent ? C.gold : C.gold;
  const size = type === "current" ? 5 : type === "origin" ? 4.5 : 3.5;
  const opacity = isCurrent ? 1 : type === "origin" ? 0.85 : 0.6;

  return (
    <g transform={`translate(${x} ${y})`}>
      {/* 当前节点脉冲环 */}
      {isCurrent && (
        <circle className="tg-ring" r="9" fill="none" stroke={C.gold} strokeWidth="1" />
      )}
      <g
        className={isCurrent ? "tg-node tg-current" : "tg-node"}
        style={{ animationDelay: `${delay}s` }}
      >
        {/* 文明火种（初始） */}
        {type === "origin" && (
          <>
            <circle r={size} fill="none" stroke={stroke} strokeWidth="1" opacity={opacity} />
            <path
              d={`M${-size * 0.5} 0 Q0 ${-size * 1.1} ${size * 0.5} 0 Q0 ${size * 0.9} ${-size * 0.5} 0`}
              fill="none" stroke={C.gold} strokeWidth="1" opacity={opacity}
            />
            <circle r="1" fill={C.gold} opacity={opacity} />
          </>
        )}
        {/* 学习（书卷） */}
        {type === "learn" && (
          <>
            <path
              d={`M${-size * 0.7} ${-size * 0.55} H${size * 0.7} V${size * 0.55} Q0 ${size * 0.35} ${-size * 0.7} ${size * 0.55} Z`}
              fill="none" stroke={stroke} strokeWidth="1" opacity={opacity}
            />
            <line x1={0} y1={-size * 0.55} x2={0} y2={size * 0.5} stroke={stroke} strokeWidth="0.7" opacity={opacity} />
          </>
        )}
        {/* 技能（能力印记 / 六边形） */}
        {type === "skill" && (
          <polygon
            points={Array.from({ length: 6 }, (_, i) => {
              const a = (Math.PI / 3) * i - Math.PI / 6;
              return `${(Math.cos(a) * size).toFixed(1)} ${(Math.sin(a) * size).toFixed(1)}`;
            }).join(" ")}
            fill="none" stroke={stroke} strokeWidth="1" opacity={opacity}
          />
        )}
        {/* 创造（建筑） */}
        {type === "project" && (
          <path
            d={`M${-size} ${size} L${-size} ${-size * 0.2} L0 ${-size} L${size} ${-size * 0.2} L${size} ${size} Z`}
            fill="none" stroke={stroke} strokeWidth="1" opacity={opacity}
          />
        )}
        {/* 当前（文明核心） */}
        {type === "current" && (
          <>
            <path
              d={`M0 ${-size} L${size * 0.9} 0 L0 ${size} L${-size * 0.9} 0 Z`}
              fill="none" stroke={stroke} strokeWidth="1.2"
            />
            <circle r="1.5" fill={C.gold} />
          </>
        )}
      </g>
      {/* 节点文字 */}
      <text
        y={size + 12}
        textAnchor="middle"
        className="text-[7px] font-mono tracking-[0.12em] uppercase"
        fill={isCurrent ? C.gold : C.warmBrown}
        opacity={isCurrent ? 1 : 0.5}
        style={{ fontFamily: "inherit" }}
      >
        {label}
      </text>
    </g>
  );
}

/* ═══════════════════════════════════════════════════════════════ */

export function ProgressTimeline({ points, datasets, skillName, isLoading }: ProgressTimelineProps) {
  const { t, locale } = useLocale();
  const isEn = locale === "en";
  // 逐个解析轨迹文案键（t() 仅返回叶子字符串，不能直接返回嵌套对象）
  const txt = useMemo(() => {
    const tr = (k: string) => t(`skills.trajectory.${k}`);
    return {
      stageOrigin: tr("stageOrigin"),
      stageForm: tr("stageForm"),
      stageAccumulate: tr("stageAccumulate"),
      stageExplore: tr("stageExplore"),
      zoneExplore: tr("zoneExplore"),
      zoneGrowth: tr("zoneGrowth"),
      zoneCreate: tr("zoneCreate"),
      phaseSeed: tr("phaseSeed"),
      phaseSprout: tr("phaseSprout"),
      phaseGrow: tr("phaseGrow"),
      phaseAdvance: tr("phaseAdvance"),
      phaseBloom: tr("phaseBloom"),
      phaseCurrent: tr("phaseCurrent"),
      emptyTitle: tr("emptyTitle"),
      emptyDesc: tr("emptyDesc"),
      emptyHint: tr("emptyHint"),
      predictedPath: tr("predictedPath"),
      legendTrajectory: tr("legendTrajectory"),
      nodeOrigin: tr("nodeOrigin"),
      nodeLearn: tr("nodeLearn"),
      nodeSkill: tr("nodeSkill"),
      nodeProject: tr("nodeProject"),
      nodeCurrent: tr("nodeCurrent"),
      noPathTitle: tr("noPathTitle"),
      noPathDesc: tr("noPathDesc"),
      noPathHint: tr("noPathHint"),
      eraWild: tr("eraWild"),
      eraAgri: tr("eraAgri"),
      eraAcademy: tr("eraAcademy"),
      eraIndustry: tr("eraIndustry"),
      eraInfo: tr("eraInfo"),
      eraAi: tr("eraAi"),
    } as TrajectoryText;
  }, [t]);

  const allDatasets: SkillDataset[] = useMemo(
    () =>
      datasets
        ? datasets
        : points && points.length > 0
          ? [{ name: skillName || "Skill", points }]
          : [],
    [datasets, points, skillName]
  );

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-1/3 rounded bg-[#C9A45C]/15 skeleton-shimmer" />
        <div className="h-60 rounded bg-[#C9A45C]/10 skeleton-shimmer" />
      </div>
    );
  }

  const primary = allDatasets[0];
  const totalCount = allDatasets.reduce((n, ds) => n + ds.points.length, 0);

  // ── 状态1：新用户（无数据） → 文明尚未建立 ──
  if (allDatasets.length === 0 || totalCount === 0) {
    return <NewCivilizationEmptyState txt={txt} isEn={isEn} />;
  }

  // 极少事件（≤3）也进入文明初始模式
  const showInitial = totalCount <= 3;

  const w = 680;
  const h = 300;
  const pad = { top: 30, right: 28, bottom: 58, left: 28 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;

  const allScores = allDatasets.flatMap((ds) => ds.points.map((p) => p.score));
  const minScore = Math.max(0, Math.floor(Math.min(...allScores) / 10) * 10);
  const maxScore = Math.min(100, Math.ceil(Math.max(...allScores) / 10) * 10 + 10);
  const scoreRange = maxScore - minScore || 1;
  const yScale = (score: number) => pad.top + chartH - ((score - minScore) / scoreRange) * chartH;

  /* ── 阶段带（纵向） ── */
  const stageBands = [
    { key: "stageExplore", from: 0, to: 25 },
    { key: "stageAccumulate", from: 25, to: 50 },
    { key: "stageForm", from: 50, to: 75 },
    { key: "stageOrigin", from: 75, to: 100 },
  ] as const;

  /* ── 区域（横向：探索/成长/创造） ── */
  const zones = [
    { key: "zoneExplore", x0: 0, x1: 0.33 },
    { key: "zoneGrowth", x0: 0.33, x1: 0.66 },
    { key: "zoneCreate", x0: 0.66, x1: 1 },
  ] as const;

  const xScale = (i: number, len: number) =>
    pad.left + (i / Math.max(len - 1, 1)) * chartW;

  const coords = (primary?.points ?? []).map((p, i) => ({
    x: xScale(i, primaryCount()),
    y: yScale(p.score),
    score: p.score,
    index: i,
  }));

  function primaryCount() {
    return primary?.points.length ?? 0;
  }

  const smoothPath = buildSmoothPath(coords);

  /* 预测虚线路径（状态2） */
  let predictedPath = "";
  if (showInitial && coords.length >= 1) {
    const last = coords[coords.length - 1];
    const steps = [
      { dx: 0.28, dy: -0.14 },
      { dx: 0.58, dy: -0.34 },
      { dx: 0.84, dy: -0.56 },
      { dx: 1, dy: -0.72 },
    ];
    let d = `M ${last.x} ${last.y}`;
    for (const s of steps) {
      d += ` L ${pad.left + s.dx * chartW} ${last.y - s.dy * chartH}`;
    }
    predictedPath = d;
  }

  return (
    <div className="relative">
      {/* ── 图例（多数据集） ── */}
      {allDatasets.length > 1 && (
        <div className="flex flex-wrap items-center gap-4 mb-2 px-1">
          <span className="text-[10px] font-mono tracking-[0.18em] uppercase text-[#8B8068]/60">
            {txt.legendTrajectory}
          </span>
          <div className="flex flex-wrap gap-3">
            {allDatasets.map((ds) => (
              <div key={ds.name} className="flex items-center gap-1.5 text-xs">
                <span className="inline-block h-1.5 w-1.5" style={{ backgroundColor: ds.color || C.gold }} />
                <span className="text-[#8B8068]">{ds.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full min-w-[340px]" role="img" aria-label="文明成长纪年轴">
          <defs>
            <filter id="cc-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="cc-trail" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={C.goldDark} stopOpacity="0.5" />
              <stop offset="45%" stopColor={C.goldLight} stopOpacity="1" />
              <stop offset="100%" stopColor={C.gold} stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="cc-glowgrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.gold} stopOpacity="0.13" />
              <stop offset="100%" stopColor={C.gold} stopOpacity="0" />
            </linearGradient>
            <pattern id="cc-texture" width="80" height="138" patternUnits="userSpaceOnUse" patternTransform="scale(0.5)">
              <path d="M40 5 L72 22 L72 56 L40 73 L8 56 L8 22 Z" fill="none" stroke={C.dimGold} strokeWidth="0.4" />
            </pattern>
            <style>{`
              @keyframes cc-draw { from { stroke-dashoffset: var(--tl); } to { stroke-dashoffset: 0; } }
              @keyframes cc-in { from { opacity: 0; } to { opacity: 1; } }
              @keyframes cc-node { 0% { opacity: 0; transform: translateY(3px); } 100% { opacity: 1; transform: translateY(0); } }
              @keyframes cc-breathe { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
              @keyframes cc-ring { 0%,100% { r: 7; opacity: 0.35; } 50% { r: 14; opacity: 0; } }
              .cc-line { animation: cc-draw 1.5s cubic-bezier(0.16,1,0.3,1) forwards; stroke-dasharray: var(--tl); stroke-dashoffset: var(--tl); }
              .cc-glow { animation: cc-in 1s ease-out .6s forwards; opacity: 0; }
              .cc-fade { animation: cc-in 1s ease-out forwards; opacity: 0; }
              .cc-node { animation: cc-node .5s ease-out forwards; opacity: 0; }
              .cc-current { animation: cc-breathe 3s ease-in-out infinite; }
              .cc-ring { animation: cc-ring 3s ease-in-out infinite; }
            `}</style>
          </defs>

          {/* 背景纹理 */}
          <rect x={pad.left} y={pad.top} width={chartW} height={chartH} fill="url(#cc-texture)" opacity="0.5" className="cc-fade" />

          {/* 阶段带 */}
          {stageBands.map((sb, i) => {
            const yTop = yScale(sb.to);
            const yBot = yScale(sb.from);
            return (
              <g key={sb.key} className="cc-fade" style={{ animationDelay: `${0.2 + i * 0.1}s` }}>
                <rect
                  x={pad.left} y={yTop} width={chartW} height={Math.max(0, yBot - yTop)}
                  fill={i % 2 === 0 ? C.faintGold : "transparent"}
                />
                <text x={w - pad.right - 6} y={yTop + 12} textAnchor="end" className="text-[9px] font-mono tracking-widest" fill={C.warmBrown} opacity="0.45">
                  {txt[sb.key as keyof TrajectoryText]}
                </text>
              </g>
            );
          })}

          {/* 区域背景 */}
          {zones.map((z, i) => (
            <g key={z.key} className="cc-fade" style={{ animationDelay: `${0.4 + i * 0.12}s` }}>
              <rect
                x={pad.left + z.x0 * chartW} y={pad.top + 24}
                width={chartW * (z.x1 - z.x0)} height={chartH - 24}
                fill={C.forest} opacity="0.03"
              />
              <text
                x={pad.left + chartW * (z.x0 + z.x1) / 2} y={pad.top + 40}
                textAnchor="middle" className="text-[8px] font-mono tracking-[0.25em] uppercase"
                fill={C.forest} opacity="0.4"
              >
                {txt[z.key as keyof TrajectoryText]}
              </text>
            </g>
          ))}

          {/* 轨迹 */}
          {coords.length >= 1 && (
            <g key="main">
              {coords.length >= 2 && !showInitial && (
                <path
                  className="cc-glow"
                  d={`${smoothPath} L ${coords[coords.length - 1].x} ${pad.top + chartH} L ${coords[0].x} ${pad.top + chartH} Z`}
                  fill="url(#cc-glowgrad)"
                />
              )}
              {predictedPath && (
                <path d={predictedPath} fill="none" stroke={C.gold} strokeWidth="1.4" strokeDasharray="5 5" opacity="0.5" className="cc-glow" />
              )}
              {!showInitial && (
                <path
                  className="cc-line"
                  d={smoothPath} fill="none"
                  stroke="url(#cc-trail)"
                  strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"
                  filter="url(#cc-glow)"
                  style={{ ["--tl" as string]: 620 } as React.CSSProperties}
                />
              )}

              {/* 文明印记节点 */}
              {coords.map((c, i) => {
                const type = nodeTypeOf(c.score, i, coords.length);
                const isCurrent = i === coords.length - 1;
                return (
                  <ChronicleNode
                    key={`n-${i}`}
                    type={type}
                    x={c.x}
                    y={c.y}
                    isCurrent={isCurrent}
                    txt={txt}
                    delay={0.6 + i * 0.08}
                  />
                );
              })}
            </g>
          )}

          {/* 底部时间轴 */}
          <line x1={pad.left} y1={h - 10} x2={w - pad.right} y2={h - 10} stroke={C.dimGold} strokeWidth="0.5" className="cc-fade" />
          <circle cx={pad.left} cy={h - 10} r="1.5" fill={C.goldDark} opacity="0.5" className="cc-fade" />
          <circle cx={w - pad.right} cy={h - 10} r="1.5" fill={C.gold} opacity="0.7" className="cc-fade">
            <animate attributeName="opacity" values="0.7;0.3;0.7" dur="3s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   状态1：新用户 → 文明尚未建立 + 预测虚线路径
   ═══════════════════════════════════════════════════════════════ */
function NewCivilizationEmptyState({ txt, isEn }: { txt: TrajectoryText; isEn: boolean }) {
  const future = ["phaseSeed", "phaseSprout", "phaseGrow", "phaseAdvance", "phaseBloom"];
  return (
    <div className="relative flex flex-col items-center justify-center py-10 px-4 text-center">
      <div className="relative w-full max-w-md h-44 mb-4">
        <svg className="w-full h-full" viewBox="0 0 400 176" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="nc-dash" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={C.gold} stopOpacity="0.12" />
              <stop offset="100%" stopColor={C.gold} stopOpacity="0.4" />
            </linearGradient>
            <style>{`
              @keyframes nc-fade { from { opacity: 0; } to { opacity: 1; } }
              @keyframes nc-pulse { 0%,100% { opacity: 0.45; } 50% { opacity: 1; } }
              .nc-fade { animation: nc-fade 1.2s ease-out forwards; opacity: 0; }
              .nc-pulse { animation: nc-pulse 3s ease-in-out infinite; }
            `}</style>
          </defs>

          {/* 未来虚线路径 */}
          <path d="M 200 132 Q 250 108 285 78 T 360 34" stroke="url(#nc-dash)" strokeWidth="1.5" strokeDasharray="4 5" fill="none" className="nc-fade" />

          {/* 未来节点 */}
          {[
            { x: 200, y: 132 },
            { x: 245, y: 102 },
            { x: 285, y: 78 },
            { x: 322, y: 55 },
            { x: 360, y: 34 },
          ].map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="2" fill={C.gold} opacity="0.4" className="nc-fade" style={{ animationDelay: `${0.4 + i * 0.15}s` }} />
          ))}

          {/* 未来阶段标签 */}
          {future.map((k, i) => {
            const xs = [205, 247, 287, 322, 360];
            const ys = [144, 114, 90, 66, 46];
            return (
              <text key={k} x={xs[i]} y={ys[i]} textAnchor="middle" fontSize="6.5" fontFamily="monospace" letterSpacing="1.5" fill={C.warmBrown} opacity="0.4" className="nc-fade" style={{ animationDelay: `${0.6 + i * 0.15}s` }}>
                {txt[k as keyof TrajectoryText]}
              </text>
            );
          })}

          {/* 文明核心 */}
          <g className="nc-fade" style={{ animationDelay: "0.2s" }}>
            <circle cx="200" cy="140" r="20" fill="none" stroke={C.gold} strokeWidth="0.8" opacity="0.35" className="nc-pulse" />
            <path d="M200 118 L214 140 L200 162 L186 140 Z" fill="none" stroke={C.gold} strokeWidth="1.4" />
            <circle cx="200" cy="140" r="2.5" fill={C.gold} className="nc-pulse" />
          </g>
        </svg>
      </div>

      <div className="space-y-2 max-w-sm">
        <h4 className="text-sm font-bold font-civ-serif text-[#3A3028] dark:text-[oklch(0.85_0.04_80)]">
          {txt.noPathTitle}
        </h4>
        <p className="text-xs text-[#8B8068]">{txt.noPathDesc}</p>
        <p className="text-[11px] text-[#8B8068]/60 font-civ-serif italic">{txt.noPathHint}</p>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="w-1 h-1 rounded-full bg-[#C9A45C]/50" />
        <span className="text-[9px] font-mono uppercase tracking-widest text-[#C9A45C]/50">
          {txt.predictedPath}
        </span>
      </div>
    </div>
  );
}