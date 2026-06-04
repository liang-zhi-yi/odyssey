"use client";

import type { ProgressLog } from "@/types/progress";
import { useLocale } from "@/hooks/useLocale";
import { EmptyState } from "./EmptyState";

interface RecentActivityProps {
  logs: ProgressLog[];
  isLoading: boolean;
}

/**
 * Recent activity feed showing progress log entries.
 * Each entry shows skill name, score delta, and reason.
 */
export function RecentActivity({ logs, isLoading }: RecentActivityProps) {
  const { t } = useLocale();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="animate-pulse flex gap-3">
            <div className="h-2 w-2 mt-2 rounded-full bg-secondary" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 rounded bg-secondary" />
              <div className="h-3 w-1/2 rounded bg-secondary" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <EmptyState
        title={t("dashboard.noActivity")}
        description={t("dashboard.noActivityDesc")}
      />
    );
  }

  return (
    <div className="space-y-1">
      {logs.map((log, i) => (
        <div key={i} className="flex gap-3 py-2">
          {/* Timeline dot and line */}
          <div className="flex flex-col items-center">
            <div
              className={`h-2.5 w-2.5 rounded-full border-2 border-background ${
                log.delta > 0 ? "bg-success" : "bg-muted-foreground"
              }`}
            />
            {i < logs.length - 1 && (
              <div className="w-px flex-1 bg-border mt-1" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 pb-3">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-medium">{log.skill}</p>
              <span
                className={`shrink-0 text-xs font-mono font-medium tabular-nums ${
                  log.delta > 0 ? "text-success" : "text-muted-foreground"
                }`}
              >
                {log.delta > 0 ? "+" : ""}
                {log.delta}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{log.reason}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {new Date(log.created_at).toLocaleDateString("zh-CN", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
