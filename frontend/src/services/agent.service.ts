/**
 * Agent API service — thin wrapper around the Odyssey Agent chat endpoints.
 *
 * Pattern: singleton object matching all existing services in src/services/.
 */
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type {
  ChatResponse,
  HistoryResponse,
  AgentCard,
} from "@/types/agent";

const BASE_URL = "/api/v1";

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onDone: (data: { conversation_id: string; cards: AgentCard[] }) => void;
  onError: (message: string) => void;
}

export const agentService = {
  /** Send a message to the agent and get a response with optional cards. */
  sendMessage: (message: string, conversationId?: string) =>
    api.post<ChatResponse>("/agent/chat", {
      message,
      conversation_id: conversationId ?? undefined,
    }),

  /**
   * Send a message and consume the SSE stream for real-time token display.
   *
   * Calls ``onToken`` for each text chunk, then ``onDone`` with the
   * conversation_id and parsed cards once the stream completes.
   * Calls ``onError`` if the request fails or the stream emits an error.
   */
  sendMessageStream: async (
    message: string,
    callbacks: StreamCallbacks,
    conversationId?: string,
  ): Promise<void> => {
    const token = getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}/agent/chat/stream`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        message,
        conversation_id: conversationId ?? undefined,
      }),
    });

    if (!response.ok) {
      // Handle 401
      if (response.status === 401 && token) {
        const { clearAuth } = await import("@/lib/auth");
        clearAuth();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return;
      }

      let errorMsg = `Stream request failed with status ${response.status}`;
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        try {
          const body = await response.json();
          const errInfo = (body?.error as Record<string, unknown> | undefined) ?? {};
          errorMsg = (errInfo.message as string) || (body?.detail as string) || errorMsg;
        } catch { /* ignore parse errors */ }
      }
      callbacks.onError(errorMsg);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      callbacks.onError("No response body from stream");
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // Keep the last (potentially incomplete) line in the buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6);
          try {
            const data = JSON.parse(jsonStr);
            if (data.type === "token") {
              callbacks.onToken(data.content as string);
            } else if (data.type === "done") {
              callbacks.onDone({
                conversation_id: data.conversation_id as string,
                cards: (data.cards as AgentCard[]) || [],
              });
            } else if (data.type === "error") {
              callbacks.onError(data.message as string);
            }
          } catch {
            // Skip lines that can't be parsed
          }
        }
      }
    } catch (err: any) {
      callbacks.onError(err?.message || "Stream connection lost");
    }
  },

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
