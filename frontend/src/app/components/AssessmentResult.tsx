"use client";

import { useState } from "react";
import Link from "next/link";
import type { AssessmentCompleted, DimensionScores, ScoreDelta } from "@/types/assessment";
import { DIMENSION_LABELS, DIMENSION_WEIGHTS } from "@/types/assessment";
import { RadarChart } from "./RadarChart";
import { useLocale } from "@/hooks/useLocale";

interface AssessmentResultProps {
  result: AssessmentCompleted;
  /** Optional: pre-assessment scores for before/after comparison */
  beforeScores?: DimensionScores | null;
  className?: string;
}

const DIMENSIONS: (keyof DimensionScores)[] = [
  "knowledge",
  "reasoning",
  "application",
  "creation",
];

const DIMENSION_ICONS: Record<keyof DimensionScores, string> = {
  knowledge: "📚",
  reasoning: "🧠",
  application: "🔧",
  creation: "🎨",
};

/** Color coding for score ranges */
function scoreColor(score: number): string {
  if (score >= 80) return "text-[#6B7D63]";
  if (score >= 60) return "text-[#8B9D83]";
  if (score >= 40) return "text-[#C4A77D]";
  if (score >= 20) return "text-[#D4A76A]";
  return "text-destructive";
}

function scoreBg(score: number): string {
  if (score >= 80) return "bg-[#8B9D83]/10";
  if (score >= 60) return "bg-[#8B9D83]/5";
  if (score >= 40) return "bg-[#C4A77D]/10";
  if (score >= 20) return "bg-[#D4A76A]/10";
  return "bg-destructive/5";
}

function progressBarColor(score: number): string {
  if (score >= 80) return "bg-[#8B9D83]";
  if (score >= 60) return "bg-[#8B9D83]/70";
  if (score >= 40) return "bg-[#C4A77D]";
  if (score >= 20) return "bg-[#D4A76A]";
  return "bg-destructive";
}

/** Build score deltas from before/after scores */
function buildDeltas(
  after: DimensionScores,
  before?: DimensionScores | null
): ScoreDelta[] {
  return DIMENSIONS.map((dim) => ({
    dimension: dim,
    before: before?.[dim] ?? 0,
    after: after[dim],
    delta: before ? after[dim] - before[dim] : after[dim],
  }));
}

/**
 * Enhanced assessment result display with before/after comparison,
 * radar chart, dimension breakdown, feedback, and world navigation.
 *
 * Extracted from AssessmentPolling for reuse and enhanced with
 * growth visualization (Phase 5).
 */
