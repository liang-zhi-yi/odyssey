/** Progress types — matching backend app/progress/schemas.py */

export interface ProgressLog {
  skill: string;
  previous: number;
  current: number;
  delta: number;
  reason: string;
  created_at: string;
}

export interface SkillGrowthPoint {
  date: string;
  score: number;
}

export interface TimelineEvent {
  date: string;
  skill_name: string;
  event_type: string;
  previous_score: number;
  new_score: number;
  delta: number;
  reason: string;
}

export interface TimelineResponse {
  events: TimelineEvent[];
  total: number;
}
