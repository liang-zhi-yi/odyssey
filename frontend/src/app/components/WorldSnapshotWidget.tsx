"use client";

import Link from "next/link";
import { useLocale } from "@/hooks/useLocale";

interface WorldSnapshotWidgetProps {
  worldTier: number;
  buildingCount: number;
  regionCount: number;
  isLoading: boolean;
  /** Number of active learning paths driving world growth */
  activePathCount?: number;
}

/**
 * Mini world state preview for the Bento Grid.
 */
export function WorldSnapshotWidget({
  worldTier,
  buildingCount,
  regionCount,
  isLoading,
  activePathCount,
}: WorldSnapshotWidgetProps) {
  const { t } = useLocale();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-[oklch(0.88_0.02_90)] dark:border-[oklch(0.3_0.01_80)] bg-gradient-to-br from-[oklch(0.99_0.003_95)] to-[oklch(0.975_0.005_92)] dark:from-[oklch(0.22_0.008_85)] dark:to-[oklch(0.2_0.006_85)] p-6 shadow-card h-full">
        <div className="h-5 w-24 rounded-md bg-muted skeleton-shimmer mb-4" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 w-full rounded-md bg-muted skeleton-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="group relative rounded-2xl border border-[oklch(0.88_0.02_90)] dark:border-[oklch(0.3_0.01_80)] bg-gradient-to-br from-[oklch(0.99_0.003_95)] to-[oklch(0.975_0.005_92)] dark:from-[oklch(0.22_0.008_85)] dark:to-[oklch(0.2_0.006_85)] p-5 shadow-card h-full overflow-hidden transition-all duration-300 hover:shadow-card-hover hover:border-[oklch(0.7_0.12_85_/_0.3)]">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-4 h-4 text-accent flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" />
        </svg>
        <h3 className="text-base font-civ-serif font-bold text-[oklch(0.3_0.02_80)] dark:text-[oklch(0.85_0.04_80)] truncate">
          {t("dashboard.sections.civilizationWorld")}
        </h3>
      </div>

      {buildingCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-full bg-accent/[0.06] blur-xl animate-glow-pulse" />
            <div className="relative w-16 h-16 rounded-full border border-[oklch(0.7_0.12_85_/_0.2)] bg-gradient-to-br from-[oklch(0.99_0.003_95)] to-[oklch(0.96_0.008_88)] flex items-center justify-center">
              <svg className="w-7 h-7 text-accent/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" />
                <path d="M9 9v.01M9 12v.01M9 15v.01M9 18v.01" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{t("dashboard.noWorld")}</p>
          <Link
            href="/quests"
            className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
          >
            {t("dashboard.startQuesting")}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Tier display — hexagon badge */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t("dashboard.civilizationTier")}</span>
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none">
                <path d="M12 2 L22 8.5 L22 15.5 L12 22 L2 15.5 L2 8.5 Z" fill="oklch(0.7 0.12 85 / 0.12)" stroke="oklch(0.7 0.12 85 / 0.5)" strokeWidth="1" />
              </svg>
              <span className="absolute text-sm font-bold tabular-nums text-accent font-mono">
                {worldTier}
              </span>
            </div>
          </div>

          {/* Building count */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <svg className="w-3.5 h-3.5 text-muted-foreground/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" />
              </svg>
              {t("dashboard.buildings")}
            </span>
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {buildingCount}
            </span>
          </div>

          {/* Region count */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <svg className="w-3.5 h-3.5 text-muted-foreground/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2 L22 8.5 L22 15.5 L12 22 L2 15.5 L2 8.5 Z" />
              </svg>
              {t("dashboard.regions")}
            </span>
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {regionCount}
            </span>
          </div>

          {/* Active paths driving growth */}
          {activePathCount != null && activePathCount > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-success/5 border border-success/20 px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-success animate-warm-pulse" />
              <span className="text-xs text-success font-medium">
                {activePathCount === 1
                  ? t("dashboard.pathDrivingOne")
                  : t("dashboard.pathDriving", { count: String(activePathCount) })}
              </span>
            </div>
          )}

          <Link
            href="/world"
            className="mt-2 flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/50 py-2 text-xs font-medium text-muted-foreground transition-all duration-300 hover:border-accent/30 hover:text-accent"
          >
            {t("dashboard.viewWorld")}
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}
