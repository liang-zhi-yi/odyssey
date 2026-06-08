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
import { RewardBadge } from "@/app/components/RewardBadge";
import { QuestStatusBadge } from "@/app/components/QuestStatusBadge";
import { SubmissionForm } from "@/app/components/SubmissionForm";
import { Loading } from "@/app/components/Loading";
import { BackButton } from "@/app/components/BackButton";
import type { QuestDetail as QuestDetailType } from "@/types/quest";
import type { SubmissionHistoryItem } from "@/types/submission";
import { ApiRequestError } from "@/lib/api";

export default function QuestDetailPage() {
  const { id: questId } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, locale } = useLocale();

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
  // Last successful submission_id — used to retry assessment trigger on failure
  const [lastSubmissionId, setLastSubmissionId] = useState<string | null>(null);
  const [isRetryingAssessment, setIsRetryingAssessment] = useState(false);

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
      setLastSubmissionId(null);
      try {
        const res = await submissionService.submit(data);

        // Trigger assessment
        try {
          const assessment = await assessmentService.runAssessment({
            submission_id: res.submission_id,
          });
          // Navigate to assessment page for polling
          router.push(`/assessment/${assessment.assessment_id}`);
          return;
        } catch (assessmentErr) {
          // Submission succeeded but assessment trigger failed —
          // store the submission_id so the user can retry without re-submitting
          setLastSubmissionId(res.submission_id);
          const message =
            assessmentErr instanceof ApiRequestError
              ? assessmentErr.message
              : t("common.error");
          setSubmitError(message);
        }
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

  // ── Handle retry assessment (submission OK, assessment failed) ─
  const handleRetryAssessment = useCallback(async () => {
    if (!lastSubmissionId) return;
    setIsRetryingAssessment(true);
    setSubmitError(null);
    try {
      const assessment = await assessmentService.runAssessment({
        submission_id: lastSubmissionId,
      });
      router.push(`/assessment/${assessment.assessment_id}`);
    } catch (err) {
      const message =
        err instanceof ApiRequestError
          ? err.message
          : t("common.error");
      setSubmitError(message);
    } finally {
      setIsRetryingAssessment(false);
    }
  }, [lastSubmissionId, router, t]);

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

      {/* ── Associated Building ──────────────────────── */}
      {quest?.associated_building && (
        <section>
          <div className="rounded-xl border border-[#C4A77D]/20 bg-[#C4A77D]/5 p-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">
                {quest.associated_building.icon || "🏛️"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">
                  {t("quests.associatedBuilding") || "关联建筑"}
                </p>
                <p className="text-sm font-semibold text-[#8B7355]">
                  {locale === "en" && quest.associated_building!.name_en
                    ? quest.associated_building!.name_en
                    : quest.associated_building!.name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">
                  {t("world.level") || "等级"}
                </p>
                <p className="text-lg font-bold text-[#8B7355] tabular-nums">
                  Lv.{quest.associated_building.current_level}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Reward Preview ────────────────────────────── */}
      {quest?.reward_preview && (
        <section>
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🎁</span>
              <h3 className="text-sm font-semibold">
                {t("quests.rewardPreview") || "预计收益"}
              </h3>
            </div>
            <RewardBadge reward={quest.reward_preview} variant="expanded" />
          </div>
        </section>
      )}

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

      {/* ── FAILED state — retry or abandon ─────────── */}
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

          {/* If submission succeeded but assessment trigger failed — retry just the assessment */}
          {lastSubmissionId ? (
            <div className="rounded-xl border border-warning/30 bg-warning/5 p-6 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5">⚠️</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">
                    {t("quests.submissionSaved") || "提交已保存"}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("quests.assessmentTriggerFailed") || "评估触发失败，你可以重试评估"}
                  </p>
                  {submitError && (
                    <p className="text-sm text-destructive mt-1">{submitError}</p>
                  )}
                  <button
                    onClick={handleRetryAssessment}
                    disabled={isRetryingAssessment}
                    className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {isRetryingAssessment
                      ? t("settings.saving")
                      : t("quests.retryAssessment") || "重试评估"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Retry submission form */
            <div className="rounded-xl border border-border bg-background p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">{t("quests.submitWork")}</h2>
              <SubmissionForm
                questId={questId}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                error={submitError}
              />
            </div>
          )}

          {/* Abandon button for FAILED quests */}
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
        </section>
      )}

      {/* ── ACTIVE (ACCEPTED / IN_PROGRESS) state ─────── */}
      {isActive && (
        <>
          {/* Submission form — or retry assessment if submit was OK but assessment failed */}
          {lastSubmissionId ? (
            <section>
              <div className="rounded-xl border border-warning/30 bg-warning/5 p-6">
                <div className="flex items-start gap-3">
                  <span className="text-lg mt-0.5">⚠️</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">
                      {t("quests.submissionSaved") || "提交已保存"}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t("quests.assessmentTriggerFailed") || "评估触发失败，你可以重试评估"}
                    </p>
                    {submitError && (
                      <p className="text-sm text-destructive mt-1">{submitError}</p>
                    )}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={handleRetryAssessment}
                        disabled={isRetryingAssessment}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {isRetryingAssessment
                          ? t("settings.saving")
                          : t("quests.retryAssessment") || "重试评估"}
                      </button>
                      <button
                        onClick={() => {
                          setLastSubmissionId(null);
                          setSubmitError(null);
                        }}
                        className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
                      >
                        {t("quests.resubmit") || "重新提交"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : (
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
          )}

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
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              {t("quests.alreadySubmitted")}{" "}
              <QuestStatusBadge status={userQuest!.status} size="sm" />
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
                    <QuestStatusBadge
                      status={item.status as any}
                      size="sm"
                    />
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
