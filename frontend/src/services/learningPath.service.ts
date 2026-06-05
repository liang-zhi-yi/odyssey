import { api } from "@/lib/api";
import type {
  LearningPath,
  LearningPathDetail,
  CreateLearningPathRequest,
  UpdateLearningPathRequest,
  GeneratePathResponse,
  GenerateQuestsResponse,
  ToggleMilestoneResponse,
  NextCheckpoint,
  UserMemoryEntry,
  UpsertMemoryRequest,
} from "@/types/learningPath";

export const learningPathService = {
  // -- Learning Paths --
  listPaths(params?: { path_type?: string; status?: string }): Promise<LearningPath[]> {
    const searchParams = new URLSearchParams();
    if (params?.path_type) searchParams.set("path_type", params.path_type);
    if (params?.status) searchParams.set("status", params.status);
    const qs = searchParams.toString();
    return api.get<LearningPath[]>(`/learning-paths${qs ? `?${qs}` : ""}`);
  },

  listPresetPaths(): Promise<LearningPath[]> {
    return api.get<LearningPath[]>("/learning-paths/presets");
  },

  getPath(id: string): Promise<LearningPathDetail> {
    return api.get<LearningPathDetail>(`/learning-paths/${id}`);
  },

  createPath(body: CreateLearningPathRequest): Promise<LearningPathDetail> {
    return api.post<LearningPathDetail>("/learning-paths", body);
  },

  updatePath(id: string, body: UpdateLearningPathRequest): Promise<LearningPath> {
    return api.put<LearningPath>(`/learning-paths/${id}`, body);
  },

  deletePath(id: string): Promise<void> {
    return api.delete(`/learning-paths/${id}`);
  },

  // -- AI Generation --
  generatePath(id: string): Promise<GeneratePathResponse> {
    return api.post<GeneratePathResponse>(`/learning-paths/${id}/generate`);
  },

  regeneratePath(id: string): Promise<GeneratePathResponse> {
    return api.post<GeneratePathResponse>(`/learning-paths/${id}/regenerate`);
  },

  generateQuests(
    pathId: string,
    milestoneId: string,
    checkpointId: string
  ): Promise<GenerateQuestsResponse> {
    return api.post<GenerateQuestsResponse>(
      `/learning-paths/${pathId}/milestones/${milestoneId}/checkpoints/${checkpointId}/generate-quests`
    );
  },

  // -- Progress --
  toggleMilestone(pathId: string, milestoneId: string): Promise<ToggleMilestoneResponse> {
    return api.put<ToggleMilestoneResponse>(
      `/learning-paths/${pathId}/milestones/${milestoneId}`
    );
  },

  // -- Checkpoint --
  getNextCheckpoint(pathId?: string): Promise<NextCheckpoint | null> {
    const qs = pathId ? `?path_id=${pathId}` : "";
    return api.get<NextCheckpoint | null>(`/learning-paths/next-checkpoint${qs}`);
  },

  // -- Memory Bank --
  listMemory(): Promise<UserMemoryEntry[]> {
    return api.get<UserMemoryEntry[]>("/memory");
  },

  upsertMemory(body: UpsertMemoryRequest): Promise<UserMemoryEntry> {
    return api.post<UserMemoryEntry>("/memory", body);
  },

  deleteMemory(id: string): Promise<void> {
    return api.delete(`/memory/${id}`);
  },

  clearMemory(): Promise<void> {
    return api.delete("/memory");
  },
};
