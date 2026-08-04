"use client";

import { useState, useEffect, useMemo, type ReactNode } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { skillService } from "@/services/skill.service";
import { progressService } from "@/services/progress.service";
import { worldService } from "@/services/world.service";
import { questService } from "@/services/quest.service";
import { badgeService } from "@/services/badge.service";
import { Loading } from "@/app/components/Loading";
import { ErrorState } from "@/app/components/ErrorState";
import { QuestScrollIcon } from "@/app/components/QuestScrollIcon";
import {
  CIV_COLORS,
  CopperDivider,
  SealRing,
  EraStoneIcon,
  BuildingSealIcon,
  ParchmentBackground,
  CivArchiveStyles,
} from "@/app/components/CivArchiveTheme";
import type { UserSkill } from "@/types/skill";
import type { TimelineEvent } from "@/types/progress";
import type {
  World,
  WorldEvent,
  CivilizationEra,
} from "@/types/world";
import type { UserQuest } from "@/types/quest";
import type { UserBadge } from "@/types/badge";
import {
  ERA_LABELS,
  EVENT_TYPE_LABELS,
  CIVILIZATION_TIER_LABELS,
} from "@/types/world";

// ── Constants ───────────────────────────────────────────────────────

const ERA_ORDER: CivilizationEra[] = [
  "WILDERNESS",
  "AGRICULTURE",
  "ACADEMY",
  "INDUSTRY",
  "INFORMATION",
  "AI",
  "INTELLIGENCE",
  "DIGITAL",
  "FUTURE",
];

const CHRONICLE_EVENT_TYPES: Set<string> = new Set([
  "BUILDING_UPGRADE",
  "COMPOUND_UNLOCK",
  "COMPOUND_UPGRADE",
  "TIER_ADVANCE",
  "ERA_ADVANCE",
  "MILESTONE_REACHED",
  "PATH_MILESTONE_COMPLETED",
  "REGION_UNLOCK",
  "EXPLORATION_UNLOCK",
]);

const BUILDING_EVENT_TYPES: Set<string> = new Set([
  "BUILDING_UPGRADE",
  "COMPOUND_UNLOCK",
  "COMPOUND_UPGRADE",
]);

// ── Types ────────────────────────────────────────────────────────────

interface ChronicleEntry {
  id: string;
  date: Date;
  monthKey: string;
  type: string;
  icon: ReactNode;
  title: string;
  description: string | null;
}

