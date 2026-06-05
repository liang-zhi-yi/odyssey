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

export interface PathGrowthSkill {
  skill_name: string;
  skill_id: string;
  points: SkillGrowthPoint[];
}

export interface PathGrowthResponse {
  path_id: string;
  path_name: string;
  skills: PathGrowthSkill[];
}
