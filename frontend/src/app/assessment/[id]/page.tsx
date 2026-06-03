"use client";

import { useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { usePolling } from "@/hooks/usePolling";
import { assessmentService } from "@/services/assessment.service";
import { AssessmentPolling } from "@/app/components/AssessmentPolling";
import { Loading } from "@/app/components/Loading";
import type { AssessmentResult, AssessmentCompleted } from "@/types/assessment";

export default function AssessmentPage() {
  const { id: assessmentId } = useParams<{ id: string }>();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

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

  if (authLoading) {
    return <Loading text="Loading..." />;
  }

  if (!isAuthenticated) {
    return null;
  }

  // Extract completed result if available
  const completedResult: AssessmentCompleted | null =
    data?.status === "COMPLETED" ? (data as AssessmentCompleted) : null;

  // Extract error from failed result
  const resultError =
    data?.status === "FAILED"
      ? (data as { error?: string | null }).error || "Assessment failed"
      : error;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold">评估结果</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          AI 正在评估你的提交...
        </p>
      </div>

      <AssessmentPolling
        isPolling={isPolling && !completedResult}
        elapsed={elapsed}
        result={completedResult}
        error={resultError}
      />
    </div>
  );
}