interface BuildingLogEntry {
  id: string;
  date: Date;
  type: string;
  icon: ReactNode;
  title: string;
  buildingName: string;
  action: string;
  level?: number;
  skillId?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────

function formatMonthLabel(monthKey: string, locale: string): string {
  const [year, month] = monthKey.split("-");
  if (locale === "en") {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
  }
  return `${year}年${parseInt(month, 10)}月`;
}

function formatDateShort(dateStr: string, locale: string): string {
  const d = new Date(dateStr);
  if (locale === "en") {
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function extractBuildingName(title: string): string {
  const patterns = [
    " 升级至 Lv",
    " 建造完成",
    " 解锁",
    " upgraded to Lv",
    " constructed",
    " unlocked",
  ];
  for (const pat of patterns) {
    const idx = title.indexOf(pat);
    if (idx > 0) return title.slice(0, idx);
  }
  return title.slice(0, 8);
}

// ── Internal Components ──────────────────────────────────────────────

/** Map event type to an inline SVG icon for the chronicle timeline */
function eventChronicleIcon(eventType: string, size = 14): ReactNode {
  const color = CIV_COLORS.gold;
  switch (eventType) {
    case "BUILDING_UPGRADE":
    case "COMPOUND_UPGRADE":
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>;
    case "COMPOUND_UNLOCK":
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 7-2.6" /></svg>;
    case "REGION_UNLOCK":
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3V7z" /><path d="M9 4v13M15 7v13" strokeWidth="1" opacity="0.5" /></svg>;
    case "TIER_ADVANCE":
      return <QuestScrollIcon name="star" size={size} />;
    case "MILESTONE_REACHED":
      return <QuestScrollIcon name="mission" size={size} />;
    case "PATH_MILESTONE_COMPLETED":
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h4l3-7 4 14 3-7h4" /></svg>;
    case "ERA_ADVANCE":
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M6 2h12v6a6 6 0 0 1-12 0V2z" /><path d="M6 8H4M18 8h2M6 14H4M18 14h2M9 22h6" strokeWidth="1" opacity="0.6" /></svg>;
    case "EXPLORATION_UNLOCK":
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-5-5" /></svg>;
    case "RESOURCE_BOOST":
    case "skill_growth":
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l6-6 4 4 8-8" /><path d="M21 7v4h-4" /></svg>;
    default:
      return <QuestScrollIcon name="seal" size={size} />;
  }
}

/** Compact stat card — civilization archive styled */
function StatCard({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: string | number;
  label: string;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl px-4 py-3 shadow-sm min-w-[120px] civ-archive-card"
    >
      <span
        className="text-xl flex-shrink-0 inline-flex"
        style={{ color: CIV_COLORS.gold }}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p
          className="text-lg font-bold tabular-nums leading-tight civ-archive-title"
          style={{ color: CIV_COLORS.darkRed }}
        >
          {value}
        </p>
        <p
          className="text-[11px] truncate leading-tight"
          style={{ color: CIV_COLORS.textSecondary }}
        >
          {label}
        </p>
      </div>
    </div>
  );
}

/**
 * Era Evolution — "文明时代长卷" (Civilization Era Scroll).
 * Vertical timeline with stone/seal SVG icons per era.
 */
function EraEvolutionScroll({
  worldData,
  locale,
}: {
  worldData: World;
  locale: string;
}) {
  const currentEra = worldData.era;
  const currentIdx = ERA_ORDER.indexOf(currentEra);
  const eraProgress = worldData.next_era_at
    ? Math.min(100, Math.round((worldData.era_score / worldData.next_era_at) * 100))
    : 100;
  const nextEra =
    currentIdx >= 0 && currentIdx < ERA_ORDER.length - 1
      ? ERA_ORDER[currentIdx + 1]
      : null;
  const nextEraLabel = nextEra ? ERA_LABELS[nextEra] : null;

  return (
    <div
      className="civ-archive-card p-6 relative overflow-hidden"
      style={{ borderColor: CIV_COLORS.gold + "80", borderWidth: "2px" }}
    >
      <ParchmentBackground opacity={0.4} />
      <h3
        className="civ-archive-title text-base mb-5 flex items-center gap-2 relative z-10"
        style={{ color: CIV_COLORS.textPrimary }}
      >
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke={CIV_COLORS.gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M3 2h10M3 14h10M4 2v3l4 3 4-3V2M4 14v-3l4-3 4 3v3" />
        </svg>
        <span>{locale === "en" ? "Era Evolution Scroll" : "文明时代长卷"}</span>
      </h3>

      {/* Vertical timeline of eras */}
      <div className="relative z-10">
        {/* Vertical connecting line */}
        <div
          className="absolute left-[24px] top-2 bottom-2 w-px"
          style={{
            background: `linear-gradient(to bottom, ${CIV_COLORS.gold}40, ${CIV_COLORS.darkRed}40)`,
          }}
          aria-hidden
        />

        <div className="space-y-4">
          {ERA_ORDER.map((era, i) => {
            const label = ERA_LABELS[era];
            const isPast = i < currentIdx;
            const isCurrent = i === currentIdx;
            const isFuture = i > currentIdx;
            const isLocked = isFuture;
            const eraName = locale === "en" ? label.en : label.zh;

            return (
              <div key={era} className="relative flex items-start gap-4">
                {/* Era stone icon */}
                <div
                  className="relative z-10 shrink-0 civ-archive-seal-hover"
                  style={{
                    opacity: isFuture ? 0.35 : 1,
                    filter: isCurrent
                      ? `drop-shadow(0 0 8px ${CIV_COLORS.gold}80)`
                      : "none",
                  }}
                >
                  <EraStoneIcon era={era} size={48} />
                </div>

                {/* Era content */}
                <div
                  className="flex-1 min-w-0 pb-2"
                  style={{ opacity: isFuture ? 0.5 : 1 }}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-sm font-bold civ-archive-title"
                      style={{
                        color: isCurrent
                          ? CIV_COLORS.darkRed
                          : isPast
                            ? CIV_COLORS.textPrimary
                            : CIV_COLORS.textSecondary,
                      }}
                    >
                      {eraName}
                    </span>
                    {isCurrent && (
                      <span
                        className="text-[9px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5"
                        style={{
                          backgroundColor: CIV_COLORS.darkRed + "20",
                          border: `1px solid ${CIV_COLORS.darkRed}`,
                          color: CIV_COLORS.darkRed,
                        }}
                      >
                        {locale === "en" ? "Current" : "当前"}
                      </span>
                    )}
                    {isPast && (
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke={CIV_COLORS.gold}
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {isFuture && (
                      <span
                        className="text-[9px] uppercase tracking-wider"
                        style={{ color: CIV_COLORS.textSecondary }}
                      >
                        {locale === "en" ? "Locked" : "未开启"}
                      </span>
                    )}
                  </div>

                  {/* Era description — only for past/current eras */}
                  {!isFuture && (
                    <p
                      className="text-xs mt-1 leading-relaxed"
                      style={{ color: CIV_COLORS.textSecondary }}
                    >
                      {locale === "en"
                        ? `Stage ${i + 1} of your civilization's journey`
                        : `文明发展第 ${i + 1} 阶段`}
                    </p>
                  )}

                  {/* Progress bar for current era */}
                  {isCurrent && nextEraLabel && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span style={{ color: CIV_COLORS.textSecondary }}>
                          {locale === "en" ? "Progress to next era" : "通往下一时代"}
                        </span>
                        <span
                          className="font-mono tabular-nums"
                          style={{ color: CIV_COLORS.darkRed }}
                        >
                          {eraProgress}%
                        </span>
                      </div>
                      <div
                        className="h-1.5 rounded-full overflow-hidden"
                        style={{
                          backgroundColor: CIV_COLORS.bgContent,
                          border: `1px solid ${CIV_COLORS.border}`,
                        }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${eraProgress}%`,
                            background: `linear-gradient(90deg, ${CIV_COLORS.gold}, ${CIV_COLORS.darkRed})`,
                          }}
                        />
                      </div>
                      <p className="text-[10px] mt-0.5" style={{ color: CIV_COLORS.textSecondary }}>
                        {locale === "en" ? "Next: " : "下一时代："}
                        <span className="font-medium" style={{ color: CIV_COLORS.darkRed }}>
                          {locale === "en" ? nextEraLabel.en : nextEraLabel.zh}
                        </span>
                        {worldData.next_era_at && (
                          <span className="ml-1">
                            （{locale === "en" ? "need " : "还需 "}
                            {worldData.next_era_at - worldData.era_score}
                            {locale === "en" ? " exp" : " 经验"}）
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* At max era */}
        {!nextEraLabel && (
          <p
            className="text-xs mt-4 text-center"
            style={{ color: CIV_COLORS.textSecondary }}
          >
            {locale === "en"
              ? "You have reached the pinnacle of civilization!"
              : "你已经到达文明的顶峰！"}
          </p>
        )}
      </div>
    </div>
  );
}

/** The main chronicle timeline — "文明事件记录" archive-styled */
function ChronicleTimeline({
  entries,
  locale,
}: {
  entries: ChronicleEntry[];
  locale: string;
}) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-4 civ-archive-seal-hover"
          style={{
            backgroundColor: CIV_COLORS.bgContent,
            border: `1.5px solid ${CIV_COLORS.gold}60`,
          }}
        >
          <QuestScrollIcon name="scroll" size={32} />
        </div>
        <p
          className="text-sm font-medium civ-archive-title mb-1"
          style={{ color: CIV_COLORS.textPrimary }}
        >
          {locale === "en" ? "No historical events yet" : "暂无历史事件"}
        </p>
        <p
          className="text-xs max-w-xs"
          style={{ color: CIV_COLORS.textSecondary }}
        >
          {locale === "en"
            ? "Complete quests, level up skills, and construct buildings — your civilization chronicle will unfold here"
            : "完成任务、提升技能、建造建筑后，你的文明编年史将在这里展开"}
        </p>
        <Link
          href="/quests"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium transition-colors civ-archive-seal-hover"
          style={{
            backgroundColor: CIV_COLORS.darkRed + "15",
            color: CIV_COLORS.darkRed,
            border: `1px solid ${CIV_COLORS.darkRed}40`,
          }}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 3.5L21 3l-.5 6.5L9 21l-3-3L18.5 5.5M5 14l-2 5 5-2" /></svg>
          {locale === "en" ? "Start Your Journey" : "开始探索"}
        </Link>
      </div>
    );
  }

  // Group by month
  const monthGroups = new Map<string, ChronicleEntry[]>();
  for (const entry of entries) {
    const existing = monthGroups.get(entry.monthKey);
    if (existing) {
      existing.push(entry);
    } else {
      monthGroups.set(entry.monthKey, [entry]);
    }
  }

  const sortedMonths = Array.from(monthGroups.keys()).sort().reverse();
  const recentMonths = sortedMonths.slice(0, 6);
  const earlierMonths = sortedMonths.slice(6);
  const hasEarlier = earlierMonths.length > 0;

  return (
    <div className="relative">
      {/* Vertical line — copper colored */}
      <div
        className="absolute left-[15px] top-0 h-full w-px"
        style={{
          background: `linear-gradient(to bottom, ${CIV_COLORS.gold}60, ${CIV_COLORS.darkRed}40)`,
        }}
        aria-hidden
      />

      <div className="space-y-4">
        {recentMonths.map((monthKey) => {
          const monthEntries = monthGroups.get(monthKey)!;
          return (
            <div key={monthKey}>
              {/* Month header */}
              <div className="flex items-center gap-3 mb-2 pl-9">
                <span
                  className="text-sm font-semibold civ-archive-title"
                  style={{ color: CIV_COLORS.textPrimary }}
                >
                  {formatMonthLabel(monthKey, locale)}
                </span>
                <span
                  className="text-[10px] tabular-nums"
                  style={{ color: CIV_COLORS.textSecondary }}
                >
                  {monthEntries.length}{" "}
                  {locale === "en" ? "events" : "事件"}
                </span>
              </div>

              {/* Events */}
              <div className="space-y-0.5">
                {monthEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="relative flex gap-3 pl-9 py-1.5 group"
                  >
                    {/* Seal-style dot on timeline */}
                    <div
                      className="absolute left-[10px] top-[9px] z-10 h-[11px] w-[11px] rounded-full transition-all group-hover:scale-125"
                      style={{
                        border: `2px solid ${CIV_COLORS.darkRed}`,
                        backgroundColor: CIV_COLORS.gold,
                        boxShadow: `0 0 0 2px ${CIV_COLORS.bgCard}`,
                      }}
                    />

                    {/* Content */}
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <span
                        className="text-sm flex-shrink-0 mt-0.5 inline-flex"
                        style={{ color: CIV_COLORS.gold }}
                      >
                        {entry.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-sm leading-snug font-medium"
                          style={{ color: CIV_COLORS.textPrimary }}
                        >
                          {entry.title}
                        </p>
                        {entry.description && (
                          <p
                            className="text-xs mt-0.5 line-clamp-1"
                            style={{ color: CIV_COLORS.textSecondary }}
                          >
                            {entry.description}
                          </p>
                        )}
                      </div>
                      <span
                        className="text-[10px] flex-shrink-0 mt-0.5 tabular-nums font-mono"
                        style={{ color: CIV_COLORS.textSecondary }}
                      >
                        {formatDateShort(
                          entry.date.toISOString().split("T")[0],
                          locale,
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Earlier records fold */}
        {hasEarlier && (
          <details className="pl-9">
            <summary
              className="text-xs cursor-pointer transition-colors py-1 civ-archive-title"
              style={{ color: CIV_COLORS.textSecondary }}
            >
              {locale === "en" ? "Earlier Records" : "更早的记录"}（
              {earlierMonths.length}{" "}
              {locale === "en" ? "months" : "个月"}）
            </summary>
            <div className="space-y-4 mt-3">
              {earlierMonths.map((monthKey) => {
                const monthEntries = monthGroups.get(monthKey)!;
                return (
                  <div key={monthKey}>
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className="text-xs font-semibold civ-archive-title"
                        style={{ color: CIV_COLORS.textPrimary }}
                      >
                        {formatMonthLabel(monthKey, locale)}
                      </span>
                      <span
                        className="text-[10px] tabular-nums"
                        style={{ color: CIV_COLORS.textSecondary }}
                      >
                        {monthEntries.length}{" "}
                        {locale === "en" ? "events" : "事件"}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {monthEntries.map((entry) => (
                        <div
                          key={entry.id}
                          className="relative flex gap-2 py-1"
                        >
                          <span
                            className="text-xs mt-0.5 inline-flex"
                            style={{ color: CIV_COLORS.gold }}
                          >
                            {entry.icon}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p
                              className="text-xs leading-snug"
                              style={{ color: CIV_COLORS.textPrimary }}
                            >
                              {entry.title}
                            </p>
                          </div>
                          <span
                            className="text-[10px] flex-shrink-0 tabular-nums font-mono"
                            style={{ color: CIV_COLORS.textSecondary }}
                          >
                            {formatDateShort(
                              entry.date.toISOString().split("T")[0],
                              locale,
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

/**
 * Building Development Log — "文明遗迹图鉴" (Civilization Ruins Catalog).
 * Two-column layout with seal-style building icons.
 */
function BuildingRuinsCatalog({
  entries,
  worldData,
  locale,
}: {
  entries: BuildingLogEntry[];
  worldData?: World | null;
  locale: string;
}) {
  // Group by building name
  const buildingGroups = new Map<string, BuildingLogEntry[]>();
  for (const entry of entries) {
    const existing = buildingGroups.get(entry.buildingName);
    if (existing) {
      existing.push(entry);
    } else {
      buildingGroups.set(entry.buildingName, [entry]);
    }
  }

  const buildingNames = Array.from(buildingGroups.keys());

  if (buildingNames.length === 0) {
    // Show current buildings from worldData as "initial state"
    const allBuildings = [
      ...(worldData?.buildings ?? []).map((b) => ({
        name: b.template?.name ?? "Unknown",
        level: b.level,
        skillId: (b.template as any)?.skill_id ?? "default",
        type: "regular" as const,
      })),
      ...(worldData?.compound_buildings ?? []).map((b) => ({
        name: b.template?.name ?? "Unknown",
        level: b.level,
        skillId: (b.template as any)?.skill_id ?? "default",
        type: "compound" as const,
      })),
    ];

    if (allBuildings.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
            style={{
              backgroundColor: CIV_COLORS.bgContent,
              border: `1.5px solid ${CIV_COLORS.border}`,
            }}
          >
            <QuestScrollIcon name="building" size={28} />
          </div>
          <p className="text-xs" style={{ color: CIV_COLORS.textSecondary }}>
            {locale === "en"
              ? "No buildings yet. Start building your civilization!"
              : "暂无建筑，开始建造你的文明吧！"}
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {allBuildings.map((b) => (
          <div
            key={b.name}
            className="civ-archive-card p-3 flex items-center gap-3"
          >
            <div className="shrink-0 civ-archive-seal-hover">
              <BuildingSealIcon type={b.skillId} size={48} />
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="text-sm font-semibold civ-archive-title truncate"
                style={{ color: CIV_COLORS.textPrimary }}
              >
                {b.name}
              </p>
              <p className="text-[10px]" style={{ color: CIV_COLORS.textSecondary }}>
                Lv{b.level}
                {b.type === "compound" && (
                  <span className="ml-1 opacity-70">
                    {locale === "en" ? "(Compound)" : "(复合)"}
                  </span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {buildingNames.map((name) => {
        const events = buildingGroups
          .get(name)!
          .sort((a, b) => a.date.getTime() - b.date.getTime());
        const lastEvent = events[events.length - 1];
        const skillId = lastEvent.skillId ?? "default";

        return (
          <div
            key={name}
            className="civ-archive-card p-4"
          >
            <div className="flex items-start gap-3 mb-2">
              <div className="shrink-0 civ-archive-seal-hover">
                <BuildingSealIcon type={skillId} size={48} />
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="text-sm font-semibold civ-archive-title truncate"
                  style={{ color: CIV_COLORS.textPrimary }}
                >
                  {name}
                </p>
                <p
                  className="text-[10px] mt-0.5"
                  style={{ color: CIV_COLORS.textSecondary }}
                >
                  {events.length}{" "}
                  {locale === "en" ? "upgrades" : "次升级"}
                  {lastEvent.level !== undefined && (
                    <span
                      className="ml-1.5 font-mono font-bold"
                      style={{ color: CIV_COLORS.darkRed }}
                    >
                      · Lv{lastEvent.level}
                    </span>
                  )}
                </p>
              </div>
            </div>
            {/* Upgrade chain */}
            <div className="flex items-center gap-1 flex-wrap mt-2">
              {events.map((evt, i) => (
                <div key={evt.id} className="flex items-center gap-1">
                  {i > 0 && (
                    <span
                      className="text-[10px]"
                      style={{ color: CIV_COLORS.gold }}
                    >
                      →
                    </span>
                  )}
                  <span
                    className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px]"
                    style={{
                      backgroundColor: CIV_COLORS.bgContent,
                      border: `1px solid ${CIV_COLORS.border}`,
                      color: CIV_COLORS.textPrimary,
                    }}
                    title={evt.date.toLocaleDateString(
                      locale === "en" ? "en-US" : "zh-CN",
                    )}
                  >
                    {evt.action}
                    {evt.level !== undefined && (
                      <span
                        className="font-mono font-semibold ml-0.5"
                        style={{ color: CIV_COLORS.darkRed }}
                      >
                        Lv{evt.level}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Page Component ──────────────────────────────────────────────

export default function HistoryPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, locale } = useLocale();
  const router = useRouter();

  // ── Auth guard ────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // ── Data fetching ─────────────────────────────────────────────────

  const { data: worldData, error: worldError } = useSWR(
    isAuthenticated ? "world" : null,
    () => worldService.getWorld().catch(() => null),
    { revalidateOnFocus: false, dedupingInterval: 60000 },
  );

  const { data: userSkills = [], isLoading: skillsLoading } = useSWR(
    isAuthenticated ? "user-skills" : null,
    () => skillService.listUserSkills(),
    { revalidateOnFocus: false, dedupingInterval: 120000 },
  );

  const { data: userQuests = [] } = useSWR(
    isAuthenticated ? "user-quests" : null,
    () => questService.listUserQuests().catch(() => [] as UserQuest[]),
    { revalidateOnFocus: false, dedupingInterval: 60000 },
  );

  const { data: userBadges = [] } = useSWR(
    isAuthenticated ? "user-badges" : null,
    () => badgeService.listUserBadges().catch(() => [] as UserBadge[]),
    { revalidateOnFocus: false, dedupingInterval: 60000 },
  );

  const { data: worldEvents = [] } = useSWR(
    isAuthenticated ? "world-events-chronicle" : null,
    () => worldService.getEvents(200).catch(() => [] as WorldEvent[]),
    { revalidateOnFocus: false, dedupingInterval: 60000 },
  );

  const { data: timeline } = useSWR(
    isAuthenticated ? "timeline-chronicle" : null,
    () =>
      progressService
        .getTimeline({ limit: 50 })
        .catch(() => ({ events: [], total: 0 })),
    { revalidateOnFocus: false, dedupingInterval: 60000 },
  );

  // ── Derived: Stats bar ────────────────────────────────────────────

  const stats = useMemo(() => {
    const completedQuests = userQuests.filter(
      (q: UserQuest) => q.status === "PASSED" || q.status === "SUBMITTED",
    ).length;
    const skillsUnlocked = userSkills.length;
    const buildingsBuilt =
      (worldData?.stats?.active_buildings ?? 0) +
      (worldData?.stats?.active_compound_buildings ?? 0);
    const civIndex =
      (worldData?.civilization_level ?? 1) * 100 +
      (worldData?.stats?.average_level ?? 0) * 10;
    const badgesEarned = userBadges.filter((b) => b.earned).length;

    return {
      completedQuests,
      skillsUnlocked,
      buildingsBuilt,
      civIndex,
      badgesEarned,
    };
  }, [userQuests, userSkills, worldData, userBadges]);

  // ── Derived: Chronicle entries ────────────────────────────────────

  const chronicleEntries = useMemo(() => {
    const entries: ChronicleEntry[] = [];

    for (const evt of worldEvents) {
      if (!CHRONICLE_EVENT_TYPES.has(evt.event_type)) continue;

      const title =
        locale === "en" && evt.title_en ? evt.title_en : evt.title;
      const desc =
        locale === "en" && evt.description_en
          ? evt.description_en
          : evt.description;

      entries.push({
        id: evt.id,
        date: new Date(evt.created_at),
        monthKey: evt.created_at.slice(0, 7),
        type: evt.event_type,
        icon: eventChronicleIcon(evt.event_type, 14),
        title,
        description: desc,
      });
    }

    const timelineEvents = timeline?.events ?? [];
    for (const evt of timelineEvents) {
      const crossedThreshold =
        Math.floor(evt.previous_score / 20) !==
        Math.floor(evt.new_score / 20);
      if (evt.delta === 0 || (Math.abs(evt.delta) < 3 && !crossedThreshold)) {
        continue;
      }

      const title =
        locale === "en"
          ? `${evt.skill_name} reached Lv${evt.new_score}`
          : `${evt.skill_name} 达到 Lv${evt.new_score}`;
      const desc =
        evt.delta > 0
          ? `+${evt.delta} · ${evt.reason}`
          : `${evt.delta} · ${evt.reason}`;

      entries.push({
        id: `skill-${evt.date}-${evt.skill_name}`,
        date: new Date(evt.date),
        monthKey: evt.date.slice(0, 7),
        type: "skill_growth",
        icon: evt.delta > 0
          ? (<svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={CIV_COLORS.gold} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l6-6 4 4 8-8" /><path d="M21 7v4h-4" /></svg>)
          : (<svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={CIV_COLORS.darkRed} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M3 7l6 6 4-4 8 8" /><path d="M21 17v-4h-4" /></svg>),
        title,
        description: desc,
      });
    }

    entries.sort((a, b) => b.date.getTime() - a.date.getTime());
    return entries;
  }, [worldEvents, timeline, locale]);

  // ── Derived: Building log ─────────────────────────────────────────

  const buildingLog = useMemo(() => {
    const entries: BuildingLogEntry[] = [];

    for (const evt of worldEvents) {
      if (!BUILDING_EVENT_TYPES.has(evt.event_type)) continue;

      const title =
        locale === "en" && evt.title_en ? evt.title_en : evt.title;
      const buildingName = extractBuildingName(title);

      let action: string;
      let level: number | undefined;
      if (evt.event_type === "BUILDING_UPGRADE" || evt.event_type === "COMPOUND_UPGRADE") {
        const lvMatch = title.match(/Lv(\d+)/i);
        level = lvMatch ? parseInt(lvMatch[1], 10) : undefined;
        action =
          locale === "en"
            ? `Upgraded Lv${level ?? "?"}`
            : `升级 Lv${level ?? "?"}`;
      } else if (evt.event_type === "COMPOUND_UNLOCK") {
        action = locale === "en" ? "Unlocked" : "解锁";
      } else {
        action = locale === "en" ? "Built" : "建造";
      }

      // Try to extract skill_id from world data for proper seal icon
      let skillId: string | undefined;
      if (worldData) {
        const allBuildings = [
          ...(worldData.buildings ?? []),
          ...(worldData.compound_buildings ?? []),
        ];
        const matched = allBuildings.find(
          (b) => b.template?.name === buildingName,
        );
        if (matched) {
          skillId = (matched.template as any)?.skill_id;
        }
      }

      entries.push({
        id: evt.id,
        date: new Date(evt.created_at),
        type: evt.event_type,
        icon: eventChronicleIcon(evt.event_type, 14),
        title,
        buildingName,
        action,
        level,
        skillId,
      });
    }

    entries.sort((a, b) => a.date.getTime() - b.date.getTime());
    return entries;
  }, [worldEvents, locale, worldData]);

  // ── Loading / Error ───────────────────────────────────────────────

  if (authLoading || !isAuthenticated) {
    return <Loading text={t("auth.validating")} />;
  }

  if (worldError && !worldData) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <ErrorState message={t("common.error")} />
      </div>
    );
  }

  const isDataLoading = skillsLoading && userSkills.length === 0;

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <div className="civ-archive-page relative">
      <CivArchiveStyles />
      <ParchmentBackground opacity={0.35} />

      <div className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6 py-6 relative z-10">
        {/* ── Header — 文明编年史标题 ────────────────────── */}
        <div className="civ-archive-fade-in">
          <h1
            className="civ-archive-title text-3xl flex items-center gap-3"
            style={{ color: CIV_COLORS.textPrimary }}
          >
            <span className="inline-flex" style={{ color: CIV_COLORS.gold }}>
              <QuestScrollIcon name="scroll" size={28} />
            </span>
            <span>{locale === "en" ? "Civilization Chronicle" : "文明编年史"}</span>
          </h1>
          <p
            className="mt-1.5 text-sm civ-archive-subtitle"
            style={{ color: CIV_COLORS.textSecondary }}
          >
            {locale === "en"
              ? "Every step of your civilization's journey — from wilderness to prosperity"
              : "记录你的文明成长历程——从荒野到繁荣的每一步"}
          </p>
        </div>

        <CopperDivider />

        {/* ── Stats Bar — 文明成长摘要 ───────────────────── */}
        <div>
          <h2
            className="text-[10px] font-bold uppercase tracking-widest mb-3 civ-archive-title"
            style={{ color: CIV_COLORS.textSecondary }}
          >
            {locale === "en" ? "Growth Summary" : "成长摘要"}
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
            <StatCard
              icon={<QuestScrollIcon name="checklist" size={20} />}
              value={stats.completedQuests}
              label={locale === "en" ? "Quests Done" : "完成Quest"}
            />
            <StatCard
              icon={<QuestScrollIcon name="mission" size={20} />}
              value={stats.skillsUnlocked}
              label={locale === "en" ? "Skills Unlocked" : "解锁技能"}
            />
            <StatCard
              icon={<QuestScrollIcon name="building" size={20} />}
              value={stats.buildingsBuilt}
              label={locale === "en" ? "Buildings Built" : "建造建筑"}
            />
            <StatCard
              icon={<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={CIV_COLORS.gold} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><rect x="7" y="10" width="3" height="8" rx="0.5" /><rect x="12" y="6" width="3" height="12" rx="0.5" /><rect x="17" y="13" width="3" height="5" rx="0.5" /></svg>}
              value={stats.civIndex.toLocaleString()}
              label={locale === "en" ? "Civ Index" : "文明指数"}
            />
            <StatCard
              icon={<QuestScrollIcon name="star" size={20} />}
              value={stats.badgesEarned}
              label={locale === "en" ? "Badges Earned" : "获得徽章"}
            />
          </div>
        </div>

        {/* ── Era Evolution Scroll — 文明时代长卷 ────────── */}
        {worldData && (
          <EraEvolutionScroll worldData={worldData} locale={locale} />
        )}

        {/* ── Key Historical Events — 文明事件记录 ───────── */}
        <section
          className="civ-archive-card p-5"
          style={{ borderColor: CIV_COLORS.gold + "80", borderWidth: "2px" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2
                className="civ-archive-title text-base flex items-center gap-2"
                style={{ color: CIV_COLORS.textPrimary }}
              >
                <QuestScrollIcon name="checklist" size={18} />
                <span>
                  {locale === "en" ? "Key Historical Events" : "关键历史事件"}
                </span>
              </h2>
              <p
                className="text-xs mt-0.5"
                style={{ color: CIV_COLORS.textSecondary }}
              >
                {locale === "en"
                  ? "Moments that shaped your civilization"
                  : "记录文明发展的重要时刻"}
              </p>
            </div>
            {chronicleEntries.length > 0 && (
              <span
                className="text-[10px] tabular-nums font-mono"
                style={{ color: CIV_COLORS.textSecondary }}
              >
                {chronicleEntries.length}{" "}
                {locale === "en" ? "events" : "条记录"}
              </span>
            )}
          </div>

          {isDataLoading ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3 pl-9">
                  <div
                    className="h-3 w-3 rounded-full mt-1.5"
                    style={{ backgroundColor: CIV_COLORS.border }}
                  />
                  <div className="flex-1 space-y-1.5">
                    <div
                      className="h-4 w-2/3 rounded"
                      style={{ backgroundColor: CIV_COLORS.border }}
                    />
                    <div
                      className="h-3 w-1/2 rounded"
                      style={{ backgroundColor: CIV_COLORS.border + "80" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ChronicleTimeline entries={chronicleEntries} locale={locale} />
          )}
        </section>

        {/* ── Building Development — 文明遗迹图鉴 ────────── */}
        <section
          className="civ-archive-card p-5"
          style={{ borderColor: CIV_COLORS.gold + "80", borderWidth: "2px" }}
        >
          <div className="mb-4">
            <h2
              className="civ-archive-title text-base flex items-center gap-2"
              style={{ color: CIV_COLORS.textPrimary }}
            >
              <QuestScrollIcon name="building" size={18} />
              <span>
                {locale === "en" ? "Civilization Ruins Catalog" : "文明遗迹图鉴"}
              </span>
            </h2>
            <p
              className="text-xs mt-0.5"
              style={{ color: CIV_COLORS.textSecondary }}
            >
              {locale === "en"
                ? "How your buildings grew over time"
                : "你的建筑如何一步步成长"}
            </p>
          </div>

          {isDataLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-pulse">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 rounded-lg"
                  style={{ backgroundColor: CIV_COLORS.border + "60" }}
                />
              ))}
            </div>
          ) : (
            <BuildingRuinsCatalog
              entries={buildingLog}
              worldData={worldData}
              locale={locale}
            />
          )}
        </section>

        {/* ── Footer: Quick links ────────────────────────── */}
        <CopperDivider />
        <div className="flex items-center justify-center gap-4 pt-2 pb-4 flex-wrap">
          <Link
            href="/world"
            className="text-xs transition-colors flex items-center gap-1 civ-archive-seal-hover"
            style={{ color: CIV_COLORS.textSecondary }}
          >
            <QuestScrollIcon name="civilization" size={14} />
            {locale === "en" ? "My World" : "我的世界"}
          </Link>
          <span style={{ color: CIV_COLORS.border }}>·</span>
          <Link
            href="/skills"
            className="text-xs transition-colors flex items-center gap-1 civ-archive-seal-hover"
            style={{ color: CIV_COLORS.textSecondary }}
          >
            <QuestScrollIcon name="mission" size={14} />
            {locale === "en" ? "Skills" : "技能"}
          </Link>
          <span style={{ color: CIV_COLORS.border }}>·</span>
          <Link
            href="/quests"
            className="text-xs transition-colors flex items-center gap-1 civ-archive-seal-hover"
            style={{ color: CIV_COLORS.textSecondary }}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 3.5L21 3l-.5 6.5L9 21l-3-3L18.5 5.5M5 14l-2 5 5-2" /></svg>
            {locale === "en" ? "Quests" : "任务"}
          </Link>
        </div>
      </div>
    </div>
  );
}
