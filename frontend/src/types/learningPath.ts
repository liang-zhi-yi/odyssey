export interface PathMetadata {
  path_summary?: string;
  difficulty?: number;
  estimated_weeks?: number;
  recommended_skills?: string[];
}

/** A building targeted by a learning path's milestones */
export interface TargetedBuilding {
  building_id: string;
  building_name: string;
  building_name_en: string | null;
  building_icon: string;
  skill_id: string;
  skill_name: string | null;
  region: string;
  region_en: string | null;
  max_level: number;
  civilization_type: string | null;
  era: string | null;
  remaining_milestones: number;
}

export interface LearningPath {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string | null;
  target_date: string | null;
  status: "ACTIVE" | "COMPLETED" | "ABANDONED";
  path_type: "PRESET" | "AI_GENERATED";
  is_official: boolean;
  difficulty: number;
  progress_pct: number;
  path_metadata: PathMetadata | null;
  milestone_count: number | null;
  targeted_buildings: TargetedBuilding[] | null;
  created_at: string;
  updated_at: string;
}

export interface GeneratedQuest {
  id: string;
  quest_id: string | null;
  title: string | null;
  skill_id: string | null;
  skill_name: string | null;
  status: string;
}

export interface PathCheckpoint {
  id: string;
  milestone_id: string;
  title: string;
  title_en: string | null;
  description: string | null;
  description_en: string | null;
  order_sequence: number;
  required_score: number;
  quest_generation_status: "PENDING" | "GENERATED" | "FAILED";
  is_completed: boolean;
  completed_at: string | null;
  generated_quests: GeneratedQuest[] | null;
}

export interface LearningPathMilestone {
  id: string;
  learning_path_id: string;
  title: string;
  title_en: string | null;
  description: string | null;
  description_en: string | null;
  skill_id: string | null;
  skill_name: string | null;
  is_completed: boolean;
  completed_at: string | null;
  order_sequence: number;
  checkpoints: PathCheckpoint[] | null;
}

export interface LearningPathDetail extends LearningPath {
  milestones: LearningPathMilestone[];
}

export interface CreateLearningPathRequest {
  title: string;
  description?: string | null;
  category?: string | null;
  target_date?: string | null;
  generate_with_ai?: boolean;
}

export interface UpdateLearningPathRequest {
  title?: string | null;
  description?: string | null;
  category?: string | null;
  target_date?: string | null;
  status?: string | null;
}

export interface GeneratePathResponse {
  path_id: string;
  path_summary: string;
  difficulty: number;
  estimated_weeks: number;
  milestone_count: number;
  total_checkpoints: number;
  quests_generated?: number;
}

export interface GenerateQuestsResponse {
  checkpoint_id: string;
  quests_generated: number;
  quests: GeneratedQuest[];
}

export interface ToggleMilestoneResponse {
  milestone_id: string;
  is_completed: boolean;
  path_progress_pct: number;
  next_checkpoint_unlocked: boolean;
}

export interface NextCheckpoint {
  path_id: string;
  path_title: string;
  milestone_id: string;
  milestone_title: string;
  milestone_title_en: string | null;
  checkpoint_id: string;
  checkpoint_title: string;
  checkpoint_title_en: string | null;
  skill_id: string | null;
  skill_name: string | null;
  required_score: number;
}

export interface UserMemoryEntry {
  id: string;
  memory_type: string;
  key: string;
  value: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface UpsertMemoryRequest {
  memory_type: string;
  key: string;
  value: Record<string, unknown>;
}

export const PATH_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  COMPLETED: "Completed",
  ABANDONED: "Abandoned",
};

export const PATH_STATUS_LABELS_ZH: Record<string, string> = {
  ACTIVE: "进行中",
  COMPLETED: "已完成",
  ABANDONED: "已放弃",
};
