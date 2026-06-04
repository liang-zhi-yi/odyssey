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
import type { UserPath, GrowthPath, PathGrowthResponse } from "@/types/path";

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, locale } = useLocale();
  const router = useRouter();
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);

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

  // Fetch trends for sparklines (only when userSkills are loaded)
  const skillIds = userSkills.map(s => s.skill_id);
  const { data: trendsData } = useSWR(
    skillIds.length > 0 ? `skill-trends-${skillIds.join("-")}` : null,
    async () => {
      const results = await Promise.all(
        skillIds.map(id => skillService.getSkillTrend(id, 30).catch(() => []))
      );
      return Object.fromEntries(skillIds.map((id, i) => [id, results[i]]));
    }
  );

  // Fetch current path
  const {
    data: currentPath,
    isLoading: pathLoading,
  } = useSWR(isAuthenticated ? "current-path" : null, () =>
    pathService.getCurrentPath().catch(() => null)
  );

  // Fetch available paths
  const {
    data: allPaths = [],
    isLoading: allPathsLoading,
  } = useSWR(isAuthenticated ? "all-paths" : null, () =>
    pathService.listPaths()
  );

  // Auto-select current path when it loads
  useEffect(() => {
    if (currentPath?.path_id && !selectedPathId) {
      setSelectedPathId(currentPath.path_id);
    }
  }, [currentPath, selectedPathId]);

  // Fetch recent progress logs
  const {
    data: progressLogs = [],
    isLoading: logsLoading,
  } = useSWR(isAuthenticated ? "progress-logs" : null, () =>
    progressService.listProgressLogs({ limit: 10 })
  );

  // Fetch path growth data for selected path
  const {
    data: pathGrowth,
    isLoading: pathGrowthLoading,
  } = useSWR(
    selectedPathId ? `path-growth-${selectedPathId}` : null,
    () => progressService.getPathGrowth(selectedPathId!)
  );

  // Resolve display name based on locale
  const resolveName = (zh: string, en: string | null | undefined) =>
    locale === "en" && en ? en : zh;

  // Build datasets from path growth response
  const pathDatasets = pathGrowth?.skills
    .filter((s) => s.points.length > 0)
    .map((s, i) => ({
      name: s.skill_name,
      points: s.points,
    })) || [];

  // Selected path info
  const selectedPath = allPaths.find((p) => p.id === selectedPathId);

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
              <SkillCard key={skill.skill_id} skill={skill} trend={trendsData?.[skill.skill_id] || []} />
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

        {/* Path Growth Curve */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">
              {selectedPathId ? t("dashboard.pathGrowth") : t("dashboard.selectPathChart")}
            </h2>

            {/* Path switcher */}
            {allPaths.length > 0 && (
              <select
                value={selectedPathId || ""}
                onChange={(e) => setSelectedPathId(e.target.value || null)}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">{t("dashboard.selectPath")}</option>
                {allPaths.map((p: GrowthPath) => (
                  <option key={p.id} value={p.id}>
                    {resolveName(p.name, p.name_en)}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="rounded-xl border border-border bg-background p-4">
            {!selectedPathId ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  {t("dashboard.clickPathHint")}
                </p>
              </div>
            ) : (
              <ProgressTimeline
                datasets={pathDatasets}
                skillName={pathGrowth?.path_name}
                isLoading={pathGrowthLoading || allPathsLoading}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
