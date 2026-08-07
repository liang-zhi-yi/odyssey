"use client";

import { useMemo } from "react";
import { useLocale } from "@/hooks/useLocale";

/*
 * AI CORE —— 文明核心苏醒 · 解析仪式 (v3 · 仪式化视觉重设计)
 *
 *  视觉构成（仅前端，无任何业务逻辑改动）：
 *  1. 中心核心：AI文明核心.png（主体 220-260px）+ 苏醒进场 + 呼吸光效
 *  2. 金色光环扩散：多层同心光环缓慢扩散 / 呼吸脉动
 *  3. 数据线与古文明符号扫描：虚线数据环匀速旋转 + 扫描弧 + 光束扫描 + 符号低透明浮现
 *  4. 卷轴式解析流程：竖向时间轴（节点 + 细线连接），状态以印记展示
 *     （已完成 / 解析中 / 待解析），取消圆角卡片列表
 *  5. 解析能量刻度：取消普通进度条，改为带刻度的能量条 + 流动标记
 *  6. 底部悬浮信息：解析时间 · 预计完成（取消卡片式计时器）
 *  7. 色彩统一 Odyssey 体系：古金 / 墨灰 / 暖白，禁用高饱和绿紫科技蓝
 */

interface AICoreProps {
  /** 已用时（毫秒）—— fallback 驱动阶段（后端未下发 phase 时使用） */
  elapsed: number;
  /**
   * 可选：后端下发的真实鉴定阶段（1..5）。
   * · 当后端未来扩展 PROCESSING 状态附带 phase 字段时，优先使用该字段驱动 UI，
   *   消除「UI 动画与真实后端进度不同步」的问题。
   * · 未提供（null/undefined/非 1..5 整数） → 退回 elapsed 时间模拟。
   */
  backendPhase?: number | null;
}

/* 资源路径：/art-assets/ 下的已复制资产 */
const ASSETS = {
  core: "/art-assets/AI文明核心.png",
  scanRing: "/art-assets/文明扫描环.png",
};

/* 古文明扫描符号 — 低透明浮现 */
const SCAN_SYMBOLS: { left: string; top: string; glyph: string; delay: string }[] = [
  { left: "94%", top: "50%", glyph: "◈", delay: "0s" },
  { left: "78%", top: "12%", glyph: "❖", delay: "0.4s" },
  { left: "50%", top: "1%", glyph: "✦", delay: "0.8s" },
  { left: "22%", top: "12%", glyph: "✒", delay: "1.2s" },
  { left: "6%", top: "50%", glyph: "☰", delay: "1.6s" },
  { left: "22%", top: "88%", glyph: "◇", delay: "2s" },
  { left: "50%", top: "99%", glyph: "△", delay: "2.4s" },
  { left: "78%", top: "88%", glyph: "☯", delay: "2.8s" },
];

