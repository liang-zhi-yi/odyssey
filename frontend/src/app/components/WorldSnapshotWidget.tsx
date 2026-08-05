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
      <div
        className="relative bg-gradient-to-br from-[#F7F2E8]/80 to-[#F0E8D8]/50 dark:from-[oklch(0.22_0.008_85)] dark:to-[oklch(0.2_0.006_85)] p-6 h-full"
        style={{ clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))" }}
      >
        <div className="h-5 w-24 bg-[#C9A45C]/15 skeleton-shimmer mb-4" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 w-full bg-[#C9A45C]/10 skeleton-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="group relative bg-gradient-to-br from-[#F7F2E8]/70 to-[#F0E8D8]/40 dark:from-[oklch(0.22_0.008_85)] dark:to-[oklch(0.2_0.006_85)] p-5 h-full overflow-hidden transition-all duration-300 hover:from-[#F7F2E8]/90 hover:to-[#F0E8D8]/60"
      style={{ clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))" }}
    >
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-[#C9A45C]/40 to-transparent" />
      <div className="flex items-center gap-2 mb-4">
        {/* Civilization Building icon — 文明建筑 */}
        <svg className="w-4 h-4 text-[#C9A45C] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 21V8l5-4 5 4v13M7 21h10M9 21v-4h2v4M13 21v-4h2v4M9 12h2M13 12h2" />
        </svg>
        <h3 className="text-base font-civ-serif font-bold text-[#4A3825] dark:text-[oklch(0.85_0.04_80)] truncate">
          {t("dashboard.sections.civilizationWorld")}
        </h3>
      </div>

      {buildingCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-full bg-[#C9A45C]/8 blur-xl animate-glow-pulse" />
            <div className="relative w-16 h-16 flex items-center justify-center">
              {/* Inactive civilization building */}
              <svg className="w-8 h-8 text-[#C9A45C]/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 21V8l5-4 5 4v13M7 21h10" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{t("dashboard.noWorld")}</p>
          <Link
            href="/quests"
            className="mt-2 inline-block text-sm font-medium text-[#C9A45C] hover:underline"
          >
            {t("dashboard.startQuesting")}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Tier display — stone seal */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#8C7655] dark:text-[oklch(0.6_0.012_80)]">{t("dashboard.civilizationTier")}</span>
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="#C9A45C" fillOpacity="0.1" stroke="#C9A45C" strokeWidth="0.8" opacity="0.5" />
                <circle cx="12" cy="12" r="7" fill="none" stroke="#C9A45C" strokeWidth="0.5" opacity="0.3" strokeDasharray="1 2" />
              </svg>
              <span className="absolute text-sm font-bold tabular-nums text-[#C9A45C] font-mono">
                {worldTier}
              </span>
            </div>
          </div>

          {/* Building count — civilization building icon */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm text-[#8C7655] dark:text-[oklch(0.6_0.012_80)]">
              <svg className="w-3.5 h-3.5 text-[#C9A45C]/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 21V8l5-4 5 4v13M7 21h10M9 21v-4h2v4M13 21v-4h2v4" />
              </svg>
              {t("dashboard.buildings")}
            </span>
            <span className="text-sm font-semibold tabular-nums text-[#4A3825] dark:text-[oklch(0.85_0.04_80)]">
              {buildingCount}
            </span>
          </div>

          {/* Region count — territory marker */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm text-[#8C7655] dark:text-[oklch(0.6_0.012_80)]">
              <svg className="w-3.5 h-3.5 text-[#C9A45C]/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="6" cy="6" r="0.8" fill="currentColor" stroke="none" />
                <circle cx="18" cy="8" r="0.6" fill="currentColor" stroke="none" opacity="0.7" />
                <circle cx="12" cy="14" r="1" fill="currentColor" stroke="none" />
                <path d="M6 6 L18 8 L12 14" strokeWidth="0.5" opacity="0.35" />
              </svg>
              {t("dashboard.regions")}
            </span>
            <span className="text-sm font-semibold tabular-nums text-[#4A3825] dark:text-[oklch(0.85_0.04_80)]">
              {regionCount}
            </span>
          </div>

          {/* Active paths driving growth */}
          {activePathCount != null && activePathCount > 0 && (
            <div className="flex items-center gap-2 bg-[#C9A45C]/8 px-3 py-2" style={{ clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))" }}>
              <span className="h-2 w-2 rounded-full bg-[#C9A45C] animate-glow-pulse" />
              <span className="text-xs text-[#8C7655] dark:text-[oklch(0.6_0.012_80)] font-medium">
                {activePathCount === 1
                  ? t("dashboard.pathDrivingOne")
                  : t("dashboard.pathDriving", { count: String(activePathCount) })}
              </span>
            </div>
          )}

          <Link
            href="/world"
            className="mt-2 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-[#8C7655] dark:text-[oklch(0.6_0.012_80)] transition-all duration-300 hover:text-[#C9A45C] border-t border-[#C9A45C]/15"
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
