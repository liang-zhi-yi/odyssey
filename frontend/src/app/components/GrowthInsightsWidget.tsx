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
  const { t, locale } = useLocale();
  const isEn = locale === "en";

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-[oklch(0.88_0.02_90)] dark:border-[oklch(0.3_0.01_80)] bg-gradient-to-br from-[oklch(0.99_0.003_95)] to-[oklch(0.975_0.005_92)] dark:from-[oklch(0.22_0.008_85)] dark:to-[oklch(0.2_0.006_85)] p-6 shadow-card h-full">
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
    <div className="group relative rounded-2xl border border-[oklch(0.88_0.02_90)] dark:border-[oklch(0.3_0.01_80)] bg-gradient-to-br from-[oklch(0.99_0.003_95)] to-[oklch(0.975_0.005_92)] dark:from-[oklch(0.22_0.008_85)] dark:to-[oklch(0.2_0.006_85)] p-5 shadow-card h-full overflow-hidden transition-all duration-300 hover:shadow-card-hover hover:border-[oklch(0.7_0.12_85_/_0.3)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <svg className="w-4 h-4 text-accent flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z" />
          </svg>
          <h3 className="text-base font-civ-serif font-bold text-[oklch(0.3_0.02_80)] dark:text-[oklch(0.85_0.04_80)] truncate">
            {t("dashboard.sections.growthInsights")}
          </h3>
        </div>
      </div>
      {topInsights.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-full bg-accent/[0.06] blur-xl animate-glow-pulse" />
            <div className="relative w-16 h-16 rounded-full border border-[oklch(0.7_0.12_85_/_0.2)] bg-gradient-to-br from-[oklch(0.99_0.003_95)] to-[oklch(0.96_0.008_88)] flex items-center justify-center">
              <svg className="w-7 h-7 text-accent/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{t("dashboard.noInsights")}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {topInsights.map((insight, i) => (
            <li key={i}>
              <div className="group flex items-start gap-3 rounded-xl p-3 -mx-1 transition-all duration-300 hover:bg-secondary/50 hover:translate-x-0.5">
                {/* Icon by insight type — circular container with glow */}
                <div className="relative mt-0.5 flex-shrink-0">
                  <div
                    className={`absolute inset-0 rounded-full blur-md animate-glow-pulse ${
                      insight.type === "skill_gap"
                        ? "bg-accent/20"
                        : insight.type === "strength_area"
                          ? "bg-success/20"
                          : "bg-primary/20"
                    }`}
                  />
                  <span
                    className={`relative flex h-8 w-8 items-center justify-center rounded-full text-sm ${
                      insight.type === "skill_gap"
                        ? "bg-accent/10 text-accent"
                        : insight.type === "strength_area"
                          ? "bg-success/10 text-success"
                          : "bg-primary/10 text-primary"
                    }`}
                  >
                    {insight.type === "skill_gap" ? "🎯" : insight.type === "strength_area" ? "⭐" : "💡"}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {isEn && insight.title_en ? insight.title_en : insight.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {isEn && insight.description_en ? insight.description_en : insight.description}
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
