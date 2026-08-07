"use client";

import Link from "next/link";
import { useState } from "react";
import { CivilizationBadge, CIVILIZATION_META, type CivilizationType } from "./CivilizationBadge";
import { CivIcon } from "./CivIcon";
import { QuestScrollIcon } from "./QuestScrollIcon";
import { skillDisplayName } from "@/lib/skillNames";
import { useLocale } from "@/hooks/useLocale";
import type { UserCivilizationQuestGroup, UserCivilizationQuestItem } from "@/types/quest";

interface CivilizationArchiveChapterProps {
  group: UserCivilizationQuestGroup;
  /** Default expanded state */
  defaultExpanded?: boolean;
}

/** Status → display label (zh/en) */
function statusLabel(status: string, isZh: boolean): string {
  const map: Record<string, { zh: string; en: string }> = {
    ACCEPTED: { zh: "已接受", en: "Accepted" },
    IN_PROGRESS: { zh: "探索中", en: "Exploring" },
    SUBMITTED: { zh: "已提交", en: "Submitted" },
    ASSESSING: { zh: "评议中", en: "Reviewing" },
    PASSED: { zh: "已通过", en: "Passed" },
    FAILED: { zh: "未通过", en: "Failed" },
    ABANDONED: { zh: "已放弃", en: "Abandoned" },
  };
  const entry = map[status];
  return entry ? (isZh ? entry.zh : entry.en) : status;
}

/** Status → accent color class */
function statusColor(status: string): string {
  switch (status) {
    case "PASSED": return "text-[oklch(0.45_0.09_145)] dark:text-[oklch(0.72_0.10_145)]";
    case "FAILED": return "text-[oklch(0.50_0.07_50)] dark:text-[oklch(0.70_0.07_55)]";
    case "ABANDONED": return "text-[oklch(0.55_0.03_65)] dark:text-[oklch(0.65_0.03_70)]";
    case "SUBMITTED":
    case "ASSESSING": return "text-[oklch(0.55_0.08_75)] dark:text-[oklch(0.72_0.09_80)]";
    default: return "text-[oklch(0.50_0.06_75)] dark:text-[oklch(0.72_0.07_80)]";
  }
}

/**
 * CivilizationArchiveChapter — 个人文明探索档案章节.
 *
 * Displays a civilization as a chapter in the player's exploration handbook:
 *   1. 文明印章 + 名称 + 等级 + 探索进度条 (██████░░░░ 12/120)
 *   2. 当前探索 — the active quest with status
 *   3. 探索记录 — list of passed/failed/abandoned quests
 *
 * Visual: 游戏冒险手册 / 文明图鉴 / 探索档案
 * No emoji — all SVG icons via QuestScrollIcon + CivilizationBadge.
 */
