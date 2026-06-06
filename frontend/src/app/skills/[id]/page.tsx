"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import useSWR from "swr";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { skillService } from "@/services/skill.service";
import { worldService } from "@/services/world.service";
import { progressService } from "@/services/progress.service";
import { ScoreCard } from "@/app/components/ScoreCard";
import { Sparkline } from "@/app/components/Sparkline";
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

  // Fetch 30-day trend for sparkline
  const {
    data: trendPoints = [],
  } = useSWR(
    isAuthenticated && skillId ? `skill-trend-${skillId}` : null,
    () => skillService.getSkillTrend(skillId, 30).catch(() => [])
  );

  // Fetch world state to find the building linked to this skill
  const { data: worldData } = useSWR(
    isAuthenticated ? "world-for-skill" : null,
    () => worldService.getWorld().catch(() => null),
    { revalidateOnFocus: false, dedupingInterval: 120000 }
  );

  // Find the building whose template is linked to this skill
  const linkedBuilding = useMemo(() => {
    if (!worldData) return null;
    const allBuildings = [
      ...(worldData.buildings ?? []),
      ...(worldData.compound_buildings ?? []),
    ];
    return allBuildings.find(
      (b) => (b as any).template?.skill_id === skillId
    ) ?? null;
  }, [worldData, skillId]);

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

      {/* Cross-module: View Building in World */}
      {linkedBuilding && (
        <section>
          <a
            href={`/world?building=${linkedBuilding.id}`}
            className="flex items-center gap-3 rounded-xl border border-[oklch(0.88_0.02_90)] bg-gradient-to-r from-[oklch(0.98_0.005_90)] to-[oklch(0.96_0.01_92)] p-4 transition-all hover:shadow-card hover:border-[oklch(0.72_0.12_85_/_0.3)] group"
          >
            <span className="text-3xl transition-transform group-hover:scale-110">
              {(linkedBuilding as any).template?.icon ?? "🏛️"}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[oklch(0.3_0.02_80)]">
                {(linkedBuilding as any).template?.name ?? t("world.viewBuilding")}
              </p>
              <p className="text-xs text-[oklch(0.55_0.02_85)]">
                {t("world.viewInWorld")}
              </p>
            </div>
            <svg
              className="w-4 h-4 text-[oklch(0.55_0.02_85)] transition-transform group-hover:translate-x-0.5"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </a>
        </section>
      )}

      {/* 30d trend sparkline */}
      {trendPoints.length >= 2 && (
        <section>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-4">
            <span className="text-sm text-muted-foreground">{t("skills.trend")}</span>
            <Sparkline points={trendPoints} width={200} height={40} className="ml-auto" />
          </div>
        </section>
      )}

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
