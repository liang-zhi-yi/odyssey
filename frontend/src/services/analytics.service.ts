/** Analytics API calls — /api/v1/analytics */

import { api } from "@/lib/api";
import type { InsightsResponse, AnalyticsSummary, TrendsResponse } from "@/types/analytics";

export const analyticsService = {
  /** Get AI-powered insights about the user's capability growth */
  getInsights(): Promise<InsightsResponse> {
    return api.get<InsightsResponse>("/analytics/insights");
  },

  /** Get analytics summary: total quests, assessments, growth rate, etc. */
  getSummary(): Promise<AnalyticsSummary> {
    return api.get<AnalyticsSummary>("/analytics/summary");
  },

  /** Get time-series trend data for a specific skill */
  getTrends(skillId: string, period: number = 30): Promise<TrendsResponse> {
    const params = new URLSearchParams();
    params.set("skill_id", skillId);
    params.set("period", String(period));
    return api.get<TrendsResponse>(`/analytics/trends?${params.toString()}`);
  },
};
