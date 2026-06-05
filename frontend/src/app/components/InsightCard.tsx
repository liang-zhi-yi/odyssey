"use client";

import Link from "next/link";
import type { AIInsight, InsightType } from "@/types/analytics";
import { useLocale } from "@/hooks/useLocale";

/** Color scheme per insight type */
const typeStyles: Record<
  InsightType,
  { border: string; bg: string; iconBg: string; accentText: string }
> = {
  growth_acceleration: {
    border: "border-l-success",
    bg: "bg-success/5",
    iconBg: "bg-success/10",
    accentText: "text-success",
  },
  plateau_warning: {
    border: "border-l-warning",
    bg: "bg-warning/5",
    iconBg: "bg-warning/10",
    accentText: "text-warning",
  },
  skill_gap: {
    border: "border-l-accent",
    bg: "bg-accent/5",
    iconBg: "bg-accent/10",
    accentText: "text-accent",
  },
  strength_area: {
    border: "border-l-success",
    bg: "bg-success/5",
    iconBg: "bg-success/10",
    accentText: "text-success",
  },
  recommended_focus: {
    border: "border-l-primary",
    bg: "bg-primary/5",
    iconBg: "bg-primary/10",
    accentText: "text-primary",
  },
};

interface InsightCardProps {
  insight: AIInsight;
}

/**
 * Displays a single AI-powered insight with icon, title, description,
 * and optional action button. Color-coded by insight type.
 */
export function InsightCard({ insight }: InsightCardProps) {
  const { t, locale } = useLocale();

  const isEn = locale === "en";
  const title = isEn && insight.title_en ? insight.title_en : insight.title;
  const description =
    isEn && insight.description_en
      ? insight.description_en
      : insight.description;
  const actionLabel =
    isEn && insight.action_label_en
      ? insight.action_label_en
      : insight.action_label;

  const style = typeStyles[insight.type] || typeStyles.recommended_focus;

  const actionHref =
    insight.type === "recommended_focus" && insight.related_skill_id
      ? `/quests?skill=${insight.related_skill_id}`
      : insight.type === "growth_acceleration" && insight.related_skill_id
        ? `/skills/${insight.related_skill_id}`
        : insight.type === "plateau_warning" && insight.related_skill_id
          ? `/quests?skill=${insight.related_skill_id}`
          : undefined;

  const inner = (
    <div
      className={`rounded-2xl border border-border border-l-4 ${style.border} ${style.bg} p-5 shadow-card transition-all duration-300 hover:shadow-card-hover`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${style.iconBg} text-lg`}
        >
          {insight.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold text-sm ${style.accentText}`}>
            {title}
          </h4>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed line-clamp-3">
            {description}
          </p>

          {/* Action button */}
          {actionLabel && actionHref && (
            <span
              className={`inline-block mt-2 text-xs font-medium ${style.accentText} hover:underline`}
            >
              {actionLabel} →
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (actionHref) {
    return <Link href={actionHref}>{inner}</Link>;
  }

  return inner;
}
