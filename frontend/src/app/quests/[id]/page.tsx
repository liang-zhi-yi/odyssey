"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { questService } from "@/services/quest.service";
import { submissionService } from "@/services/submission.service";
import { assessmentService } from "@/services/assessment.service";
import { QuestDetail } from "@/app/components/QuestDetail";
import { SubmissionForm } from "@/app/components/SubmissionForm";
import { Loading } from "@/app/components/Loading";
import { BackButton } from "@/app/components/BackButton";
import type { QuestDetail as QuestDetailType } from "@/types/quest";
import type { SubmissionDetail } from "@/types/submission";
import type { SubmissionHistoryItem } from "@/types/submission";
import { ApiRequestError } from "@/lib/api";

export default function QuestDetailPage() {
  const { id: questId } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useLocale();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // ── State ──────────────────────────────────────────
  const [isAccepting, setIsAccepting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [abandonError, setAbandonError] = useState<string | null>(null);
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  const [isAbandoning, setIsAbandoning] = useState(false);

  // ── Fetch quest detail ─────────────────────────────
  const {
    data: quest,
    isLoading: questLoading,
    error: questError,
  } = useSWR(
    isAuthenticated && questId ? `quest-${questId}` : null,
    () => questService.getQuestDetail(questId)
  );

  // ── Fetch user quest status ────────────────────────
  const {
    data: userQuests = [],
    isLoading: userQuestsLoading,
  } = useSWR(
    isAuthenticated ? "user-quests" : null,
    () => questService.listUserQuests()
  );

  // Check if this quest has been accepted
  const userQuest = userQuests.find((uq) => uq.quest_id === questId);
  const alreadyAccepted = !!userQuest;

  const isAbandoned = userQuest?.status === "ABANDONED";
  const isFailed = userQuest?.status === "FAILED";
  const isActive =
    userQuest?.status === "ACCEPTED" || userQuest?.status === "IN_PROGRESS";
  const hasSubmitted =
    userQuest?.status === "SUBMITTED" ||
    userQuest?.status === "ASSESSING" ||
    userQuest?.status === "PASSED";
  const isPassed = userQuest?.status === "PASSED";

  // ── Fetch submission history when multiple submissions exist ──
  const { data: submissionHistory = [] } = useSWR(
    userQuest && userQuest.submission_count > 1 && questId
      ? `submission-history-${questId}`
      : null,
    () => submissionService.getSubmissionHistory(questId)
  );

  // ── Handle accept quest ────────────────────────────
  const handleAccept = useCallback(async () => {
    if (!questId) return;
    setIsAccepting(true);
    setAcceptError(null);
    try {
      await questService.acceptQuest(questId);
      await mutate("user-quests");
    } catch (err) {
      const message =
        err instanceof ApiRequestError
          ? err.message
          : t("common.error");
      setAcceptError(message);
    } finally {
      setIsAccepting(false);
    }
  }, [questId, t]);

  // ── Handle abandon quest ───────────────────────────
  const handleAbandon = useCallback(async () => {
    if (!questId) return;
    setIsAbandoning(true);
    setAbandonError(null);
    try {
      await questService.abandonQuest(questId);
      await mutate("user-quests");
      setShowAbandonConfirm(false);
    } catch (err) {
      const message =
        err instanceof ApiRequestError
          ? err.message
          : t("common.error");
      setAbandonError(message);
    } finally {
      setIsAbandoning(false);
    }
  }, [questId, t]);

  // ── Handle submission ──────────────────────────────
  const handleSubmit = useCallback(
    async (data: {
      quest_id: string;
      content?: string;
      github_url?: string;
      demo_url?: string;
    }) => {
      setIsSubmitting(true);
      setSubmitError(null);
      try {
        const res = await submissionService.submit(data);

        // Trigger assessment
        const assessment = await assessmentService.runAssessment({
          submission_id: res.submission_id,
        });

        // Navigate to assessment page for polling
        router.push(`/assessment/${assessment.assessment_id}`);
      } catch (err) {
        const message =
          err instanceof ApiRequestError
            ? err.message
            : t("common.error");
        setSubmitError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [router, t]
  );

  // ── Render ─────────────────────────────────────────
  if (authLoading || !isAuthenticated) {
    return <Loading text={t("auth.validating")} />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      {/* Back navigation */}
      <BackButton href="/quests" label={t("quests.backToList")} />

      {/* Quest detail */}
      <QuestDetail
        quest={quest || null}
        isLoading={questLoading || userQuestsLoading}
        error={
          questError
            ? questError instanceof Error
              ? questError.message
              : t("common.error")
            : acceptError || abandonError || undefined
        }
        onAccept={handleAccept}
        isAccepting={isAccepting}
        alreadyAccepted={alreadyAccepted && !isAbandoned}
      />

      {/* ── ABANDONED state ──────────────────────────── */}
      {isAbandoned && (
        <section>
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
            <div className="flex items-start gap-3">
              <svg
                className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <div>
                <h3 className="font-semibold text-sm">{t("quests.status.ABANDONED")}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("quests.abandoned")}
                </p>
                <button
                  onClick={handleAccept}
                  disabled={isAccepting}
                  className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isAccepting ? t("settings.saving") : t("quests.accept")}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── FAILED state — retry ─────────────────────── */}
      {isFailed && (
        <section>
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 mb-6">
            <div className="flex items-start gap-3">
              <svg
                className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="font-semibold text-sm">{t("quests.status.FAILED")}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("quests.retry")}
                </p>
              </div>
            </div>
          </div>

          {/* Retry submission form */}
          <div className="rounded-xl border border-border bg-background p-6">
            <h2 className="text-lg font-semibold mb-4">{t("quests.submitWork")}</h2>
            <SubmissionForm
              questId={questId}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              error={submitError}
            />
          </div>
        </section>
      )}

      {/* ── ACTIVE (ACCEPTED / IN_PROGRESS) state ─────── */}
      {isActive && (
        <>
          {/* Submission form */}
          <section>
            <div className="rounded-xl border border-border bg-background p-6">
              <h2 className="text-lg font-semibold mb-4">{t("quests.submitWork")}</h2>
              <SubmissionForm
                questId={questId}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                error={submitError}
              />
            </div>
          </section>

          {/* Abandon button */}
          <section>
            {!showAbandonConfirm ? (
              <button
                onClick={() => setShowAbandonConfirm(true)}
                className="rounded-lg border border-destructive/30 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/5 transition-colors"
              >
                {t("quests.abandon")}
              </button>
            ) : (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <p className="text-sm mb-3">{t("quests.confirmAbandon")}</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleAbandon}
                    disabled={isAbandoning}
                    className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {isAbandoning ? t("settings.saving") : t("common.confirm")}
                  </button>
                  <button
                    onClick={() => setShowAbandonConfirm(false)}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
                  >
                    {t("common.cancel")}
                  </button>
                </div>
              </div>
            )}
          </section>
        </>
      )}

      {/* ── PASSED or SUBMITTED/ASSESSING state ───────── */}
      {(hasSubmitted || isPassed) && (
        <section>
          <div className="rounded-xl border border-border bg-background p-6">
            <h2 className="text-lg font-semibold mb-2">{t("quests.submissionStatus")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("quests.alreadySubmitted")}{" "}
              <span
                className={`font-medium ${
                  isPassed
                    ? "text-success"
                    : "text-muted-foreground"
                }`}
              >
                {t(`quests.status.${userQuest!.status}` as any)}
              </span>
            </p>
          </div>
        </section>
      )}

      {/* ── Submission History ────────────────────────── */}
      {submissionHistory.length > 0 && (
        <section>
          <div className="rounded-xl border border-border bg-background p-6">
            <h2 className="text-lg font-semibold mb-4">{t("quests.submissionHistory")}</h2>
            <div className="space-y-3">
              {submissionHistory.map((item: SubmissionHistoryItem, idx: number) => (
                <div
                  key={item.submission_id}
                  className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {t("quests.attempt", { count: submissionHistory.length - idx })}
                    </p>
                    {item.content && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {item.content}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {item.submitted_at && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.submitted_at).toLocaleDateString()}
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        item.status === "PASSED"
                          ? "bg-success/10 text-success"
                          : item.status === "FAILED"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {t(`quests.status.${item.status}` as any)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
