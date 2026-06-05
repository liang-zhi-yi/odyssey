"use client";

import Link from "next/link";
import { useLocale } from "@/hooks/useLocale";
import { GrowthPhaseIndicator } from "./GrowthPhaseIndicator";
import type { UserSkill } from "@/types/skill";
import type { LearningPath } from "@/types/learningPath";

interface DashboardHeroProps {
  userSkills: UserSkill[];
  currentPath: LearningPath | null;
  worldTier?: number;
  questsCompleted?: number;
  isLoading: boolean;
}

/**
 * Hero section for the Dashboard — replaces the old 4-stat grid.
 * Shows growth phase, active path, next milestone, and inline stats.
 */
export function DashboardHero({
  userSkills,
  currentPath,
  worldTier = 0,
  questsCompleted = 0,
  isLoading,
}: DashboardHeroProps) {
  const { t } = useLocale();

  const avgScore =
    userSkills.length > 0
      ? Math.round(
          userSkills.reduce((sum, s) => sum + s.overall, 0) / userSkills.length
        )
      : 0;

  const progressPct = currentPath?.progress_pct ?? avgScore;

  const stats = [
    { value: userSkills.length, label: t("dashboard.skillsCount"), key: "skills" },
    { value: questsCompleted, label: t("dashboard.questsCompleted"), key: "quests" },
    { value: worldTier, label: t("dashboard.worldTier"), key: "world" },
    { value: avgScore, label: t("dashboard.avgScoreShort"), key: "score", suffix: "%" },
  ];

  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-8">
        <div className="flex items-center gap-8 animate-pulse">
          <div className="h-24 w-24 rounded-full bg-muted skeleton-shimmer" />
          <div className="flex-1 space-y-3">
            <div className="h-6 w-48 rounded-md bg-muted skeleton-shimmer" />
            <div className="h-4 w-72 rounded-md bg-muted skeleton-shimmer" />
            <div className="h-3 w-96 rounded-md bg-muted skeleton-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-card"
      style={{
        backgroundImage:
          "url('/textures/hero-pattern.svg'), linear-gradient(to bottom, oklch(0.55 0.08 160 / 0.04), oklch(0.985 0.002 95))",
        backgroundSize: "60px 60px, 100% 100%",
      }}
    >
      {/* Content */}
      <div className="relative z-10 flex flex-col gap-6 p-8 sm:flex-row sm:items-center">
        {/* Phase indicator */}
        <div className="flex-shrink-0">
          <GrowthPhaseIndicator progressPct={progressPct} size="lg" />
        </div>

        {/* Main info */}
        <div className="flex-1 space-y-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {t("dashboard.welcome")}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {currentPath
                ? t("dashboard.onPath").replace("{path}", currentPath.title)
                : t("dashboard.title")}
            </h1>
          </div>

          {currentPath && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{t("paths.progress")}</span>
                <span className="font-semibold tabular-nums text-foreground">
                  {currentPath.progress_pct}%
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                  style={{ width: `${currentPath.progress_pct}%` }}
                />
              </div>
            </div>
          )}

          {!currentPath && (
            <div className="space-y-1.5">
              <p className="text-sm text-muted-foreground">
                {t("dashboard.startJourney")}
              </p>
              <Link
                href="/paths"
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:opacity-90"
              >
                {t("dashboard.createPath")}
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          )}
        </div>

        {/* Next milestone CTA */}
        {currentPath && (
          <div className="flex-shrink-0">
            <Link
              href="/paths?tab=checkpoint"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-medium text-foreground shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-card-hover"
            >
              <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{t("dashboard.nextMilestone")}</span>
              <svg className="h-3.5 w-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          </div>
        )}
      </div>

      {/* Inline stats row */}
      <div className="border-t border-border/50 px-8 py-4">
        <div className="flex flex-wrap items-center gap-6 sm:gap-8">
          {stats.map((stat) => (
            <div key={stat.key} className="flex items-baseline gap-1.5">
              <span className="text-lg font-semibold tabular-nums text-foreground">
                {stat.value}
                {stat.suffix || ""}
              </span>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
