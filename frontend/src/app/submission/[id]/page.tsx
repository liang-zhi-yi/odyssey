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
import { QuestScrollIcon } from "@/app/components/QuestScrollIcon";
import { SUBMISSION_STATUS_LABELS, type SubmissionStatus } from "@/types/quest";

export default function SubmissionPage() {
  const { id: submissionId } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, locale } = useLocale();

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
      <div className="quest-scroll-page px-4 py-6">
        <div className="mx-auto max-w-2xl">
          <Loading text={t("common.loading")} />
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="quest-scroll-page px-4 py-6">
        <div className="mx-auto max-w-2xl">
          <ErrorState
            message={t("common.error")}
            detail={error instanceof Error ? error.message : t("submission.notFound")}
          />
        </div>
      </div>
    );
  }

  const status = submission.status as SubmissionStatus;
  const isZh = locale === "zh";

  return (
    <div className="quest-scroll-page px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Back navigation */}
        <BackButton label={t("submission.backOneLevel")} />

        {/* Header — 宋体卷轴标题 */}
        <div>
          <h1 className="font-civ-serif text-[22px] sm:text-[24px] font-bold text-[oklch(0.28_0.025_70)] dark:text-[oklch(0.88_0.04_80)] tracking-tight">
            {isZh ? "提交探索成果" : "Submission Record"}
          </h1>
          <p className="mt-1.5 font-civ-serif text-xs text-[oklch(0.50_0.035_75)] dark:text-[oklch(0.62_0.04_80)] italic tracking-wide">
            {isZh ? "文明档案" : "Civilization Archive"} · #{submission.submission_id}
          </p>
        </div>

        {/* Status scroll — 成果评议状态 */}
        <div className="rounded-xl scroll-fuse ornamental-border p-6">
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <QuestScrollIcon name="seal" size={15} className="text-[oklch(0.50_0.05_75)] dark:text-[oklch(0.70_0.06_80)]" strokeWidth={1.4} />
                <h2 className="font-civ-serif text-sm font-bold text-[oklch(0.32_0.025_70)] dark:text-[oklch(0.85_0.04_80)] tracking-wide">
                  {isZh ? "评议状态" : "Review Status"}
                </h2>
              </div>
              <span
                className={`font-civ-serif rounded-full px-3 py-1 text-xs font-medium ${
                  status === "PASSED"
                    ? "bg-[oklch(0.50_0.09_145_/_0.12)] text-[oklch(0.42_0.09_145)] dark:text-[oklch(0.72_0.10_145)]"
                    : status === "FAILED"
                    ? "bg-[oklch(0.55_0.07_50_/_0.12)] text-[oklch(0.45_0.07_50)] dark:text-[oklch(0.70_0.07_55)]"
                    : status === "ASSESSING"
                    ? "bg-[oklch(0.65_0.08_75_/_0.14)] text-[oklch(0.50_0.06_75)] dark:text-[oklch(0.75_0.08_80)]"
                    : "bg-[oklch(0.72_0.05_80_/_0.12)] text-[oklch(0.50_0.04_75)] dark:text-[oklch(0.68_0.045_80)]"
                }`}
              >
                {SUBMISSION_STATUS_LABELS[status] || status}
              </span>
            </div>
            <div className="scroll-divider" />

            {/* Content — 成果记录 */}
            {submission.content && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <QuestScrollIcon name="scroll" size={13} className="text-[oklch(0.50_0.05_75)] dark:text-[oklch(0.70_0.06_80)]" strokeWidth={1.4} />
                  <h3 className="font-civ-serif text-[12px] font-bold text-[oklch(0.35_0.03_70)] dark:text-[oklch(0.82_0.04_80)] tracking-wide">
                    {isZh ? "成果描述" : "Description"}
                  </h3>
                </div>
                <div className="rounded-lg bg-[oklch(0.95_0.018_82_/_0.45)] dark:bg-[oklch(0.22_0.013_78_/_0.40)] border border-[oklch(0.72_0.06_80_/_0.15)] dark:border-[oklch(0.48_0.04_80_/_0.20)] p-3.5">
                  <pre className="font-civ-serif text-sm whitespace-pre-wrap text-[oklch(0.35_0.03_70)] dark:text-[oklch(0.80_0.035_82)] leading-[1.8]">
                    {submission.content}
                  </pre>
                </div>
              </div>
            )}

            {/* Links — 档案记录 */}
            <div className="space-y-2.5">
              {submission.github_url && (
                <div className="flex items-center gap-2.5">
                  <QuestScrollIcon name="application" size={14} className="text-[oklch(0.50_0.05_75)] dark:text-[oklch(0.70_0.06_80)] flex-shrink-0" strokeWidth={1.4} />
                  <span className="font-civ-serif text-xs text-[oklch(0.50_0.035_75)] dark:text-[oklch(0.65_0.04_80)] flex-shrink-0">
                    {isZh ? "GitHub 档案" : "GitHub"}:
                  </span>
                  <a
                    href={submission.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-civ-serif text-sm text-[oklch(0.45_0.08_145)] dark:text-[oklch(0.68_0.09_145)] hover:underline italic truncate"
                  >
                    {submission.github_url}
                  </a>
                </div>
              )}
              {submission.demo_url && (
                <div className="flex items-center gap-2.5">
                  <QuestScrollIcon name="creation" size={14} className="text-[oklch(0.50_0.05_75)] dark:text-[oklch(0.70_0.06_80)] flex-shrink-0" strokeWidth={1.4} />
                  <span className="font-civ-serif text-xs text-[oklch(0.50_0.035_75)] dark:text-[oklch(0.65_0.04_80)] flex-shrink-0">
                    {isZh ? "演示记录" : "Demo"}:
                  </span>
                  <a
                    href={submission.demo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-civ-serif text-sm text-[oklch(0.45_0.08_145)] dark:text-[oklch(0.68_0.09_145)] hover:underline italic truncate"
                  >
                    {submission.demo_url}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Back link — 文字型返回 */}
        <div className="text-center">
          <Link
            href={`/quests/${submission.quest_id}`}
            className="scroll-quiet-action inline-block"
          >
            {t("submission.backToQuest")}
          </Link>
        </div>
      </div>
    </div>
  );
}
