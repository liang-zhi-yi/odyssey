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
    <div className="relative overflow-hidden rounded-[1.5rem] border border-[oklch(0.7_0.12_85_/_0.35)] shadow-[0_8px_32px_-4px_oklch(0_0_0/0.06),0_0_0_1px_oklch(0.99_0.002_95/0.8)_inset]">
      {/* ── Background layers ─────────────────────────────── */}
      <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.99_0.003_95)] via-[oklch(0.975_0.005_92)] to-[oklch(0.96_0.008_88)] dark:from-[oklch(0.22_0.008_85)] dark:via-[oklch(0.2_0.006_85)] dark:to-[oklch(0.18_0.005_80)]" />
      {/* Hex grid texture */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.5] dark:opacity-[0.3]" aria-hidden="true">
        <defs>
          <pattern id="nexus-hex" width="60" height="104" patternUnits="userSpaceOnUse" patternTransform="scale(0.6)">
            <path d="M30 4 L54 18 L54 52 L30 66 L6 52 L6 18 Z" fill="none" stroke="oklch(0.55 0.08 160 / 0.06)" strokeWidth="0.8" />
            <circle cx="30" cy="35" r="1" fill="oklch(0.7 0.12 85 / 0.08)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#nexus-hex)" />
      </svg>
      {/* Radial focus glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 600px 300px at 30% 50%, oklch(0.7 0.08 85 / 0.06), transparent 70%)",
        }}
      />
      {/* Ambient glow blobs */}
      <div className="absolute top-1/4 right-[20%] w-[300px] h-[300px] rounded-full bg-accent/[0.06] blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-[10%] w-[200px] h-[200px] rounded-full bg-primary/[0.04] blur-3xl pointer-events-none" />

      {/* ── Content ───────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col lg:flex-row gap-8 p-6 sm:p-8">
        {/* ═══ Left: Civilization status ═══ */}
        <div className="flex-1 flex flex-col gap-5">
          {/* Header label */}
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2 L22 8.5 L22 15.5 L12 22 L2 15.5 L2 8.5 Z" />
              <path d="M12 2 L12 22 M2 8.5 L22 15.5 M22 8.5 L2 15.5" strokeWidth="0.6" />
            </svg>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-accent font-mono">
              {t("dashboard.nexus.title")}
            </span>
            <span className="text-xs text-muted-foreground/60 font-civ-serif italic">
              {t("dashboard.nexus.subtitle")}
            </span>
          </div>

          {/* Phase + stage info */}
          <div className="flex items-center gap-5">
            <div className="flex-shrink-0 relative">
              {/* Halo behind ring */}
              <div className="absolute inset-0 rounded-full bg-accent/[0.08] blur-xl animate-glow-pulse" />
              <div className="relative">
                <GrowthPhaseIndicator progressPct={progressPct} size="lg" />
              </div>
            </div>

            <div className="flex-1 space-y-2 min-w-0">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 font-mono">
                  {t("dashboard.nexus.civilizationStage")}
                </p>
                <h1 className="text-xl sm:text-2xl font-bold font-civ-serif text-[oklch(0.3_0.02_80)] dark:text-[oklch(0.85_0.04_80)] leading-tight truncate">
                  {currentPath
                    ? t("dashboard.onPath").replace("{path}", currentPath.title)
                    : t("dashboard.nexus.noDirection")}
                </h1>
              </div>

              {currentPath && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-[oklch(0.5_0.02_85)] font-semibold">
                    <span className="uppercase tracking-wider font-mono text-[10px]">
                      {t("dashboard.nexus.growthTrajectory")}
                    </span>
                    <span className="font-bold font-mono tabular-nums text-[oklch(0.3_0.02_80)] dark:text-accent">
                      {currentPath.progress_pct}%
                    </span>
                  </div>
                  {/* Progress bar — growth trajectory */}
                  <div className="h-2 w-full max-w-sm overflow-hidden rounded-full bg-[oklch(0.95_0.005_90)] dark:bg-[oklch(0.25_0.008_85)] border border-[oklch(0.88_0.02_90_/_0.5)] relative">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[oklch(0.55_0.08_160)] via-[oklch(0.6_0.1_150)] to-[oklch(0.7_0.12_85)] animate-route-flow transition-all duration-700 ease-out relative"
                      style={{ width: `${currentPath.progress_pct}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer-pulse" />
                    </div>
                  </div>
                </div>
              )}

              {!currentPath && (
                <p className="text-sm text-muted-foreground">
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
                className="group inline-flex items-center gap-2 rounded-xl border border-[oklch(0.7_0.12_85_/_0.3)] bg-gradient-to-br from-[oklch(0.99_0.003_95)] to-[oklch(0.97_0.005_92)] dark:from-[oklch(0.25_0.008_85)] dark:to-[oklch(0.22_0.006_85)] px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-all duration-300 hover:border-accent/50 hover:shadow-[0_4px_16px_-2px_oklch(0.7_0.12_85/0.15)] hover:-translate-y-0.5"
              >
                <svg className="h-4 w-4 text-accent transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{t("dashboard.nexus.nextExpedition")}</span>
                <svg className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            ) : (
              <Link
                href="/paths"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[oklch(0.5_0.09_150)] px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-all duration-300 hover:shadow-[0_4px_16px_-2px_oklch(0.42_0.08_150/0.3)] hover:-translate-y-0.5"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>{t("dashboard.nexus.chooseDirection")}</span>
              </Link>
            )}

            <Link
              href="/quests"
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-300 hover:text-foreground hover:bg-secondary/50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span>{t("dashboard.nexus.continueJourney")}</span>
            </Link>
          </div>

          {/* ── Civilization registry (stats) ── */}
          <div className="relative rounded-xl border border-[oklch(0.88_0.02_90_/_0.5)] dark:border-[oklch(0.3_0.01_80_/_0.5)] bg-gradient-to-r from-[oklch(0.99_0.003_95_/_0.6)] to-[oklch(0.975_0.005_92_/_0.4)] dark:from-[oklch(0.2_0.006_85_/_0.4)] dark:to-[oklch(0.18_0.005_80_/_0.3)] backdrop-blur-sm px-5 py-3.5">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-1 h-1 rounded-full bg-accent/60" />
              <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-muted-foreground/60 font-mono">
                {t("dashboard.nexus.registry")}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {stats.map((stat) => (
                <div key={stat.key} className="flex items-center gap-2 group">
                  <RegistryIcon name={stat.icon} />
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold tabular-nums font-mono text-foreground group-hover:text-accent transition-colors">
                      {stat.value}
                      {stat.suffix || ""}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      {stat.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ Right: AI Mentor visual area ═══ */}
        <div className="hidden lg:flex flex-shrink-0 w-[280px] xl:w-[320px] items-center justify-center relative">
          <MentorVisualArea />
        </div>
      </div>

      {/* Mobile mentor area (compact, below content) */}
      <div className="lg:hidden flex items-center justify-center pb-6 px-6">
        <MentorVisualArea compact />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */

/** Static AI mentor visual area — decorative only, no interaction. */
function MentorVisualArea({ compact = false }: { compact?: boolean }) {
  const { t } = useLocale();
  const size = compact ? 160 : 220;

  return (
    <div
      className="relative flex flex-col items-center"
      style={{ width: size, height: size + 40 }}
    >
      {/* Ambient glow */}
      <div
        className="absolute rounded-full bg-accent/[0.08] blur-2xl animate-glow-pulse"
        style={{ width: size * 0.9, height: size * 0.9, top: 10 }}
      />

      {/* Energy ring (decorative) */}
      <svg
        className="absolute animate-energy-ring"
        style={{ width: size, height: size, top: 0 }}
        viewBox="0 0 140 140"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="70" cy="70" r="64" stroke="oklch(0.7 0.12 85)" strokeWidth="0.8" strokeDasharray="3 8" opacity="0.3" />
        <circle cx="70" cy="70" r="58" stroke="oklch(0.7 0.12 85)" strokeWidth="0.5" strokeDasharray="2 12" opacity="0.2" />
        <circle cx="70" cy="70" r="52" stroke="oklch(0.55 0.08 160)" strokeWidth="0.4" strokeDasharray="1 6" opacity="0.15" />
      </svg>

      {/* Counter-rotating inner ring */}
      <svg
        className="absolute"
        style={{
          width: size * 0.7,
          height: size * 0.7,
          top: size * 0.15,
          animation: "energy-ring 30s linear infinite reverse",
        }}
        viewBox="0 0 100 100"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="50" cy="50" r="46" stroke="oklch(0.7 0.12 85)" strokeWidth="0.4" strokeDasharray="4 4" opacity="0.2" />
      </svg>

      {/* Center medallion — AI mentor emblem */}
      <div
        className="absolute rounded-full flex items-center justify-center backdrop-blur-xl border"
        style={{
          width: size * 0.5,
          height: size * 0.5,
          top: size * 0.25,
          background:
            "linear-gradient(135deg, oklch(0.99 0.003 95 / 0.8), oklch(0.95 0.01 90 / 0.6))",
          borderColor: "oklch(0.7 0.12 85 / 0.3)",
          boxShadow:
            "0 0 30px oklch(0.7 0.12 85 / 0.12), 0 4px 16px rgba(0,0,0,0.04), inset 0 1px 1px rgba(255,255,255,0.5)",
        }}
      >
        {/* Compass / mentor emblem */}
        <svg
          className="w-1/2 h-1/2 text-accent animate-rhumb-spin"
          viewBox="0 0 100 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          aria-hidden="true"
        >
          <circle cx="50" cy="50" r="42" strokeDasharray="2 4" opacity="0.5" />
          <circle cx="50" cy="50" r="34" opacity="0.4" />
          <path d="M50 8 L54 50 L50 92 L46 50 Z" fill="oklch(0.7 0.12 85 / 0.15)" />
          <path d="M8 50 L50 54 L92 50 L50 46 Z" fill="oklch(0.55 0.08 160 / 0.12)" strokeWidth="0.8" />
          <circle cx="50" cy="50" r="3" fill="oklch(0.7 0.12 85)" opacity="0.6" />
        </svg>
      </div>

      {/* Sparkle decorations */}
      <Sparkle className="absolute" style={{ top: size * 0.1, left: size * 0.15, width: 8, height: 8 }} delay="0s" />
      <Sparkle className="absolute" style={{ top: size * 0.2, right: size * 0.1, width: 6, height: 6 }} delay="0.8s" />
      <Sparkle className="absolute" style={{ bottom: size * 0.15, left: size * 0.2, width: 5, height: 5 }} delay="1.5s" />
      <Sparkle className="absolute" style={{ bottom: size * 0.1, right: size * 0.15, width: 7, height: 7 }} delay="2.2s" />

      {/* Pedestal */}
      <svg
        className="absolute bottom-8 w-full"
        viewBox="0 0 300 60"
        preserveAspectRatio="none"
        style={{ height: 30 }}
        aria-hidden="true"
      >
        <ellipse cx="150" cy="50" rx="120" ry="8" fill="none" stroke="oklch(0.7 0.12 85 / 0.2)" strokeWidth="0.8" />
        <ellipse cx="150" cy="50" rx="90" ry="6" fill="none" stroke="oklch(0.7 0.12 85 / 0.15)" strokeWidth="0.6" />
        <polygon points="150,35 172,42 172,50 150,54 128,50 128,42" fill="oklch(0.7 0.12 85 / 0.06)" stroke="oklch(0.7 0.12 85 / 0.2)" strokeWidth="0.8" />
      </svg>

      {/* Label */}
      <div className="absolute bottom-0 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent/80 font-mono">
          {t("dashboard.nexus.mentorGuide")}
        </p>
        <p className="text-[9px] text-muted-foreground/60 font-civ-serif italic mt-0.5">
          {t("dashboard.nexus.mentorHint")}
        </p>
      </div>
    </div>
  );
}

/** Small 4-point sparkle decoration. */
function Sparkle({
  className = "",
  style,
  delay = "0s",
}: {
  className?: string;
  style?: React.CSSProperties;
  delay?: string;
}) {
  return (
    <svg
      className={className}
      style={{ ...style, animationDelay: delay }}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 0 C13 6, 18 11, 24 12 C18 13, 13 18, 12 24 C11 18, 6 13, 0 12 C6 11, 11 6, 12 0 Z"
        fill="oklch(0.82 0.12 85)"
        opacity="0.7"
        className="animate-twinkle"
      />
    </svg>
  );
}

/** Small icon for the registry stats row. */
function RegistryIcon({ name }: { name: string }) {
  const common = "w-3.5 h-3.5 text-muted-foreground/50";
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
