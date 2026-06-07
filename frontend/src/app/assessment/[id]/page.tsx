"use client";

import { useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { usePolling } from "@/hooks/usePolling";
import { assessmentService } from "@/services/assessment.service";
import { AssessmentPolling } from "@/app/components/AssessmentPolling";
import { Loading } from "@/app/components/Loading";
import { BackButton } from "@/app/components/BackButton";
import type { AssessmentResult, AssessmentCompleted } from "@/types/assessment";

export default function AssessmentPage() {
  const { id: assessmentId } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useLocale();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const fetcher = useCallback(
    () => assessmentService.getAssessment(assessmentId),
    [assessmentId]
  );

  const { data, isLoading, error, isPolling, elapsed, refetch } =
    usePolling<AssessmentResult>(fetcher, {
      interval: 3000,
      stopWhen: (result) =>
        result.status === "COMPLETED" || result.status === "FAILED",
      timeout: 60000,
      onTimeout: () => {
        // Timeout — keep last data so user can see partial
      },
    });

  if (authLoading || !isAuthenticated) {
    return <Loading text={t("auth.validating")} />;
  }

  // Extract completed result if available
  const completedResult: AssessmentCompleted | null =
    data?.status === "COMPLETED" ? (data as AssessmentCompleted) : null;

  // Extract before_scores for comparison (Phase 5+)
  const beforeScores = completedResult?.before_scores ?? null;

  // Extract error from failed result
  const resultError =
    data?.status === "FAILED"
      ? (data as { error?: string | null }).error || t("assessment.failed")
      : error;

  const isCompleted = completedResult != null;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      {/* Back navigation */}
      <BackButton label={t("submission.backOneLevel")} />

      <div>
        <h1 className="text-2xl font-bold">
          {isCompleted
            ? t("assessment.completed") || "评估完成"
            : t("assessment.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isCompleted
            ? t("assessment.completedSubtitle") || "你的能力已更新"
            : t("assessment.processingSubtitle")}
        </p>
      </div>

      <AssessmentPolling
        isPolling={isPolling && !completedResult}
        elapsed={elapsed}
        result={completedResult}
        error={resultError}
        beforeScores={beforeScores}
      />
    </div>
  );
}
