"use client";

import { Loading } from "./Loading";
import type { UserSkill } from "@/types/skill";
import type { UserPath } from "@/types/path";
import { useLocale } from "@/hooks/useLocale";

interface DashboardOverviewProps {
  userSkills: UserSkill[];
  currentPath: UserPath | null;
  isLoading: boolean;
}

/**
 * Dashboard hero section showing overall stats:
 * - Number of skills
 * - Average overall score
 * - Current learning path
 * - Highest ranked skill
 */
export function DashboardOverview({
  userSkills,
  currentPath,
  isLoading,
}: DashboardOverviewProps) {
  const { t } = useLocale();

  if (isLoading) {
    return <Loading text={t("common.loading")} />;
  }

  const avgScore =
    userSkills.length > 0
      ? Math.round(
          userSkills.reduce((sum, s) => sum + s.overall, 0) / userSkills.length
        )
      : 0;

  const topSkill =
    userSkills.length > 0
      ? userSkills.reduce((best, s) => (s.overall > best.overall ? s : best))
      : null;

  const stats = [
    {
      label: t("dashboard.skillsCount"),
      value: userSkills.length,
      sub: t("common.activated"),
    },
    {
      label: t("dashboard.avgScore"),
      value: avgScore,
      sub: t("dashboard.overallScore"),
    },
    {
      label: t("dashboard.activePath"),
      value: currentPath?.name || t("dashboard.notSelected"),
      sub: currentPath ? t("paths.progress") + ` ${currentPath.progress}%` : t("dashboard.selectPath"),
    },
    {
      label: t("dashboard.topRank"),
      value: topSkill?.rank || "—",
      sub: topSkill?.skill_name || t("dashboard.completeFirstQuest"),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-border bg-background p-4"
        >
          <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
          <p className="text-xl font-bold text-foreground tabular-nums truncate">
            {stat.value}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{stat.sub}</p>
        </div>
      ))}
    </div>
  );
}
