"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import { useAuth } from "@/hooks/useAuth";
import { questService } from "@/services/quest.service";
import { submissionService } from "@/services/submission.service";
import { assessmentService } from "@/services/assessment.service";
import { QuestDetail } from "@/app/components/QuestDetail";
import { SubmissionForm } from "@/app/components/SubmissionForm";
import { Loading } from "@/app/components/Loading";
import type { QuestDetail as QuestDetailType } from "@/types/quest";
import type { SubmissionDetail } from "@/types/submission";
import { ApiRequestError } from "@/lib/api";

export default function QuestDetailPage() {
  const { id: questId } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [isAccepting, setIsAccepting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  // Fetch quest detail
  const {
    data: quest,
    isLoading: questLoading,
    error: questError,
  } = useSWR(
    isAuthenticated && questId ? `quest-${questId}` : null,
    () => questService.getQuestDetail(questId)
  );

  // Fetch user quest status
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
  const hasSubmitted = userQuest?.status === "SUBMITTED" ||
    userQuest?.status === "ASSESSING" ||
    userQuest?.status === "PASSED" ||
    userQuest?.status === "FAILED";

  // Handle accept quest
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
          : "Failed to accept quest";
      setAcceptError(message);
    } finally {
      setIsAccepting(false);
    }
  }, [questId]);

  // Handle submission
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
            : "Failed to submit";
        setSubmitError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [router]
  );

  if (authLoading) {
    return <Loading text="Loading..." />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      {/* Quest detail */}
      <QuestDetail
        quest={quest || null}
        isLoading={questLoading || userQuestsLoading}
        error={
          questError
            ? questError instanceof Error
              ? questError.message
              : "Failed to load quest"
            : acceptError
        }
        onAccept={handleAccept}
        isAccepting={isAccepting}
        alreadyAccepted={alreadyAccepted}
      />

      {/* Submission form — only show if already accepted */}
      {alreadyAccepted && !hasSubmitted && (
        <section>
          <div className="rounded-xl border border-border bg-background p-6">
            <h2 className="text-lg font-semibold mb-4">提交你的成果</h2>
            <SubmissionForm
              questId={questId}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              error={submitError}
            />
          </div>
        </section>
      )}

      {/* Already submitted notice */}
      {hasSubmitted && userQuest && (
        <section>
          <div className="rounded-xl border border-border bg-background p-6">
            <h2 className="text-lg font-semibold mb-2">提交状态</h2>
            <p className="text-sm text-muted-foreground">
              你已提交此Quest的成果。当前状态：{userQuest.status}
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
