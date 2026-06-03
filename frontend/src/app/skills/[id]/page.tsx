"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import { useAuth } from "@/hooks/useAuth";
import { skillService } from "@/services/skill.service";
import { progressService } from "@/services/progress.service";
import { ScoreCard } from "@/app/components/ScoreCard";
import { ProgressTimeline } from "@/app/components/ProgressTimeline";
import { Loading } from "@/app/components/Loading";

export default function SkillDetailPage() {
  const { id: skillId } = useParams<{ id: string }>();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

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

  if (authLoading) {
    return <Loading text="Loading..." />;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (skillLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <Loading text="Loading skill..." />
      </div>
    );
  }

  if (skillError || !userSkill) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm font-medium text-destructive">加载失败</p>
          <p className="text-xs text-muted-foreground mt-1">
            {skillError instanceof Error
              ? skillError.message
              : "Skill not found"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold">
          {userSkill.skill_name || userSkill.skill_id}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          技能详情与成长曲线
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
