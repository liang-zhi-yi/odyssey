"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import { useAuth } from "@/hooks/useAuth";
import { agentService } from "@/services/agent.service";
import type { AgentMessage, AgentCard } from "@/types/agent";

// ── Types ─────────────────────────────────────────────────────────

interface DisplayMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  cards?: AgentCard[];
  timestamp: string;
  isStreaming?: boolean;
}

interface AgentContextValue {
  isOpen: boolean;
  messages: DisplayMessage[];
  isLoading: boolean;
  conversationId: string | null;
  hasUnread: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
  sendMessage: (text: string) => Promise<void>;
  startNewChat: () => void;
}

const AgentContext = createContext<AgentContextValue | null>(null);

const STORAGE_KEY_OPEN = "odyssey_agent_open";
const STORAGE_KEY_CONV = "odyssey_agent_conv";

// ── Helpers ────────────────────────────────────────────────────────

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function formatTime(): string {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ── Provider ───────────────────────────────────────────────────────

export function AgentProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [hasUnread, setHasUnread] = useState(false);
  const initialized = useRef(false);

  // ── Persisted state ──────────────────────────────────────────

  // Restore open state from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY_OPEN);
      if (stored === "true") setIsOpen(true);
    }
  }, []);

  // Persist open state
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_OPEN, String(isOpen));
    }
  }, [isOpen]);

  // Persist conversation ID
  useEffect(() => {
    if (typeof window !== "undefined" && conversationId) {
      localStorage.setItem(STORAGE_KEY_CONV, conversationId);
    }
  }, [conversationId]);

  // ── Auto-greet on first open ─────────────────────────────────

  useEffect(() => {
    if (isOpen && isAuthenticated && !initialized.current && messages.length === 0) {
      initialized.current = true;
      loadGreeting();
    }
    // Reset initialized when auth changes
    if (!isAuthenticated) {
      initialized.current = false;
    }
  }, [isOpen, isAuthenticated]);

  // ── Actions ──────────────────────────────────────────────────

  const loadGreeting = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await agentService.getGreeting();
      setConversationId(response.conversation_id);
      const msg: DisplayMessage = {
        id: generateId(),
        role: "agent",
        content: response.message.content,
        cards: response.cards ?? undefined,
        timestamp: formatTime(),
      };
      setMessages([msg]);
    } catch {
      // Silently fail — greeting is not critical
      setMessages([
        {
          id: generateId(),
          role: "agent",
          content: `Hello ${user?.username || "there"}! 👋 I'm Odyssey, your growth companion. How can I help you today?`,
          timestamp: formatTime(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.username]);

  // Ref to hold the streaming message ID so we can update it across callbacks
  const streamingMsgIdRef = useRef<string | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMsg: DisplayMessage = {
        id: generateId(),
        role: "user",
        content: text.trim(),
        timestamp: formatTime(),
      };
      const agentMsgId = generateId();
      streamingMsgIdRef.current = agentMsgId;

      // Add user message + placeholder streaming agent message
      setMessages((prev) => [
        ...prev,
        userMsg,
        {
          id: agentMsgId,
          role: "agent",
          content: "",
          timestamp: formatTime(),
          isStreaming: true,
        },
      ]);
      setIsLoading(true);

      // Accumulate streaming content
      let streamedContent = "";

      await agentService.sendMessageStream(
        text.trim(),
        {
          onToken: (token: string) => {
            streamedContent += token;
            // Update the streaming message content
            setMessages((prev) =>
              prev.map((m) =>
                m.id === agentMsgId
                  ? { ...m, content: streamedContent }
                  : m
              )
            );
          },
          onDone: (data: { conversation_id: string; cards: AgentCard[] }) => {
            setConversationId(data.conversation_id);
            // Finalize the streaming message
            setMessages((prev) =>
              prev.map((m) =>
                m.id === agentMsgId
                  ? {
                      ...m,
                      content: streamedContent,
                      cards: data.cards.length > 0 ? data.cards : undefined,
                      isStreaming: false,
                    }
                  : m
              )
            );
          },
          onError: (_message: string) => {
            // Replace streaming message with error
            setMessages((prev) =>
              prev.map((m) =>
                m.id === agentMsgId
                  ? {
                      ...m,
                      content:
                        streamedContent ||
                        "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment.",
                      isStreaming: false,
                    }
                  : m
              )
            );
          },
        },
        conversationId ?? undefined,
      );

      streamingMsgIdRef.current = null;
      setIsLoading(false);
    },
    [conversationId, isLoading]
  );

  const startNewChat = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY_CONV);
    }
    // Load fresh greeting
    initialized.current = false;
    loadGreeting();
  }, [loadGreeting]);

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) setHasUnread(false);
      return next;
    });
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
    setHasUnread(false);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  // ── Keyboard shortcut: Ctrl+. / Cmd+. ─────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === ".") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggle]);

  // ── Value ────────────────────────────────────────────────────

  const value: AgentContextValue = {
    isOpen,
    messages,
    isLoading,
    conversationId,
    hasUnread,
    toggle,
    open,
    close,
    sendMessage,
    startNewChat,
  };

  return (
    <AgentContext.Provider value={value}>{children}</AgentContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────

export function useAgent(): AgentContextValue {
  const ctx = useContext(AgentContext);
  if (!ctx) {
    throw new Error("useAgent must be used within an AgentProvider");
  }
  return ctx;
}
