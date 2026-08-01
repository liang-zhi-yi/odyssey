"use client";

import { useMemo } from "react";
import { useLocale } from "@/hooks/useLocale";

/*
 * AI CORE —— AI 文明鉴定核心扫描动画 (v2 · 使用真实美术资产)
 *
 *  视觉构成：
 *  1. 中心核心：AI文明核心.png（主体 220-260px，占容器 20%-30%，不压迫文字）
 *              + 轻微呼吸动画 + 温和能量光晕
 *  2. 扫描环：  文明扫描环.png（覆盖在核心外，缓慢匀速旋转 + 扫光脉冲）
 *  3. 档案纹理：半透明 档案背景纹理.png（作为整卡 background-image）
 *  4. 5 阶段：  读取任务目标 → 解析知识结构 → 评估推理能力
 *              → 判断创造能力 → 生成文明报告
 *  5. 时间信息：古文明档案风格（羊皮纸卷轴式标签，非纯文本UI）
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
  archiveBg: "/art-assets/档案背景纹理.png",
};

export function AICore({ elapsed, backendPhase }: AICoreProps) {
  const { t, locale } = useLocale();

  /* ── 5 个鉴定阶段 ───────────────────────────────────── */

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
    // 当后端明确告诉我们阶段时：该阶段显示为"进行中"且 progress 固定为 0.65
    // （后端通常不会下发 sub-phase 进度，避免跳变视觉）
    inPhaseProgress = 0.65;
  } else {
    currentPhase = Math.min(
      Math.floor(sec / PHASE_DURATION) + 1,
      phases.length
    );
    inPhaseProgress = Math.min((sec % PHASE_DURATION) / PHASE_DURATION, 1);
  }

  // 时间标签
  const elapsedSeconds = Math.floor(elapsed / 1000);
  const minutes = Math.floor(elapsedSeconds / 60).toString().padStart(2, "0");
  const seconds = (elapsedSeconds % 60).toString().padStart(2, "0");

  return (
    <div className="relative flex flex-col items-center">
      <style>{aICoreKeyframes}</style>

      {/* ── 核心视觉区：扫描环 + AI核心 ────────────────────── */}
      <div className="relative h-72 w-72 sm:h-80 sm:w-80 flex items-center justify-center">
        {/* (a) 呼吸光晕层 —— 温和的能量脉动，不引入鲜艳渐变 */}
        <div
          className="absolute inset-4 rounded-full animate-aicore-aura"
          aria-hidden
          style={{
            background:
              "radial-gradient(circle, oklch(0.72 0.10 80 / 0.22) 0%, oklch(0.72 0.10 80 / 0.06) 45%, transparent 72%)",
          }}
        />

        {/* (b) 文明扫描环 —— 真实资产，缓慢逆时针旋转 + 渐进透明 */}
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

        {/* (c) 第二扫描层 —— 同心环的扫光脉冲（不用光效渐变，用透明度） */}
        <div
          className="absolute h-[92%] w-[92%] rounded-full animate-aicore-ring-pulse pointer-events-none"
          aria-hidden
          style={{
            boxShadow:
              "inset 0 0 0 1.5px oklch(0.62 0.09 80 / 0.35)",
          }}
        />

        {/* (d) AI 文明核心 —— 真实资产，主体尺寸 ≤ 260px，呼吸缩放 */}
        <div
          className="relative z-10 animate-aicore-core-breathe flex items-center justify-center"
          style={{
            // 主体宽度约 220px（容器 72/80 * 4 = 288/320，这里占 76% 左右）
            width: "76%",
            height: "76%",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ASSETS.core}
            alt={locale === "zh" ? "AI文明核心" : "AI Civilization Core"}
            className="h-full w-full object-contain drop-shadow-[0_6px_16px_rgba(74,64,53,0.12)]"
            draggable={false}
          />
          {/* 核心中心的微光符号（不压过图片主体） */}
          <span
            aria-hidden
            className="absolute inset-0 flex items-center justify-center font-civ-serif text-2xl font-bold animate-aicore-symbol"
            style={{
              color: "oklch(0.98 0.02 85 / 0.55)",
              textShadow: "0 0 10px oklch(0.85 0.10 80 / 0.35)",
              letterSpacing: "0.1em",
            }}
          >
            ◈
          </span>
        </div>
      </div>

      {/* ── 核心标签：档案标题格式 ───────────────────────── */}
      <div className="mt-2 text-center">
        <p
          className="font-civ-serif text-base font-semibold tracking-[0.3em]"
          style={{ color: "oklch(0.50 0.08 75)" }}
        >
          {locale === "zh" ? "AI · 文明鉴定核心" : "AI · CIVILIZATION CORE"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {locale === "zh"
            ? "正在解读你的创造痕迹..."
            : "Interpreting your creation traces..."}
        </p>
      </div>

      {/* ── 5 阶段指示器 ──────────────────────────────────── */}
      <div
        role="list"
        aria-label={locale === "zh" ? "鉴定进度" : "Appraisal progress"}
        className="mt-6 w-full max-w-sm space-y-2"
      >
        {phases.map((phase) => {
          const isDone = phase.id < currentPhase;
          const isActive = phase.id === currentPhase;
          return (
            <div
              key={phase.id}
              role="listitem"
              className="group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-500"
              style={{
                borderColor: isActive
                  ? "oklch(0.72 0.10 80 / 0.5)"
                  : isDone
                  ? "oklch(0.55 0.08 145 / 0.30)"
                  : "var(--border)",
                backgroundColor: isActive
                  ? "oklch(0.72 0.08 80 / 0.07)"
                  : isDone
                  ? "oklch(0.55 0.08 145 / 0.04)"
                  : "transparent",
              }}
            >
              {/* 阶段古符号 */}
              <span
                aria-hidden
                className="flex h-6 w-6 flex-none items-center justify-center rounded-md border text-xs font-bold"
                style={{
                  borderColor: isActive
                    ? "oklch(0.72 0.10 80 / 0.45)"
                    : "var(--border)",
                  backgroundColor: isActive
                    ? "oklch(0.72 0.08 80 / 0.12)"
                    : isDone
                    ? "oklch(0.55 0.08 145 / 0.10)"
                    : "transparent",
                  color: isActive
                    ? "oklch(0.58 0.10 80)"
                    : isDone
                    ? "oklch(0.50 0.10 145)"
                    : "oklch(0.60 0.02 75 / 0.55)",
                }}
              >
                {isDone ? <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg> : phase.glyph}
              </span>

              {/* 阶段文本（档案式小标签） */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-[11px] font-civ-serif font-medium tracking-wider ${
                      isDone
                        ? "text-muted-foreground"
                        : isActive
                        ? "text-foreground"
                        : "text-muted-foreground/50"
                    }`}
                  >
                    {locale === "zh" ? `第 ${phase.id} 卷` : `Vol.${phase.id}`}
                  </span>
                  <span
                    className={`text-sm truncate ${
                      isDone
                        ? "text-foreground/65 line-through decoration-1"
                        : isActive
                        ? "font-medium text-foreground"
                        : "text-muted-foreground/60"
                    }`}
                    style={
                      isDone
                        ? {
                            textDecorationColor:
                              "oklch(0.55 0.08 145 / 0.4)",
                          }
                        : undefined
                    }
                  >
                    {phase.label}
                  </span>
                </div>
              </div>

              {/* 阶段状态：进度条（仅进行中） / 对勾占位 */}
              {isActive ? (
                <div className="flex-none w-20 h-1.5 overflow-hidden rounded-full bg-secondary/70">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.round(inPhaseProgress * 100)}%`,
                      background:
                        "linear-gradient(90deg, oklch(0.68 0.12 80 / 0.85), oklch(0.78 0.12 85 / 0.95))",
                    }}
                  />
                </div>
              ) : (
                <span
                  className={`flex-none w-20 text-right text-[10px] font-civ-serif tracking-wider ${
                    isDone
                      ? "text-[oklch(0.50 0.10 145)]"
                      : "text-muted-foreground/40"
                  }`}
                >
                  {isDone
                    ? locale === "zh"
                      ? "已归档"
                      : "Archived"
                    : locale === "zh"
                    ? "待解读"
                    : "Pending"}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* ── 时间信息：古文明档案风格 ──────────────────────── */}
      {/*    不是「已用时 12s · 最大等待 180s」的纯文本，      */}
      {/*    而是卷轴式标签：左侧已用时间卷轴 + 分隔符 + 右侧时限标签  */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {/* (a) 已用时间卷轴 */}
        <div
          className="relative flex items-center gap-2 rounded-lg border px-3.5 py-2 shadow-sm"
          style={{
            borderColor: "oklch(0.80 0.05 75 / 0.7)",
            backgroundColor: "oklch(0.96 0.015 80 / 0.85)",
            backgroundImage: `url(${ASSETS.archiveBg})`,
            backgroundSize: "cover",
            backgroundBlendMode: "soft-light" as const,
          }}
          aria-label={t("assessment.elapsed", { seconds: elapsedSeconds })}
        >
          {/* 卷轴两端装饰 */}
          <span
            aria-hidden
            className="h-5 w-1 rounded-sm"
            style={{ backgroundColor: "oklch(0.55 0.10 75 / 0.55)" }}
          />
          <span className="flex flex-col leading-tight">
            <span
              className="font-civ-serif text-[10px] font-medium tracking-[0.2em] text-muted-foreground"
            >
              {locale === "zh" ? "已用纪年" : "ELAPSED"}
            </span>
            <span className="font-civ-serif text-sm font-semibold tabular-nums text-[oklch(0.50 0.08 75)]">
              {minutes}:{seconds}
            </span>
          </span>
          <span
            aria-hidden
            className="h-5 w-1 rounded-sm"
            style={{ backgroundColor: "oklch(0.55 0.10 75 / 0.55)" }}
          />
        </div>

        {/* (b) 分隔符：古文明分隔线 */}
        <span
          aria-hidden
          className="hidden sm:inline-flex items-center text-xs tracking-[0.2em] text-muted-foreground/60"
        >
          · · ◈ · ·
        </span>

        {/* (c) 最大等待时限标签 */}
        <div
          className="relative flex items-center gap-2 rounded-lg border px-3.5 py-2 shadow-sm"
          style={{
            borderColor: "oklch(0.80 0.05 75 / 0.55)",
            backgroundColor: "oklch(0.955 0.012 80 / 0.6)",
          }}
        >
          <span
            aria-hidden
            className="h-3 w-3 rounded-full border-2 border-dashed"
            style={{ borderColor: "oklch(0.62 0.10 80 / 0.6)" }}
          />
          <span className="flex flex-col leading-tight">
            <span className="font-civ-serif text-[10px] font-medium tracking-[0.2em] text-muted-foreground">
              {locale === "zh" ? "鉴定时限" : "MAX WAIT"}
            </span>
            <span className="font-civ-serif text-sm font-semibold tabular-nums text-muted-foreground/80">
              {t("assessment.maxWait")}
            </span>
          </span>
        </div>
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
@keyframes aicore-symbol {
  0%, 100% { opacity: 0.45; }
  50%      { opacity: 0.85; }
}
@keyframes aicore-aura {
  0%, 100% { opacity: 0.55; transform: scale(1); }
  50%      { opacity: 0.95; transform: scale(1.06); }
}
@keyframes aicore-ring-rotate {
  from { transform: rotate(0deg); }
  to   { transform: rotate(-360deg); }
}
@keyframes aicore-ring-pulse {
  0%, 100% { opacity: 0.35; transform: scale(1); }
  50%      { opacity: 0.75; transform: scale(1.015); }
}

.animate-aicore-core-breathe { animation: aicore-core-breathe 4.2s ease-in-out infinite; transform-origin: center; }
.animate-aicore-symbol       { animation: aicore-symbol       3.0s ease-in-out infinite; }
.animate-aicore-aura         { animation: aicore-aura         3.8s ease-in-out infinite; }
.animate-aicore-ring-rotate  { animation: aicore-ring-rotate 28s linear infinite; transform-origin: center; will-change: transform; }
.animate-aicore-ring-pulse   { animation: aicore-ring-pulse  3.4s ease-in-out infinite; }
`;
