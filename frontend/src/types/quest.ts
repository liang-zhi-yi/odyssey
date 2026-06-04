/** Quest types — matching backend app/quests/schemas.py */

export type QuestDifficulty = "LEVEL_1" | "LEVEL_2" | "LEVEL_3" | "LEVEL_4";
export type QuestType = "KNOWLEDGE" | "APPLICATION" | "PROJECT" | "MASTERY";
export type DeliverableType = "PROMPT" | "ARCHITECTURE" | "WORKFLOW" | "CODE" | "REPORT";

export interface QuestListItem {
  id: string;
  title: string;
  title_en: string | null;
  skill_id: string;
  skill_name: string;
  difficulty: QuestDifficulty;
  quest_type: QuestType;
  expected_deliverable: DeliverableType;
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
