"use client";

import { useLocale } from "@/hooks/useLocale";
import type { SubmissionStatus } from "@/types/quest";

interface QuestStatusBadgeProps {
  status: SubmissionStatus;
  size?: "sm" | "md";
  className?: string;
}

/** Status → color mapping for the badge background + text */
const STATUS_STYLE: Record<SubmissionStatus, string> = {
  ACCEPTED: "bg-primary/10 text-primary border-primary/20",
  IN_PROGRESS: "bg-primary/10 text-primary border-primary/20",
  SUBMITTED: "bg-warning/10 text-warning border-warning/20",
  ASSESSING: "bg-warning/10 text-warning border-warning/20 animate-warm-pulse",
  PASSED: "bg-success/10 text-success border-success/20",
  FAILED: "bg-destructive/10 text-destructive border-destructive/20",
  ABANDONED: "bg-muted/30 text-muted-foreground border-muted/20",
};

/** Status → icon */
const STATUS_ICON: Record<SubmissionStatus, string> = {
  ACCEPTED: "📋",
  IN_PROGRESS: "🔄",
  SUBMITTED: "📤",
  ASSESSING: "🔍",
  PASSED: "✅",
  FAILED: "❌",
  ABANDONED: "🚫",
};

/**
 * Reusable quest status badge with status-specific styling.
 * Extracted from quests/page.tsx inline usage for reuse across
 * quest list cards, detail pages, and submission history.
 */
export function QuestStatusBadge({ status, size = "sm", className = "" }: QuestStatusBadgeProps) {
  const { t } = useLocale();

  const label = t(`quests.status.${status}` as any);
  const style = STATUS_STYLE[status] || "bg-secondary text-muted-foreground border-border";
  const icon = STATUS_ICON[status] || "";

  const sizeClass = size === "md"
    ? "px-3 py-1 text-xs"
    : "px-2 py-0.5 text-[10px]";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${sizeClass} ${style} ${className}`}
    >
      {size === "md" && <span className="text-xs leading-none">{icon}</span>}
      {label}
    </span>
  );
}
