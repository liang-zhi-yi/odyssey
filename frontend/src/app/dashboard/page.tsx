"use client";

import { useState } from "react";
import useSWR from "swr";
import { useAuth } from "@/hooks/useAuth";
import { skillService } from "@/services/skill.service";
import { progressService } from "@/services/progress.service";
import { pathService } from "@/services/path.service";
import { DashboardOverview } from "@/app/components/DashboardOverview";
import { SkillCard } from "@/app/components/SkillCard";
import { RecentActivity } from "@/app/components/RecentActivity";
import { ProgressTimeline } from "@/app/components/ProgressTimeline";
import { Loading } from "@/app/components/Loading";
import { EmptyState } from "@/app/components/EmptyState";
import type { UserSkill } from "@/types/skill";
import type { ProgressLog } from "@/types/progress";
import type { UserPath } from "@/types/path";
import type { SkillGrowthPoint } from "@/types/progress";

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);

  // Fetch user skills
  const {
    data: userSkills = [],
    isLoading: skillsLoading,
    error: skillsError,
  } = useSWR(isAuthenticated ? "user-skills" : null, () =>
    skillService.listUserSkills()
  );

  // Fetch current path
  const {
    data: currentPath,
    isLoading: pathLoading,
  } = useSWR(isAuthenticated ? "current-path" : null, () =>
    pathService.getCurrentPath().catch(() => null)
  );

  // Fetch recent progress logs
  const {
    data: progressLogs = [],
    isLoading: logsLoading,
  } = useSWR(isAuthenticated ? "progress-logs" : null, () =>
    progressService.listProgressLogs({ limit: 10 })
  );

  // Fetch growth data for selected skill
  const {
    data: growthPoints = [],
    isLoading: growthLoading,
  } = useSWR(
    selectedSkillId ? `skill-growth-${selectedSkillId}` : null,
    () => progressService.getSkillGrowth(selectedSkillId!)
  );

  if (authLoading) {
    return <Loading text="Loading..." />;
  }

  if (!isAuthenticated) {
    return null; // Will redirect from root page
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          你的能力概览与学习动态
        </p>
      </div>

      {/* Overview stats */}
      <DashboardOverview
        userSkills={userSkills}
        currentPath={currentPath || null}
        isLoading={skillsLoading || pathLoading}
      />

      {/* Skills grid */}
      <section>
        <h2 className="text-lg font-semibold mb-3">技能</h2>
        {skillsLoading ? (
          <Loading text="Loading skills..." />
        ) : skillsError ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            加载技能失败
          </div>
        ) : userSkills.length === 0 ? (
          <EmptyState
            title="暂无技能数据"
            description="接受并完成Quest后，你的技能档案将在此展示"
            actionLabel="浏览 Quests"
            actionHref="/quests"
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {userSkills.map((skill) => (
              <div
                key={skill.skill_id}
                onClick={() => setSelectedSkillId(skill.skill_id)}
                className="cursor-pointer"
              >
                <SkillCard skill={skill} />
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent activity */}
        <section>
          <h2 className="text-lg font-semibold mb-3">最近动态</h2>
          <div className="rounded-xl border border-border bg-background p-4">
            <RecentActivity logs={progressLogs} isLoading={logsLoading} />
          </div>
        </section>

        {/* Growth chart */}
        <section>
          <h2 className="text-lg font-semibold mb-3">
            {selectedSkillId ? "成长曲线" : "选择技能查看成长曲线"}
          </h2>
          <div className="rounded-xl border border-border bg-background p-4">
            {selectedSkillId ? (
              <ProgressTimeline
                points={growthPoints}
                skillName={
                  userSkills.find((s) => s.skill_id === selectedSkillId)
                    ?.skill_name || selectedSkillId
                }
                isLoading={growthLoading}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  点击上方技能卡片查看对应的成长曲线
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
