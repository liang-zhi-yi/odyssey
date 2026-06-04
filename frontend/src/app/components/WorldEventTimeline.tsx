"use client";

import useSWR from "swr";
import { worldService } from "@/services/world.service";
import { EVENT_TYPE_LABELS } from "@/types/world";
import type { WorldEvent, WorldEventType } from "@/types/world";
import { useLocale } from "@/hooks/useLocale";

interface WorldEventTimelineProps {
  /** Pre-fetched events (optional — falls back to SWR fetch) */
  events?: WorldEvent[];
}

export function WorldEventTimeline({ events: initialEvents }: WorldEventTimelineProps) {
  const { t, locale } = useLocale();

  const { data: events } = useSWR(
    "world-events",
    () => worldService.getEvents(20, 0),
    { fallbackData: initialEvents }
  );

  if (!events || events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          {t("world.noEvents")}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {t("world.noEventsDesc")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {events.map((event) => (
        <EventItem key={event.id} event={event} locale={locale} />
      ))}
    </div>
  );
}

function EventItem({ event, locale }: { event: WorldEvent; locale: string }) {
  const typeInfo = EVENT_TYPE_LABELS[event.event_type as WorldEventType] ?? {
    zh: event.event_type,
    en: event.event_type,
    icon: "📌",
  };

  const title =
    locale === "en" && event.title_en ? event.title_en : event.title;
  const desc =
    locale === "en" && event.description_en
      ? event.description_en
      : event.description;

  const timeAgo = formatTimeAgo(event.created_at, locale);

  return (
    <div className="relative flex gap-3 pb-4 pl-3 border-l border-border last:border-l-0 last:pb-0">
      {/* Timeline dot */}
      <div className="absolute left-0 top-1 w-2 h-2 rounded-full bg-primary -translate-x-[4.5px]" />

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <span className="text-sm">{typeInfo.icon}</span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {title}
            </p>
            {desc && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {desc}
              </p>
            )}
          </div>
        </div>
        <span className="text-[10px] text-muted-foreground mt-1 block">
          {timeAgo}
        </span>
      </div>
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
    if (diffMin < 60) return `${diffMin} 分钟前`;
    if (diffHr < 24) return `${diffHr} 小时前`;
    if (diffDay < 30) return `${diffDay} 天前`;
    return date.toLocaleDateString("zh-CN");
  }

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 30) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-US");
}
