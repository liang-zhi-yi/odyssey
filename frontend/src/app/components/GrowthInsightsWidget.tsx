"use client";

import { useLocale } from "@/hooks/useLocale";
import type { AIInsight } from "@/types/analytics";

interface GrowthInsightsWidgetProps {
  insights: AIInsight[];
  isLoading: boolean;
}

/**
 * Compact growth insights / recent achievements widget for the Bento Grid.
 */
export function GrowthInsightsWidget({ insights, isLoading }: GrowthInsightsWidgetProps) {
  const { t } = useLocale();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="h-5 w-32 rounded-md bg-muted skeleton-shimmer mb-4" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 w-full rounded-lg bg-muted skeleton-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  const topInsights = insights.slice(0, 3);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{t("dashboard.growthInsights")}</h3>
      </div>
      {topInsights.length === 0 ? (
        <div className="py-4 text-center">
          <p className="text-sm text-muted-foreground">{t("dashboard.noInsights")}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {topInsights.map((insight, i) => (
            <li key={i}>
              <div className="group flex items-start gap-3 rounded-xl p-3 -mx-1 transition-colors hover:bg-secondary/50">
                {/* Icon by insight type */}
                <span
                  className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm ${
                    insight.type === "skill_gap"
                      ? "bg-accent/10 text-accent"
                      : insight.type === "strength_area"
                        ? "bg-success/10 text-success"
                        : "bg-primary/10 text-primary"
                  }`}
                >
                  {insight.type === "skill_gap" ? "🎯" : insight.type === "strength_area" ? "⭐" : "💡"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {insight.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {insight.description}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
