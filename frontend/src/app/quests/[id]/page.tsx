"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { skillDisplayName } from "@/lib/skillNames";
import { questService } from "@/services/quest.service";
import { submissionService } from "@/services/submission.service";
import { assessmentService } from "@/services/assessment.service";
import { QuestHeader } from "@/app/components/QuestHeader";
import { QuestObjective } from "@/app/components/QuestObjective";
import { CivilizationBuildingCard } from "@/app/components/CivilizationBuildingCard";
import { QuestRewardPanel } from "@/app/components/QuestRewardPanel";
import { QuestScrollIcon } from "@/app/components/QuestScrollIcon";
import { QuestStatusBadge } from "@/app/components/QuestStatusBadge";
import { SubmissionForm } from "@/app/components/SubmissionForm";
import { Loading } from "@/app/components/Loading";
import { ErrorState } from "@/app/components/ErrorState";
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
  const isAssessing = userQuest?.status === "ASSESSING";

  // ── Fetch submission history ───────────────────────
  // 只要有提交记录（≥1 次）即可查看，含单次提交的历史与 AI 评测
  const { data: submissionHistory = [] } = useSWR(
    userQuest && userQuest.submission_count >= 1 && questId
      ? `submission-history-${questId}`
      : null,
    () => submissionService.getSubmissionHistory(questId)
  );

  // ── Handlers ───────────────────────────────────────
  const handleAccept = useCallback(async () => {
    if (!questId) return;
    setIsAccepting(true);
    setAcceptError(null);
    try {
      await questService.acceptQuest(questId);
      await mutate("user-quests");
    } catch (err) {
      setAcceptError(err instanceof ApiRequestError ? err.message : t("common.error"));
    } finally {
      setIsAccepting(false);
    }
  }, [questId, t]);

  const handleAbandon = useCallback(async () => {
    if (!questId) return;
    setIsAbandoning(true);
    setAbandonError(null);
    try {
      await questService.abandonQuest(questId);
      await mutate("user-quests");
      setShowAbandonConfirm(false);
    } catch (err) {
      setAbandonError(err instanceof ApiRequestError ? err.message : t("common.error"));
    } finally {
      setIsAbandoning(false);
    }
  }, [questId, t]);

  const handleSubmit = useCallback(
    async (data: { quest_id: string; content?: string; github_url?: string; demo_url?: string }) => {
      setIsSubmitting(true);
      setSubmitError(null);
      setLastSubmissionId(null);
      try {
        const res = await submissionService.submit(data);
        try {
          const assessment = await assessmentService.runAssessment({ submission_id: res.submission_id });
          router.push(`/assessment/${assessment.assessment_id}`);
          return;
        } catch (assessmentErr) {
          setLastSubmissionId(res.submission_id);
          setSubmitError(assessmentErr instanceof ApiRequestError ? assessmentErr.message : t("common.error"));
        }
      } catch (err) {
        setSubmitError(err instanceof ApiRequestError ? err.message : t("common.error"));
      } finally {
        setIsSubmitting(false);
      }
    },
    [router, t]
  );

  const handleRetryAssessment = useCallback(async () => {
    if (!lastSubmissionId) return;
    setIsRetryingAssessment(true);
    setSubmitError(null);
    try {
      const assessment = await assessmentService.runAssessment({ submission_id: lastSubmissionId });
      router.push(`/assessment/${assessment.assessment_id}`);
    } catch (err) {
      setSubmitError(err instanceof ApiRequestError ? err.message : t("common.error"));
    } finally {
      setIsRetryingAssessment(false);
    }
  }, [lastSubmissionId, router, t]);

  // ── Render ─────────────────────────────────────────
  if (authLoading || !isAuthenticated) {
    return <Loading text={t("auth.validating")} />;
  }

  if (questLoading || userQuestsLoading) {
    return <Loading text={t("common.loading")} />;
  }

  if (questError || (!quest && !questLoading)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <ErrorState
          message={t("common.error")}
          detail={questError instanceof Error ? questError.message : acceptError || abandonError || undefined}
        />
      </div>
    );
  }

  if (!quest) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <ErrorState message={t("common.noData")} />
      </div>
    );
  }

  // Derive subtitle from skill name + quest type
  const subtitle = locale === "zh"
    ? `推动 ${quest.skill_name} 领域的文明建设`
    : `Advance the civilization of ${quest.skill_name}`;

  return (
    <div className="quest-scroll-page px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* ── 返回任务大厅 ──────────────────────────────── */}
        <button
          onClick={() => router.back()}
          className="relative z-10 flex items-center gap-1.5 text-sm text-[oklch(0.45_0.03_72)] dark:text-[oklch(0.65_0.035_82)] hover:text-[oklch(0.32_0.025_70)] dark:hover:text-[oklch(0.85_0.04_80)] transition-colors group font-civ-serif"
        >
          <QuestScrollIcon name="arrow-left" size={16} className="group-hover:-translate-x-0.5 transition-transform" strokeWidth={1.4} />
          <span className="italic tracking-wide">{t("quests.backToList") || (locale === "zh" ? "返回任务大厅" : "Back to Quest Hall")}</span>
        </button>

        {/* ── 文明任务卷轴 ──────────────────────────────── */}
        <main className="relative z-10 rounded-xl scroll-fuse ornamental-border p-6 sm:p-8 space-y-7 scroll-enter">

        {/* ── 1. Quest Scroll Header ────────────────── */}
        <QuestHeader
          title={quest.title}
          titleEn={quest.title_en}
          subtitle={subtitle}
          difficulty={quest.difficulty}
          questType={quest.quest_type}
          skillName={skillDisplayName(quest.skill_name, undefined, locale)}
        />

        {/* ── 2. 任务核心区域 ────────────────────────── */}
        <QuestObjective
          background={quest.description}
          questTitle={locale === "en" && quest.title_en ? quest.title_en : quest.title}
          expectedDeliverable={quest.expected_deliverable}
        />

        {/* ── 3. 关联文明建筑 ────────────────────────── */}
        <CivilizationBuildingCard
          building={quest.associated_building ?? null}
          reward={quest.reward_preview ?? null}
        />

        {/* ── 4. 任务奖励 ────────────────────────────── */}
        <QuestRewardPanel reward={quest.reward_preview ?? null} />

        {/* ── 5. 开始探索 — 古卷轴印记按钮 ──────────── */}
        {!alreadyAccepted && !isAbandoned && (
          <div className="flex flex-col items-center pt-3 pb-1 relative z-10">
            <button
              onClick={handleAccept}
              disabled={isAccepting}
              className="scroll-seal-btn text-[26px] sm:text-[28px]"
              aria-label={locale === "zh" ? "开始探索" : "Begin Quest"}
            >
              {isAccepting
                ? (locale === "zh" ? "接 受 中" : "Accepting")
                : (locale === "zh" ? "开 始 探 索" : "Begin Quest")}
            </button>
            <p className="mt-5 text-[11px] text-[oklch(0.50_0.035_75)] dark:text-[oklch(0.62_0.04_80)] italic text-center font-civ-serif tracking-wide">
              {locale === "zh"
                ? "任务开始后将计入文明成长记录"
                : "Your progress will be recorded in your civilization chronicle"}
            </p>
            {acceptError && (
              <p className="mt-2 text-xs text-destructive text-center">{acceptError}</p>
            )}
          </div>
        )}

        {/* ── 已接受状态提示 ────────────────────────── */}
        {alreadyAccepted && !isAbandoned && !isFailed && (
          <div className="flex items-center justify-center gap-2 py-2 relative z-10">
            <QuestStatusBadge status={userQuest!.status} size="sm" />
            <span className="font-civ-serif text-sm text-[oklch(0.45_0.09_145)] dark:text-[oklch(0.68_0.10_145)] font-medium italic tracking-wide">
              {locale === "zh" ? "任务进行中" : "Quest in Progress"}
            </span>
          </div>
        )}
      </main>

      {/* ── 状态处理区域（在卷轴外部） ─────────────────── */}

      {/* ABANDONED state */}
      {isAbandoned && (
        <section className="rounded-xl scroll-fuse ornamental-border p-6">
          <div className="flex items-start gap-3 relative z-10">
            <QuestScrollIcon name="shield" size={20} className="text-[oklch(0.55_0.06_55)] dark:text-[oklch(0.68_0.06_60)] mt-0.5 flex-shrink-0" strokeWidth={1.4} />
            <div>
              <h3 className="font-civ-serif font-bold text-sm text-[oklch(0.35_0.03_70)] dark:text-[oklch(0.85_0.04_80)]">{t("quests.status.ABANDONED")}</h3>
              <p className="font-civ-serif text-sm text-[oklch(0.50_0.03_72)] dark:text-[oklch(0.65_0.035_82)] mt-1 italic">{t("quests.abandoned")}</p>
              <div className="mt-4">
                <button
                  onClick={handleAccept}
                  disabled={isAccepting}
                  className="scroll-seal-btn text-[18px]"
                  aria-label={t("quests.accept")}
                >
                  {isAccepting ? (locale === "zh" ? "接 受 中" : "Accepting") : (locale === "zh" ? "重 新 接 受" : "Accept Again")}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* FAILED state */}
      {isFailed && (
        <section className="space-y-4">
          <div className="rounded-xl scroll-fuse ornamental-border p-6">
            <div className="flex items-start gap-3 relative z-10">
              <QuestScrollIcon name="shield" size={20} className="text-[oklch(0.55_0.07_50)] dark:text-[oklch(0.68_0.07_55)] mt-0.5 flex-shrink-0" strokeWidth={1.4} />
              <div>
                <h3 className="font-civ-serif font-bold text-sm text-[oklch(0.35_0.03_70)] dark:text-[oklch(0.85_0.04_80)]">{t("quests.status.FAILED")}</h3>
                <p className="font-civ-serif text-sm text-[oklch(0.50_0.03_72)] dark:text-[oklch(0.65_0.035_82)] mt-1 italic">{t("quests.retry")}</p>
              </div>
            </div>
          </div>

          {lastSubmissionId ? (
            <div className="rounded-xl border border-[oklch(0.65_0.08_75_/_0.25)] bg-[oklch(0.93_0.025_80_/_0.35)] dark:bg-[oklch(0.22_0.015_78_/_0.40)] p-6">
              <div className="flex items-start gap-3 relative z-10">
                <QuestScrollIcon name="sparkle" size={20} className="text-[oklch(0.55_0.08_75)] dark:text-[oklch(0.72_0.09_80)] mt-0.5 flex-shrink-0" strokeWidth={1.4} />
                <div className="flex-1">
                  <h3 className="font-civ-serif font-bold text-sm text-[oklch(0.35_0.03_70)] dark:text-[oklch(0.85_0.04_80)]">
                    {t("quests.submissionSaved") || (locale === "zh" ? "提交已保存" : "Submission Saved")}
                  </h3>
                  <p className="font-civ-serif text-sm text-[oklch(0.50_0.03_72)] dark:text-[oklch(0.65_0.035_82)] mt-1 italic">
                    {t("quests.assessmentTriggerFailed") || (locale === "zh" ? "评估触发失败，你可以重试评估" : "Assessment trigger failed, you can retry")}
                  </p>
                  {submitError && <p className="text-sm text-destructive mt-1 font-civ-serif italic">{submitError}</p>}
                  <div className="mt-4">
                    <button
                      onClick={handleRetryAssessment}
                      disabled={isRetryingAssessment}
                      className="scroll-seal-btn text-[16px]"
                      aria-label={t("quests.retryAssessment") || (locale === "zh" ? "重试评估" : "Retry Assessment")}
                    >
                      {isRetryingAssessment ? (locale === "zh" ? "评 估 中" : "Assessing") : (locale === "zh" ? "重 试 评 估" : "Retry Assessment")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl scroll-fuse ornamental-border p-6">
              <SubmissionForm
                questId={questId}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                error={submitError}
                questTitle={locale === "en" && quest.title_en ? quest.title_en : quest.title}
                statusText={t("quests.status.FAILED") || (locale === "zh" ? "未通过" : "Failed")}
              />
            </div>
          )}

          {/* Abandon confirm */}
          {!showAbandonConfirm ? (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => setShowAbandonConfirm(true)}
                className="scroll-quiet-action"
              >
                {t("quests.abandon")}
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-[oklch(0.58_0.06_55_/_0.25)] bg-[oklch(0.92_0.02_60_/_0.30)] dark:bg-[oklch(0.22_0.015_60_/_0.40)] p-4 text-center">
              <p className="font-civ-serif text-sm text-[oklch(0.40_0.03_65)] dark:text-[oklch(0.72_0.035_75)] mb-3">{t("quests.confirmAbandon")}</p>
              <div className="flex justify-center gap-4">
                <button onClick={handleAbandon} disabled={isAbandoning}
                  className="scroll-quiet-action">
                  {isAbandoning ? t("settings.saving") : t("common.confirm")}
                </button>
                <button onClick={() => setShowAbandonConfirm(false)}
                  className="scroll-quiet-action">
                  {t("common.cancel")}
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ACTIVE state — submission form */}
      {isActive && (
        <section className="space-y-4">
          {lastSubmissionId ? (
            <div className="rounded-xl border border-[oklch(0.65_0.08_75_/_0.25)] bg-[oklch(0.93_0.025_80_/_0.35)] dark:bg-[oklch(0.22_0.015_78_/_0.40)] p-6">
              <div className="flex items-start gap-3 relative z-10">
                <QuestScrollIcon name="sparkle" size={20} className="text-[oklch(0.55_0.08_75)] dark:text-[oklch(0.72_0.09_80)] mt-0.5 flex-shrink-0" strokeWidth={1.4} />
                <div className="flex-1">
                  <h3 className="font-civ-serif font-bold text-sm text-[oklch(0.35_0.03_70)] dark:text-[oklch(0.85_0.04_80)]">
                    {t("quests.submissionSaved") || (locale === "zh" ? "提交已保存" : "Submission Saved")}
                  </h3>
                  <p className="font-civ-serif text-sm text-[oklch(0.50_0.03_72)] dark:text-[oklch(0.65_0.035_82)] mt-1 italic">
                    {t("quests.assessmentTriggerFailed") || (locale === "zh" ? "评估触发失败，你可以重试评估" : "Assessment trigger failed")}
                  </p>
                  {submitError && <p className="text-sm text-destructive mt-1 font-civ-serif italic">{submitError}</p>}
                  <div className="flex items-center gap-6 mt-4">
                    <button onClick={handleRetryAssessment} disabled={isRetryingAssessment}
                      className="scroll-seal-btn text-[16px]"
                      aria-label={t("quests.retryAssessment") || (locale === "zh" ? "重试评估" : "Retry")}>
                      {isRetryingAssessment ? (locale === "zh" ? "评 估 中" : "Assessing") : (locale === "zh" ? "重 试 评 估" : "Retry")}
                    </button>
                    <button onClick={() => { setLastSubmissionId(null); setSubmitError(null); }}
                      className="scroll-quiet-action">
                      {t("quests.resubmit") || (locale === "zh" ? "重新提交" : "Resubmit")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl scroll-fuse ornamental-border p-6">
              <SubmissionForm
                questId={questId}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                error={submitError}
                questTitle={locale === "en" && quest.title_en ? quest.title_en : quest.title}
                statusText={t("quests.status.ACCEPTED") || (locale === "zh" ? "已接受" : "Accepted")}
              />
            </div>
          )}

          {/* Abandon */}
          {!showAbandonConfirm ? (
            <div className="flex justify-center pt-2">
              <button onClick={() => setShowAbandonConfirm(true)}
                className="scroll-quiet-action">
                {t("quests.abandon")}
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-[oklch(0.58_0.06_55_/_0.25)] bg-[oklch(0.92_0.02_60_/_0.30)] dark:bg-[oklch(0.22_0.015_60_/_0.40)] p-4 text-center">
              <p className="font-civ-serif text-sm text-[oklch(0.40_0.03_65)] dark:text-[oklch(0.72_0.035_75)] mb-3">{t("quests.confirmAbandon")}</p>
              <div className="flex justify-center gap-4">
                <button onClick={handleAbandon} disabled={isAbandoning}
                  className="scroll-quiet-action">
                  {isAbandoning ? t("settings.saving") : t("common.confirm")}
                </button>
                <button onClick={() => setShowAbandonConfirm(false)}
                  className="scroll-quiet-action">
                  {t("common.cancel")}
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* PASSED / SUBMITTED state */}
      {(hasSubmitted || isPassed) && (
        <section className="rounded-xl scroll-fuse ornamental-border p-6">
          <div className="relative z-10">
            <h2 className="font-civ-serif text-base font-bold text-[oklch(0.32_0.025_70)] dark:text-[oklch(0.85_0.04_80)] mb-2">{t("quests.submissionStatus")}</h2>
            <p className="font-civ-serif text-sm text-[oklch(0.50_0.03_72)] dark:text-[oklch(0.65_0.035_82)] italic flex items-center gap-2">
              {t("quests.alreadySubmitted")} <QuestStatusBadge status={userQuest!.status} size="sm" />
            </p>
          </div>

          {/* Abandon (for ASSESSING status — zombie task recovery) */}
          {isAssessing && (
            !showAbandonConfirm ? (
              <div className="flex justify-center pt-5">
                <button onClick={() => setShowAbandonConfirm(true)}
                  className="scroll-quiet-action">
                  {t("quests.abandon")}
                </button>
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-[oklch(0.58_0.06_55_/_0.25)] bg-[oklch(0.92_0.02_60_/_0.30)] dark:bg-[oklch(0.22_0.015_60_/_0.40)] p-4 text-center">
                <p className="font-civ-serif text-sm text-[oklch(0.40_0.03_65)] dark:text-[oklch(0.72_0.035_75)] mb-3">{t("quests.confirmAbandon")}</p>
                <div className="flex justify-center gap-4">
                  <button onClick={handleAbandon} disabled={isAbandoning}
                    className="scroll-quiet-action">
                    {isAbandoning ? t("settings.saving") : t("common.confirm")}
                  </button>
                  <button onClick={() => setShowAbandonConfirm(false)}
                    className="scroll-quiet-action">
                    {t("common.cancel")}
                  </button>
                </div>
              </div>
            )
          )}
        </section>
      )}

      {/* Submission History — 提交记录 + AI 评测详情 */}
      {submissionHistory.length > 0 && (
        <section className="rounded-xl scroll-fuse ornamental-border p-6">
          <div className="relative z-10">
            <div className="flex items-center gap-2.5 mb-4">
              <QuestScrollIcon name="scroll" size={15} className="text-[oklch(0.50_0.05_75)] dark:text-[oklch(0.70_0.06_80)]" strokeWidth={1.4} />
              <h2 className="font-civ-serif text-sm font-bold text-[oklch(0.32_0.025_70)] dark:text-[oklch(0.85_0.04_80)] tracking-wide">
                {t("quests.submissionHistory")}
              </h2>
              <div className="flex-1 h-px bg-[oklch(0.72_0.06_80_/_0.18)] dark:bg-[oklch(0.55_0.05_80_/_0.20)]" />
            </div>
            <div className="space-y-3">
              {submissionHistory.map((item: SubmissionHistoryItem, idx: number) => {
                const attemptNo = submissionHistory.length - idx;
                return (
                  <div key={item.submission_id}
                    className="rounded-lg border border-[oklch(0.72_0.06_80_/_0.15)] dark:border-[oklch(0.48_0.04_80_/_0.20)] bg-[oklch(0.95_0.018_82_/_0.40)] dark:bg-[oklch(0.22_0.013_78_/_0.40)]">
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="min-w-0">
                        <p className="font-civ-serif text-sm font-medium text-[oklch(0.35_0.03_70)] dark:text-[oklch(0.82_0.04_80)]">
                          {t("quests.attempt", { count: attemptNo })}
                        </p>
                        {item.content && (
                          <p className="text-xs text-[oklch(0.50_0.03_72)] dark:text-[oklch(0.62_0.035_80)] font-civ-serif italic mt-0.5 line-clamp-2">{item.content}</p>
                        )}
                      </div>
                      <div className="flex flex-none items-center gap-2 flex-wrap justify-end">
                        {item.submitted_at && (
                          <span className="text-xs text-[oklch(0.50_0.03_72)] dark:text-[oklch(0.62_0.035_80)] font-civ-serif tabular-nums">
                            {new Date(item.submitted_at).toLocaleDateString()}
                          </span>
                        )}
                        <QuestStatusBadge status={item.status as any} size="sm" />
                        {item.assessment_id && (
                          <button
                            onClick={() => router.push(`/assessment/${item.assessment_id}`)}
                            className="font-civ-serif text-xs italic tracking-wide text-[oklch(0.50_0.05_75)] dark:text-[oklch(0.62_0.05_80)] hover:text-[oklch(0.35_0.05_70)] dark:hover:text-[oklch(0.78_0.06_82)] underline-offset-2 hover:underline transition-colors"
                          >
                            {t("quests.viewDetails")}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
      </div>
    </div>
  );
}