export function CivilizationArchiveChapter({
  group,
  defaultExpanded = false,
}: CivilizationArchiveChapterProps) {
  const { locale } = useLocale();
  const isZh = locale === "zh";
  const [expanded, setExpanded] = useState(defaultExpanded);
  // Pagination state — one page per section
  const [activePage, setActivePage] = useState(0);
  const [explorationPage, setExplorationPage] = useState(0);

  const civType = group.civilization_type as CivilizationType;
  const meta = CIVILIZATION_META[civType] || { zh: group.label, en: group.label_en };
  const displayName = isZh ? meta.zh : meta.en;

  const total = group.count;
  const passed = group.quests.filter((q) => q.submission_status === "PASSED");
  const completed = passed.length;
  const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const level = Math.min(10, completed + 1);

  // 当前探索: ALL quests that are accepted/in-progress/submitted/assessing
  const activeQuests = group.quests.filter((q) =>
    ["ACCEPTED", "IN_PROGRESS", "SUBMITTED", "ASSESSING"].includes(q.submission_status ?? "")
  );

  // 探索记录: passed / failed / abandoned quests
  const explorationQuests = group.quests.filter((q) =>
    ["PASSED", "FAILED", "ABANDONED"].includes(q.submission_status ?? "")
  );

  if (total === 0) return null;

  // Progress bar segments (██████░░░░ style) — 10 segments
  const filledSegments = Math.round((completed / total) * 10);

  return (
    <div
      className="rounded-xl scroll-fuse ornamental-border overflow-hidden"
      style={{
        ["--civ-stroke" as string]: `var(--civ-${civType}-stroke, oklch(0.6 0.05 80))`,
        ["--civ-glow" as string]: `var(--civ-${civType}-glow, oklch(0.6 0.1 80 / 0.2))`,
      }}
    >
      {/* ── Chapter Header (clickable) ─────────────────── */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-4 text-left transition-colors hover:bg-[oklch(0.92_0.02_80_/_0.30)] dark:hover:bg-[oklch(0.22_0.012_78_/_0.30)] relative z-10"
        aria-expanded={expanded}
      >
        {/* Civilization emblem */}
        <div className="flex-shrink-0">
          <CivIcon
            type="type"
            name={civType}
            size={40}
            alt={displayName}
            fallback={<CivilizationBadge type={civType} size={40} glow={expanded} />}
          />
        </div>

        {/* Name + level + progress */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="font-civ-serif text-[15px] font-bold text-[oklch(0.30_0.025_70)] dark:text-[oklch(0.88_0.04_80)] truncate">
              {displayName}
            </h3>
            <span className="font-civ-serif text-[10px] text-[oklch(0.50_0.04_75)] dark:text-[oklch(0.65_0.045_80)] bg-[oklch(0.72_0.05_80_/_0.12)] dark:bg-[oklch(0.45_0.04_80_/_0.18)] rounded px-1.5 py-0.5 tabular-nums">
              Lv.{level}
            </span>
          </div>

          {/* 探索进度 — ██████░░░░ segment bar */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-[2px] flex-1">
              {Array.from({ length: 10 }, (_, i) => (
                <div
                  key={i}
                  className={`h-[5px] flex-1 rounded-[1px] transition-all duration-500 ${
                    i < filledSegments
                      ? "bg-[oklch(0.55_0.09_145)] dark:bg-[oklch(0.65_0.10_145)]"
                      : "bg-[oklch(0.85_0.015_80_/_0.50)] dark:bg-[oklch(0.30_0.01_78_/_0.50)]"
                  }`}
                />
              ))}
            </div>
            <span className="font-civ-serif text-[11px] tabular-nums text-[oklch(0.45_0.03_72)] dark:text-[oklch(0.68_0.035_80)] flex-shrink-0">
              {completed}/{total}
            </span>
          </div>
        </div>

        {/* Completion percentage */}
        <div className="flex-shrink-0 text-right">
          <div className="font-civ-serif text-[18px] font-bold tabular-nums text-[oklch(0.35_0.025_70)] dark:text-[oklch(0.85_0.04_80)]">
            {progressPct}%
          </div>
          <div className="font-civ-serif text-[9px] text-[oklch(0.50_0.035_75)] dark:text-[oklch(0.62_0.04_80)]">
            {isZh ? "已探索" : "Explored"}
          </div>
        </div>

        {/* Chevron */}
        <QuestScrollIcon
          name="arrow-right"
          size={14}
          className={`flex-shrink-0 text-[oklch(0.50_0.04_75)] dark:text-[oklch(0.62_0.04_80)] transition-transform duration-300 ${expanded ? "rotate-90" : ""}`}
          strokeWidth={1.8}
        />
      </button>

      {/* ── Expandable Archive Content ──────────────────── */}
      {expanded && (
        <div className="section-expand relative z-10">
          <div className="px-4 pb-4 pt-1 border-t border-[oklch(0.72_0.06_80_/_0.15)] dark:border-[oklch(0.45_0.04_80_/_0.18)] space-y-4">

            {/* ── 当前探索 ─────────────────────────────────── */}
            {activeQuests.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <QuestScrollIcon name="mission" size={13} className="text-[oklch(0.50_0.06_75)] dark:text-[oklch(0.70_0.07_80)]" strokeWidth={1.4} />
                  <span className="font-civ-serif text-[11px] font-bold text-[oklch(0.35_0.03_70)] dark:text-[oklch(0.82_0.04_80)] uppercase tracking-[0.14em]">
                    {isZh ? "当前探索" : "Current Exploration"} ({activeQuests.length})
                  </span>
                  <div className="flex-1 h-px bg-[oklch(0.72_0.06_80_/_0.18)] dark:bg-[oklch(0.50_0.04_80_/_0.20)]" />
                </div>
                <PaginatedQuestList
                  items={activeQuests}
                  page={activePage}
                  onPageChange={setActivePage}
                  isZh={isZh}
                  highlight
                />
              </div>
            )}

            {/* ── 探索记录（已通过/未通过/已放弃） ─────────── */}
            {explorationQuests.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <QuestScrollIcon name="seal" size={13} className="text-[oklch(0.45_0.09_145)] dark:text-[oklch(0.68_0.10_145)]" strokeWidth={1.4} />
                  <span className="font-civ-serif text-[11px] font-bold text-[oklch(0.35_0.03_70)] dark:text-[oklch(0.82_0.04_80)] uppercase tracking-[0.14em]">
                    {isZh ? "探索记录" : "Exploration Records"} ({explorationQuests.length})
                  </span>
                  <div className="flex-1 h-px bg-[oklch(0.72_0.06_80_/_0.18)] dark:bg-[oklch(0.50_0.04_80_/_0.20)]" />
                </div>
                <PaginatedQuestList
                  items={explorationQuests}
                  page={explorationPage}
                  onPageChange={setExplorationPage}
                  isZh={isZh}
                />
              </div>
            )}

            {/* ── 空状态：无活跃任务 ───────────────────────── */}
            {activeQuests.length === 0 && explorationQuests.length === 0 && (
              <p className="font-civ-serif text-xs text-[oklch(0.50_0.03_72)] dark:text-[oklch(0.62_0.035_80)] italic text-center py-2">
                {isZh ? "暂无探索记录" : "No exploration records"}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Individual quest row in the archive — seal marker + title + status */
function ArchiveQuestRow({
  item,
  isZh,
  highlight = false,
}: {
  item: UserCivilizationQuestItem;
  isZh: boolean;
  highlight?: boolean;
}) {
  const title = isZh && item.title_en ? item.title : item.title;
  const displayTitle = !isZh && item.title_en ? item.title_en : title;
  const status = item.submission_status;
  const isPassed = status === "PASSED";

  return (
    <Link
      href={`/quests/${item.id}`}
      className={`group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
        highlight
          ? "bg-[oklch(0.92_0.025_80_/_0.50)] dark:bg-[oklch(0.23_0.015_78_/_0.45)] border border-[oklch(0.65_0.08_75_/_0.20)] dark:border-[oklch(0.50_0.05_80_/_0.22)]"
          : "hover:bg-[oklch(0.93_0.02_80_/_0.40)] dark:hover:bg-[oklch(0.22_0.012_78_/_0.35)] border border-transparent"
      }`}
    >
      {/* Seal marker — ✓ for passed, ○ for active, · for others */}
      <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
        {isPassed ? (
          <QuestScrollIcon name="star" size={14} className="text-[oklch(0.50_0.10_145)] dark:text-[oklch(0.70_0.10_145)]" />
        ) : (
          <div className={`w-2.5 h-2.5 rounded-full border ${highlight ? "border-[oklch(0.55_0.08_75)] bg-[oklch(0.65_0.08_75_/_0.20)]" : "border-[oklch(0.60_0.04_75_/_0.50)]"}`} />
        )}
      </div>

      {/* Title + skill */}
      <div className="flex-1 min-w-0">
        <p className={`font-civ-serif text-[13px] truncate leading-tight ${
          isPassed
            ? "text-[oklch(0.40_0.03_70)] dark:text-[oklch(0.80_0.035_82)]"
            : highlight
            ? "text-[oklch(0.30_0.025_70)] dark:text-[oklch(0.88_0.04_80)] font-bold"
            : "text-[oklch(0.40_0.025_72)] dark:text-[oklch(0.75_0.035_82)]"
        }`}>
          {displayTitle}
        </p>
        {item.skill_name && (
          <p className="font-civ-serif text-[10px] text-[oklch(0.55_0.03_75)] dark:text-[oklch(0.62_0.04_80)] truncate mt-0.5 italic">
            {skillDisplayName(item.skill_name, undefined, isZh ? "zh" : "en")}
          </p>
        )}
      </div>

      {/* Status label */}
      {status && (
        <span className={`font-civ-serif text-[10px] italic flex-shrink-0 ${statusColor(status)}`}>
          {statusLabel(status, isZh)}
        </span>
      )}

      {/* Arrow */}
      <QuestScrollIcon
        name="arrow-right"
        size={12}
        className="flex-shrink-0 text-[oklch(0.50_0.04_75_/_0.40)] dark:text-[oklch(0.68_0.04_80_/_0.70)] group-hover:text-[oklch(0.45_0.06_75)] dark:group-hover:text-[oklch(0.75_0.07_80)] group-hover:translate-x-0.5 transition-all"
        strokeWidth={1.6}
      />
    </Link>
  );
}

/** Paginated quest list — shows PAGE_SIZE items per page with prev/next controls */
const PAGE_SIZE = 8;

function PaginatedQuestList({
  items,
  page,
  onPageChange,
  isZh,
  highlight = false,
}: {
  items: UserCivilizationQuestItem[];
  page: number;
  onPageChange: (page: number) => void;
  isZh: boolean;
  highlight?: boolean;
}) {
  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const safePage = Math.min(page, totalPages - 1);
  const start = safePage * PAGE_SIZE;
  const pageItems = items.slice(start, start + PAGE_SIZE);

  return (
    <div>
      <div className="space-y-1.5">
        {pageItems.map((item) => (
          <ArchiveQuestRow key={item.id} item={item} isZh={isZh} highlight={highlight} />
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-3 pt-2 border-t border-[oklch(0.72_0.06_80_/_0.10)] dark:border-[oklch(0.45_0.04_80_/_0.12)]">
          <button
            onClick={() => onPageChange(Math.max(0, safePage - 1))}
            disabled={safePage === 0}
            className="font-civ-serif text-[11px] px-2.5 py-1 rounded-md border border-[oklch(0.72_0.06_80_/_0.20)] dark:border-[oklch(0.45_0.04_80_/_0.22)] text-[oklch(0.45_0.03_72)] dark:text-[oklch(0.75_0.04_80)] hover:bg-[oklch(0.92_0.02_80_/_0.40)] dark:hover:bg-[oklch(0.22_0.012_78_/_0.35)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {isZh ? "上一页" : "Prev"}
          </button>
          <span className="font-civ-serif text-[11px] tabular-nums text-[oklch(0.45_0.03_72)] dark:text-[oklch(0.68_0.035_80)]">
            {safePage + 1} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(Math.min(totalPages - 1, safePage + 1))}
            disabled={safePage >= totalPages - 1}
            className="font-civ-serif text-[11px] px-2.5 py-1 rounded-md border border-[oklch(0.72_0.06_80_/_0.20)] dark:border-[oklch(0.45_0.04_80_/_0.22)] text-[oklch(0.45_0.03_72)] dark:text-[oklch(0.75_0.04_80)] hover:bg-[oklch(0.92_0.02_80_/_0.40)] dark:hover:bg-[oklch(0.22_0.012_78_/_0.35)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {isZh ? "下一页" : "Next"}
          </button>
        </div>
      )}
    </div>
  );
}
