/** Path types — matching backend app/paths/schemas.py */

export interface GrowthPath {
  id: string;
  name: string;
  name_en: string | null;
  description: string | null;
  description_en: string | null;
  difficulty: number;
  is_official: boolean;
}

export interface SelectPathRequest {
  path_id: string;
}

export interface SelectPathResponse {
  status: string;
}

export interface UserPath {
  path_id: string;
  name: string;
  name_en: string | null;
  progress: number;
}

/** A single skill node (stage) within a growth path */
export interface PathSkillNode {
  stage_order: number;
  skill_id: string;
  skill_name: string;
  skill_name_en: string | null;
  skill_description: string | null;
  skill_description_en: string | null;
  required_score: number;
}

/** Full path breakdown with all nodes */
export interface PathNodes {
  path_id: string;
  path_name: string;
  path_name_en: string | null;
  path_description: string | null;
  path_description_en: string | null;
  nodes: PathSkillNode[];
}

/** Current path node info (for quest push) */
export interface NextPathNode {
  stage_order: number;
  skill_id: string;
  skill_name: string;
  skill_name_en: string | null;
  skill_description: string | null;
  skill_description_en: string | null;
  required_score: number;
  current_score: number;
  path_id: string;
}

/** Path skill growth data */
export interface PathSkillGrowth {
  skill_id: string;
  skill_name: string;
  points: SkillGrowthPoint[];
}

/** Path growth response */
export interface PathGrowthResponse {
  path_id: string;
  path_name: string;
  skills: PathSkillGrowth[];
}

/** Re-export from progress for convenience */
import type { SkillGrowthPoint } from "./progress";
