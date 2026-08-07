"use client";

import Link from "next/link";
import { useLocale } from "@/hooks/useLocale";
import { GrowthPhaseIndicator } from "./GrowthPhaseIndicator";
import { AgentSparkles } from "./AgentSparkles";
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
 * Civilization Nexus — the hero section of the Dashboard.
 *
 * Replaces the traditional "welcome + stats" panel with a two-column
 * "civilization command center":
 *   - Left:  growth phase ring, civilization stage, current direction,
 *            growth trajectory bar, and next expedition CTA.
 *   - Right: a static AI mentor visual area (pedestal + energy ring +
 *            ambient sparkles) that echoes the Landing Page hero.
 *
 * Only visual — no data or business logic changes.
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
    { value: userSkills.length, label: t("dashboard.skillsCount"), key: "skills", icon: "codex" },
    { value: questsCompleted, label: t("dashboard.questsCompleted"), key: "quests", icon: "flag" },
    { value: worldTier, label: t("dashboard.worldTier"), key: "world", icon: "tower" },
    { value: avgScore, label: t("dashboard.avgScoreShort"), key: "score", suffix: "%", icon: "spark" },
  ];

  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-[#C9A45C]/20 bg-[#F7F2E8] dark:bg-[oklch(0.17_0.015_70)] p-8">
        <div className="flex items-center gap-8 animate-pulse">
          <div className="h-24 w-24 rounded-full bg-[#C9A45C]/15 skeleton-shimmer" />
          <div className="flex-1 space-y-3">
            <div className="h-6 w-48 rounded-md bg-[#C9A45C]/15 skeleton-shimmer" />
            <div className="h-4 w-72 rounded-md bg-[#C9A45C]/10 skeleton-shimmer" />
            <div className="h-3 w-96 rounded-md bg-[#C9A45C]/8 skeleton-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[1.5rem] border border-[#C9A45C]/25 shadow-[0_8px_32px_-4px_oklch(0_0_0/0.06),0_0_0_1px_oklch(0.99_0.002_95/0.8)_inset]">
      {/* ── Background layers ─────────────────────────────── */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F7F2E8] via-[#F5EFE3] to-[#F0E8D8] dark:from-[oklch(0.17_0.015_70)] dark:via-[oklch(0.15_0.012_70)] dark:to-[oklch(0.13_0.01_70)]" />
      {/* Hex grid texture */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.5]" aria-hidden="true">
        <defs>
          <pattern id="nexus-hex" width="60" height="104" patternUnits="userSpaceOnUse" patternTransform="scale(0.6)">
            <path d="M30 4 L54 18 L54 52 L30 66 L6 52 L6 18 Z" fill="none" stroke="#C9A45C15" strokeWidth="0.8" />
            <circle cx="30" cy="35" r="1" fill="#C9A45C20" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#nexus-hex)" />
      </svg>
      {/* Radial focus glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 600px 300px at 30% 50%, #C9A45C10, transparent 70%)",
        }}
      />
      {/* Ambient glow blobs */}
      <div className="absolute top-1/4 right-[20%] w-[300px] h-[300px] rounded-full bg-[#C9A45C]/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-[10%] w-[200px] h-[200px] rounded-full bg-[#C9A45C]/5 blur-3xl pointer-events-none" />

      {/* ── Content ───────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col lg:flex-row gap-8 p-6 sm:p-8">
        {/* ═══ Left: Civilization status ═══ */}
        <div className="flex-1 flex flex-col gap-5">
          {/* Header label */}
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#C9A45C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2 L22 8.5 L22 15.5 L12 22 L2 15.5 L2 8.5 Z" />
              <path d="M12 2 L12 22 M2 8.5 L22 15.5 M22 8.5 L2 15.5" strokeWidth="0.6" />
            </svg>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#C9A45C] font-mono">
              {t("dashboard.nexus.title")}
            </span>
            <span className="text-xs text-[#8C7655] dark:text-[oklch(0.6_0.012_80)]/60 font-civ-serif italic">
              {t("dashboard.nexus.subtitle")}
            </span>
          </div>

          {/* Phase + stage info */}
          <div className="flex items-center gap-5">
            <div className="flex-shrink-0 relative">
              {/* Halo behind ring */}
              <div className="absolute inset-0 rounded-full bg-[#C9A45C]/10 blur-xl animate-glow-pulse" />
              <div className="relative">
                <GrowthPhaseIndicator progressPct={progressPct} size="lg" />
              </div>
            </div>

            <div className="flex-1 space-y-2 min-w-0">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#8C7655] dark:text-[oklch(0.6_0.012_80)]/70 font-mono">
                  {t("dashboard.nexus.civilizationStage")}
                </p>
                <h1 className="text-xl sm:text-2xl font-bold font-civ-serif text-[#4A3825] dark:text-[oklch(0.85_0.04_80)] leading-tight truncate">
                  {currentPath
                    ? t("dashboard.onPath").replace("{path}", currentPath.title)
                    : t("dashboard.nexus.noDirection")}
                </h1>
              </div>

              {currentPath && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-[#8C7655] dark:text-[oklch(0.6_0.012_80)] font-semibold">
                    <span className="uppercase tracking-wider font-mono text-[10px]">
                      {t("dashboard.nexus.growthTrajectory")}
                    </span>
                    <span className="font-bold font-mono tabular-nums text-[#4A3825] dark:text-[oklch(0.85_0.04_80)]">
                      {currentPath.progress_pct}%
                    </span>
                  </div>
                  {/* Progress bar — growth trajectory */}
                  <div className="h-2 w-full max-w-sm overflow-hidden rounded-full bg-[#F0E8D8] dark:bg-[oklch(0.2_0.012_70)] border border-[#C9A45C]/20 relative">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#A08850] via-[#C9A45C] to-[#D4B068] animate-route-flow transition-all duration-700 ease-out relative"
                      style={{ width: `${currentPath.progress_pct}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer-pulse" />
                    </div>
                  </div>
                </div>
              )}

              {!currentPath && (
                <p className="text-sm text-[#8C7655] dark:text-[oklch(0.6_0.012_80)]">
                  {t("dashboard.startJourney")}
                </p>
              )}
            </div>
          </div>

          {/* CTA row */}
          <div className="flex flex-wrap items-center gap-3">
            {currentPath ? (
              <Link
                href="/paths?tab=checkpoint"
                className="group inline-flex items-center gap-2 px-1 py-1 text-sm font-semibold font-civ-serif italic text-[#4A3825] dark:text-[oklch(0.85_0.04_80)] transition-colors duration-300 hover:text-[#C9A45C]"
              >
                <svg className="h-4 w-4 text-[#C9A45C] transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{t("dashboard.nexus.nextExpedition")}</span>
                <svg className="h-3.5 w-3.5 text-[#8C7655] dark:text-[oklch(0.6_0.012_80)] transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            ) : (
              <Link
                href="/paths"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#C9A45C] to-[#A08850] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:shadow-[0_4px_16px_-2px_#C9A45C40] hover:-translate-y-0.5"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>{t("dashboard.nexus.chooseDirection")}</span>
              </Link>
            )}

            <Link
              href="/quests"
              className="inline-flex items-center gap-1.5 px-1 py-1 text-sm font-medium font-civ-serif italic text-[#8C7655] dark:text-[oklch(0.6_0.012_80)] transition-colors duration-300 hover:text-[#4A3825] dark:hover:text-[oklch(0.85_0.04_80)]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span>{t("dashboard.nexus.continueJourney")}</span>
            </Link>
          </div>

          {/* ── Civilization registry (stats) ── */}
          <div className="relative rounded-xl border border-[#C9A45C]/20 bg-gradient-to-r from-[#F7F2E8]/60 to-[#F5EFE3]/40 dark:from-[oklch(0.22_0.008_85)]/60 dark:to-[oklch(0.2_0.006_85)]/40 backdrop-blur-sm px-5 py-3.5">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-1 h-1 rounded-full bg-[#C9A45C]/60" />
              <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#8C7655] dark:text-[oklch(0.6_0.012_80)]/60 font-mono">
                {t("dashboard.nexus.registry")}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {stats.map((stat) => (
                <div key={stat.key} className="flex items-center gap-2 group">
                  <RegistryIcon name={stat.icon} />
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold tabular-nums font-mono text-[#4A3825] dark:text-[oklch(0.85_0.04_80)] group-hover:text-[#C9A45C] transition-colors">
                      {stat.value}
                      {stat.suffix || ""}
                    </span>
                    <span className="text-[10px] text-[#8C7655] dark:text-[oklch(0.6_0.012_80)] uppercase tracking-wider">
                      {stat.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ Right: AI Mentor (APNG, same as homepage) ═══ */}
        <div className="hidden lg:flex flex-shrink-0 w-[280px] xl:w-[320px] items-center justify-center relative">
          <div className="relative w-[220px] h-[220px]">
            {/* Radial glows */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[200px] h-[200px] rounded-full bg-[#C9A45C]/10 blur-2xl animate-glow-pulse" />
            </div>
            <div className="absolute inset-4 flex items-center justify-center pointer-events-none">
              <div className="w-[160px] h-[160px] rounded-full bg-gradient-to-br from-[#C9A45C]/8 to-[#C9A45C]/4 blur-xl" />
            </div>
            {/* Sparkles */}
            <AgentSparkles scale={1} />
            {/* APNG image — same as homepage */}
            <img
              src="/agent-mentor.apng"
              alt="AI Mentor"
              width={192}
              height={192}
              className="relative z-10 w-full h-full object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
            />
          </div>
        </div>
      </div>

      {/* Mobile mentor area (compact, below content) */}
      <div className="lg:hidden flex items-center justify-center pb-6 px-6">
        <div className="relative w-[160px] h-[160px]">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[140px] h-[140px] rounded-full bg-[#C9A45C]/8 blur-2xl animate-glow-pulse" />
          </div>
          <AgentSparkles scale={0.7} />
          <img
            src="/agent-mentor.apng"
            alt="AI Mentor"
            width={140}
            height={140}
            className="relative z-10 w-full h-full object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
          />
        </div>
      </div>
    </div>
  );
}

/** Small icon for the registry stats row. */
function RegistryIcon({ name }: { name: string }) {
  const common = "w-3.5 h-3.5 text-[#C9A45C]/50";
  const paths: Record<string, React.ReactNode> = {
    codex: <path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2M4 4h16v16H4z M8 8h8M8 12h8M8 16h5" strokeLinecap="round" strokeLinejoin="round" />,
    flag: <path d="M4 22V4a1 1 0 011-1h12l-2 4 2 4H5" strokeLinecap="round" strokeLinejoin="round" />,
    tower: <path d="M7 21V8l5-4 5 4v13M7 21h10M9 21v-4h2v4M13 21v-4h2v4M9 12h2M13 12h2" strokeLinecap="round" strokeLinejoin="round" />,
    spark: <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" strokeLinejoin="round" />,
  };
  return (
    <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      {paths[name] || paths.spark}
    </svg>
  );
}
