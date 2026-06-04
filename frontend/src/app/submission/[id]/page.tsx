"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { submissionService } from "@/services/submission.service";
import { Loading } from "@/app/components/Loading";
import { ErrorState } from "@/app/components/ErrorState";
import { BackButton } from "@/app/components/BackButton";
import { SUBMISSION_STATUS_LABELS, type SubmissionStatus } from "@/types/quest";

export default function SubmissionPage() {
  const { id: submissionId } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useLocale();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const {
    data: submission,
    isLoading,
    error,
  } = useSWR(
    isAuthenticated && submissionId ? `submission-${submissionId}` : null,
    () => submissionService.getSubmission(submissionId)
  );

  if (authLoading || !isAuthenticated) {
    return <Loading text={t("auth.validating")} />;
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <Loading text={t("common.loading")} />
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <ErrorState
          message={t("common.error")}
          detail={error instanceof Error ? error.message : t("submission.notFound")}
        />
      </div>
    );
  }

  const status = submission.status as SubmissionStatus;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      {/* Back navigation */}
      <BackButton label={t("submission.backOneLevel")} />

      <div>
        <h1 className="text-2xl font-bold">{t("submission.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Submission #{submission.submission_id}
        </p>
      </div>

      {/* Status */}
      <div className="rounded-xl border border-border bg-background p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{t("submission.status")}</h2>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              status === "PASSED"
                ? "bg-success/10 text-success"
                : status === "FAILED"
                ? "bg-destructive/10 text-destructive"
                : status === "ASSESSING"
                ? "bg-warning/10 text-warning"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {SUBMISSION_STATUS_LABELS[status] || status}
          </span>
        </div>

        {/* Content */}
        {submission.content && (
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-1.5">{t("submission.content")}</h3>
            <div className="rounded-lg bg-secondary/50 p-3">
              <pre className="text-sm whitespace-pre-wrap font-sans text-muted-foreground">
                {submission.content}
              </pre>
            </div>
          </div>
        )}

        {/* Links */}
        <div className="space-y-2 text-sm">
          {submission.github_url && (
            <div>
              <span className="text-muted-foreground">{t("submission.githubUrl")}: </span>
              <a
                href={submission.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {submission.github_url}
              </a>
            </div>
          )}
          {submission.demo_url && (
            <div>
              <span className="text-muted-foreground">{t("submission.demoUrl")}: </span>
              <a
                href={submission.demo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {submission.demo_url}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Back link */}
      <div className="text-center">
        <Link
          href={`/quests/${submission.quest_id}`}
          className="text-sm text-primary hover:underline"
        >
          {t("submission.backToQuest")}
        </Link>
      </div>
    </div>
  );
}
