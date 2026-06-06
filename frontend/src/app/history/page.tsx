"use client";

import { useState, useEffect, useMemo } from "react";
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

/** Event types to include in the chronicle timeline */
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

/** Event types for the building development log */
const BUILDING_EVENT_TYPES: Set<string> = new Set([
  "BUILDING_UPGRADE",
  "COMPOUND_UNLOCK",
  "COMPOUND_UPGRADE",
]);

// ── Types ────────────────────────────────────────────────────────────

interface ChronicleEntry {
  id: string;
  date: Date;
  monthKey: string; // "2026-06"
  type: string;
  icon: string;
  title: string;
  description: string | null;
}

interface BuildingLogEntry {
  id: string;
  date: Date;
  type: string;
  icon: string;
  title: string;
  buildingName: string;
  action: string;
  level?: number;
}

// ── Helpers ──────────────────────────────────────────────────────────

function formatMonthLabel(
  monthKey: string,
  locale: string,
): string {
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

/** Extract a building name from a WorldEvent title */
function extractBuildingName(title: string): string {
  // Titles are like "AI研究院 升级至 Lv3" or "知识殿堂 建造完成"
  // Extract the part before common action patterns
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
  // Fallback: first 2-4 Chinese chars or first word
  return title.slice(0, 8);
}

// ── Internal Components ──────────────────────────────────────────────

/** Compact stat card for the stats bar */
function StatCard({
  icon,
  value,
  label,
}: {
  icon: string;
  value: string | number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-card min-w-[120px]">
      <span className="text-xl flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-lg font-bold text-foreground tabular-nums leading-tight">
          {value}
        </p>
        <p className="text-[11px] text-muted-foreground truncate leading-tight">
          {label}
        </p>
      </div>
    </div>
  );
}

/** Horizontal era evolution bar */
function EraEvolutionBar({
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
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <span>⏳</span>
        <span>{locale === "en" ? "Era Evolution" : "时代演进"}</span>
      </h3>

      {/* Era chain */}
      <div className="flex items-center gap-1 flex-wrap mb-4">
        {ERA_ORDER.map((era, i) => {
          const label = ERA_LABELS[era];
          const isPast = i < currentIdx;
          const isCurrent = i === currentIdx;
          const isFuture = i > currentIdx;

          return (
            <div key={era} className="flex items-center gap-1">
              {i > 0 && (
                <span className="text-[10px] text-muted-foreground/50 mx-0.5">
                  ──
                </span>
              )}
              <div
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-all ${
                  isCurrent
                    ? "bg-primary/10 border border-primary/30 text-primary font-semibold"
                    : isPast
                      ? "bg-secondary/50 text-foreground/70"
                      : "bg-transparent text-muted-foreground/40"
                }`}
                title={
                  isPast
                    ? locale === "en"
                      ? "Completed"
                      : "已完成"
                    : isCurrent
                      ? locale === "en"
                        ? "Current Era"
                        : "当前时代"
                      : locale === "en"
                        ? "Not Started"
                        : "未开始"
                }
              >
                <span className="text-sm">{label.icon}</span>
                <span className="hidden sm:inline">
                  {locale === "en" ? label.en : label.zh}
                </span>
                {isPast && (
                  <svg
                    className="w-3 h-3 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress bar to next era */}
      {nextEraLabel && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {locale === "en" ? "Era Progress" : "时代进度"}
            </span>
            <span className="text-muted-foreground tabular-nums">
              {eraProgress}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary/70 to-accent transition-all duration-700"
              style={{ width: `${eraProgress}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground/70">
            {locale === "en" ? "Next Era: " : "下一时代："}
            <span className="font-medium text-foreground/80">
              {nextEraLabel.icon}{" "}
              {locale === "en" ? nextEraLabel.en : nextEraLabel.zh}
            </span>
            {worldData.next_era_at && (
              <span className="ml-1">
                （
                {locale === "en" ? "need " : "还需 "}
                {worldData.next_era_at - worldData.era_score}{" "}
                {locale === "en" ? "exp" : "经验"}）
              </span>
            )}
          </p>
        </div>
      )}

      {/* At max era */}
      {!nextEraLabel && (
        <p className="text-xs text-muted-foreground">
          {locale === "en"
            ? "You have reached the pinnacle of civilization!"
            : "你已经到达文明的顶峰！"}
        </p>
      )}
    </div>
  );
}

/** The main chronicle timeline — key historical events grouped by month */
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
        <span className="text-4xl mb-4">📜</span>
        <p className="text-sm font-medium text-foreground mb-1">
          {locale === "en" ? "No historical events yet" : "暂无历史事件"}
        </p>
        <p className="text-xs text-muted-foreground max-w-xs">
          {locale === "en"
            ? "Complete quests, level up skills, and construct buildings — your civilization chronicle will unfold here"
            : "完成Quest、提升技能、建造建筑后，你的文明编年史将在这里展开"}
        </p>
        <Link
          href="/quests"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-4 py-2 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
        >
          <span>⚔️</span>
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

  // Separate: last 3 months + "earlier" group
  const recentMonths = sortedMonths.slice(0, 6);
  const earlierMonths = sortedMonths.slice(6);
  const hasEarlier = earlierMonths.length > 0;

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[15px] top-0 h-full w-px bg-border/60" />

      <div className="space-y-4">
        {recentMonths.map((monthKey) => {
          const monthEntries = monthGroups.get(monthKey)!;

          return (
            <div key={monthKey}>
              {/* Month header */}
              <div className="flex items-center gap-3 mb-2 pl-9">
                <span className="text-sm font-semibold text-foreground">
                  {formatMonthLabel(monthKey, locale)}
                </span>
                <span className="text-[10px] text-muted-foreground tabular-nums">
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
                    {/* Dot on timeline */}
                    <div className="absolute left-[11px] top-[10px] z-10 h-[9px] w-[9px] rounded-full border-2 border-background bg-primary/60 group-hover:bg-primary group-hover:scale-125 transition-all" />

                    {/* Content */}
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <span className="text-sm flex-shrink-0 mt-0.5">
                        {entry.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground leading-snug">
                          {entry.title}
                        </p>
                        {entry.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {entry.description}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground/60 flex-shrink-0 mt-0.5 tabular-nums">
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
            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors py-1">
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
                      <span className="text-xs font-semibold text-foreground/70">
                        {formatMonthLabel(monthKey, locale)}
                      </span>
                      <span className="text-[10px] text-muted-foreground tabular-nums">
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
                          <span className="text-xs mt-0.5">{entry.icon}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-foreground/70 leading-snug">
                              {entry.title}
                            </p>
                          </div>
                          <span className="text-[10px] text-muted-foreground/50 flex-shrink-0 tabular-nums">
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

/** Building development log — upgrade chains */
function BuildingDevelopmentLog({
  entries,
  worldData,
  locale,
}: {
  entries: BuildingLogEntry[];
  worldData: World;
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
      ...(worldData.buildings ?? []).map((b) => ({
        name: b.template?.name ?? "Unknown",
        level: b.level,
        icon: b.template?.icon ?? "🏛️",
        type: "regular" as const,
      })),
      ...(worldData.compound_buildings ?? []).map((b) => ({
        name: b.template?.name ?? "Unknown",
        level: b.level,
        icon: b.template?.icon ?? "🏛️",
        type: "compound" as const,
      })),
    ];

    if (allBuildings.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <span className="text-3xl mb-3">🏗️</span>
          <p className="text-xs text-muted-foreground">
            {locale === "en"
              ? "No buildings yet. Start building your civilization!"
              : "暂无建筑，开始建造你的文明吧！"}
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {allBuildings.map((b) => (
          <div
            key={b.name}
            className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2"
          >
            <span className="text-base">{b.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground truncate">
                {b.name}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Lv{b.level}
                {b.type === "compound" && (
                  <span className="ml-1 opacity-60">
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
    <div className="space-y-3">
      {buildingNames.map((name) => {
        const events = buildingGroups
          .get(name)!
          .sort(
            (a, b) => a.date.getTime() - b.date.getTime(),
          );

        return (
          <div
            key={name}
            className="rounded-lg border border-border bg-background px-4 py-3"
          >
            <p className="text-xs font-semibold text-foreground mb-2 truncate">
              {name}
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {events.map((evt, i) => (
                <div key={evt.id} className="flex items-center gap-1">
                  {i > 0 && (
                    <span className="text-[10px] text-muted-foreground/50">
                      →
                    </span>
                  )}
                  <span
                    className="inline-flex items-center gap-1 rounded-md bg-secondary/50 px-2 py-1 text-[11px] text-foreground"
                    title={evt.date.toLocaleDateString(
                      locale === "en" ? "en-US" : "zh-CN",
                    )}
                  >
                    {evt.icon} {evt.action}
                    {evt.level !== undefined && (
                      <span className="font-mono font-semibold text-primary ml-0.5">
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

  // ── Derived: Stats bar ────────────────────────────────────────────

  const stats = useMemo(() => {
    const completedQuests = userQuests.filter(
      (q: UserQuest) => q.status === "PASSED" || q.status === "SUBMITTED",
    ).length;
    const skillsUnlocked = userSkills.length;
    const buildingsBuilt =
      (worldData?.stats?.total_buildings ?? 0) +
      (worldData?.stats?.compound_buildings ?? 0);
    const civIndex =
      (worldData?.civilization_level ?? 1) * 100 +
      (worldData?.stats?.average_level ?? 0) * 10;
    const badgesEarned = userBadges.length;

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

    // Merge WorldEvents
    for (const evt of worldEvents) {
      if (!CHRONICLE_EVENT_TYPES.has(evt.event_type)) continue;

      const label = EVENT_TYPE_LABELS[evt.event_type as keyof typeof EVENT_TYPE_LABELS];
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
        icon: label?.icon ?? "📌",
        title,
        description: desc,
      });
    }

    // Merge TimelineEvents (skill growth)
    const timelineEvents = timeline?.events ?? [];
    for (const evt of timelineEvents) {
      // Skip insignificant deltas (0 or tiny changes, unless it's a threshold crossing)
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
        icon: evt.delta > 0 ? "📈" : "📉",
        title,
        description: desc,
      });
    }

    // Sort by date descending
    entries.sort((a, b) => b.date.getTime() - a.date.getTime());

    return entries;
  }, [worldEvents, timeline, locale]);

  // ── Derived: Building log ─────────────────────────────────────────

  const buildingLog = useMemo(() => {
    const entries: BuildingLogEntry[] = [];

    for (const evt of worldEvents) {
      if (!BUILDING_EVENT_TYPES.has(evt.event_type)) continue;

      const label = EVENT_TYPE_LABELS[evt.event_type as keyof typeof EVENT_TYPE_LABELS];
      const title =
        locale === "en" && evt.title_en ? evt.title_en : evt.title;
      const buildingName = extractBuildingName(title);

      // Derive action text
      let action: string;
      let level: number | undefined;
      if (evt.event_type === "BUILDING_UPGRADE" || evt.event_type === "COMPOUND_UPGRADE") {
        const lvMatch = title.match(/Lv(\d+)/i);
        level = lvMatch ? parseInt(lvMatch[1], 10) : undefined;
        action =
          locale === "en"
            ? `Upgraded to Lv${level ?? "?"}`
            : `升级至 Lv${level ?? "?"}`;
      } else if (evt.event_type === "COMPOUND_UNLOCK") {
        action = locale === "en" ? "Unlocked" : "解锁";
      } else {
        action = locale === "en" ? "Constructed" : "建造完成";
      }

      entries.push({
        id: evt.id,
        date: new Date(evt.created_at),
        type: evt.event_type,
        icon: label?.icon ?? "🏗️",
        title,
        buildingName,
        action,
        level,
      });
    }

    entries.sort((a, b) => a.date.getTime() - b.date.getTime());

    return entries;
  }, [worldEvents, locale]);

  // ── Combined loading state ─────────────────────────────────────────

  const isDataLoading = skillsLoading && userSkills.length === 0;

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6 py-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
          <span>📜</span>
          <span>{locale === "en" ? "Civilization Chronicle" : "文明编年史"}</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {locale === "en"
            ? "Every step of your civilization's journey — from wilderness to prosperity"
            : "记录你的文明成长历程——从荒野到繁荣的每一步"}
        </p>
      </div>

      {/* ── Stats Bar ───────────────────────────────────────── */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground tracking-wide uppercase mb-3">
          {locale === "en" ? "Growth Summary" : "成长摘要"}
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
          <StatCard
            icon="✅"
            value={stats.completedQuests}
            label={locale === "en" ? "Quests Done" : "完成Quest"}
          />
          <StatCard
            icon="🎯"
            value={stats.skillsUnlocked}
            label={locale === "en" ? "Skills Unlocked" : "解锁技能"}
          />
          <StatCard
            icon="🏗️"
            value={stats.buildingsBuilt}
            label={locale === "en" ? "Buildings Built" : "建造建筑"}
          />
          <StatCard
            icon="📊"
            value={stats.civIndex.toLocaleString()}
            label={locale === "en" ? "Civ Index" : "文明指数"}
          />
          <StatCard
            icon="🏅"
            value={stats.badgesEarned}
            label={locale === "en" ? "Badges Earned" : "获得徽章"}
          />
        </div>
      </div>

      {/* ── Era Evolution ───────────────────────────────────── */}
      {worldData && (
        <EraEvolutionBar worldData={worldData} locale={locale} />
      )}

      {/* ── Key Historical Events (MAIN CONTENT) ────────────── */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span>📋</span>
              <span>
                {locale === "en" ? "Key Historical Events" : "关键历史事件"}
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {locale === "en"
                ? "Moments that shaped your civilization"
                : "记录文明发展的重要时刻"}
            </p>
          </div>
          {chronicleEntries.length > 0 && (
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {chronicleEntries.length}{" "}
              {locale === "en" ? "events" : "条记录"}
            </span>
          )}
        </div>

        {isDataLoading ? (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3 pl-9">
                <div className="h-3 w-3 rounded-full bg-secondary mt-1.5" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-2/3 rounded bg-secondary" />
                  <div className="h-3 w-1/2 rounded bg-secondary" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ChronicleTimeline entries={chronicleEntries} locale={locale} />
        )}
      </section>

      {/* ── Building Development Log ────────────────────────── */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <span>🏗️</span>
            <span>
              {locale === "en" ? "Building Development" : "建筑发展记录"}
            </span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {locale === "en"
              ? "How your buildings grew over time"
              : "你的建筑如何一步步成长"}
          </p>
        </div>

        {isDataLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 rounded-lg bg-secondary" />
            ))}
          </div>
        ) : (
          <BuildingDevelopmentLog
            entries={buildingLog}
            worldData={worldData!}
            locale={locale}
          />
        )}
      </section>

      {/* ── Footer: Quick links ─────────────────────────────── */}
      <div className="flex items-center justify-center gap-4 pt-2 pb-4">
        <Link
          href="/world"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          <span>🌍</span>
          {locale === "en" ? "My World" : "我的世界"}
        </Link>
        <span className="text-muted-foreground/30">·</span>
        <Link
          href="/skills"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          <span>🎯</span>
          {locale === "en" ? "Skills" : "技能"}
        </Link>
        <span className="text-muted-foreground/30">·</span>
        <Link
          href="/quests"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          <span>⚔️</span>
          {locale === "en" ? "Quests" : "任务"}
        </Link>
      </div>
    </div>
  );
}
