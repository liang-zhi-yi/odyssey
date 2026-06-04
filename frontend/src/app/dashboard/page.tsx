"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { skillService } from "@/services/skill.service";
import { progressService } from "@/services/progress.service";
import { pathService } from "@/services/path.service";
import { DashboardOverview } from "@/app/components/DashboardOverview";
import { SkillCard } from "@/app/components/SkillCard";
import { RecentActivity } from "@/app/components/RecentActivity";
import { ProgressTimeline } from "@/app/components/ProgressTimeline";
import { Loading } from "@/app/components/Loading";
import { ErrorState } from "@/app/components/ErrorState";
import { EmptyState } from "@/app/components/EmptyState";
import type { UserSkill } from "@/types/skill";
import type { ProgressLog } from "@/types/progress";
import type { UserPath } from "@/types/path";
import type { SkillGrowthPoint } from "@/types/progress";

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

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

  if (authLoading || !isAuthenticated) {
    return <Loading text={t("auth.validating")} />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold">{t("dashboard.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("dashboard.subtitle")}
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
        <h2 className="text-lg font-semibold mb-3">{t("dashboard.skillsSection")}</h2>
        {skillsLoading ? (
          <Loading variant="skeleton-cards" cardCount={3} />
        ) : skillsError ? (
            <ErrorState message={t("dashboard.loadSkillsError")} />
          ) : userSkills.length === 0 ? (
          <EmptyState
            title={t("dashboard.noSkillData")}
            description={t("dashboard.noSkillDesc")}
            actionLabel={t("dashboard.browseQuests")}
            actionHref="/quests"
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 animate-stagger">
            {userSkills.map((skill) => (
              <div
                key={skill.skill_id}
                onClick={() => setSelectedSkillId(skill.skill_id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedSkillId(skill.skill_id);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={t("skills.viewSkillDetail", { name: skill.skill_name || skill.skill_id })}
                className="cursor-pointer card-hover"
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
          <h2 className="text-lg font-semibold mb-3">{t("dashboard.recentActivity")}</h2>
          <div className="rounded-xl border border-border bg-background p-4">
            <RecentActivity logs={progressLogs} isLoading={logsLoading} />
          </div>
        </section>

        {/* Growth chart */}
        <section>
          <h2 className="text-lg font-semibold mb-3">
            {selectedSkillId ? t("dashboard.growthChart") : t("dashboard.selectSkillChart")}
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
                  {t("dashboard.clickSkillHint")}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
