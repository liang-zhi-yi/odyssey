"use client";

import Link from "next/link";
import { useLocale } from "@/hooks/useLocale";
import type { LearningPath } from "@/types/learningPath";

interface ActivePathsWidgetProps {
  paths: LearningPath[];
  isLoading: boolean;
}

/**
 * Active expeditions widget for the Bento Grid.
 * Shows the user's active learning paths (进行中的远征) with progress.
 */
export function ActiveQuestsWidget({ paths, isLoading }: ActivePathsWidgetProps) {
  const { t, locale } = useLocale();
  const isEn = locale === "en";

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-[#C9A45C]/20 dark:border-[#C9A45C]/25 bg-gradient-to-br from-[#F7F2E8] to-[#F0E8D8] dark:from-[oklch(0.22_0.008_85)] dark:to-[oklch(0.2_0.006_85)] p-6 shadow-card h-full">
        <div className="h-5 w-28 rounded-md bg-muted skeleton-shimmer mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 w-full rounded-md bg-muted skeleton-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  const activePaths = paths.filter((p) => p.status === "ACTIVE");
  const display = activePaths.slice(0, 4);
  const totalCount = activePaths.length;

  return (
    <div className="group relative rounded-2xl border border-[#C9A45C]/20 dark:border-[#C9A45C]/25 bg-gradient-to-br from-[#F7F2E8] to-[#F0E8D8] dark:from-[oklch(0.22_0.008_85)] dark:to-[oklch(0.2_0.006_85)] p-5 shadow-card h-full overflow-hidden transition-all duration-300 hover:shadow-card-hover hover:border-[oklch(0.7_0.12_85_/_0.3)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <svg className="w-4 h-4 text-accent flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 22V4a1 1 0 011-1h12l-2 4 2 4H5" />
          </svg>
          <h3 className="text-base font-civ-serif font-bold text-[#4A3825] dark:text-[oklch(0.85_0.04_80)] truncate">
            {t("dashboard.sections.activeExpeditions")}
          </h3>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[oklch(0.7_0.12_85_/_0.2)] bg-accent/[0.06] px-2.5 py-0.5 text-xs font-semibold text-accent font-mono">
          {totalCount}
        </span>
      </div>
      {totalCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-full bg-accent/[0.06] blur-xl animate-glow-pulse" />
            <div className="relative w-16 h-16 rounded-full border border-[oklch(0.7_0.12_85_/_0.2)] bg-gradient-to-br from-[oklch(0.99_0.003_95)] to-[oklch(0.96_0.008_88)] flex items-center justify-center">
              <svg className="w-7 h-7 text-accent/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2 L22 8.5 L22 15.5 L12 22 L2 15.5 L2 8.5 Z" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{t("dashboard.noActiveQuests")}</p>
          <Link
            href="/paths"
            className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
          >
            {isEn ? "Create a path" : "创建学习路径"}
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {display.map((path) => (
            <li key={path.id}>
              <Link
                href={`/paths/${path.id}`}
                className="group flex items-start gap-3 rounded-xl p-2 -mx-2 transition-all duration-300 hover:bg-secondary/50 hover:translate-x-0.5"
              >
                {/* Hexagon status icon */}
                <svg
                  className="mt-1 h-3 w-3 flex-shrink-0 animate-warm-pulse"
                  viewBox="0 0 24 24"
                  fill="oklch(0.55 0.15 280)"
                  stroke="none"
                >
                  <path d="M12 2 L22 8.5 L22 15.5 L12 22 L2 15.5 L2 8.5 Z" />
                </svg>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {path.title}
                  </p>
                  {/* Progress bar */}
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-1 flex-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent transition-all duration-500"
                        style={{ width: `${path.progress_pct || 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground font-mono tabular-nums">
                      {path.progress_pct || 0}%
                    </span>
                  </div>
                </div>
                <svg className="h-4 w-4 flex-shrink-0 text-muted-foreground/40 dark:text-muted-foreground/70 mt-0.5 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
