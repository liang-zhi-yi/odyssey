"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import type { DimensionScores, AssessmentCompleted } from "@/types/assessment";
import { DIMENSION_WEIGHTS } from "@/types/assessment";
import { parseFeedback } from "@/lib/assessmentMarkdown";
import { useLocale } from "@/hooks/useLocale";
import { worldService } from "@/services/world.service";
import type { World } from "@/types/world";
import { CIVILIZATION_TIER_LABELS } from "@/types/world";

/* ── 资产路径 ────────────────────────────────── */
const ASSETS = {
  mentor: "/art-assets/文明导师.png",
  abilityCores: {
    knowledge: "/art-assets/知识能力核心.png",
    reasoning: "/art-assets/推理核心.png",
    application: "/art-assets/应用核心.png",
    creation: "/art-assets/创造核心.png",
  },
} as const;

type DimensionKey = "knowledge" | "reasoning" | "application" | "creation";

/* ═══════════════════════════════════════════════════
   SVG 装饰组件 — 纯 CSS/SVG 绘制，不引入新资源
   ═══════════════════════════════════════════════════ */

/** 档案封面徽章外圈 — 石刻印章环 */
function SealRingSVG({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="100" cy="100" r="97" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
      <circle cx="100" cy="100" r="93" stroke="currentColor" strokeWidth="0.8" opacity="0.15" />
      <circle cx="100" cy="100" r="88" stroke="currentColor" strokeWidth="0.4" opacity="0.1" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        const r2 = (n: number) => Math.round(n * 100) / 100;
        const x1 = r2(100 + Math.cos(a) * 90);
        const y1 = r2(100 + Math.sin(a) * 90);
        const x2 = r2(100 + Math.cos(a) * 95);
        const y2 = r2(100 + Math.sin(a) * 95);
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="0.6" opacity="0.15" />
        );
      })}
      <path d="M 100 18 A 82 82 0 0 1 182 100" stroke="currentColor" strokeWidth="0.4" opacity="0.08" fill="none" />
      <path d="M 100 182 A 82 82 0 0 1 18 100" stroke="currentColor" strokeWidth="0.4" opacity="0.08" fill="none" />
    </svg>
  );
}

