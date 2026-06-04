"use client";

import { useState } from "react";
import type { AssessmentCompleted } from "@/types/assessment";
import { RadarChart } from "./RadarChart";
import { DIMENSION_LABELS, DIMENSION_WEIGHTS } from "@/types/assessment";
import type { DimensionScores } from "@/types/assessment";
import { useLocale } from "@/hooks/useLocale";

interface AssessmentPollingProps {
  isPolling: boolean;
  elapsed: number;
  result: AssessmentCompleted | null;
  error?: string | null;
}

const DIMENSIONS: (keyof DimensionScores)[] = [
  "knowledge",
  "reasoning",
  "application",
  "creation",
];

/**
 * Displays assessment polling status, then the completed result
 * with radar chart and dimension breakdown.
 */
export function AssessmentPolling({
  isPolling,
  elapsed,
  result,
  error,
}: AssessmentPollingProps) {
  const { t } = useLocale();
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

  // Error state
  if (error && !result) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <div className="mb-3 text-3xl">⚠️</div>
        <p className="text-sm font-medium text-destructive">{t("assessment.failed")}</p>
        <p className="text-xs text-muted-foreground mt-1">{error}</p>
      </div>
    );
  }

  // Polling state
  if (isPolling || (!result && !error)) {
    return (
      <div className="rounded-xl border border-border bg-background p-8 text-center">
        <div className="mb-4 flex justify-center">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
        <h3 className="text-lg font-semibold">{t("assessment.processing")}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {t("assessment.polling")}
        </p>
        <div className="mt-4 flex justify-center gap-6 text-xs text-muted-foreground">
          <span>{t("assessment.elapsed", { seconds: Math.floor(elapsed / 1000) })}</span>
          <span>{t("assessment.maxWait")}</span>
        </div>
        {/* Animated dots */}
        <div className="mt-3 flex justify-center gap-1">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="h-2 w-2 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Completed state
  if (result) {
    const scores: DimensionScores = {
      knowledge: result.knowledge,
      reasoning: result.reasoning,
      application: result.application,
      creation: result.creation,
    };

    return (
      <div className="space-y-4">
        {/* Overall score */}
        <div className="rounded-xl border border-border bg-background p-6 text-center">
          <p className="text-sm text-muted-foreground mb-1">{t("assessment.overall")}</p>
          <p className="text-5xl font-bold text-primary tabular-nums">
            {result.overall}
          </p>
          <div className="mt-3 flex justify-center">
            <RadarChart scores={scores} size={220} />
          </div>
        </div>

        {/* Dimension breakdown */}
        <div className="rounded-xl border border-border bg-background p-4">
          <h4 className="text-sm font-semibold mb-3">{t("assessment.dimensionDetails")}</h4>
          <div className="space-y-2.5">
            {DIMENSIONS.map((dim) => (
              <div key={dim}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium">
                    {t(`skills.dimensions.${dim}`) || DIMENSION_LABELS[dim]}
                  </span>
                  <span className="text-muted-foreground">
                    {t("assessment.weight", { percent: Math.round(DIMENSION_WEIGHTS[dim] * 100) })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${result[dim]}%` }}
                    />
                  </div>
                  <span className="w-8 text-right font-mono text-sm font-bold tabular-nums">
                    {result[dim]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Justifications — expandable per-dimension */}
        {result.justifications && (
          <div className="rounded-xl border border-border bg-background p-4">
            <h4 className="text-sm font-semibold mb-3">
              {t("assessment.justification")}
            </h4>
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
                        <span className="text-xs font-medium">
                          {t(`skills.dimensions.${dim}`) || DIMENSION_LABELS[dim]}
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

        {/* Feedback */}
        {result.feedback && (
          <div className="rounded-xl border border-border bg-background p-4">
            <h4 className="text-sm font-semibold mb-2">{t("assessment.feedback")}</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {result.feedback}
            </p>
          </div>
        )}

        {/* Suggestions */}
        {result.suggestions && (
          <div className="rounded-xl border border-border bg-background p-4">
            <h4 className="text-sm font-semibold mb-2">{t("assessment.suggestions")}</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {result.suggestions}
            </p>
          </div>
        )}
      </div>
    );
  }

  return null;
}
