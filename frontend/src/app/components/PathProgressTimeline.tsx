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
 * Wide path progress timeline widget for the Bento Grid (full row).
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
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="h-5 w-40 rounded-md bg-muted skeleton-shimmer mb-4" />
        <div className="h-48 w-full rounded-lg bg-muted skeleton-shimmer" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          {selectedPathId ? t("dashboard.pathGrowth") : t("dashboard.growthCurve")}
        </h3>

        {/* Path switcher */}
        {allPaths.length > 0 ? (
          <select
            value={selectedPathId || ""}
            onChange={(e) => onSelectPath(e.target.value || null)}
            className="rounded-xl border border-border bg-card px-3 py-1.5 text-sm text-foreground transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">{t("dashboard.selectPath")}</option>
            {allPaths.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        ) : (
          <Link
            href="/paths"
            className="text-sm font-medium text-primary hover:underline"
          >
            {t("dashboard.createPath")}
          </Link>
        )}
      </div>

      {!selectedPathId ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-muted-foreground">{t("dashboard.selectPathHint")}</p>
          {allPaths.length === 0 && (
            <Link
              href="/paths"
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:opacity-90"
            >
              {t("dashboard.createFirstPath")}
            </Link>
          )}
        </div>
      ) : (
        <ProgressTimeline
          datasets={pathDatasets}
          skillName={pathName}
          isLoading={false}
        />
      )}
    </div>
  );
}
