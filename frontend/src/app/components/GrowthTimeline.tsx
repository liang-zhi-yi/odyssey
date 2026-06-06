"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { worldService } from "@/services/world.service";
import { EVENT_TYPE_LABELS } from "@/types/world";
import type { WorldEvent, UserMilestone, WorldEventType } from "@/types/world";
import { useLocale } from "@/hooks/useLocale";

interface GrowthTimelineProps {
  /** Pre-fetched events (from world state) */
  events?: WorldEvent[];
  /** Milestone counts */
  unlockedCount?: number;
  totalCount?: number;
}

interface TimelineEntry {
  id: string;
  type: "event" | "milestone";
  timestamp: string;
  icon: string;
  title: string;
  title_en: string | null;
  description: string | null;
  description_en: string | null;
  eventType?: string;
  category?: string;
}

/**
 * Bottom-layer growth timeline.
 *
 * Merges world events + milestones into a single chronological feed
 * styled with the warm theme (cream/sage/gold).
 */
export function GrowthTimeline({
  events: initialEvents,
  unlockedCount,
  totalCount,
}: GrowthTimelineProps) {
  const { t, locale } = useLocale();

  // Fetch events (20 most recent)
  const { data: events } = useSWR(
    "world-events-timeline",
    () => worldService.getEvents(20, 0),
    { fallbackData: initialEvents, revalidateOnFocus: false }
  );

  // Fetch milestones
  const { data: milestones } = useSWR(
    "world-milestones-timeline",
    () => worldService.getMilestones().catch(() => [] as UserMilestone[]),
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  // Merge events + unlocked milestones into one timeline
  const entries = useMemo<TimelineEntry[]>(() => {
    const result: TimelineEntry[] = [];

    // Add events
    for (const ev of (events ?? [])) {
      result.push({
        id: ev.id,
        type: "event",
        timestamp: ev.created_at,
        icon: EVENT_TYPE_LABELS[ev.event_type as WorldEventType]?.icon ?? "📌",
        title: ev.title,
        title_en: ev.title_en,
        description: ev.description,
        description_en: ev.description_en,
        eventType: ev.event_type,
      });
    }

    // Add unlocked milestones
    for (const ms of (milestones ?? [])) {
      if (ms.unlocked && ms.unlocked_at) {
        result.push({
          id: `ms-${ms.id}`,
          type: "milestone",
          timestamp: ms.unlocked_at,
          icon: ms.icon ?? "🎯",
          title: ms.name,
          title_en: ms.name_en,
          description: ms.description,
          description_en: ms.description_en,
          category: ms.category,
        });
      }
    }

    // Sort by timestamp descending
    result.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return result.slice(0, 20);
  }, [events, milestones]);

  const isEmpty = entries.length === 0;

  return (
    <div className="rounded-2xl border border-[oklch(0.88_0.02_90)] bg-gradient-to-br from-[oklch(0.98_0.005_90)] via-[oklch(0.97_0.008_95)] to-[oklch(0.96_0.015_92)] p-5 shadow-card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">📜</span>
          <h3 className="text-sm font-semibold text-[oklch(0.35_0.02_80)]">
            {locale === "en" ? "Growth Timeline" : "成长时间线"}
          </h3>
        </div>

        {/* Milestone progress */}
        {unlockedCount != null && totalCount != null && totalCount > 0 && (
          <span className="text-[11px] font-medium text-[oklch(0.55_0.02_85)]">
            🎯 {unlockedCount}/{totalCount}{" "}
            {locale === "en" ? "milestones" : "里程碑"}
          </span>
        )}
      </div>

      {/* Empty state */}
      {isEmpty && (
        <div className="rounded-xl border border-dashed border-[oklch(0.85_0.02_90)] bg-[oklch(0.97_0.003_90)] p-6 text-center">
          <p className="text-sm font-medium text-[oklch(0.55_0.02_85)]">
            {locale === "en" ? "No growth events yet" : "暂无成长事件"}
          </p>
          <p className="text-xs text-[oklch(0.6_0.02_85)] mt-1">
            {locale === "en"
              ? "Complete quests and upgrade buildings to see your growth here"
              : "完成任务并升级建筑后，成长记录将显示在这里"}
          </p>
        </div>
      )}

      {/* Timeline entries */}
      {!isEmpty && (
        <div className="space-y-0 max-h-[360px] overflow-y-auto pr-1">
          {entries.map((entry, idx) => {
            const isEvent = entry.type === "event";
            const title =
              locale === "en" && entry.title_en ? entry.title_en : entry.title;
            const desc =
              locale === "en" && entry.description_en
                ? entry.description_en
                : entry.description;

            const isLast = idx === entries.length - 1;
            const timeLabel = formatTimeAgo(entry.timestamp, locale);

            return (
              <div
                key={entry.id}
                className={`relative flex gap-3 pb-3 pl-4 ${
                  isLast ? "pb-0" : ""
                }`}
              >
                {/* Timeline line */}
                {!isLast && (
                  <div className="absolute left-[9px] top-6 bottom-0 w-px bg-[oklch(0.88_0.02_90)]" />
                )}

                {/* Node dot */}
                <div
                  className={`absolute left-0 top-1.5 w-[19px] h-[19px] rounded-full border-2 flex items-center justify-center text-[10px] shrink-0 ${
                    isEvent
                      ? "bg-[oklch(0.72_0.12_85_/_0.12)] border-[oklch(0.72_0.12_85_/_0.35)]"
                      : "bg-[oklch(0.65_0.05_145_/_0.1)] border-[oklch(0.65_0.05_145_/_0.3)]"
                  }`}
                >
                  {entry.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 ml-2">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      {/* Type label */}
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span
                          className={`text-[10px] font-medium px-1.5 py-px rounded ${
                            isEvent
                              ? "bg-[oklch(0.72_0.12_85_/_0.12)] text-[oklch(0.5_0.08_80)]"
                              : "bg-[oklch(0.65_0.05_145_/_0.1)] text-[oklch(0.4_0.04_140)]"
                          }`}
                        >
                          {isEvent
                            ? locale === "en"
                              ? "Event"
                              : "事件"
                            : locale === "en"
                              ? "Milestone"
                              : "里程碑"}
                        </span>
                        <span className="text-[10px] text-[oklch(0.6_0.02_85)]">
                          {timeLabel}
                        </span>
                      </div>

                      <p className="text-sm font-medium text-[oklch(0.3_0.02_80)] truncate">
                        {title}
                      </p>

                      {desc && (
                        <p className="text-xs text-[oklch(0.55_0.02_85)] mt-0.5 line-clamp-2">
                          {desc}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (locale === "zh") {
    if (diffMin < 1) return "刚刚";
    if (diffMin < 60) return `${diffMin}分钟前`;
    if (diffHr < 24) return `${diffHr}小时前`;
    if (diffDay < 30) return `${diffDay}天前`;
    return date.toLocaleDateString("zh-CN");
  }

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 30) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-US");
}
