/** Phase 3 & Phase 4 — World, Building, Region, Compound Building, Events, Milestones types */

export type BuildingStatus = "LOCKED" | "CONSTRUCTING" | "STABLE" | "UPGRADING";
export type BuildingType = "regular" | "compound";
export type WorldEventType =
  | "BUILDING_UPGRADE"
  | "COMPOUND_UNLOCK"
  | "COMPOUND_UPGRADE"
  | "REGION_UNLOCK"
  | "TIER_ADVANCE"
  | "MILESTONE_REACHED"
  | "PATH_MILESTONE_COMPLETED";
export type CivilizationTierValue =
  | "SETTLER"
  | "VILLAGE"
  | "TOWN"
  | "CITY"
  | "METROPOLIS"
  | "CIVILIZATION";
export type MilestoneCategory = "FOUNDATION" | "EXPANSION" | "MASTERY";

// ── Phase 3: Regular buildings ──────────────────────────────────────

export interface BuildingTemplate {
  id: string;
  skill_id: string;
  name: string;
  name_en: string | null;
  description: string | null;
  description_en: string | null;
  icon: string;
  region: string;
  region_en: string | null;
  max_level: number;
  level_names: Record<string, { zh: string; en: string }>;
  position_x: number;
  position_y: number;
}

export interface UserBuilding {
  id: string;
  building_template_id: string;
  level: number;
  status: BuildingStatus;
  constructed_at: string | null;
  upgraded_at: string | null;
  building_type?: BuildingType;
  template: BuildingTemplate | null;
}

export interface RegionInfo {
  key: string;
  name: string;
  buildings: number;
  highest_level: number;
  unlocked: boolean;
}

export interface WorldStats {
  total_buildings: number;
  active_buildings: number;
  average_level: number;
  highest_level: number;
  highest_level_building_name: string | null;
  civilization_level: number;
  compound_buildings: number;
  active_compound_buildings: number;
  milestones_unlocked: number;
  total_milestones: number;
}

// ── Phase 4: Compound buildings ─────────────────────────────────────

export interface CompoundBuildingTemplate {
  id: string;
  name: string;
  name_en: string | null;
  description: string | null;
  description_en: string | null;
  icon: string;
  region: string;
  region_en: string | null;
  max_level: number;
  level_names: Record<string, { zh: string; en: string }>;
  required_skills: { skill_name: string; min_level: number }[];
  position_x: number;
  position_y: number;
}

export interface UserCompoundBuilding {
  id: string;
  building_template_id: string;
  level: number;
  status: BuildingStatus;
  constructed_at: string | null;
  upgraded_at: string | null;
  building_type: "compound";
  template: CompoundBuildingTemplate | null;
}

export interface SourceSkillScore {
  skill_name: string;
  min_level: number;
  knowledge: number;
  reasoning: number;
  application: number;
  creation: number;
  overall: number;
  rank: string;
}

export interface CompoundBuildingDetail extends UserCompoundBuilding {
  source_skill_scores: SourceSkillScore[];
  next_level_at: number;
  level_label: string;
}

// ── Phase 4: World Events ───────────────────────────────────────────

export interface WorldEvent {
  id: string;
  event_type: WorldEventType;
  title: string;
  title_en: string | null;
  description: string | null;
  description_en: string | null;
  building_ref_id: string | null;
  created_at: string;
}

// ── Phase 4: Milestones ─────────────────────────────────────────────

export interface MilestoneDefinition {
  id: string;
  name: string;
  name_en: string | null;
  description: string | null;
  description_en: string | null;
  icon: string;
  category: MilestoneCategory;
  criteria: Record<string, unknown>;
  order_sequence: number;
}

export interface UserMilestone {
  id: string;
  name: string;
  name_en: string | null;
  description: string | null;
  description_en: string | null;
  icon: string;
  category: MilestoneCategory;
  criteria: Record<string, unknown>;
  order_sequence: number;
  unlocked: boolean;
  unlocked_at: string | null;
}

// ── Phase 4: Tech Tree ──────────────────────────────────────────────

