/** Barrel export — all types */

export type { User, UpdateProfileRequest, ChangePasswordRequest } from "./user";

export type {
  RegisterRequest,
  LoginRequest,
  TokenResponse,
} from "./auth";

export type {
  Skill,
  UserSkill,
  SkillRank,
} from "./skill";
export { RANK_LABELS } from "./skill";

export type {
  QuestListItem,
  QuestDetail,
  AcceptQuestResponse,
  UserQuest,
  QuestDifficulty,
  QuestType,
  DeliverableType,
  SubmissionStatus,
} from "./quest";
export {
  SUBMISSION_STATUS_LABELS,
  DIFFICULTY_LABELS,
  QUEST_TYPE_LABELS,
} from "./quest";

export type {
  SubmitRequest,
  SubmitResponse,
  SubmissionDetail,
  SubmissionHistoryItem,
} from "./submission";

export type {
  AssessmentStatus,
  RunAssessmentRequest,
  RunAssessmentResponse,
  AssessmentProcessing,
  AssessmentCompleted,
  AssessmentFailed,
  AssessmentResult,
  DimensionScores,
} from "./assessment";
export { DIMENSION_LABELS, DIMENSION_WEIGHTS } from "./assessment";

export type { ProgressLog, SkillGrowthPoint } from "./progress";

export type { Credential, UserCredential } from "./credential";

export type {
  PassportSkillEntry,
  PassportCredentialEntry,
  PassportProjectEntry,
  Passport,
} from "./passport";

export type { CreateProjectRequest, Project } from "./project";

export type {
  GrowthPath,
  SelectPathRequest,
  SelectPathResponse,
  UserPath,
} from "./path";

export type { UserSettings, UpdateSettingsRequest } from "./settings";

export type { BadgeDefinition, UserBadge } from "./badge";

export type {
  World,
  WorldStats,
  RegionInfo,
  UserBuilding,
  BuildingTemplate,
  BuildingDetail,
  BuildingStatus,
} from "./world";
export { LEVEL_LABELS, BUILDING_STATUS_LABELS } from "./world";
