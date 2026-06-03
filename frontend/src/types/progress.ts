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
