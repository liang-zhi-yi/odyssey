"use client";

import { useLocale } from "@/hooks/useLocale";
import type { SubmissionStatus } from "@/types/quest";
import { QuestScrollIcon } from "./QuestScrollIcon";

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

/** Status → ancient-civilization SVG icon */
const STATUS_ICON: Record<SubmissionStatus, JSX.Element> = {
  ACCEPTED: <QuestScrollIcon name="checklist" size={12} />,
  IN_PROGRESS: <QuestScrollIcon name="application" size={12} />,
  SUBMITTED: <QuestScrollIcon name="scroll" size={12} />,
  ASSESSING: (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  ),
  PASSED: (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13l4 4L19 7" />
    </svg>
  ),
  FAILED: (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  ABANDONED: (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M5.6 5.6l12.8 12.8" />
    </svg>
  ),
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
  const icon = STATUS_ICON[status];

  const sizeClass = size === "md"
    ? "px-3 py-1 text-xs"
    : "px-2 py-0.5 text-[10px]";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${sizeClass} ${style} ${className}`}
    >
      {size === "md" && <span className="text-xs leading-none inline-flex items-center">{icon}</span>}
      {label}
    </span>
  );
}
