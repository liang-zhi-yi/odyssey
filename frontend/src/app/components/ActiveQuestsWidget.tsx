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
      <div
        className="relative bg-gradient-to-br from-[#F7F2E8]/80 to-[#F0E8D8]/50 dark:from-[oklch(0.22_0.008_85)] dark:to-[oklch(0.2_0.006_85)] p-6 h-full"
        style={{ clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))" }}
      >
        <div className="h-5 w-28 bg-[#C9A45C]/15 skeleton-shimmer mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 w-full bg-[#C9A45C]/10 skeleton-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  const activePaths = paths.filter((p) => p.status === "ACTIVE");
  const display = activePaths.slice(0, 4);
  const totalCount = activePaths.length;

  return (
    <div
      className="group relative bg-gradient-to-br from-[#F7F2E8]/70 to-[#F0E8D8]/40 dark:from-[oklch(0.22_0.008_85)] dark:to-[oklch(0.2_0.006_85)] p-5 h-full overflow-hidden transition-all duration-300 hover:from-[#F7F2E8]/90 hover:to-[#F0E8D8]/60"
      style={{ clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))" }}
    >
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-[#C9A45C]/40 to-transparent" />
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 min-w-0">
          {/* Star Map icon — 星图 */}
          <svg className="w-4 h-4 text-[#C9A45C] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6" cy="6" r="1" fill="currentColor" stroke="none" />
            <circle cx="18" cy="8" r="0.8" fill="currentColor" stroke="none" opacity="0.7" />
            <circle cx="12" cy="14" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="8" cy="18" r="0.6" fill="currentColor" stroke="none" opacity="0.5" />
            <circle cx="16" cy="17" r="0.8" fill="currentColor" stroke="none" opacity="0.6" />
            <path d="M6 6 L18 8 L12 14 L8 18 M12 14 L16 17" strokeWidth="0.5" opacity="0.35" />
          </svg>
          <h3 className="text-base font-civ-serif font-bold text-[#4A3825] dark:text-[oklch(0.85_0.04_80)] truncate">
            {t("dashboard.sections.activeExpeditions")}
          </h3>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8C7655] dark:text-[oklch(0.6_0.012_80)] font-mono">
          <span className="w-1 h-1 rounded-full bg-[#C9A45C] animate-glow-pulse" />
          {totalCount}
        </span>
      </div>
      {totalCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-full bg-[#C9A45C]/8 blur-xl animate-glow-pulse" />
            <div className="relative w-16 h-16 flex items-center justify-center">
              {/* Inactive star map */}
              <svg className="w-9 h-9 text-[#C9A45C]/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="6" cy="6" r="0.8" fill="currentColor" stroke="none" />
                <circle cx="18" cy="8" r="0.6" fill="currentColor" stroke="none" opacity="0.7" />
                <circle cx="12" cy="14" r="1" fill="currentColor" stroke="none" />
                <circle cx="8" cy="18" r="0.5" fill="currentColor" stroke="none" opacity="0.5" />
                <circle cx="16" cy="17" r="0.6" fill="currentColor" stroke="none" opacity="0.6" />
                <path d="M6 6 L18 8 L12 14 L8 18 M12 14 L16 17" strokeWidth="0.4" opacity="0.3" />
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
                className="group flex items-start gap-3 p-2 -mx-2 transition-all duration-300 hover:bg-[#C9A45C]/8 hover:translate-x-0.5"
              >
                {/* Star map constellation marker */}
                <svg
                  className="mt-1 h-3 w-3 flex-shrink-0 animate-glow-pulse"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle cx="12" cy="12" r="2" fill="#C9A45C" opacity="0.8" />
                  <circle cx="12" cy="12" r="5" fill="none" stroke="#C9A45C" strokeWidth="0.5" opacity="0.3" strokeDasharray="1 2" />
                </svg>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {path.title}
                  </p>
                  {/* Progress bar — civilization growth line */}
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-1 flex-1 bg-[#C9A45C]/15 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#A08850] to-[#C9A45C] transition-all duration-500"
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
