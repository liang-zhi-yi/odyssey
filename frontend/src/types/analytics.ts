/** Analytics types — matching backend app/analytics/schemas.py */

export type InsightType =
  | "growth_acceleration"
  | "plateau_warning"
  | "skill_gap"
  | "strength_area"
  | "recommended_focus";

export interface AIInsight {
  type: InsightType;
  title: string;
  title_en: string;
  description: string;
  description_en: string;
  icon: string;
  related_skill_id: string | null;
  action_label: string | null;
  action_label_en: string | null;
}

export interface InsightsResponse {
  insights: AIInsight[];
}

export interface AnalyticsSummary {
  total_quests: number;
  total_assessments: number;
  growth_rate: number;
  strongest_skill: string | null;
  strongest_skill_en: string | null;
  strongest_skill_score: number | null;
  weakest_skill: string | null;
  weakest_skill_en: string | null;
  weakest_skill_score: number | null;
}

export interface TrendPoint {
  date: string;
  overall: number;
  knowledge: number;
  reasoning: number;
  application: number;
  creation: number;
}

export interface TrendsResponse {
  skill_id: string;
  skill_name: string;
  skill_name_en: string | null;
  points: TrendPoint[];
}
