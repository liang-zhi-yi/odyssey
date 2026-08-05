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
      <div
        className="relative bg-gradient-to-br from-[#F7F2E8]/80 to-[#F0E8D8]/50 dark:from-[oklch(0.22_0.008_85)] dark:to-[oklch(0.2_0.006_85)] p-6 h-full"
        style={{ clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))" }}
      >
        <div className="h-5 w-32 bg-[#C9A45C]/15 skeleton-shimmer mb-4" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 w-full bg-[#C9A45C]/10 skeleton-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  const topInsights = insights.slice(0, 3);

  return (
    <div
      className="group relative bg-gradient-to-br from-[#F7F2E8]/70 to-[#F0E8D8]/40 dark:from-[oklch(0.22_0.008_85)] dark:to-[oklch(0.2_0.006_85)] p-5 h-full overflow-hidden transition-all duration-300 hover:from-[#F7F2E8]/90 hover:to-[#F0E8D8]/60"
      style={{ clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))" }}
    >
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-[#C9A45C]/40 to-transparent" />
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 min-w-0">
          {/* Fire Seed icon — 火种 */}
          <svg className="w-4 h-4 text-[#C9A45C] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2 C 8 6 6 10 8 14 C 9 16 11 17 12 17 C 13 17 15 16 16 14 C 18 10 16 6 12 2 Z" />
            <path d="M12 8 C 10 10 10 12 11 14 C 11.5 15 12.5 15 13 14 C 14 12 14 10 12 8 Z" opacity="0.5" strokeWidth="1" />
          </svg>
          <h3 className="text-base font-civ-serif font-bold text-[#4A3825] dark:text-[oklch(0.85_0.04_80)] truncate">
            {t("dashboard.sections.growthInsights")}
          </h3>
        </div>
      </div>
      {topInsights.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-full bg-[#C9A45C]/8 blur-xl animate-glow-pulse" />
            <div className="relative w-16 h-16 flex items-center justify-center">
              {/* Inactive fire seed */}
              <svg className="w-8 h-8 text-[#C9A45C]/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2 C 8 6 6 10 8 14 C 9 16 11 17 12 17 C 13 17 15 16 16 14 C 18 10 16 6 12 2 Z" />
                <path d="M12 8 C 10 10 10 12 11 14 C 11.5 15 12.5 15 13 14 C 14 12 14 10 12 8 Z" opacity="0.4" strokeWidth="0.8" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{t("dashboard.noInsights")}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {topInsights.map((insight, i) => (
            <li key={i}>
              <div className="group flex items-start gap-3 p-3 -mx-1 transition-all duration-300 hover:bg-[#C9A45C]/8 hover:translate-x-0.5">
                {/* Stone seal marker by insight type */}
                <div className="relative mt-0.5 flex-shrink-0">
                  <div
                    className={`absolute inset-0 blur-md animate-glow-pulse ${
                      insight.type === "skill_gap"
                        ? "bg-[#C9A45C]/20"
                        : insight.type === "strength_area"
                          ? "bg-[#A08850]/20"
                          : "bg-[#925E46]/20"
                    }`}
                  />
                  <span
                    className={`relative flex h-8 w-8 items-center justify-center text-sm ${
                      insight.type === "skill_gap"
                        ? "text-[#C9A45C]"
                        : insight.type === "strength_area"
                          ? "text-[#A08850]"
                          : "text-[#925E46]"
                    }`}
                  >
                    {insight.type === "skill_gap" ? (
                      /* Stone tablet — skill gap */
                      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 3 L18 3 L18 21 L6 21 Z" />
                        <line x1="9" y1="8" x2="15" y2="8" strokeWidth="0.8" opacity="0.6" />
                        <line x1="9" y1="12" x2="15" y2="12" strokeWidth="0.8" opacity="0.6" />
                        <line x1="9" y1="16" x2="13" y2="16" strokeWidth="0.8" opacity="0.6" />
                      </svg>
                    ) : insight.type === "strength_area" ? (
                      /* Crystal core — strength */
                      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2 L18 9 L12 22 L6 9 Z" />
                        <path d="M6 9 L18 9" strokeWidth="1" />
                      </svg>
                    ) : (
                      /* Fire seed — recommendation */
                      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2 C 8 6 6 10 8 14 C 9 16 11 17 12 17 C 13 17 15 16 16 14 C 18 10 16 6 12 2 Z" />
                        <path d="M12 8 C 10 10 10 12 11 14 C 11.5 15 12.5 15 13 14 C 14 12 14 10 12 8 Z" opacity="0.5" strokeWidth="1" />
                      </svg>
                    )}
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
