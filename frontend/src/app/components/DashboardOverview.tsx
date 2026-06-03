"use client";

import { Loading } from "./Loading";
import type { UserSkill } from "@/types/skill";
import type { UserPath } from "@/types/path";

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
  if (isLoading) {
    return <Loading text="Loading dashboard..." />;
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
      label: "技能数量",
      value: userSkills.length,
      sub: "项已激活",
    },
    {
      label: "平均分",
      value: avgScore,
      sub: "综合评分",
    },
    {
      label: "学习路径",
      value: currentPath?.name || "未选择",
      sub: currentPath ? `进度 ${currentPath.progress}%` : "选择路径开始学习",
    },
    {
      label: "最高排名",
      value: topSkill?.rank || "—",
      sub: topSkill?.skill_name || "完成首次Quest",
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
