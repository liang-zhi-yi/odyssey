"use client";

import { useState, type ReactNode } from "react";
import { CivilizationBadge, CIVILIZATION_META, type CivilizationType } from "./CivilizationBadge";
import { useLocale } from "@/hooks/useLocale";

const PAGE_SIZE = 12; // 4 rows × 3 columns (desktop)

interface CivilizationSectionProps {
  type: CivilizationType;
  /** Total quests in this civilization */
  totalQuests: number;
  /** Completed quests in this civilization */
  completedQuests: number;
  /** Civilization level (derived from building/skill score) */
  level: number;
  /** Max level for progress bar */
  maxLevel?: number;
  /** Quest cards to render (paginated internally) */
  quests: ReactNode[];
  /** Default expanded state */
  defaultExpanded?: boolean;
}

/**
 * Collapsible civilization section for the Quest Hall.
 *
 * Shows: civilization badge, name, level, completed count, progress bar.
 * Click to expand/collapse the quest list.
 * Internally paginates quest cards (PAGE_SIZE per page).
 *
 * Design: RPG "tech tree" node with ornamental border and ink-wash texture.
 */
export function CivilizationSection({
  type,
  totalQuests,
  completedQuests,
  level,
  maxLevel = 10,
  quests,
  defaultExpanded = false,
}: CivilizationSectionProps) {
  const { locale } = useLocale();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [page, setPage] = useState(0);

  const meta = CIVILIZATION_META[type] || { zh: type, en: type };
  const displayName = locale === "en" ? meta.en : meta.zh;
  const progressPct = totalQuests > 0 ? Math.round((completedQuests / totalQuests) * 100) : 0;

  // Don't render if no quests
  if (totalQuests === 0) return null;

  // Pagination
  const totalPages = Math.ceil(quests.length / PAGE_SIZE);
  const pagedQuests = quests.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const showPagination = totalPages > 1;

  return (
    <div
      className="rounded-xl scroll-fuse ornamental-border overflow-hidden"
      style={{
        ["--civ-stroke" as string]: `var(--civ-${type}-stroke, oklch(0.6 0.05 80))`,
        ["--civ-glow" as string]: `var(--civ-${type}-glow, oklch(0.6 0.1 80 / 0.2))`,
      }}
    >
      {/* ── Section Header (clickable) ───────────────────── */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-4 text-left transition-colors hover:bg-[oklch(0.92_0.02_80_/_0.30)] dark:hover:bg-[oklch(0.22_0.012_78_/_0.30)] relative z-10"
        aria-expanded={expanded}
      >
        {/* Civilization badge with glow */}
        <div className="flex-shrink-0">
          <CivilizationBadge type={type} size={40} glow={expanded} />
        </div>

        {/* Civilization name + level */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="font-civ-serif text-[15px] font-bold text-[oklch(0.30_0.025_70)] dark:text-[oklch(0.88_0.04_80)] truncate tracking-wide">
              {displayName}
            </h3>
            <span className="font-civ-serif text-[10px] text-[oklch(0.50_0.04_75)] dark:text-[oklch(0.65_0.045_80)] bg-[oklch(0.72_0.05_80_/_0.12)] dark:bg-[oklch(0.45_0.04_80_/_0.18)] rounded px-1.5 py-0.5 tabular-nums">
              Lv.{level}
            </span>
          </div>

          {/* Progress bar — completion percentage */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-[oklch(0.85_0.015_80_/_0.50)] dark:bg-[oklch(0.30_0.01_78_/_0.50)] overflow-hidden">
              <div
                className="h-full progress-liquid rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="font-civ-serif text-[10px] tabular-nums text-[oklch(0.45_0.03_72)] dark:text-[oklch(0.68_0.035_80)] flex-shrink-0">
              {completedQuests}/{totalQuests}
            </span>
          </div>
        </div>

        {/* Completion percentage */}
        <div className="flex-shrink-0 text-right">
          <div className="font-civ-serif text-lg font-bold tabular-nums text-[oklch(0.35_0.025_70)] dark:text-[oklch(0.85_0.04_80)]">
            {progressPct}%
          </div>
          <div className="font-civ-serif text-[9px] text-[oklch(0.50_0.035_75)] dark:text-[oklch(0.62_0.04_80)]">
            {locale === "zh" ? "已探索" : "Explored"}
          </div>
        </div>

        {/* Expand/collapse chevron */}
        <svg
          className={`flex-shrink-0 w-4 h-4 text-[oklch(0.50_0.04_75)] dark:text-[oklch(0.62_0.04_80)] transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 8 L 10 12 L 14 8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* ── Expandable Quest List ────────────────────────── */}
      {expanded && (
        <div className="section-expand relative z-10">
          <div className="px-4 pb-4 pt-1 border-t border-[oklch(0.72_0.06_80_/_0.15)] dark:border-[oklch(0.45_0.04_80_/_0.18)]">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-3">
              {pagedQuests}
            </div>

            {/* ── Pagination controls ─────────────────────── */}
            {showPagination && (
              <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-[oklch(0.72_0.06_80_/_0.12)] dark:border-[oklch(0.45_0.04_80_/_0.15)]">
                {/* Prev button */}
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="rounded-lg border border-[oklch(0.72_0.06_80_/_0.20)] dark:border-[oklch(0.50_0.04_80_/_0.22)] bg-transparent px-3 py-1.5 text-xs font-medium font-civ-serif text-[oklch(0.50_0.03_75)] dark:text-[oklch(0.65_0.035_80)] hover:bg-[oklch(0.92_0.02_80_/_0.40)] dark:hover:bg-[oklch(0.22_0.012_78_/_0.35)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 6 L 8 10 L 12 14" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {/* Page numbers */}
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-civ-serif font-bold tabular-nums transition-all ${
                      page === i
                        ? "bg-[oklch(0.60_0.08_145_/_0.15)] text-[oklch(0.40_0.08_145)] dark:text-[oklch(0.72_0.09_145)] border border-[oklch(0.60_0.08_145_/_0.30)]"
                        : "text-[oklch(0.50_0.03_75)] dark:text-[oklch(0.62_0.04_80)] hover:bg-[oklch(0.92_0.02_80_/_0.40)] dark:hover:bg-[oklch(0.22_0.012_78_/_0.35)] border border-transparent"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                {/* Next button */}
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page === totalPages - 1}
                  className="rounded-lg border border-[oklch(0.72_0.06_80_/_0.20)] dark:border-[oklch(0.50_0.04_80_/_0.22)] bg-transparent px-3 py-1.5 text-xs font-medium font-civ-serif text-[oklch(0.50_0.03_75)] dark:text-[oklch(0.65_0.035_80)] hover:bg-[oklch(0.92_0.02_80_/_0.40)] dark:hover:bg-[oklch(0.22_0.012_78_/_0.35)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 6 L 12 10 L 8 14" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
