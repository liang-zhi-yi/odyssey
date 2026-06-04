/** Badge types — matching backend app/badges/schemas.py */

export interface BadgeCriteria {
  type: string;
  operator?: "AND" | "OR";
  conditions?: BadgeCriteria[];
  [key: string]: unknown;
}

export interface BadgeDefinition {
  id: string;
  name: string;
  name_en: string | null;
  description: string | null;
  description_en: string | null;
  icon: string;
  criteria: BadgeCriteria;
  category: string;
}

export interface UserBadge {
  badge_id: string;
  badge: BadgeDefinition;
  earned: boolean;
  earned_at: string | null;
  progress_current: number | null;
  progress_target: number | null;
}
