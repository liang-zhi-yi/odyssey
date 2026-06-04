/** Phase 3 — World, Building, Region types */

export type BuildingStatus = "LOCKED" | "CONSTRUCTING" | "STABLE" | "UPGRADING";

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
}

export interface World {
  id: string;
  user_id: string;
  name: string;
  civilization_level: number;
  created_at: string;
  updated_at: string;
  regions: RegionInfo[];
  buildings: UserBuilding[];
  stats: WorldStats;
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
