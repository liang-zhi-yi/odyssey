"use client";

import type { AssessmentCompleted, DimensionScores } from "@/types/assessment";
import { AssessmentResult } from "./AssessmentResult";
import { useLocale } from "@/hooks/useLocale";

interface AssessmentPollingProps {
  isPolling: boolean;
  elapsed: number;
  result: AssessmentCompleted | null;
  error?: string | null;
  /** Optional: pre-assessment scores for before/after comparison */
  beforeScores?: DimensionScores | null;
}

/**
 * Displays assessment polling status, error, or delegates to
 * AssessmentResult for the completed state (Phase 5 enhancement).
 */
export function AssessmentPolling({
  isPolling,
  elapsed,
  result,
  error,
  beforeScores,
}: AssessmentPollingProps) {
  const { t } = useLocale();

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

  // Completed state → delegate to AssessmentResult
  if (result) {
    return <AssessmentResult result={result} beforeScores={beforeScores} />;
  }

  return null;
}
