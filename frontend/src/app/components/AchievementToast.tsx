"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { notificationsService } from "@/services/notifications.service";
import { QuestScrollIcon, type ScrollIconName } from "./QuestScrollIcon";
import type { Notification } from "@/types/notifications";

/** Types that should surface as an in-app achievement toast. */
const TOAST_TYPES = new Set([
  "BADGE_EARNED",
  "CREDENTIAL_EARNED",
  "BUILDING_UNLOCK",
  "COMPOUND_UNLOCK",
  "BUILDING_UPGRADE",
  "COMPOUND_UPGRADE",
  "REGION_UNLOCK",
  "MILESTONE_REACHED",
  "ERA_ADVANCE",
  "TIER_ADVANCE",
]);

interface ToastMeta {
  icon: ScrollIconName;
  labelKey: string;
  gold: boolean;
}

/** Per-type toast styling: icon, i18n label key, and accent (gold = milestone). */
const TOAST_META: Record<string, ToastMeta> = {
  BADGE_EARNED: { icon: "star", labelKey: "achievement.badgeToastLabel", gold: true },
  CREDENTIAL_EARNED: { icon: "shield", labelKey: "achievement.credentialToastLabel", gold: false },
  BUILDING_UNLOCK: { icon: "building-emblem", labelKey: "achievement.buildingUnlockToastLabel", gold: true },
  COMPOUND_UNLOCK: { icon: "building-emblem", labelKey: "achievement.compoundUnlockToastLabel", gold: true },
  BUILDING_UPGRADE: { icon: "building-emblem", labelKey: "achievement.buildingUpgradeToastLabel", gold: false },
  COMPOUND_UPGRADE: { icon: "building-emblem", labelKey: "achievement.compoundUpgradeToastLabel", gold: false },
  REGION_UNLOCK: { icon: "civilization", labelKey: "achievement.regionUnlockToastLabel", gold: true },
  MILESTONE_REACHED: { icon: "mission", labelKey: "achievement.milestoneToastLabel", gold: true },
  ERA_ADVANCE: { icon: "sparkle", labelKey: "achievement.eraToastLabel", gold: true },
  TIER_ADVANCE: { icon: "star", labelKey: "achievement.tierToastLabel", gold: true },
};

const SEEN_KEY = "odyssey_achievement_seen";
const POLL_INTERVAL = 20000; // ms
const TOAST_DURATION = 6000; // ms
const MAX_TOASTS_PER_CYCLE = 3;
const RECENT_WINDOW_MS = 24 * 60 * 60 * 1000; // only toast achievements from last 24h

interface ToastItem {
  id: string;
  type: string;
  title: string;
  title_en: string;
  body: string;
  link: string | null;
}

function readSeen(): Set<string> {
  if (typeof window === "undefined") return new Set<string>();
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return new Set<string>();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set<string>();
  }
}

function writeSeen(seen: Set<string>) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(seen)));
  } catch {
    // ignore quota / privacy errors
  }
}

export function AchievementToast() {
  const { isAuthenticated } = useAuth();
  const { t, locale } = useLocale();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const seenRef = useRef<Set<string>>(new Set());
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const scheduleDismiss = useCallback(
    (id: string) => {
      const timer = setTimeout(() => dismiss(id), TOAST_DURATION);
      timersRef.current.set(id, timer);
    },
    [dismiss]
  );

  const check = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await notificationsService.listNotifications({ limit: 20 });
      const seen = seenRef.current;
      let shown = 0;
      const now = Date.now();

      for (const n of data.items) {
        if (shown >= MAX_TOASTS_PER_CYCLE) break;
        if (!TOAST_TYPES.has(n.type)) continue;
        if (seen.has(n.id)) continue;

        const createdAt = new Date(n.created_at).getTime();
        if (Number.isNaN(createdAt) || now - createdAt > RECENT_WINDOW_MS) continue;

        seen.add(n.id);
        writeSeen(seen);
        shown++;
        const item = thisToast(n);
        setToasts((prev) => [...prev, item]);
        scheduleDismiss(item.id);
      }
    } catch {
      // Silently fail — toasts are non-critical
    }
  }, [isAuthenticated, scheduleDismiss]);

  // Keep the seen set in sync with localStorage on mount
  useEffect(() => {
    seenRef.current = readSeen();
  }, []);

  // Poll for new achievements
  useEffect(() => {
    if (!isAuthenticated) return;
    check();
    const interval = setInterval(check, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [isAuthenticated, check]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-16 right-4 z-[100] flex flex-col gap-3 w-80 max-w-[calc(100vw-2rem)] pointer-events-none"
      role="status"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const meta = TOAST_META[toast.type] || TOAST_META.CREDENTIAL_EARNED;
        const isBadge = meta.gold;
        return (
          <button
            key={toast.id}
            type="button"
            onClick={() => {
              dismiss(toast.id);
              if (toast.link) window.location.href = toast.link;
            }}
            className="pointer-events-auto relative overflow-hidden rounded-xl border bg-gradient-to-br from-[oklch(0.99_0.003_95)] to-[oklch(0.97_0.01_90)] dark:from-[oklch(0.24_0.01_85)] dark:to-[oklch(0.2_0.008_85)] shadow-lg text-left animate-achievement-toast"
            style={{
              borderColor: isBadge
                ? "oklch(0.7_0.14_85 / 0.55)"
                : "oklch(0.6_0.12_145 / 0.5)",
            }}
          >
            {/* Decor top line */}
            <span className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[oklch(0.7_0.12_85_/_0.6)] to-transparent" />
            {/* Corner accents */}
            <span className="absolute top-2 left-2 h-3 w-3 border-l border-t border-[oklch(0.7_0.12_85_/_0.4)] pointer-events-none" />
            <span className="absolute bottom-2 right-2 h-3 w-3 border-r border-b border-[oklch(0.7_0.12_85_/_0.4)] pointer-events-none" />

            <div className="relative flex items-start gap-3 p-4">
              <span
                className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border"
                style={{
                  borderColor: isBadge
                    ? "oklch(0.7_0.14_85 / 0.45)"
                    : "oklch(0.6_0.12_145 / 0.4)",
                  background: isBadge
                    ? "oklch(0.7_0.14_85 / 0.12)"
                    : "oklch(0.6_0.12_145 / 0.12)",
                }}
              >
                <QuestScrollIcon name={meta.icon} size={18} strokeWidth={1.4} />
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className="text-[10px] font-bold uppercase tracking-wider font-civ-serif"
                  style={{ color: isBadge ? "oklch(0.55_0.12_85)" : "oklch(0.48_0.12_145)" }}
                >
                  {t(meta.labelKey)}
                </p>
                <p className="mt-0.5 text-sm font-bold font-civ-serif text-[oklch(0.3_0.02_80)] dark:text-[oklch(0.85_0.04_80)] truncate">
                  {locale === "en" ? toast.title_en || toast.title : toast.title}
                </p>
                {toast.body && (
                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground line-clamp-2">
                    {toast.body}
                  </p>
                )}
              </div>
              <span className="mt-1 shrink-0 text-[oklch(0.6_0.10_85)] dark:text-[oklch(0.72_0.12_82)]">
                <QuestScrollIcon name="arrow-right" size={14} strokeWidth={1.5} />
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// Helper to build a ToastItem from a backend notification
function thisToast(n: Notification): ToastItem {
  return {
    id: n.id,
    type: n.type,
    title: n.title || "",
    title_en: n.title_en || n.title || "",
    body: n.body || n.body_en || "",
    link: n.link,
  };
}