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
  roadmap_nodes: MilestoneNode[];
  rewards_preview: PathRewardsPreview | null;
}

// ── Roadmap / Civilization Development View ──────────────────────

export interface MilestoneNode {
  id: string;
  title: string;
  title_en: string | null;
  order_sequence: number;
  estimated_hours: number;
  status: "LOCKED" | "ACTIVE" | "COMPLETED";
  skill_name: string | null;
  associated_building: {
    id: string;
    name: string;
    name_en: string | null;
    icon: string;
    region: string;
    region_en: string | null;
    max_level: number;
  } | null;
  progress_pct: number;
  checkpoints: PathCheckpoint[] | null;
}

export interface PathRewardsPreview {
  buildings: {
    name: string;
    name_en: string | null;
    icon: string;
    current_level: number;
    current_score: number;
    projected_level: number;
    projected_score: number;
    region: string;
    max_level: number;
  }[];
  civilization_level_projection: number | null;
  tier_projection: {
    current_tier: string;
    current_tier_name: string;
    projected_tier: string;
    projected_tier_name: string;
  } | null;
}

// ── Stats Summary ────────────────────────────────────────────────

export interface PathStatsSummary {
  civilization_level: number;
  civilization_name: string;
  era: string;
  era_icon: string;
  unlocked_buildings: number;
  total_buildings: number;
  completed_quests: number;
  total_skill_value: number;
}

// ── AI Mentor ────────────────────────────────────────────────────

export interface MentorSuggestion {
  current_suggestion: string;
  recommended_quests: {
    quest_id: string;
    title: string;
    skill_name: string | null;
    difficulty: string;
  }[];
  estimated_growth: {
    building_name: string;
    building_icon: string;
    current_level: number;
    projected_level: number;
  } | null;
  actions: {
    label: string;
    url: string;
    type: "continue" | "plan" | "chat";
  }[];
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
