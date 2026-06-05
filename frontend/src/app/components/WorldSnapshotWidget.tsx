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
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
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
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <h3 className="text-lg font-semibold mb-4">{t("dashboard.myWorld")}</h3>

      {buildingCount === 0 ? (
        <div className="py-4 text-center">
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
          {/* Tier display */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t("dashboard.civilizationTier")}</span>
            <span className="rounded-full bg-accent/10 px-3 py-1 text-sm font-semibold text-accent">
              {t("dashboard.tier")} {worldTier}
            </span>
          </div>

          {/* Building count */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t("dashboard.buildings")}</span>
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {buildingCount}
            </span>
          </div>

          {/* Region count */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t("dashboard.regions")}</span>
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
            className="mt-2 flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/50 py-2 text-xs font-medium text-muted-foreground transition-all duration-300 hover:border-primary/30 hover:text-foreground"
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