/** 章节分隔装饰线 — 卷轴线条 */
function ScrollDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`} aria-hidden>
      <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, oklch(0.72 0.06 80 / 0.15) 50%, transparent)" }} />
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M 8 2 L 9.5 6.5 L 14 8 L 9.5 9.5 L 8 14 L 6.5 9.5 L 2 8 L 6.5 6.5 Z" fill="currentColor" opacity="0.2" />
      </svg>
      <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, oklch(0.72 0.06 80 / 0.15) 50%, transparent)" }} />
    </div>
  );
}

/** 观察记录 SVG 标记 — 小型档案批注图标 */
function ObservationMark({ type }: { type: "advantage" | "challenge" | "advice" }) {
  const color =
    type === "advantage"
      ? "oklch(0.50 0.08 150)"
      : type === "challenge"
        ? "oklch(0.55 0.10 65)"
        : "oklch(0.45 0.05 45)";
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      {type === "advantage" && (
        <>
          <path d="M 8 2 L 12 8 L 8 14 L 4 8 Z" stroke={color} strokeWidth="0.8" fill="none" opacity="0.4" />
          <circle cx="8" cy="8" r="2" fill={color} opacity="0.35" />
        </>
      )}
      {type === "challenge" && (
        <>
          <rect x="3" y="3" width="10" height="10" rx="1" stroke={color} strokeWidth="0.8" fill="none" opacity="0.4" />
          <path d="M 6 8 L 10 8" stroke={color} strokeWidth="1" opacity="0.4" />
        </>
      )}
      {type === "advice" && (
        <>
          <circle cx="8" cy="8" r="5" stroke={color} strokeWidth="0.8" fill="none" opacity="0.4" />
          <path d="M 8 5 L 8 8 L 10.5 9.5" stroke={color} strokeWidth="0.8" opacity="0.4" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

/** 展开收起箭头 SVG */
function ChevronSVG({ open }: { open: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden
      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 250ms ease-out" }}>
      <path d="M 3 5 L 7 9 L 11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

/** 变化箭头 SVG */
function DeltaArrow({ positive }: { positive: boolean }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      {positive ? <path d="M 5 2 L 8 7 L 2 7 Z" fill="currentColor" /> : <path d="M 5 8 L 2 3 L 8 3 Z" fill="currentColor" />}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════
   小组件
   ═══════════════════════════════════════════════════ */

function computeOverallBefore(
  before: DimensionScores | null,
  weights: Record<DimensionKey, number>,
  dims: DimensionKey[]
): number | null {
  if (!before) return null;
  let s = 0;
  let covered = 0;
  for (const d of dims) {
    const v = before[d];
    if (typeof v === "number" && Number.isFinite(v)) {
      s += v * weights[d];
      covered += 1;
    }
  }
  return covered > 0 ? s : null;
}

function ScoreDeltaMini({ after, before }: { after: number; before: number | null }) {
  if (before === null) return null;
  const d = Number((after - before).toFixed(1));
  const positive = d > 0;
  const color = positive ? "text-[oklch(0.50_0.12_150)]" : d < 0 ? "text-[oklch(0.55_0.15_28)]" : "text-[oklch(0.45_0.03_72)] dark:text-[oklch(0.68_0.035_80)]";
  return (
    <p className={`mt-1 flex items-center justify-center gap-1 text-[11px] font-bold tabular-nums ${color}`}>
      <DeltaArrow positive={positive} />
      {positive ? "+" : ""}{d.toFixed(1)}
    </p>
  );
}

function DeltaBadge({ delta, deltaPct }: { delta: number | null; deltaPct: number | null }) {
  if (delta === null) return null;
  if (delta === 0) {
    return <span className="rounded-full border border-[oklch(0.72_0.06_80_/_0.15)] dark:border-[oklch(0.48_0.04_80_/_0.20)] px-2 py-[2px] text-[10px] font-bold tabular-nums text-[oklch(0.45_0.03_72)] dark:text-[oklch(0.68_0.035_80)]">±0</span>;
  }
  const positive = delta > 0;
  const pct = deltaPct !== null && Number.isFinite(deltaPct) && Math.abs(deltaPct) < 999 ? ` (${positive ? "+" : ""}${deltaPct}%)` : "";
  return (
    <span className={`flex items-center gap-1 rounded-full px-2 py-[2px] text-[10px] font-bold tabular-nums ${
      positive ? "bg-[oklch(0.50_0.12_150)]/8 text-[oklch(0.45_0.10_150)]" : "bg-[oklch(0.7_0.15_28)]/8 text-[oklch(0.55_0.15_28)]"
    }`}>
      <DeltaArrow positive={positive} />
      {positive ? "+" : ""}{delta.toFixed(1)}{pct}
    </span>
  );
}

function BeforeAfterBar({ before, after }: { before: number; after: number }) {
  return (
    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-[oklch(0.88_0.018_80_/_0.45)] dark:bg-[oklch(0.30_0.015_78_/_0.45)]">
      <div className="absolute inset-y-0 left-0 bg-[oklch(0.65_0.04_75_/_0.25)] dark:bg-[oklch(0.55_0.04_80_/_0.25)]" style={{ width: `${Math.max(0, Math.min(100, before))}%` }} />
      <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[oklch(0.65_0.10_80)] via-[oklch(0.60_0.08_75)] to-[oklch(0.55_0.07_70)] transition-all duration-700"
        style={{ width: `${Math.max(0, Math.min(100, after))}%` }} />
    </div>
  );
}

function BaseBar({ value }: { value: number }) {
  return (
    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-[oklch(0.88_0.018_80_/_0.45)] dark:bg-[oklch(0.30_0.015_78_/_0.45)]">
      <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[oklch(0.65_0.10_80)] to-[oklch(0.55_0.07_70)] transition-all duration-700"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, maskImage: "linear-gradient(to right, #000 80%, rgba(0,0,0,0.3) 100%)", WebkitMaskImage: "linear-gradient(to right, #000 80%, rgba(0,0,0,0.3) 100%)" }} />
    </div>
  );
}

/* ── 维度说明手风琴（多选展开） ──────────────── */

interface DimensionJustificationsProps {
  afterScores: DimensionScores;
  dimensionNames: Record<DimensionKey, string>;
  dimensionWeights: Record<DimensionKey, number>;
  safeHtmlMap: Record<DimensionKey, string>;
  justifications: Partial<Record<DimensionKey, string>>;
  t: (key: string, vars?: Record<string, string | number>) => string;
  locale: string;
}

function DimensionJustifications({
  afterScores, dimensionNames, dimensionWeights, safeHtmlMap, justifications, t, locale,
}: DimensionJustificationsProps) {
  const dimensions: DimensionKey[] = ["knowledge", "reasoning", "application", "creation"];
  const [open, setOpen] = useState<Set<string>>(new Set());

  const toggle = useCallback((dim: string) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(dim)) next.delete(dim);
      else next.add(dim);
      return next;
    });
  }, []);

  return (
    <div className="space-y-2">
      <p className="text-[11px] leading-relaxed text-[oklch(0.45_0.03_72)] dark:text-[oklch(0.68_0.035_80)]">
        {t("assessment.dimensionExpand.hint")}
      </p>
      <div className="space-y-1.5">
        {dimensions.map((dim) => {
          const isOpen = open.has(dim);
          const has = Boolean((justifications[dim] && justifications[dim]!.trim().length > 0) || safeHtmlMap[dim]);
          if (!has) return null;
          const score = afterScores[dim] ?? 0;
          return (
            <div key={dim} className={`rounded-lg border transition-all duration-300 ${
              isOpen ? "bg-[oklch(0.95_0.018_82_/_0.40)] dark:bg-[oklch(0.22_0.013_78_/_0.40)] border-[oklch(0.72_0.06_80_/_0.15)] dark:border-[oklch(0.48_0.04_80_/_0.20)]" : "bg-transparent border-[oklch(0.72_0.06_80_/_0.10)] dark:border-[oklch(0.48_0.04_80_/_0.15)] hover:border-[oklch(0.72_0.06_80_/_0.18)] dark:hover:border-[oklch(0.48_0.04_80_/_0.20)]"
            }`}>
              <button type="button" onClick={() => toggle(dim)} aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 flex-none items-center justify-center rounded-md text-[oklch(0.45_0.03_72)] dark:text-[oklch(0.68_0.035_80)]">
                    <ChevronSVG open={isOpen} />
                  </span>
                  <div>
                    <p className="font-civ-serif text-[13px] font-bold text-[oklch(0.35_0.03_70)] dark:text-[oklch(0.85_0.04_80)]">{dimensionNames[dim]}</p>
                    <p className="mt-0.5 text-[11px] text-[oklch(0.45_0.03_72)] dark:text-[oklch(0.68_0.035_80)]">
                      {t("assessment.justification")} · {t("assessment.weight", { percent: Math.round(dimensionWeights[dim] * 100) })} · {t("skills.overall")} {score.toFixed(1)}
                    </p>
                  </div>
                </div>
                <span className={`rounded-full border px-2 py-[2px] text-[10px] font-semibold tracking-[0.1em] transition-colors ${
                  isOpen ? "border-[oklch(0.65_0.08_75_/_0.25)] dark:border-[oklch(0.55_0.06_80_/_0.30)] text-[oklch(0.45_0.09_145)] dark:text-[oklch(0.68_0.10_145)]" : "border-[oklch(0.72_0.06_80_/_0.15)] dark:border-[oklch(0.48_0.04_80_/_0.20)] text-[oklch(0.45_0.03_72)] dark:text-[oklch(0.68_0.035_80)]"
                }`}>
                  {isOpen ? (locale === "zh" ? "收起" : "Collapse") : (locale === "zh" ? "展开" : "Expand")}
                </span>
              </button>
              {isOpen && (safeHtmlMap[dim] ? (
                <div className="border-t border-[oklch(0.72_0.06_80_/_0.15)] dark:border-[oklch(0.48_0.04_80_/_0.20)] px-4 pb-4 pt-3">
                  <div className="assessment-richtext text-[13px] leading-[1.75] text-[oklch(0.50_0.03_72)] dark:text-[oklch(0.65_0.035_80)] break-words"
                    dangerouslySetInnerHTML={{ __html: safeHtmlMap[dim] }} />
                </div>
              ) : (
                <div className="border-t border-[oklch(0.72_0.06_80_/_0.15)] dark:border-[oklch(0.48_0.04_80_/_0.20)] px-4 pb-4 pt-3">
                  <p className="whitespace-pre-wrap break-words text-[13px] leading-[1.75] text-[oklch(0.50_0.03_72)] dark:text-[oklch(0.65_0.035_80)]">
                    {justifications[dim]}
                  </p>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   主组件
   ═══════════════════════════════════════════════════ */

interface AssessmentResultProps {
  result: AssessmentCompleted;
  beforeScores?: DimensionScores | null;
  className?: string;
}

export function AssessmentResult({
  result, beforeScores, className = "",
}: AssessmentResultProps) {
  const { t, locale } = useLocale();

  /* ── World 数据获取 ─────────────────────────── */
  const [worldData, setWorldData] = useState<World | null>(null);

  useEffect(() => {
    let cancelled = false;
    worldService.getWorld()
      .then((data) => { if (!cancelled) setWorldData(data); })
      .catch(() => { /* World data unavailable — assessment still shows */ });
    return () => { cancelled = true; };
  }, []);

  const tierInfo = useMemo(() => {
    if (!worldData) return null;
    const tierLabel = CIVILIZATION_TIER_LABELS[worldData.tier];
    const tierName = tierLabel ? (locale === "en" ? tierLabel.en : tierLabel.zh) : worldData.tier_name;
    const tierScore = worldData.tier_score ?? 0;
    const nextTierAt = worldData.next_tier_at ?? 0;
    const tierProgress = nextTierAt > 0 ? Math.min(100, Math.round(tierScore / nextTierAt * 100)) : 100;
    return { tierName, tierScore, nextTierAt, tierProgress };
  }, [worldData, locale]);

  /* ── 数据处理 ────────────────────────────────── */
  const parsed = useMemo(() => parseFeedback(result.feedback, result.suggestions), [result.feedback, result.suggestions]);

  const dimensions: DimensionKey[] = ["knowledge", "reasoning", "application", "creation"];

  const dimensionNames = useMemo<Record<DimensionKey, string>>(() => ({
    knowledge: t("skills.dimensions.knowledge"),
    reasoning: t("skills.dimensions.reasoning"),
    application: t("skills.dimensions.application"),
    creation: t("skills.dimensions.creation"),
  }), [t]);

  const dimensionWeights: Record<DimensionKey, number> = {
    knowledge: DIMENSION_WEIGHTS.knowledge,
    reasoning: DIMENSION_WEIGHTS.reasoning,
    application: DIMENSION_WEIGHTS.application,
    creation: DIMENSION_WEIGHTS.creation,
  };

  const after: DimensionScores = {
    knowledge: result.knowledge, reasoning: result.reasoning,
    application: result.application, creation: result.creation,
  };

  const hasBefore = Boolean(beforeScores && typeof beforeScores === "object" && beforeScores !== null);
  const before: DimensionScores | null = hasBefore ? beforeScores! : null;

  const overall = useMemo(() => {
    if (typeof result.overall === "number" && Number.isFinite(result.overall)) return result.overall;
    return dimensions.reduce((sum, d) => sum + (after[d] ?? 0) * dimensionWeights[d], 0);
  }, [result.overall, after, dimensionWeights, dimensions]);

  const abilityRank = useCallback((score: number) => {
    const ranks: Array<{ key: string; min: number }> = [
      { key: "ARCHITECT", min: 90 }, { key: "ENGINEER", min: 75 },
      { key: "PRACTITIONER", min: 60 }, { key: "BEGINNER", min: 40 },
    ];
    for (const r of ranks) if (score >= r.min) return t(`skills.abilityRanks.${r.key}`);
    return t("skills.abilityRanks.NOVICE");
  }, [t]);

  const abilityShortDesc = useCallback((dimension: DimensionKey) => t(`skills.dimensionShortDescs.${dimension}`), [t]);

  const deltas = useMemo(() => dimensions.map((dim) => {
    const beforeVal = before ? before[dim] ?? null : null;
    const afterVal = after[dim] ?? 0;
    const deltaNum = beforeVal !== null && typeof beforeVal === "number" ? Number((afterVal - beforeVal).toFixed(1)) : null;
    const deltaPct = deltaNum !== null && beforeVal && beforeVal > 0 ? Number(((deltaNum / beforeVal) * 100).toFixed(0)) : null;
    return {
      dimension: dim, label: dimensionNames[dim], weight: Math.round(dimensionWeights[dim] * 100),
      before: beforeVal, after: afterVal, delta: deltaNum, deltaPct,
      core: ASSETS.abilityCores[dim], rank: abilityRank(afterVal), shortDesc: abilityShortDesc(dim),
    };
  }), [after, before, dimensionNames, dimensionWeights, abilityRank, abilityShortDesc]);

  const dimensionSafeHtmlMap = useMemo<Record<DimensionKey, string>>(() => {
    const map: Record<string, string> = {};
    const just = result.justifications;
    for (const dim of dimensions) {
      const raw = (just as unknown as Record<string, string> | null | undefined)?.[dim];
      if (typeof raw === "string" && raw.trim().length > 0) {
        map[dim] = parseFeedback(raw, "").safeHtml || raw;
      } else { map[dim] = ""; }
    }
    return map as Record<DimensionKey, string>;
  }, [result.justifications]);

  const hasAnyJustification = useMemo(() => {
    const just = result.justifications;
    if (!just || typeof just !== "object") return false;
    return dimensions.some((d) => {
      const v = (just as unknown as Record<string, string> | null | undefined)?.[d];
      return typeof v === "string" && v.trim().length > 0;
    });
  }, [result.justifications]);

  const [showFullAnalysis, setShowFullAnalysis] = useState(false);

  const explorationSuggestions = useMemo(() =>
    // 仅使用建议（探索方向），不回退到挑战，避免内容与标题不相关
    parsed.suggestions.length > 0 ? parsed.suggestions.slice(0, 4) : [],
  [parsed.suggestions]);

  const aiSummary = useMemo(() => {
    if (parsed.summary && parsed.summary.trim().length > 0) return parsed.summary;
    if (parsed.fullText && parsed.fullText.trim().length > 0) {
      const text = parsed.fullText.replace(/\s+/g, " ").trim();
      return text.length > 120 ? text.slice(0, 120) + "..." : text;
    }
    return locale === "zh" ? "本次鉴定已完成，请查看下方详细分析。" : "Assessment complete. See detailed analysis below.";
  }, [parsed.summary, parsed.fullText, locale]);

  /* ═══════════════════════════════════════════════════
     UI 渲染
     ═══════════════════════════════════════════════════ */

  return (
    <div className={`relative space-y-12 ${className}`}>

      {/* ─────────── 一、能力鉴定档案 ─────────── */}
      <section className="relative">
        {/* 档案封面背景 — 自然融入页面，不使用独立卡片 */}
        <div className="pointer-events-none absolute inset-x-[-3rem] -top-6 -bottom-6" aria-hidden
          style={{
            background: "linear-gradient(180deg, oklch(0.96 0.022 82 / 0.5) 0%, oklch(0.965 0.018 80 / 0.25) 60%, transparent 100%)",
          }}
        />
        {/* 羊皮纸纹理 */}
        <div className="pointer-events-none absolute inset-x-[-3rem] -top-6 -bottom-6 opacity-[0.5]" aria-hidden
          style={{
            backgroundImage: "radial-gradient(oklch(0.82 0.03 75 / 0.06) 1px, transparent 1.5px), radial-gradient(oklch(0.80 0.035 72 / 0.04) 1px, transparent 1.5px)",
            backgroundSize: "16px 16px, 24px 24px",
            backgroundPosition: "0 0, 8px 8px",
          }}
        />

        <div className="relative px-2 py-4 sm:py-6">
          {/* 首次鉴定徽标 */}
          {!hasBefore && (
            <div className="mb-5 flex justify-center sm:justify-start">
              <div className="inline-flex items-center gap-2 rounded-full border border-[oklch(0.65_0.08_75_/_0.20)] dark:border-[oklch(0.55_0.06_80_/_0.25)] bg-[oklch(0.65_0.08_75_/_0.04)] dark:bg-[oklch(0.55_0.06_80_/_0.06)] px-3.5 py-1">
                <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
                  <path d="M 5 1 L 6 3.5 L 8.5 3.5 L 6.5 5 L 7 7.5 L 5 6 L 3 7.5 L 3.5 5 L 1.5 3.5 L 4 3.5 Z" fill="currentColor" className="text-[oklch(0.45_0.09_145)] dark:text-[oklch(0.68_0.10_145)]" />
                </svg>
                <span className="font-civ-serif text-[11px] font-bold tracking-[0.1em] text-[oklch(0.45_0.09_145)] dark:text-[oklch(0.68_0.10_145)]">
                  {t("assessment.firstAssessment.badge")}
                </span>
              </div>
            </div>
          )}

          {/* 左右布局：印章装饰 | 标题+描述 */}
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
            {/* 左侧：印章装饰 */}
            <div className="flex-none">
              <div className="relative flex items-center justify-center">
                {/* 光晕 */}
                <div className="absolute h-[150px] w-[150px] rounded-full" aria-hidden
                  style={{ background: "radial-gradient(circle, oklch(0.7 0.12 80 / 0.1) 0%, transparent 65%)" }} />
                {/* 印章外圈 */}
                <SealRingSVG className="absolute h-[140px] w-[140px] text-[oklch(0.5_0.05_75)]" />
                {/* 文明阶段名称居中 */}
                <div className="relative h-[110px] w-[110px] flex items-center justify-center"
                  style={{ filter: "drop-shadow(0 3px 10px oklch(0 0 0 / 0.08))" }}>
                  <div className="text-center">
                    <p className="font-civ-serif text-[11px] font-bold tracking-[0.15em] text-[oklch(0.45_0.03_72)] dark:text-[oklch(0.68_0.035_80)]">
                      {locale === "zh" ? "文明阶段" : "Civ Tier"}
                    </p>
                    <p className="mt-1 font-civ-serif text-[20px] font-black leading-tight text-[oklch(0.35_0.03_70)] dark:text-[oklch(0.85_0.04_80)]">
                      {tierInfo ? tierInfo.tierName : "—"}
                    </p>
                    {tierInfo && (
                      <p className="mt-0.5 text-[10px] font-semibold tabular-nums text-[oklch(0.45_0.03_72)] dark:text-[oklch(0.68_0.035_80)]">
                        {tierInfo.tierScore} / {tierInfo.nextTierAt > 0 ? tierInfo.nextTierAt : "∞"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧：评估名称 + 描述 */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              <h1 className="font-civ-serif font-black tracking-wide break-words text-[oklch(0.32_0.025_70)] dark:text-[oklch(0.85_0.04_80)]"
                style={{ fontSize: "clamp(26px, 4.5vw, 32px)", lineHeight: 1.25 }}>
                {locale === "zh" ? "能力鉴定档案" : "Ability Assessment Archive"}
              </h1>
              <p className="mt-2 text-[13px] leading-relaxed text-[oklch(0.50_0.03_72)] dark:text-[oklch(0.65_0.035_80)] max-w-md break-words">
                {tierInfo
                  ? (locale === "zh"
                    ? `当前文明阶段：${tierInfo.tierName}（${tierInfo.tierScore} 分）`
                    : `Current tier: ${tierInfo.tierName} (${tierInfo.tierScore} pts)`)
                  : (locale === "zh" ? "本次评估结果已记录至文明档案。" : "Assessment results have been recorded.")}
              </p>
            </div>
          </div>

          {/* 数据展示区域 — 无卡片背景，使用细线分隔 */}
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
            {/* 综合分 */}
            <div className="border-l border-[oklch(0.72_0.06_80_/_0.15)] dark:border-[oklch(0.48_0.04_80_/_0.20)] pl-3">
              <p className="text-[10px] font-semibold tracking-[0.12em] text-[oklch(0.45_0.03_72)] dark:text-[oklch(0.68_0.035_80)]">
                {t("assessment.overall")}
              </p>
              <p className="mt-1 font-civ-serif text-[22px] font-black tabular-nums text-[oklch(0.35_0.03_70)] dark:text-[oklch(0.85_0.04_80)]">
                {Math.round(overall)}
              </p>
              {hasBefore ? (
                <ScoreDeltaMini after={overall} before={computeOverallBefore(before, dimensionWeights, dimensions)} />
              ) : (
                <p className="mt-0.5 text-[10px] font-semibold text-[oklch(0.45_0.03_72)] dark:text-[oklch(0.68_0.035_80)]">
                  {locale === "zh" ? "基线" : "Baseline"}
                </p>
              )}
            </div>
            {/* 能力等级 */}
            <div className="border-l border-[oklch(0.45_0.09_145_/_0.20)] dark:border-[oklch(0.68_0.10_145_/_0.20)] pl-3">
              <p className="text-[10px] font-semibold tracking-[0.12em] text-[oklch(0.45_0.09_145)] dark:text-[oklch(0.68_0.10_145)]">
                {locale === "zh" ? "能力等级" : "Ability Level"}
              </p>
              <p className="mt-1 font-civ-serif text-[14px] font-black leading-tight text-[oklch(0.40_0.09_145)] dark:text-[oklch(0.72_0.10_145)] break-words">
                {abilityRank(overall)}
              </p>
            </div>
            {/* 4 维均分 */}
            <div className="border-l border-[oklch(0.72_0.06_80_/_0.15)] dark:border-[oklch(0.48_0.04_80_/_0.20)] pl-3">
              <p className="text-[10px] font-semibold tracking-[0.12em] text-[oklch(0.45_0.03_72)] dark:text-[oklch(0.68_0.035_80)]">
                {locale === "zh" ? "能力均分" : "Avg Score"}
              </p>
              <p className="mt-1 font-civ-serif text-[22px] font-black tabular-nums text-[oklch(0.35_0.03_70)] dark:text-[oklch(0.85_0.04_80)]">
                {(dimensions.reduce((s, d) => s + (after[d] ?? 0), 0) / 4).toFixed(0)}
              </p>
            </div>
            {/* 维度数 */}
            <div className="border-l border-[oklch(0.72_0.06_80_/_0.15)] dark:border-[oklch(0.48_0.04_80_/_0.20)] pl-3">
              <p className="text-[10px] font-semibold tracking-[0.12em] text-[oklch(0.45_0.03_72)] dark:text-[oklch(0.68_0.035_80)]">
                {locale === "zh" ? "鉴定维度" : "Dimensions"}
              </p>
              <p className="mt-1 font-civ-serif text-[22px] font-black tabular-nums text-[oklch(0.35_0.03_70)] dark:text-[oklch(0.85_0.04_80)]">4</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── 二、能力印记 ─────────── */}
      <section>
        <header className="mb-6">
          <h2 className="font-civ-serif text-[20px] font-black tracking-wide text-[oklch(0.32_0.025_70)] dark:text-[oklch(0.85_0.04_80)]">
            {locale === "zh" ? "能力印记" : "Ability Imprints"}
          </h2>
          <p className="mt-1 text-[12px] text-[oklch(0.50_0.03_72)] dark:text-[oklch(0.65_0.035_80)]">
            {locale === "zh" ? "四维能力的量化记录与成长轨迹" : "Quantitative record and growth trajectory across four dimensions"}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-px sm:grid-cols-2 overflow-hidden rounded-xl border border-[oklch(0.72_0.06_80_/_0.15)] dark:border-[oklch(0.48_0.04_80_/_0.20)]" style={{ background: "oklch(0.88 0.018 80 / 0.25)" }}>
          {deltas.map((delta) => (
            <article key={delta.dimension} className="relative bg-[oklch(0.95_0.018_82_/_0.40)] dark:bg-[oklch(0.22_0.013_78_/_0.40)] p-5 sm:p-6">
              {/* 顶部细线装饰 */}
              <div className="pointer-events-none absolute inset-x-5 top-0 h-px" aria-hidden
                style={{ background: "linear-gradient(90deg, transparent, oklch(0.6 0.06 75 / 0.12) 30%, oklch(0.6 0.06 75 / 0.12) 70%, transparent)" }} />

              <div className="flex items-start gap-4">
                {/* 能力图标 — 增强权重 */}
                <div className="flex-none flex items-center justify-center">
                  <div className="relative h-14 w-14 sm:h-16 sm:w-16 flex items-center justify-center">
                    {/* 图标底纹 */}
                    <div className="absolute inset-0 rounded-full" aria-hidden
                      style={{ background: "radial-gradient(circle, oklch(0.93 0.02 85 / 0.5) 0%, transparent 70%)" }} />
                    <img src={delta.core} alt={delta.label}
                      className="relative h-full w-full object-contain" draggable={false} />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  {/* 名称 + 数值 */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-civ-serif text-[16px] font-black tracking-wide text-[oklch(0.35_0.03_70)] dark:text-[oklch(0.85_0.04_80)]">
                        {delta.label}
                      </h3>
                      <p className="mt-0.5 text-[11px] font-semibold text-[oklch(0.50_0.03_72)] dark:text-[oklch(0.65_0.035_80)]">
                        {delta.rank}
                      </p>
                    </div>
                    <p className="font-civ-serif text-[26px] font-black tabular-nums leading-none flex-none text-[oklch(0.35_0.03_70)] dark:text-[oklch(0.85_0.04_80)]">
                      {delta.after.toFixed(0)}
                    </p>
                  </div>

                  {/* 描述 */}
                  <p className="mt-1.5 text-[12px] leading-relaxed text-[oklch(0.50_0.03_72)] dark:text-[oklch(0.65_0.035_80)] break-words">
                    {delta.shortDesc}
                  </p>

                  {/* 进度条 */}
                  <div className="mt-3">
                    {!hasBefore ? <BaseBar value={delta.after} /> : <BeforeAfterBar before={delta.before ?? 0} after={delta.after} />}
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-[oklch(0.45_0.03_72)] dark:text-[oklch(0.68_0.035_80)]">
                      {hasBefore ? (
                        <span className="tabular-nums">{(delta.before ?? 0).toFixed(0)} → {delta.after.toFixed(0)}</span>
                      ) : (
                        <span>{locale === "zh" ? "基线建立" : "Baseline set"}</span>
                      )}
                      <DeltaBadge delta={delta.delta} deltaPct={delta.deltaPct} />
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ─────────── 三、AI 观察记录 ─────────── */}
      <section>
        <header className="mb-6">
          <h2 className="font-civ-serif text-[20px] font-black tracking-wide text-[oklch(0.32_0.025_70)] dark:text-[oklch(0.85_0.04_80)]">
            {locale === "zh" ? "AI 观察记录" : "AI Observations"}
          </h2>
          <p className="mt-1 text-[12px] text-[oklch(0.50_0.03_72)] dark:text-[oklch(0.65_0.035_80)]">
            {locale === "zh" ? "基于本次鉴定的观察与分析" : "Observations and analysis from this assessment"}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* 优势 */}
          <article className="relative rounded-lg bg-[oklch(0.95_0.018_82_/_0.40)] dark:bg-[oklch(0.22_0.013_78_/_0.40)] p-4 pl-5">
            <div className="absolute left-0 top-2 bottom-2 w-px" aria-hidden
              style={{ background: "oklch(0.50 0.08 150 / 0.12)" }} />
            <div className="mb-2 flex items-center gap-2">
              <ObservationMark type="advantage" />
              <h3 className="font-civ-serif text-[14px] font-bold tracking-wide text-[oklch(0.35_0.03_70)] dark:text-[oklch(0.85_0.04_80)]">
                {locale === "zh" ? "优势" : "Strengths"}
              </h3>
            </div>
            {parsed.advantages.length > 0 ? (
              <ul className="space-y-1.5">
                {parsed.advantages.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 flex-none rounded-full" style={{ background: "oklch(0.50 0.08 150 / 0.35)" }} aria-hidden />
                    <p className="text-[13px] leading-[1.7] text-[oklch(0.50_0.03_72)] dark:text-[oklch(0.65_0.035_80)] break-words">{item}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] italic text-[oklch(0.45_0.03_72)] dark:text-[oklch(0.68_0.035_80)] break-words">
                {locale === "zh" ? "继续完成任务以积累优势记录。" : "Complete more quests to build your strengths."}
              </p>
            )}
          </article>

          {/* 挑战 */}
          <article className="relative rounded-lg bg-[oklch(0.95_0.018_82_/_0.40)] dark:bg-[oklch(0.22_0.013_78_/_0.40)] p-4 pl-5">
            <div className="absolute left-0 top-2 bottom-2 w-px" aria-hidden
              style={{ background: "oklch(0.55 0.10 65 / 0.12)" }} />
            <div className="mb-2 flex items-center gap-2">
              <ObservationMark type="challenge" />
              <h3 className="font-civ-serif text-[14px] font-bold tracking-wide text-[oklch(0.35_0.03_70)] dark:text-[oklch(0.85_0.04_80)]">
                {locale === "zh" ? "挑战" : "Challenges"}
              </h3>
            </div>
            {parsed.improvements.length > 0 ? (
              <ul className="space-y-1.5">
                {parsed.improvements.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 flex-none rounded-full" style={{ background: "oklch(0.55 0.10 65 / 0.35)" }} aria-hidden />
                    <p className="text-[13px] leading-[1.7] text-[oklch(0.50_0.03_72)] dark:text-[oklch(0.65_0.035_80)] break-words">{item}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] italic text-[oklch(0.45_0.03_72)] dark:text-[oklch(0.68_0.035_80)] break-words">
                {locale === "zh" ? "当前未检测到显著挑战。" : "No significant challenges detected."}
              </p>
            )}
          </article>

          {/* 建议 */}
          <article className="relative rounded-lg bg-[oklch(0.95_0.018_82_/_0.40)] dark:bg-[oklch(0.22_0.013_78_/_0.40)] p-4 pl-5">
            <div className="absolute left-0 top-2 bottom-2 w-px" aria-hidden
              style={{ background: "oklch(0.45 0.05 45 / 0.12)" }} />
            <div className="mb-2 flex items-center gap-2">
              <ObservationMark type="advice" />
              <h3 className="font-civ-serif text-[14px] font-bold tracking-wide text-[oklch(0.35_0.03_70)] dark:text-[oklch(0.85_0.04_80)]">
                {locale === "zh" ? "建议" : "Suggestions"}
              </h3>
            </div>
            {parsed.suggestions.length > 0 ? (
              <ul className="space-y-1.5">
                {parsed.suggestions.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 flex-none rounded-full" style={{ background: "oklch(0.45 0.05 45 / 0.35)" }} aria-hidden />
                    <p className="text-[13px] leading-[1.7] text-[oklch(0.50_0.03_72)] dark:text-[oklch(0.65_0.035_80)] break-words">{item}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] italic text-[oklch(0.45_0.03_72)] dark:text-[oklch(0.68_0.035_80)] break-words">
                {locale === "zh" ? "关注能力得分较低的维度持续提升。" : "Focus on lower-scoring dimensions."}
              </p>
            )}
          </article>
        </div>
      </section>

      {/* ─────────── 四、AI 详细记录 ─────────── */}
      {parsed.hasDetails && (
        <section>
          <header className="mb-6">
            <h2 className="font-civ-serif text-[20px] font-black tracking-wide text-[oklch(0.32_0.025_70)] dark:text-[oklch(0.85_0.04_80)]">
              {locale === "zh" ? "AI 详细记录" : "AI Detailed Record"}
            </h2>
            <p className="mt-1 text-[12px] text-[oklch(0.50_0.03_72)] dark:text-[oklch(0.65_0.035_80)]">
              {locale === "zh" ? "完整的 AI 分析记录，点击展开查看" : "Full AI analysis record — click to expand"}
            </p>
          </header>

          {/* 摘要 + 展开 — 无 overflow-hidden，无固定高度 */}
          <div className="rounded-xl scroll-fuse ornamental-border">
            {/* 摘要 — 含 AI 导师图标 */}
            <div className="px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-[oklch(0.72_0.06_80_/_0.15)] dark:border-[oklch(0.48_0.04_80_/_0.20)] bg-[oklch(0.95_0.018_82_/_0.40)] dark:bg-[oklch(0.22_0.013_78_/_0.40)]">
                  <img src={ASSETS.mentor} alt={locale === "zh" ? "AI 导师" : "AI Mentor"}
                    className="h-[60%] w-[60%] object-contain" draggable={false} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-[10px] font-semibold tracking-[0.12em] text-[oklch(0.45_0.09_145)] dark:text-[oklch(0.68_0.10_145)]">
                    {locale === "zh" ? "AI 导师摘要" : "AI Mentor Summary"}
                  </p>
                  <p className="text-[14px] leading-[1.8] text-[oklch(0.50_0.03_72)] dark:text-[oklch(0.65_0.035_80)] break-words">
                    {aiSummary}
                  </p>
                </div>
              </div>
            </div>

            {/* 展开按钮 */}
            <button type="button" onClick={() => setShowFullAnalysis(!showFullAnalysis)}
              className="flex w-full items-center justify-center gap-2 border-t border-[oklch(0.72_0.06_80_/_0.15)] dark:border-[oklch(0.48_0.04_80_/_0.20)] px-5 py-2.5 text-[13px] font-semibold text-[oklch(0.45_0.09_145)]/80 dark:text-[oklch(0.68_0.10_145)]/80 transition-colors hover:bg-[oklch(0.65_0.08_75_/_0.04)]">
              <span>
                {showFullAnalysis
                  ? (locale === "zh" ? "收起详细补充" : "Collapse Details")
                  : (locale === "zh" ? "展开详细补充" : "Expand Details")}
              </span>
              <ChevronSVG open={showFullAnalysis} />
            </button>

            {/* 展开内容 — 在摘要基础上的补充展开，非重新输出 */}
            {showFullAnalysis && (
              <div className="border-t border-[oklch(0.72_0.06_80_/_0.15)] dark:border-[oklch(0.48_0.04_80_/_0.20)] px-5 py-5">
                <p className="mb-3 text-[11px] font-semibold tracking-[0.1em] text-[oklch(0.45_0.03_72)] dark:text-[oklch(0.68_0.035_80)]">
                  {locale === "zh" ? "以下为摘要的详细补充：" : "Detailed supplement to the summary:"}
                </p>
                <div className="assessment-richtext text-[14px] leading-[1.85] text-[oklch(0.50_0.03_72)] dark:text-[oklch(0.65_0.035_80)] break-words"
                  style={{ overflowWrap: "break-word", wordBreak: "break-word" }}
                  dangerouslySetInnerHTML={{ __html: parsed.safeHtml }} />
              </div>
            )}
          </div>

          {/* 维度详细说明 */}
          {hasAnyJustification && (
            <div className="mt-4 rounded-xl scroll-fuse ornamental-border p-4 sm:p-5">
              <h3 className="mb-3 font-civ-serif text-[15px] font-bold tracking-wide text-[oklch(0.35_0.03_70)] dark:text-[oklch(0.85_0.04_80)]">
                {t("assessment.justification")}
              </h3>
              <DimensionJustifications
                afterScores={after}
                dimensionNames={dimensionNames}
                dimensionWeights={dimensionWeights}
                safeHtmlMap={dimensionSafeHtmlMap}
                justifications={result.justifications as unknown as Partial<Record<DimensionKey, string>> ?? {}}
                t={t}
                locale={locale}
              />
            </div>
          )}
        </section>
      )}

      {/* ─────────── 五、能力记录 ─────────── */}
      <section>
        <ScrollDivider className="mb-8" />

        <header className="mb-4">
          <h2 className="font-civ-serif text-[18px] font-black tracking-wide text-[oklch(0.50_0.03_72)] dark:text-[oklch(0.65_0.035_80)]">
            {locale === "zh" ? "能力记录" : "Ability Record"}
          </h2>
        </header>

        <div className="rounded-xl scroll-fuse ornamental-border p-4 sm:p-5">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[13px] sm:grid-cols-4">
            <div>
              <dt className="text-[10px] font-semibold tracking-[0.12em] text-[oklch(0.45_0.03_72)] dark:text-[oklch(0.68_0.035_80)]">
                {t("assessment.overall")}
              </dt>
              <dd className="mt-0.5 font-civ-serif font-bold tabular-nums text-[oklch(0.35_0.03_70)] dark:text-[oklch(0.85_0.04_80)]">{Math.round(overall)}/100</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold tracking-[0.12em] text-[oklch(0.45_0.03_72)] dark:text-[oklch(0.68_0.035_80)]">
                {locale === "zh" ? "能力等级" : "Ability Level"}
              </dt>
              <dd className="mt-0.5 font-civ-serif font-bold break-words text-[oklch(0.35_0.03_70)] dark:text-[oklch(0.85_0.04_80)]">{abilityRank(overall)}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-[10px] font-semibold tracking-[0.12em] text-[oklch(0.45_0.03_72)] dark:text-[oklch(0.68_0.035_80)]">
                {locale === "zh" ? "四维评分" : "Dimension Scores"}
              </dt>
              <dd className="mt-0.5 font-civ-serif font-bold tabular-nums break-words text-[oklch(0.35_0.03_70)] dark:text-[oklch(0.85_0.04_80)]">
                {dimensions.map((d) => `${dimensionNames[d]} ${after[d]?.toFixed(0)}`).join(" / ")}
              </dd>
            </div>
          </dl>
        </div>

        {/* 探索方向 */}
        {explorationSuggestions.length > 0 && (
          <div className="mt-4 rounded-xl scroll-fuse ornamental-border p-4 sm:p-5">
            <h3 className="mb-3 font-civ-serif text-[14px] font-bold tracking-wide text-[oklch(0.45_0.09_145)] dark:text-[oklch(0.68_0.10_145)]">
              {locale === "zh" ? "探索方向" : "Exploration Directions"}
            </h3>
            <ul className="space-y-2">
              {explorationSuggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full border border-[oklch(0.65_0.08_75_/_0.20)] dark:border-[oklch(0.55_0.06_80_/_0.25)] text-[10px] font-bold text-[oklch(0.45_0.09_145)]/70 dark:text-[oklch(0.68_0.10_145)]/70 tabular-nums">
                    {i + 1}
                  </span>
                  <p className="text-[13px] leading-relaxed text-[oklch(0.50_0.03_72)] dark:text-[oklch(0.65_0.035_80)] break-words">
                    {s.replace(/[*#`>_~]/g, "").trim()}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CTA — 无圆角框 + 斜体艺术字 */}
        <div className="mt-6 flex flex-col items-center gap-3 text-center">
          <p className="text-[12px] text-[oklch(0.45_0.03_72)] dark:text-[oklch(0.68_0.035_80)]">
            {locale === "zh" ? "每一次任务提交，都会留下新的文明印记。" : "Every quest submission leaves a new mark on your record."}
          </p>
          <a href="/quests"
            className="btn-press inline-flex items-center gap-2 rounded-none border-2 border-[oklch(0.45_0.09_145_/_0.45)] dark:border-[oklch(0.68_0.10_145_/_0.45)] bg-[oklch(0.95_0.018_82_/_0.40)] dark:bg-[oklch(0.22_0.013_78_/_0.40)] px-7 py-3 italic font-civ-serif text-[15px] font-bold tracking-[0.15em] text-[oklch(0.35_0.03_70)] dark:text-[oklch(0.85_0.04_80)] hover:border-[oklch(0.45_0.09_145_/_0.70)] dark:hover:border-[oklch(0.68_0.10_145_/_0.70)] hover:bg-[oklch(0.65_0.08_75_/_0.06)] transition-all"
            style={{ textShadow: "0 1px 0 oklch(0.9 0.02 80 / 0.5)", fontFamily: '"Noto Serif SC","Source Han Serif SC","Songti SC",serif' }}>
            {locale === "zh" ? "继续任务" : "Continue Quests"}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M 3 7 L 11 7 M 8 4 L 11 7 L 8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </section>

      {/* ── 局部样式：assessment-richtext 富文本渲染 ──
         仅用于此组件，类名唯一，不影响其他页面 */}
      <style dangerouslySetInnerHTML={{ __html: `
        .assessment-richtext p { margin: 0.5rem 0; line-height: 1.85; word-break: break-word; overflow-wrap: break-word; }
        .assessment-richtext h1 { font-family: "Noto Serif SC","Source Han Serif SC","Songti SC",serif; font-size: 1.2rem; font-weight: 900; margin: 1rem 0 0.5rem; line-height: 1.3; }
        .assessment-richtext h2 { font-family: "Noto Serif SC","Source Han Serif SC","Songti SC",serif; font-size: 1.1rem; font-weight: 800; margin: 0.875rem 0 0.5rem; line-height: 1.3; }
        .assessment-richtext h3 { font-family: "Noto Serif SC","Source Han Serif SC","Songti SC",serif; font-size: 1rem; font-weight: 700; margin: 0.75rem 0 0.375rem; line-height: 1.4; }
        .assessment-richtext h4 { font-family: "Noto Serif SC","Source Han Serif SC","Songti SC",serif; font-size: 0.9rem; font-weight: 700; margin: 0.625rem 0 0.25rem; }
        .assessment-richtext h5, .assessment-richtext h6 { font-weight: 700; margin: 0.5rem 0 0.25rem; }
        .assessment-richtext ul { list-style: none; padding: 0; margin: 0.5rem 0; }
        .assessment-richtext ol { list-style: none; padding: 0; margin: 0.5rem 0; counter-reset: ol-counter; }
        .assessment-richtext li { position: relative; padding-left: 1rem; margin: 0.2rem 0; line-height: 1.7; word-break: break-word; overflow-wrap: break-word; }
        .assessment-richtext ul li::before { content: ""; position: absolute; left: 0; top: 0.65em; width: 5px; height: 5px; border-radius: 50%; background: oklch(0.6 0.06 75 / 0.3); }
        .assessment-richtext ol li { counter-increment: ol-counter; }
        .assessment-richtext ol li::before { content: counter(ol-counter); position: absolute; left: 0; top: 0; font-weight: 700; font-size: 0.75rem; color: oklch(0.5 0.05 75); }
        .assessment-richtext blockquote { border-left: 2px solid oklch(0.6 0.06 75 / 0.15); padding-left: 0.875rem; margin: 0.75rem 0; font-style: italic; color: oklch(0.48 0.02 75); line-height: 1.7; }
        .assessment-richtext hr { border: none; height: 1px; margin: 1rem 0; background: linear-gradient(90deg, transparent, oklch(0.72 0.06 80 / 0.15) 50%, transparent); }
        .assessment-richtext strong { font-weight: 700; color: oklch(0.25 0.02 70); }
        .assessment-richtext em { font-style: italic; }
        .assessment-richtext code { background: oklch(0.94 0.012 80 / 0.5); padding: 0.1rem 0.3rem; border-radius: 0.25rem; font-size: 0.8rem; font-family: "JetBrains Mono","Fira Code",monospace; word-break: break-all; }
        .assessment-richtext pre { background: oklch(0.94 0.012 80 / 0.5); padding: 0.75rem; border-radius: 0.5rem; margin: 0.75rem 0; overflow-x: auto; }
        .assessment-richtext pre code { background: none; padding: 0; border-radius: 0; }
        .assessment-richtext br { display: block; content: ""; margin-top: 0.25rem; }
      ` }} />
    </div>
  );
}
