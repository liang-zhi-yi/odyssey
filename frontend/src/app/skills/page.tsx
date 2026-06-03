"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { skillService } from "@/services/skill.service";
import { SkillCard } from "@/app/components/SkillCard";
import { ScoreCard } from "@/app/components/ScoreCard";
import { RadarChart } from "@/app/components/RadarChart";
import { Loading } from "@/app/components/Loading";
import { EmptyState } from "@/app/components/EmptyState";
import type { UserSkill, Skill } from "@/types/skill";
import type { DimensionScores } from "@/types/assessment";
import { computeAggregateScores } from "@/lib/scores";
import { ErrorState } from "@/app/components/ErrorState";

export default function SkillsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [selectedSkill, setSelectedSkill] = useState<UserSkill | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch all defined skills
  const { data: allSkills = [] } = useSWR(
    isAuthenticated ? "all-skills" : null,
    () => skillService.listSkills()
  );

  // Fetch user's skill states
  const {
    data: userSkills = [],
    isLoading,
    error,
  } = useSWR(isAuthenticated ? "user-skills" : null, () =>
    skillService.listUserSkills()
  );

  if (authLoading || !isAuthenticated) {
    return <Loading text="验证中..." />;
  }

  const userSkillMap = new Map(userSkills.map((us) => [us.skill_id, us]));

  // Compute radar scores for selected skill or aggregate
  const radarScores: DimensionScores = selectedSkill
    ? {
        knowledge: selectedSkill.knowledge,
        reasoning: selectedSkill.reasoning,
        application: selectedSkill.application,
        creation: selectedSkill.creation,
      }
    : computeAggregateScores(userSkills);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold">技能树</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          你的四维能力档案
        </p>
      </div>

      {/* Selected skill detail / Overview radar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Radar overview */}
        <div className="rounded-xl border border-border bg-background p-6 flex flex-col items-center">
          <h3 className="text-sm font-semibold mb-4">
            {selectedSkill
              ? selectedSkill.skill_name || selectedSkill.skill_id
              : "综合能力雷达图"}
          </h3>
          <RadarChart scores={radarScores} size={240} />
          {selectedSkill && (
            <button
              onClick={() => setSelectedSkill(null)}
              className="mt-4 text-xs text-primary hover:underline"
            >
              ← 查看综合概览
            </button>
          )}
        </div>

        {/* Score cards or skill list */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <Loading variant="skeleton-cards" cardCount={6} />
          ) : error ? (
            <ErrorState message="加载技能失败" />
          ) : userSkills.length === 0 ? (
            <EmptyState
              title="暂无技能数据"
              description="接受并完成Quest后，你的技能档案将在此展示"
              actionLabel="浏览 Quests"
              actionHref="/quests"
            />
          ) : selectedSkill ? (
            /* Show detailed score card for selected skill */
            <ScoreCard
              title={selectedSkill.skill_name || selectedSkill.skill_id}
              overall={selectedSkill.overall}
              scores={{
                knowledge: selectedSkill.knowledge,
                reasoning: selectedSkill.reasoning,
                application: selectedSkill.application,
                creation: selectedSkill.creation,
              }}
              rank={selectedSkill.rank}
              size={200}
            />
          ) : (
            /* Show skill cards grid */
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 animate-stagger">
              {userSkills.map((skill) => (
                <div
                  key={skill.skill_id}
                  onClick={() => setSelectedSkill(skill)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedSkill(skill);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`查看 ${skill.skill_name || skill.skill_id} 详情`}
                  className="cursor-pointer card-hover"
                >
                  <SkillCard skill={skill} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* All defined skills reference */}
      {allSkills.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">全部技能目录</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {allSkills.map((skill: Skill) => {
              const userSkill = userSkillMap.get(skill.id);
              return (
                <div
                  key={skill.id}
                  className={`rounded-lg border px-3 py-2 text-xs transition-all ${
                    userSkill
                      ? "border-primary/30 bg-primary/5 cursor-pointer hover:shadow-sm"
                      : "border-border bg-secondary/30"
                  }`}
                  onClick={() => {
                    if (userSkill) setSelectedSkill(userSkill);
                  }}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === " ") && userSkill) {
                      e.preventDefault();
                      setSelectedSkill(userSkill);
                    }
                  }}
                  tabIndex={userSkill ? 0 : undefined}
                  role={userSkill ? "button" : undefined}
                  aria-label={userSkill ? `查看 ${skill.name} 详情` : undefined}
                >
                  <p className="font-medium truncate">{skill.name}</p>
                  {userSkill ? (
                    <p className="text-primary font-bold mt-0.5 tabular-nums">
                      {userSkill.overall}
                    </p>
                  ) : (
                    <p className="text-muted-foreground mt-0.5">未激活</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
