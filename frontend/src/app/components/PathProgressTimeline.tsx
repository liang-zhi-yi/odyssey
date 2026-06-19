"use client";

import Link from "next/link";
import { useLocale } from "@/hooks/useLocale";
import { ProgressTimeline } from "./ProgressTimeline";
import type { LearningPath } from "@/types/learningPath";
import type { SkillGrowthPoint } from "@/types/progress";

interface PathProgressTimelineProps {
  allPaths: LearningPath[];
  selectedPathId: string | null;
  onSelectPath: (id: string | null) => void;
  pathDatasets: { name: string; points: SkillGrowthPoint[] }[];
  pathName?: string;
  isLoading: boolean;
}

/**
 * Growth Trajectory card — tracks the user's civilization evolution curve.
 * Features a high-quality "future blueprint" empty state when no path is selected.
 */
export function PathProgressTimeline({
  allPaths,
  selectedPathId,
  onSelectPath,
  pathDatasets,
  pathName,
  isLoading,
}: PathProgressTimelineProps) {
  const { t } = useLocale();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-[oklch(0.88_0.02_90)] dark:border-[oklch(0.3_0.01_80)] bg-gradient-to-br from-[oklch(0.99_0.003_95)] to-[oklch(0.975_0.005_92)] dark:from-[oklch(0.22_0.008_85)] dark:to-[oklch(0.2_0.006_85)] p-6 shadow-card h-full">
        <div className="h-5 w-40 rounded-md bg-muted skeleton-shimmer mb-4" />
        <div className="h-48 w-full rounded-lg bg-muted skeleton-shimmer" />
      </div>
    );
  }

  return (
    <div className="group relative rounded-2xl border border-[oklch(0.88_0.02_90)] dark:border-[oklch(0.3_0.01_80)] bg-gradient-to-br from-[oklch(0.99_0.003_95)] to-[oklch(0.975_0.005_92)] dark:from-[oklch(0.22_0.008_85)] dark:to-[oklch(0.2_0.006_85)] p-6 shadow-card h-full overflow-hidden transition-all duration-300 hover:shadow-card-hover hover:border-[oklch(0.7_0.12_85_/_0.3)]">
      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 opacity-[0.4] dark:opacity-[0.2] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.5 0.02 85 / 0.03) 1px, transparent 1px), linear-gradient(90deg, oklch(0.5 0.02 85 / 0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <svg className="w-4 h-4 text-accent flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 17 L9 11 L13 15 L21 7 M21 7 L15 7 M21 7 L21 13" />
            </svg>
            <h3 className="text-base font-bold font-civ-serif text-[oklch(0.3_0.02_80)] dark:text-[oklch(0.85_0.04_80)] truncate">
              {selectedPathId ? t("dashboard.pathGrowth") : t("dashboard.growthCurve")}
            </h3>
          </div>

          {/* Path switcher — styled as "expedition selector" */}
          {allPaths.length > 0 ? (
            <div className="relative">
              <select
                value={selectedPathId || ""}
                onChange={(e) => onSelectPath(e.target.value || null)}
                className="appearance-none rounded-xl border border-[oklch(0.88_0.02_90)] dark:border-[oklch(0.3_0.01_80)] bg-card pl-9 pr-8 py-1.5 text-sm text-foreground transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/30 hover:border-accent/30 cursor-pointer font-medium"
              >
                <option value="">{t("dashboard.selectPath")}</option>
                {allPaths.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
              {/* Compass icon prefix */}
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-accent/60 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 3 L14 12 L12 21 L10 12 Z" fill="oklch(0.7 0.12 85 / 0.2)" />
              </svg>
              {/* Dropdown arrow */}
              <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          ) : (
            <Link
              href="/paths"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              {t("dashboard.createPath")}
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          )}
        </div>

        {!selectedPathId ? (
          <FutureBlueprintEmptyState
            hasPaths={allPaths.length > 0}
            t={t}
          />
        ) : pathDatasets.length === 0 ? (
          <FutureBlueprintEmptyState
            hasPaths={true}
            t={t}
            variant="no-data"
          />
        ) : (
          <ProgressTimeline
            datasets={pathDatasets}
            skillName={pathName}
            isLoading={false}
          />
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */

/**
 * High-quality empty state — "Future Growth Blueprint".
 * Shows a predicted/idealized growth curve with exploration hints
 * instead of leaving the area blank.
 */
function FutureBlueprintEmptyState({
  hasPaths,
  t,
  variant = "no-path",
}: {
  hasPaths: boolean;
  t: (key: string, vars?: Record<string, string>) => string;
  variant?: "no-path" | "no-data";
}) {
  return (
    <div className="relative flex flex-col items-center justify-center py-10 px-4 text-center">
      {/* Decorative blueprint curve — predicted growth */}
      <div className="relative w-full max-w-md h-32 mb-6">
        <svg
          className="w-full h-full"
          viewBox="0 0 400 130"
          fill="none"
          aria-hidden="true"
        >
          {/* Grid lines */}
          <line x1="0" y1="30" x2="400" y2="30" stroke="oklch(0.5 0.02 85 / 0.06)" strokeWidth="0.5" strokeDasharray="2 4" />
          <line x1="0" y1="65" x2="400" y2="65" stroke="oklch(0.5 0.02 85 / 0.06)" strokeWidth="0.5" strokeDasharray="2 4" />
          <line x1="0" y1="100" x2="400" y2="100" stroke="oklch(0.5 0.02 85 / 0.06)" strokeWidth="0.5" strokeDasharray="2 4" />

          {/* Predicted growth curve — dashed, gradient */}
          <defs>
            <linearGradient id="blueprint-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="oklch(0.55 0.08 160)" stopOpacity="0.3" />
              <stop offset="50%" stopColor="oklch(0.7 0.12 85)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="oklch(0.7 0.12 85)" stopOpacity="0.15" />
            </linearGradient>
            <linearGradient id="blueprint-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.7 0.12 85)" stopOpacity="0.08" />
              <stop offset="100%" stopColor="oklch(0.7 0.12 85)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Area fill */}
          <path
            d="M 10 110 Q 80 105 120 90 T 220 60 T 320 35 T 390 20 L 390 120 L 10 120 Z"
            fill="url(#blueprint-area)"
          />
          {/* Curve */}
          <path
            d="M 10 110 Q 80 105 120 90 T 220 60 T 320 35 T 390 20"
            stroke="url(#blueprint-grad)"
            strokeWidth="2"
            strokeDasharray="6 4"
            fill="none"
            className="animate-civ-flow"
          />

          {/* Milestone dots — future checkpoints */}
          {[
            { x: 80, y: 105, delay: "0s" },
            { x: 160, y: 82, delay: "0.5s" },
            { x: 240, y: 55, delay: "1s" },
            { x: 320, y: 35, delay: "1.5s" },
          ].map((dot, i) => (
            <g key={i}>
              <circle
                cx={dot.x}
                cy={dot.y}
                r="4"
                fill="oklch(0.99 0.003 95)"
                stroke="oklch(0.7 0.12 85 / 0.4)"
                strokeWidth="1.2"
              />
              <circle
                cx={dot.x}
                cy={dot.y}
                r="2"
                fill="oklch(0.7 0.12 85 / 0.3)"
                className="animate-twinkle"
                style={{ animationDelay: dot.delay }}
              />
            </g>
          ))}

          {/* Start point */}
          <circle cx="10" cy="110" r="3" fill="oklch(0.55 0.08 160 / 0.5)" />
          {/* End point — future mastery */}
          <circle cx="390" cy="20" r="5" fill="none" stroke="oklch(0.7 0.12 85 / 0.5)" strokeWidth="1.5" />
          <circle cx="390" cy="20" r="2.5" fill="oklch(0.7 0.12 85 / 0.6)" className="animate-glow-pulse" />

          {/* Labels */}
          <text x="10" y="126" fill="oklch(0.5 0.02 85 / 0.5)" fontSize="7" fontFamily="monospace">
            {t("dashboard.emptyStates.startExploring")}
          </text>
          <text x="370" y="14" fill="oklch(0.7 0.12 85 / 0.6)" fontSize="7" fontFamily="monospace" textAnchor="end">
            ★
          </text>
        </svg>

        {/* Blueprint label */}
        <div className="absolute top-0 right-0 flex items-center gap-1">
          <div className="w-1 h-1 rounded-full bg-accent/40" />
          <span className="text-[8px] font-mono uppercase tracking-widest text-accent/50">
            {t("dashboard.emptyStates.predictedCurve")}
          </span>
        </div>
      </div>

      {/* Text content */}
      <div className="space-y-2 max-w-sm">
        <div className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4 text-accent/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 17 L9 11 L13 15 L21 7 M21 7 L15 7 M21 7 L21 13" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h4 className="text-sm font-bold font-civ-serif text-[oklch(0.3_0.02_80)] dark:text-[oklch(0.85_0.04_80)]">
            {variant === "no-data"
              ? t("dashboard.emptyStates.unchartedTerritory")
              : t("dashboard.emptyStates.futureBlueprint")}
          </h4>
        </div>
        <p className="text-xs text-muted-foreground/80 leading-relaxed">
          {variant === "no-data"
            ? t("dashboard.emptyStates.territoryDesc")
            : t("dashboard.emptyStates.blueprintDesc")}
        </p>
        <p className="text-[11px] text-muted-foreground/60 font-civ-serif italic">
          {t("dashboard.emptyStates.blueprintHint")}
        </p>
      </div>

      {/* CTA */}
      {!hasPaths && (
        <Link
          href="/paths"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[oklch(0.5_0.09_150)] px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-all duration-300 hover:shadow-[0_4px_16px_-2px_oklch(0.42_0.08_150/0.3)] hover:-translate-y-0.5"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {t("dashboard.createFirstPath")}
        </Link>
      )}
    </div>
  );
}
