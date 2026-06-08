/** Quest types — matching backend app/quests/schemas.py */

export type QuestDifficulty = "LEVEL_1" | "LEVEL_2" | "LEVEL_3" | "LEVEL_4";
export type QuestType = "KNOWLEDGE" | "APPLICATION" | "PROJECT" | "MASTERY";
export type DeliverableType = "PROMPT" | "ARCHITECTURE" | "WORKFLOW" | "CODE" | "REPORT";

export interface BuildingContext {
  building_name: string;
  building_name_en: string | null;
  building_icon: string;
  current_level: number;
  next_level_at: number;
}

/** Associated building info (from enhanced quest detail / world-aware recommendations) */
export interface AssociatedBuilding {
  id: string;
  name: string;
  name_en: string | null;
  icon: string;
  current_level: number;
  next_level_at?: number;
  region?: string;
}

/** Estimated reward preview for completing a quest */
export interface QuestRewardPreview {
  knowledge: number;
  reasoning: number;
  application: number;
  creation: number;
  building_exp: number;
  civilization_contribution: number;
}

export interface QuestListItem {
  id: string;
  title: string;
  title_en: string | null;
  skill_id: string;
  skill_name: string;
  difficulty: QuestDifficulty;
  quest_type: QuestType;
  expected_deliverable: DeliverableType;
  /** Optional: building context from world-aware recommendations */
  building_context?: BuildingContext | null;
  /** Enhanced: associated building info */
  associated_building?: AssociatedBuilding | null;
  /** Enhanced: reward preview */
  reward_preview?: QuestRewardPreview | null;
}

export interface QuestDetail {
  id: string;
  title: string;
  title_en: string | null;
  description: string | null;
  description_en: string | null;
  skill_id: string;
  skill_name: string;
  difficulty: QuestDifficulty;
  quest_type: QuestType;
  expected_deliverable: DeliverableType;
  /** Enhanced: associated building */
  associated_building?: AssociatedBuilding | null;
  /** Enhanced: reward preview */
  reward_preview?: QuestRewardPreview | null;
}

export interface AcceptQuestResponse {
  status: string;
}

export interface UserQuest {
  quest_id: string;
  quest_title: string;
  quest_title_en: string | null;
  status: SubmissionStatus;
  latest_submission_id: string | null;
  submission_count: number;
}

/** Submission status matching backend SubmissionStatus enum */
export type SubmissionStatus =
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "ASSESSING"
  | "PASSED"
  | "FAILED"
  | "ABANDONED";

export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  ACCEPTED: "已接受",
  IN_PROGRESS: "进行中",
  SUBMITTED: "已提交",
  ASSESSING: "评估中",
  PASSED: "已通过",
  FAILED: "未通过",
  ABANDONED: "已放弃",
};

export const DIFFICULTY_LABELS: Record<QuestDifficulty, string> = {
  LEVEL_1: "入门",
  LEVEL_2: "基础",
  LEVEL_3: "进阶",
  LEVEL_4: "专家",
};

export const QUEST_TYPE_LABELS: Record<QuestType, string> = {
  KNOWLEDGE: "知识",
  APPLICATION: "应用",
  PROJECT: "项目",
  MASTERY: "精通",
};

// ── Civilization-grouped Quests ─────────────────────────────────────

export interface CivilizationQuestGroup {
  civilization_type: string;
  label: string;
  label_en: string;
  icon: string;
  count: number;
  quests: CivilizationQuestItem[];
}

export interface CivilizationQuestItem {
  id: string;
  title: string;
  title_en: string | null;
  description: string | null;
  description_en: string | null;
  skill_id: string;
  skill_name: string | null;
  difficulty: QuestDifficulty;
  quest_type: QuestType;
  expected_deliverable: DeliverableType;
  associated_building: AssociatedBuilding | null;
  reward_preview: QuestRewardPreview | null;
}

export type CivilizationQuestsMap = Record<string, CivilizationQuestGroup>;
