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
import { useLocale } from "@/hooks/useLocale";
import { agentService } from "@/services/agent.service";
import type { AgentCard, ConversationListItem, ChatMessage } from "@/types/agent";

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
  conversations: ConversationListItem[];
  activeConversationId: string | null;
  toggle: () => void;
  open: () => void;
  close: () => void;
  sendMessage: (text: string) => Promise<void>;
  startNewChat: () => void;
  loadConversation: (conversationId: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
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
  const { locale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [hasUnread, setHasUnread] = useState(false);
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const initialized = useRef(false);
  const localeRef = useRef(locale);

  // Keep localeRef in sync
  useEffect(() => {
    localeRef.current = locale;
  }, [locale]);

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

  // ── Load conversation list ────────────────────────────────────

  const refreshConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await agentService.getHistory();
      setConversations(data.conversations ?? []);
    } catch {
      // Silently fail — conversations list is not critical
    }
  }, [isAuthenticated]);

  // ── Load a specific conversation's messages ───────────────────

  const loadConversation = useCallback(async (convId: string) => {
    try {
      setIsLoading(true);
      const data = await agentService.getHistory(convId);
      const msgs = data.messages ?? [];
      const displayMsgs: DisplayMessage[] = msgs.map((m: ChatMessage) => ({
        id: m.id,
        role: m.role === "user" ? "user" : "agent",
        content: m.content,
        timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }));
      setMessages(displayMsgs);
      setConversationId(convId);
      setActiveConversationId(convId);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY_CONV, convId);
      }
    } catch {
      // If loading fails, fall back to greeting
      setMessages([]);
      setConversationId(null);
      setActiveConversationId(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Auto-greet or restore on first open ───────────────────────

  useEffect(() => {
    if (isOpen && isAuthenticated && !initialized.current && messages.length === 0) {
      initialized.current = true;
      // Try to restore last conversation from cache
      const cachedConvId = typeof window !== "undefined"
        ? localStorage.getItem(STORAGE_KEY_CONV)
        : null;
      if (cachedConvId) {
        // Restore the cached conversation
        loadConversation(cachedConvId).then(() => {
          // Also refresh conversation list
          refreshConversations();
        }).catch(() => {
          // If restore fails, load greeting
          loadGreeting();
        });
      } else {
        // No cached conversation, load greeting
        loadGreeting();
        refreshConversations();
      }
    }
    // Reset initialized when auth changes
    if (!isAuthenticated) {
      initialized.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isAuthenticated]);

  // ── Actions ──────────────────────────────────────────────────

  const loadGreeting = useCallback(async () => {
    try {
      setIsLoading(true);
      const currentLocale = localeRef.current;
      const response = await agentService.getGreeting(currentLocale);
      setConversationId(response.conversation_id);
      setActiveConversationId(response.conversation_id);
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
          content: `Hello ${user?.username || "there"}! I'm Odyssey, your growth companion. How can I help you today?`,
          timestamp: formatTime(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.username]);

  // Ref to hold the streaming message ID so we can update it across callbacks
  const streamingMsgIdRef = useRef<string | null>(null);
  // Ref to hold the typewriter timer so we can clear it on unmount
  const typewriterTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const currentLocale = localeRef.current;
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

      // Buffer for typewriter effect: receives tokens, reveals characters one by one
      let tokenBuffer = "";
      let displayIndex = 0;
      let streamFinished = false;
      let finalCards: AgentCard[] = [];
      let finalConvId = "";

      // Clear any existing typewriter timer
      if (typewriterTimerRef.current) {
        clearInterval(typewriterTimerRef.current);
        typewriterTimerRef.current = null;
      }

      // Typewriter: reveal characters from buffer at a steady pace
      const TYPEWRITER_SPEED = 20; // ms per character
      typewriterTimerRef.current = setInterval(() => {
        if (displayIndex < tokenBuffer.length) {
          displayIndex++;
          const visible = tokenBuffer.slice(0, displayIndex);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === agentMsgId
                ? { ...m, content: visible }
                : m
            )
          );
        }
        // If stream finished and all characters revealed, finalize
        if (streamFinished && displayIndex >= tokenBuffer.length) {
          if (typewriterTimerRef.current) {
            clearInterval(typewriterTimerRef.current);
            typewriterTimerRef.current = null;
          }
          setConversationId(finalConvId);
          setActiveConversationId(finalConvId);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === agentMsgId
                ? {
                    ...m,
                    content: tokenBuffer,
                    cards: finalCards.length > 0 ? finalCards : undefined,
                    isStreaming: false,
                  }
                : m
            )
          );
          setIsLoading(false);
          // Refresh conversation list after sending a message
          refreshConversations();
        }
      }, TYPEWRITER_SPEED);

      await agentService.sendMessageStream(
        text.trim(),
        {
          onToken: (token: string) => {
            tokenBuffer += token;
          },
          onDone: (data: { conversation_id: string; cards: AgentCard[] }) => {
            finalConvId = data.conversation_id;
            finalCards = data.cards;
            streamFinished = true;
          },
          onError: (_message: string) => {
            streamFinished = true;
            if (typewriterTimerRef.current) {
              clearInterval(typewriterTimerRef.current);
              typewriterTimerRef.current = null;
            }
            // Replace streaming message with error
            setMessages((prev) =>
              prev.map((m) =>
                m.id === agentMsgId
                  ? {
                      ...m,
                      content:
                        tokenBuffer ||
                        "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment.",
                      isStreaming: false,
                    }
                  : m
              )
            );
            setIsLoading(false);
          },
        },
        conversationId ?? undefined,
        currentLocale,
      );

      streamingMsgIdRef.current = null;
    },
    [conversationId, isLoading, refreshConversations]
  );

  const startNewChat = useCallback(() => {
    // Clear any running typewriter timer
    if (typewriterTimerRef.current) {
      clearInterval(typewriterTimerRef.current);
      typewriterTimerRef.current = null;
    }
    setMessages([]);
    setConversationId(null);
    setActiveConversationId(null);
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
    conversations,
    activeConversationId,
    toggle,
    open,
    close,
    sendMessage,
    startNewChat,
    loadConversation,
    refreshConversations,
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
