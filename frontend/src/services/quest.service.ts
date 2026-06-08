/** Quest API calls — /api/v1/quests, /api/v1/user-quests */

import { api } from "@/lib/api";
import type {
  QuestListItem,
  QuestDetail,
  AcceptQuestResponse,
  UserQuest,
  CivilizationQuestGroup,
  CivilizationQuestsMap,
} from "@/types/quest";

export const questService = {
  /** List quests, optionally filtered by skill or difficulty */
  listQuests(params?: {
    skill_id?: string;
    difficulty?: string;
  }): Promise<QuestListItem[]> {
    const searchParams = new URLSearchParams();
    if (params?.skill_id) searchParams.set("skill_id", params.skill_id);
    if (params?.difficulty) searchParams.set("difficulty", params.difficulty);
    const qs = searchParams.toString();
    return api.get<QuestListItem[]>(`/quests${qs ? `?${qs}` : ""}`);
  },

  /** Get full details for a single quest */
  getQuestDetail(questId: string): Promise<QuestDetail> {
    return api.get<QuestDetail>(`/quests/${questId}`);
  },

  /** Accept a quest — creates a QuestSubmission */
  acceptQuest(questId: string): Promise<AcceptQuestResponse> {
    return api.post<AcceptQuestResponse>(`/quests/${questId}/accept`);
  },

  /** List quests the current user has interacted with */
  listUserQuests(): Promise<UserQuest[]> {
    return api.get<UserQuest[]>("/user-quests");
  },

  /** Get daily recommended quests (not yet accepted). Set context="world" for world-aware. */
  listRecommendedQuests(context?: string): Promise<QuestListItem[]> {
    const qs = context ? `?context=${context}` : "";
    return api.get<QuestListItem[]>(`/quests/recommended${qs}`);
  },

  /** Get quests for the user's current path node */
  listPathNodeQuests(): Promise<QuestListItem[]> {
    return api.get<QuestListItem[]>("/quests/path-node");
  },

  /** List quests grouped by civilization type */
  async listQuestsByCivilization(): Promise<CivilizationQuestGroup[]> {
    const data = await api.get<CivilizationQuestsMap>("/quests/by-civilization");
    // Backend returns a dict keyed by civilization type; convert to sorted array
    return Object.values(data).sort((a, b) => b.count - a.count);
  },

  /** Abandon an accepted quest */
  abandonQuest(questId: string): Promise<{ status: string }> {
    return api.post<{ status: string }>(`/quests/${questId}/abandon`);
  },
};
