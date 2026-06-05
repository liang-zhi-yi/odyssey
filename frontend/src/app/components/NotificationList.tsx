"use client";

import { useEffect, useState, useCallback } from "react";
import { useLocale } from "@/hooks/useLocale";
import { notificationsService } from "@/services/notifications.service";
import type { Notification } from "@/types/notifications";

const TYPE_ICONS: Record<string, string> = {
  CREDENTIAL_EARNED: "\u{1F3C5}",
  TIER_ADVANCE: "\u{1F31F}",
  MILESTONE_REACHED: "\u{1F3C6}",
  ASSESSMENT_COMPLETE: "\u{2705}",
  WEEKLY_DIGEST: "\u{1F4CA}",
};

function getTypeKey(type: string): string {
  const map: Record<string, string> = {
    CREDENTIAL_EARNED: "notifications.types.credentialEarned",
    TIER_ADVANCE: "notifications.types.tierAdvance",
    MILESTONE_REACHED: "notifications.types.milestoneReached",
    ASSESSMENT_COMPLETE: "notifications.types.assessmentComplete",
    WEEKLY_DIGEST: "notifications.types.weeklyDigest",
  };
  return map[type] || type;
}

function relativeTime(dateStr: string, t: (key: string) => string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return t("notifications.justNow");
  if (diffMin < 60) return t("notifications.minutesAgo").replace("{n}", String(diffMin));
  if (diffHr < 24) return t("notifications.hoursAgo").replace("{n}", String(diffHr));
  if (diffDay < 30) return t("notifications.daysAgo").replace("{n}", String(diffDay));
  return new Date(dateStr).toLocaleDateString();
}

interface NotificationListProps {
  onClose: () => void;
  onMarkAllRead?: () => void;
}

export function NotificationList({ onClose, onMarkAllRead }: NotificationListProps) {
  const { t, locale } = useLocale();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await notificationsService.listNotifications({ limit: 20 });
      setNotifications(data.items);
    } catch {
      // Silently fail — notifications is non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsService.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {
      // Silently fail
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      onMarkAllRead?.();
    } catch {
      // Silently fail
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const displayTitle = (n: Notification) => {
    return locale === "en" && n.title_en ? n.title_en : n.title;
  };

  const displayBody = (n: Notification) => {
    return locale === "en" && n.body_en ? n.body_en : n.body;
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-background shadow-lg z-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold">{t("notifications.title")}</h3>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs font-medium text-primary hover:opacity-80 transition-opacity"
          >
            {t("notifications.markAllRead")}
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto">
        {loading && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            {t("common.loading")}
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="px-4 py-8 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              {t("notifications.empty")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("notifications.emptyDesc")}
            </p>
          </div>
        )}

        {!loading &&
          notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => {
                if (!n.is_read) handleMarkRead(n.id);
                if (n.link) {
                  window.location.href = n.link;
                  onClose();
                }
              }}
              className={`flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-secondary/50 ${
                !n.is_read ? "bg-primary/5" : ""
              }`}
            >
              {/* Icon */}
              <span className="mt-0.5 flex-shrink-0 text-lg">
                {TYPE_ICONS[n.type] || "\u{1F514}"}
              </span>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    {t(getTypeKey(n.type))}
                  </span>
                  {!n.is_read && (
                    <span className="h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                  )}
                </div>
                <p className="mt-0.5 text-sm font-medium truncate">
                  {displayTitle(n)}
                </p>
                {displayBody(n) && (
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                    {displayBody(n)}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {relativeTime(n.created_at, t)}
                </p>
              </div>
            </button>
          ))}
      </div>
    </div>
  );
}
