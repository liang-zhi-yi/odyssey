/**
 * Agent API service — thin wrapper around the Odyssey Agent chat endpoints.
 *
 * Pattern: singleton object matching all existing services in src/services/.
 */
import { api } from "@/lib/api";
import type {
  ChatResponse,
  HistoryResponse,
} from "@/types/agent";

export const agentService = {
  /** Send a message to the agent and get a response with optional cards. */
  sendMessage: (message: string, conversationId?: string) =>
    api.post<ChatResponse>("/agent/chat", {
      message,
      conversation_id: conversationId ?? undefined,
    }),

  /** Get conversation list or messages for a specific conversation. */
  getHistory: (conversationId?: string) => {
    const params = conversationId
      ? `?conversation_id=${encodeURIComponent(conversationId)}`
      : "";
    return api.get<HistoryResponse>(`/agent/history${params}`);
  },

  /** Get a context-aware greeting from the agent. */
  getGreeting: () => api.get<ChatResponse>("/agent/greeting"),
};