export interface TechTreeNode {
  id: string;
  name: string;
  name_en: string | null;
  icon: string;
  region: string | null;
  region_en: string | null;
  level: number;
  status: BuildingStatus;
  position_x: number;
  position_y: number;
  node_type: BuildingType;
  required_skills?: { skill_name: string; min_level: number }[] | null;
  prereq_progress?: { skill_name: string; required_level: number; current_level: number; met: boolean }[] | null;
  all_prereqs_met?: boolean | null;
}

export interface TechTreeData {
  regular_nodes: TechTreeNode[];
  compound_nodes: TechTreeNode[];
}

// ── Updated World (Phase 4) ─────────────────────────────────────────

export interface World {
  id: string;
  user_id: string;
  name: string;
  civilization_level: number;
  tier: CivilizationTierValue;
  tier_name: string;
  tier_score: number;
  next_tier_at: number;
  created_at: string;
  updated_at: string;
  regions: RegionInfo[];
  buildings: UserBuilding[];
  compound_buildings: UserCompoundBuilding[];
  stats: WorldStats;
  recent_events: WorldEvent[];
}

export interface BuildingDetail extends UserBuilding {
  skill_scores: {
    knowledge: number;
    reasoning: number;
    application: number;
    creation: number;
    overall: number;
    rank: string;
  } | null;
  next_level_at: number;
  level_label: string;
}

// ── Labels ──────────────────────────────────────────────────────────

export const LEVEL_LABELS: Record<number, { zh: string; en: string }> = {
  1: { zh: "基地", en: "Foundation" },
  2: { zh: "工坊", en: "Workshop" },
  3: { zh: "学院", en: "Academy" },
  4: { zh: "研究院", en: "Institute" },
  5: { zh: "堡垒", en: "Citadel" },
};

export const BUILDING_STATUS_LABELS: Record<BuildingStatus, { zh: string; en: string }> = {
  LOCKED: { zh: "未激活", en: "Locked" },
  CONSTRUCTING: { zh: "建设中", en: "Constructing" },
  STABLE: { zh: "稳定", en: "Stable" },
  UPGRADING: { zh: "升级中", en: "Upgrading" },
};

export const CIVILIZATION_TIER_LABELS: Record<CivilizationTierValue, { zh: string; en: string; icon: string }> = {
  SETTLER: { zh: "定居者", en: "Settler", icon: "🏕️" },
  VILLAGE: { zh: "村落", en: "Village", icon: "🏘️" },
  TOWN: { zh: "城镇", en: "Town", icon: "🏙️" },
  CITY: { zh: "城市", en: "City", icon: "🌆" },
  METROPOLIS: { zh: "大都会", en: "Metropolis", icon: "🏛️" },
  CIVILIZATION: { zh: "文明", en: "Civilization", icon: "🌍" },
};

export const EVENT_TYPE_LABELS: Record<WorldEventType, { zh: string; en: string; icon: string }> = {
  BUILDING_UPGRADE: { zh: "建筑升级", en: "Building Upgrade", icon: "⬆️" },
  COMPOUND_UNLOCK: { zh: "复合建筑解锁", en: "Compound Unlock", icon: "🔓" },
  COMPOUND_UPGRADE: { zh: "复合建筑升级", en: "Compound Upgrade", icon: "⬆️" },
  REGION_UNLOCK: { zh: "区域解锁", en: "Region Unlock", icon: "🗺️" },
  TIER_ADVANCE: { zh: "文明晋级", en: "Tier Advance", icon: "⭐" },
  MILESTONE_REACHED: { zh: "里程碑达成", en: "Milestone", icon: "🎯" },
  PATH_MILESTONE_COMPLETED: { zh: "路径里程碑", en: "Path Milestone", icon: "🛤️" },
};

// ── Civilization Direction ──────────────────────────────────────────────

export interface TargetedBuilding {
  building_id: string;
  building_name: string;
  building_name_en: string | null;
  building_icon: string;
  current_level: number;
  projected_level: number;
  remaining_milestones: number;
  region: string;
  region_en: string | null;
  max_level: number;
}

export interface ActivePathDirection {
  path_id: string;
  path_title: string;
  progress_pct: number;
  targeted_buildings: TargetedBuilding[];
}

export interface CivilizationDirection {
  active_paths: ActivePathDirection[];
  summary: string;
  suggested_focus: string;
}