export function AICore({ elapsed, backendPhase }: AICoreProps) {
  const { t, locale } = useLocale();

  /* ── 5 个鉴定阶段（逻辑不变） ─────────────────────────── */

  const phases = useMemo(
    () =>
      locale === "zh"
        ? [
            { id: 1, label: "读取任务目标", glyph: "☰" },
            { id: 2, label: "解析知识结构", glyph: "❖" },
            { id: 3, label: "评估推理能力", glyph: "◈" },
            { id: 4, label: "判断创造能力", glyph: "✦" },
            { id: 5, label: "生成文明报告", glyph: "✒" },
          ]
        : [
            { id: 1, label: "Reading Objectives", glyph: "☰" },
            { id: 2, label: "Analyzing Knowledge", glyph: "❖" },
            { id: 3, label: "Evaluating Reasoning", glyph: "◈" },
            { id: 4, label: "Judging Creation", glyph: "✦" },
            { id: 5, label: "Generating Report", glyph: "✒" },
          ],
    [locale]
  );

  // 阶段驱动：优先 backendPhase（若为 1..5 整数），否则 elapsed 时间模拟
  const sec = elapsed / 1000;
  const PHASE_DURATION = 3.6;
  const isBackendPhaseValid =
    typeof backendPhase === "number" &&
    Number.isFinite(backendPhase) &&
    Number.isInteger(backendPhase) &&
    backendPhase >= 1 &&
    backendPhase <= phases.length;

  // currentPhase & inPhaseProgress
  let currentPhase: number;
  let inPhaseProgress: number;
  if (isBackendPhaseValid) {
    currentPhase = backendPhase as number;
    inPhaseProgress = 0.65;
  } else {
    currentPhase = Math.min(
      Math.floor(sec / PHASE_DURATION) + 1,
      phases.length
    );
    inPhaseProgress = Math.min((sec % PHASE_DURATION) / PHASE_DURATION, 1);
  }

  // 整体解析能量比例（用于能量刻度）
  const energyPct = Math.min(
    Math.round(((currentPhase - 1 + inPhaseProgress) / phases.length) * 100),
    100
  );

  // 预计完成时间（展示用估算，不改逻辑）
  const fractionDone = (currentPhase - 1 + inPhaseProgress) / phases.length;
  const estimatedTotal = fractionDone > 0.001 ? elapsed / fractionDone : elapsed;
  const remainingSeconds = Math.max(0, Math.ceil((estimatedTotal - elapsed) / 1000));
  const remMin = Math.floor(remainingSeconds / 60).toString().padStart(2, "0");
  const remSec = (remainingSeconds % 60).toString().padStart(2, "0");

  // 时间标签（解析时间）
  const elapsedSeconds = Math.floor(elapsed / 1000);
  const minutes = Math.floor(elapsedSeconds / 60).toString().padStart(2, "0");
  const seconds = (elapsedSeconds % 60).toString().padStart(2, "0");

  const GOLD = "oklch(0.68 0.10 80)";
  const INK = "oklch(0.42 0.02 80)";

  return (
    <div className="relative flex flex-col items-center">
      <style>{aICoreKeyframes}</style>

      {/* ── 文明核心苏醒区 ─────────────────────────────── */}
      <div className="relative h-72 w-72 sm:h-80 sm:w-80 flex items-center justify-center">
        {/* (a) 金色光环扩散 —— 多层同心环缓慢扩张 + 呼吸 */}
        <div
          className="absolute inset-1 rounded-full aicore-halo-ring"
          style={{ border: `1px solid ${GOLD}40` }}
          aria-hidden
        />
        <div
          className="absolute inset-4 rounded-full aicore-halo-ring"
          style={{ border: `1px solid ${GOLD}33`, animationDelay: "0.6s" }}
          aria-hidden
        />
        <div
          className="absolute inset-8 rounded-full aicore-halo-ring"
          style={{ border: `1px solid ${GOLD}26`, animationDelay: "1.2s" }}
          aria-hidden
        />

        {/* (b) 呼吸光晕层 —— 温和能量脉动 */}
        <div
          className="absolute inset-5 rounded-full animate-aicore-aura"
          aria-hidden
          style={{
            background:
              "radial-gradient(circle, oklch(0.72 0.10 80 / 0.22) 0%, oklch(0.72 0.10 80 / 0.06) 45%, transparent 72%)",
          }}
        />

        {/* (c) 文明扫描环 —— 真实资产，缓慢旋转 */}
        <div
          className="absolute inset-0 animate-aicore-ring-rotate pointer-events-none"
          aria-hidden
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ASSETS.scanRing}
            alt=""
            className="h-full w-full object-contain"
            style={{ opacity: 0.55, mixBlendMode: "multiply" as const }}
            draggable={false}
          />
        </div>

        {/* (d) 数据线扫描环 —— 虚线环旋转 + 扫描弧 */}
        <svg
          className="absolute inset-2 animate-aicore-dataring pointer-events-none"
          viewBox="0 0 100 100"
          fill="none"
          aria-hidden
        >
          <circle cx="50" cy="50" r="48" stroke={`${GOLD}55`} strokeWidth="0.6" strokeDasharray="2 7" />
          <circle cx="50" cy="50" r="45" stroke={`${GOLD}40`} strokeWidth="0.5" strokeDasharray="1 5" />
          <path
            d="M50 4 A46 46 0 0 1 87 22"
            stroke={GOLD}
            strokeWidth="1.4"
            strokeLinecap="round"
            className="aicore-arc"
          />
        </svg>

        {/* (e) 光束扫描 —— 旋转的金色扇形光 */}
        <div
          className="absolute inset-0 rounded-full animate-aicore-beam pointer-events-none"
          aria-hidden
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg, oklch(0.82 0.12 85 / 0.10) 42deg, transparent 80deg)",
          }}
        />

        {/* (f) 古文明符号低透明浮现 */}
        {SCAN_SYMBOLS.map((s, i) => (
          <span
            key={i}
            aria-hidden
            className="absolute flex items-center justify-center font-civ-serif animate-aicore-symbol select-none"
            style={{
              left: s.left,
              top: s.top,
              transform: "translate(-50%, -50%)",
              color: GOLD,
              fontSize: "16px",
              textShadow: `0 0 10px ${GOLD}55`,
              animationDelay: s.delay,
            }}
          >
            {s.glyph}
          </span>
        ))}

        {/* (g) AI 文明核心 —— 苏醒进场 + 呼吸 */}
        <div
          className="relative z-10 aicore-core-enter flex items-center justify-center"
          style={{ width: "70%", height: "70%" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ASSETS.core}
            alt={locale === "zh" ? "AI文明核心" : "AI Civilization Core"}
            className="h-full w-full object-contain animate-aicore-core-breathe"
            draggable={false}
          />
        </div>
      </div>

      {/* ── 核心标签：仪式档案标题 ───────────────────────── */}
      <div className="mt-3 text-center">
        <p
          className="font-civ-serif text-base font-semibold tracking-[0.3em]"
          style={{ color: INK }}
        >
          {locale === "zh" ? "文明解析核心" : "CIVILIZATION CORE"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {locale === "zh"
            ? "正在读取你的文明成长轨迹..."
            : "Reading your civilization growth trajectory..."}
        </p>
      </div>

      {/* ── 解析能量刻度（取消普通进度条） ───────────────── */}
      <div className="mt-7 w-full max-w-sm">
        <div className="flex items-center justify-between text-[10px] font-civ-serif tracking-[0.25em] text-muted-foreground">
          <span>{locale === "zh" ? "文明解析能量" : "PARSE ENERGY"}</span>
          <span className="font-mono tabular-nums" style={{ color: GOLD }}>
            {energyPct}%
          </span>
        </div>
        <div className="relative mt-2 h-2.5">
          {/* 刻度 */}
          <div className="absolute inset-0 flex items-center justify-between" aria-hidden>
            {Array.from({ length: 21 }).map((_, i) => (
              <span
                key={i}
                className="h-1.5 w-px"
                style={{ background: `${GOLD}30` }}
              />
            ))}
          </div>
          {/* 能量填充 */}
          <div
            className="absolute left-0 top-0 h-full"
            style={{
              width: `${energyPct}%`,
              background: `linear-gradient(90deg, ${INK}, ${GOLD})`,
              boxShadow: `0 0 12px ${GOLD}66`,
              transition: "width 700ms ease-out",
            }}
          />
          {/* 流动标记 */}
          <div
            className="absolute -top-[3px] h-5 w-[3px] animate-aicore-marker"
            style={{ left: `calc(${energyPct}% - 1px)`, background: GOLD, boxShadow: `0 0 8px ${GOLD}` }}
          />
        </div>
      </div>

      {/* ── 卷轴式解析流程（竖向时间轴） ─────────────────── */}
      <div className="relative mt-9 w-full max-w-sm">
        {/* 竖向脊柱细线 */}
        <div
          className="absolute left-5 top-2 bottom-2 w-px"
          style={{
            background: `linear-gradient(180deg, transparent, ${GOLD}66 15%, ${GOLD}33 85%, transparent)`,
          }}
          aria-hidden
        />
        <div role="list" aria-label={locale === "zh" ? "解析流程" : "Analysis flow"}>
          {phases.map((phase) => {
            const isDone = phase.id < currentPhase;
            const isActive = phase.id === currentPhase;
            return (
              <div
                key={phase.id}
                role="listitem"
                className="relative flex items-start gap-4 py-2.5"
              >
                {/* 节点印记 */}
                <div
                  className="relative z-10 mt-0.5 flex h-10 w-10 flex-none items-center justify-center rounded-full border font-civ-serif"
                  style={{
                    borderColor: isActive
                      ? `${GOLD}90`
                      : isDone
                      ? `${GOLD}55`
                      : "oklch(0.82 0.02 85 / 0.6)",
                    background: isActive
                      ? "radial-gradient(circle, oklch(0.82 0.12 85 / 0.18), transparent 70%)"
                      : isDone
                      ? "oklch(0.98 0.01 90 / 0.5)"
                      : "transparent",
                    color: isActive ? GOLD : isDone ? INK : "oklch(0.62 0.02 80 / 0.5)",
                    boxShadow: isActive ? `0 0 16px ${GOLD}44` : "none",
                  }}
                >
                  {isDone ? (
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12l5 5L20 7" />
                    </svg>
                  ) : (
                    <span className={isActive ? "aicore-active-glyph" : ""}>{phase.glyph}</span>
                  )}
                </div>

                {/* 阶段内容 */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-baseline gap-2">
                    <span
                      className="text-[10px] font-civ-serif tracking-[0.2em]"
                      style={{ color: isDone ? `${INK}90` : isActive ? GOLD : "oklch(0.62 0.02 80 / 0.45)" }}
                    >
                      {locale === "zh" ? `第 ${phase.id} 卷` : `Vol.${phase.id}`}
                    </span>
                    <span
                      className={`text-sm truncate ${
                        isDone ? "line-through decoration-1" : ""
                      }`}
                      style={{
                        color: isDone
                          ? "oklch(0.55 0.02 80 / 0.7)"
                          : isActive
                          ? "oklch(0.30 0.03 80)"
                          : "oklch(0.5 0.02 80 / 0.6)",
                        textDecorationColor: isDone ? `${GOLD}55` : undefined,
                        fontWeight: isActive ? 600 : 400,
                      }}
                    >
                      {phase.label}
                    </span>
                  </div>
                </div>

                {/* 状态印记（右侧） */}
                <div className="flex-none self-center text-right">
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-civ-serif tracking-[0.15em]"
                    style={{
                      color: isActive
                        ? GOLD
                        : isDone
                        ? "oklch(0.55 0.04 75)"
                        : "oklch(0.6 0.02 80 / 0.4)",
                    }}
                  >
                    {isActive && (
                      <span className="h-1.5 w-1.5 rounded-full animate-aicore-dot" style={{ background: GOLD }} />
                    )}
                    {isDone
                      ? locale === "zh"
                        ? "已完成"
                        : "Complete"
                      : isActive
                      ? locale === "zh"
                        ? "解析中"
                        : "Parsing"
                      : locale === "zh"
                      ? "待解析"
                      : "Pending"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 底部悬浮信息：解析时间 · 预计完成 ─────────────── */}
      <div
        className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground"
        aria-label={t("assessment.elapsed", { seconds: elapsedSeconds })}
      >
        <span className="inline-flex items-center gap-2">
          <span className="font-civ-serif tracking-[0.2em]">
            {locale === "zh" ? "解析时间" : "ELAPSED"}
          </span>
          <span className="font-mono tabular-nums" style={{ color: INK }}>
            {minutes}:{seconds}
          </span>
        </span>
        <span aria-hidden style={{ color: `${GOLD}77` }}>◆</span>
        <span className="inline-flex items-center gap-2">
          <span className="font-civ-serif tracking-[0.2em]">
            {locale === "zh" ? "预计完成" : "EST. COMPLETE"}
          </span>
          <span className="font-mono tabular-nums" style={{ color: INK }}>
            {remMin}:{remSec}
          </span>
        </span>
      </div>
    </div>
  );
}

/* ─── 关键帧（仅作用于 AICore 内部样式，不使用额外依赖） ─ */

const aICoreKeyframes = `
@keyframes aicore-core-breathe {
  0%, 100% { transform: scale(1); filter: drop-shadow(0 6px 16px rgba(74,64,53,0.10)); }
  50%      { transform: scale(1.035); filter: drop-shadow(0 10px 22px rgba(74,64,53,0.16)); }
}
@keyframes aicore-core-enter {
  from { opacity: 0; transform: scale(0.8); filter: blur(3px); }
  to   { opacity: 1; transform: scale(1); filter: blur(0); }
}
@keyframes aicore-aura {
  0%, 100% { opacity: 0.55; transform: scale(1); }
  50%      { opacity: 0.95; transform: scale(1.06); }
}
@keyframes aicore-ring-rotate {
  from { transform: rotate(0deg); }
  to   { transform: rotate(-360deg); }
}
@keyframes aicore-halo-ring {
  0%, 100% { opacity: 0.25; transform: scale(0.92); }
  50%      { opacity: 0.65; transform: scale(1.02); }
}
@keyframes aicore-dataring {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes aicore-arc {
  to { stroke-dashoffset: -120; }
}
@keyframes aicore-beam {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes aicore-symbol {
  0%, 100% { opacity: 0.08; }
  50%      { opacity: 0.5; }
}
@keyframes aicore-marker {
  0%, 100% { opacity: 0.5; }
  50%      { opacity: 1; }
}
@keyframes aicore-active-glyph {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.2); }
}
@keyframes aicore-dot {
  0%, 100% { opacity: 0.3; }
  50%      { opacity: 1; }
}

.animate-aicore-core-breathe { animation: aicore-core-breathe 4.2s ease-in-out infinite; transform-origin: center; }
.aicore-core-enter          { animation: aicore-core-enter 1.4s cubic-bezier(0.22, 0.61, 0.36, 1) 0.2s both; }
.animate-aicore-aura        { animation: aicore-aura 3.8s ease-in-out infinite; }
.animate-aicore-ring-rotate { animation: aicore-ring-rotate 28s linear infinite; transform-origin: center; will-change: transform; }
.aicore-halo-ring           { animation: aicore-halo-ring 4.2s ease-in-out infinite; }
.animate-aicore-dataring    { animation: aicore-dataring 16s linear infinite; transform-origin: center; }
.aicore-arc                 { stroke-dasharray: 18 80; animation: aicore-arc 3.2s linear infinite; }
.animate-aicore-beam        { animation: aicore-beam 9s linear infinite; }
.animate-aicore-symbol      { animation: aicore-symbol 4.4s ease-in-out infinite; }
.animate-aicore-marker      { animation: aicore-marker 2.2s ease-in-out infinite; }
.aicore-active-glyph        { display: inline-block; animation: aicore-active-glyph 1.6s ease-in-out infinite; }
.animate-aicore-dot         { animation: aicore-dot 1.2s ease-in-out infinite; }
`;