export function AssessmentResult({
  result,
  beforeScores,
  className = "",
}: AssessmentResultProps) {
  const { t, locale } = useLocale();
  const [expandedDimensions, setExpandedDimensions] = useState<Set<string>>(
    new Set()
  );

  const toggleDimension = (dim: string) => {
    setExpandedDimensions((prev) => {
      const next = new Set(prev);
      if (next.has(dim)) {
        next.delete(dim);
      } else {
        next.add(dim);
      }
      return next;
    });
  };

  const scores: DimensionScores = {
    knowledge: result.knowledge,
    reasoning: result.reasoning,
    application: result.application,
    creation: result.creation,
  };

  const deltas = buildDeltas(scores, beforeScores);
  const hasBefore = beforeScores != null;
  const hasGrowth = deltas.some((d) => d.delta > 0);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* ── Overall Score Hero ───────────────────────── */}
      <div
        className={`rounded-2xl border border-border p-8 text-center ${scoreBg(result.overall)}`}
      >
        <p className="text-sm text-muted-foreground mb-2">
          {t("assessment.overall")}
        </p>
        <p
          className={`text-6xl font-bold tabular-nums tracking-tight ${scoreColor(result.overall)}`}
        >
          {result.overall}
        </p>
        {hasGrowth && (
          <p className="mt-2 text-xs text-[#8B9D83] font-medium inline-flex items-center gap-1">
            <span>🌱</span>
            {locale === "zh" ? "能力成长中" : "Growing"}
          </p>
        )}
      </div>

      {/* ── Radar Chart ──────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card flex flex-col items-center">
        <h3 className="text-sm font-semibold mb-3 self-start">
          {t("assessment.dimensionDetails")}
        </h3>
        <RadarChart scores={scores} size={220} />
      </div>

      {/* ── Dimension Breakdown (Before/After or Progress) */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <h3 className="text-sm font-semibold mb-4">
          {hasBefore
            ? locale === "zh"
              ? "📈 分数变化"
              : "📈 Score Changes"
            : t("assessment.dimensionDetails")}
        </h3>

        <div className="space-y-3">
          {deltas.map((delta) => (
            <div key={delta.dimension}>
              {/* Header: icon + label + score + delta */}
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">
                    {DIMENSION_ICONS[delta.dimension]}
                  </span>
                  <span className="font-medium">
                    {t(`skills.dimensions.${delta.dimension}`) ||
                      DIMENSION_LABELS[delta.dimension]}
                  </span>
                  <span className="text-muted-foreground">
                    {locale === "zh"
                      ? `权重 ${Math.round(DIMENSION_WEIGHTS[delta.dimension] * 100)}%`
                      : `wt ${Math.round(DIMENSION_WEIGHTS[delta.dimension] * 100)}%`}
                  </span>
                </div>

                {/* Score display: before → after or single score */}
                {hasBefore ? (
                  <div className="flex items-center gap-1.5 tabular-nums">
                    <span className="text-muted-foreground line-through">
                      {delta.before}
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <span
                      className={`font-bold text-sm ${scoreColor(delta.after)}`}
                    >
                      {delta.after}
                    </span>
                    {delta.delta !== 0 && (
                      <span
                        className={`text-[10px] font-bold ml-0.5 ${
                          delta.delta > 0
                            ? "text-[#8B9D83]"
                            : "text-destructive"
                        }`}
                      >
                        {delta.delta > 0 ? "+" : ""}
                        {delta.delta}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-sm font-bold tabular-nums">
                    {delta.after}
                  </span>
                )}
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${progressBarColor(delta.after)}`}
                    style={{ width: `${delta.after}%` }}
                  />
                </div>
              </div>

              {/* Growth bar overlay when before data available */}
              {hasBefore && delta.delta > 0 && (
                <div className="relative h-1 -mt-1">
                  <div
                    className="absolute h-full rounded-full bg-[#8B9D83]/30"
                    style={{
                      left: `${Math.min(delta.before, delta.after)}%`,
                      width: `${Math.abs(delta.delta)}%`,
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── AI Justifications ────────────────────────── */}
      {result.justifications && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h3 className="text-sm font-semibold mb-3">
            {t("assessment.justification")}
          </h3>
          <div className="space-y-1.5">
            {DIMENSIONS.map((dim) => {
              const justification = result.justifications?.[dim];
              if (!justification) return null;
              const isExpanded = expandedDimensions.has(dim);
              return (
                <div key={dim} className="rounded-lg border border-border/50">
                  <button
                    type="button"
                    onClick={() => toggleDimension(dim)}
                    className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-secondary/30 transition-colors rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {DIMENSION_ICONS[dim]}
                      </span>
                      <span className="text-xs font-medium">
                        {t(`skills.dimensions.${dim}`) ||
                          DIMENSION_LABELS[dim]}
                      </span>
                      <span className="font-mono text-xs font-bold tabular-nums text-muted-foreground">
                        {result[dim]}
                      </span>
                    </div>
                    <span className="text-muted-foreground text-xs transition-transform">
                      {isExpanded ? "▾" : "▸"}
                    </span>
                  </button>
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-1">
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {justification}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Feedback ─────────────────────────────────── */}
      {result.feedback && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h3 className="text-sm font-semibold mb-2">
            💬 {t("assessment.feedback")}
          </h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {result.feedback}
          </p>
        </div>
      )}

      {/* ── Suggestions ──────────────────────────────── */}
      {result.suggestions && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h3 className="text-sm font-semibold mb-2">
            💡 {t("assessment.suggestions")}
          </h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {result.suggestions}
          </p>
        </div>
      )}

      {/* ── CTA: View World ──────────────────────────── */}
      <div className="flex justify-center pt-2">
        <Link
          href="/world"
          className="inline-flex items-center gap-2 rounded-xl bg-[#C4A77D]/10 border border-[#C4A77D]/20 px-5 py-3 text-sm font-medium text-[#8B7355] hover:bg-[#C4A77D]/20 transition-colors"
        >
          <span className="text-lg">🌍</span>
          <span>{locale === "zh" ? "查看我的世界" : "View My World"}</span>
          <span className="text-muted-foreground">→</span>
        </Link>
      </div>
    </div>
  );
}
