"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import useSWR from "swr";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { skillService } from "@/services/skill.service";
import { progressService } from "@/services/progress.service";
import { ScoreCard } from "@/app/components/ScoreCard";
import { ProgressTimeline } from "@/app/components/ProgressTimeline";
import { Loading } from "@/app/components/Loading";
import { ErrorState } from "@/app/components/ErrorState";
import { BackButton } from "@/app/components/BackButton";

export default function SkillDetailPage() {
  const { id: skillId } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useLocale();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch skill detail
  const {
    data: userSkill,
    isLoading: skillLoading,
    error: skillError,
  } = useSWR(
    isAuthenticated && skillId ? `user-skill-${skillId}` : null,
    () => skillService.getUserSkillDetail(skillId)
  );

  // Fetch growth data
  const {
    data: growthPoints = [],
    isLoading: growthLoading,
  } = useSWR(
    isAuthenticated && skillId ? `skill-growth-${skillId}` : null,
    () => progressService.getSkillGrowth(skillId)
  );

  if (authLoading || !isAuthenticated) {
    return <Loading text={t("auth.validating")} />;
  }

  if (skillLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <Loading text={t("common.loading")} />
      </div>
    );
  }

  if (skillError || !userSkill) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <ErrorState
          message={t("common.error")}
          detail={
            skillError instanceof Error
              ? skillError.message
              : "Skill not found"
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      {/* Back navigation */}
      <BackButton href="/skills" label={t("skills.backToList")} />

      <div>
        <h1 className="text-2xl font-bold">
          {userSkill.skill_name || userSkill.skill_id}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("skills.detailSubtitle")}
        </p>
      </div>

      {/* Score card with radar */}
      <ScoreCard
        title={userSkill.skill_name || userSkill.skill_id}
        overall={userSkill.overall}
        scores={{
          knowledge: userSkill.knowledge,
          reasoning: userSkill.reasoning,
          application: userSkill.application,
          creation: userSkill.creation,
        }}
        rank={userSkill.rank}
        size={200}
      />

      {/* Growth curve */}
      <section>
        <div className="rounded-xl border border-border bg-background p-4">
          <ProgressTimeline
            points={growthPoints}
            skillName={userSkill.skill_name || skillId}
            isLoading={growthLoading}
          />
        </div>
      </section>
    </div>
  );
}
