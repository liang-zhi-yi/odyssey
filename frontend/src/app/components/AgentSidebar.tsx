"use client";

import { useState, useRef, useEffect } from "react";
import { useAgent } from "@/hooks/useAgent";
import { useLocale } from "@/hooks/useLocale";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import { AgentMessageBubble } from "./AgentMessage";

/**
 * Agent Sidebar — collapsible right panel with chat interface.
 *
 * Features:
 * - Fixed right panel, 380px width, full viewport height
 * - Smooth slide-in/out transition
 * - Chat messages with auto-scroll to bottom
 * - Text input with Enter to send, Shift+Enter newline
 * - Loading indicator while waiting for agent response
 * - Empty state with suggested questions
 * - Keyboard shortcut: Ctrl+. / Cmd+.
 */
export function AgentSidebar() {
  const { t } = useLocale();
  const { isAuthenticated, user } = useAuth();
  const {
    isOpen,
    messages,
    isLoading,
    sendMessage,
    startNewChat,
    close,
  } = useAgent();

  const [input, setInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ── Auto-scroll to bottom ─────────────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // ── Focus input on open ────────────────────────────────────────

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300); // wait for transition
    }
  }, [isOpen]);

  // ── Send handler ──────────────────────────────────────────────

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    sendMessage(trimmed);
    setInput("");
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-grow textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  // ── Suggested questions ────────────────────────────────────────

  const suggestions = [
    { key: "agent.suggestions.progress", text: "How am I progressing?" },
    { key: "agent.suggestions.next", text: "What should I learn next?" },
    { key: "agent.suggestions.world", text: "Show my world status" },
  ];

  // ── Don't render when not authenticated ────────────────────────

  if (!isAuthenticated) return null;

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-screen w-full flex-col border-l-2 border-double border-[oklch(0.7_0.12_85_/_0.55)] bg-gradient-to-b from-[oklch(0.995_0.003_95)] to-[oklch(0.98_0.003_95)] dark:from-[oklch(0.24_0.008_85)] dark:to-[oklch(0.2_0.006_85)] shadow-2xl transition-all duration-300 ease-in-out ${
          isExpanded ? "max-w-[50vw]" : "max-w-[380px]"
        } ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="complementary"
        aria-label={t("agent.title")}
      >
        {/* ── Header ────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-border/80 px-4 py-3 bg-secondary/10">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="absolute inset-[-4px] rounded-full border border-[#C4A77D]/30 animate-ping pointer-events-none" />
              <div className="relative w-7 h-7 rounded-full overflow-hidden border-2 border-[#C4A77D]/60">
                <img
                  src="/agent-mentor.apng"
                  alt="AI Mentor"
                  width={28}
                  height={28}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div>
              <h2 className="text-sm font-bold font-civ-serif text-[oklch(0.3_0.02_80)] dark:text-[oklch(0.85_0.04_80)] flex items-center gap-1">
                <span>🔮</span>
                {t("agent.title")}
              </h2>
              <p className="text-[10px] text-muted-foreground italic leading-tight">
                {t("agent.subtitle")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={startNewChat}
              className="rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground border border-transparent hover:border-border"
              title={t("agent.newChat")}
              aria-label={t("agent.newChat")}
            >
              📜
            </button>
            <button
              onClick={() => setIsExpanded((prev) => !prev)}
              className="rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground border border-transparent hover:border-border"
              title={isExpanded ? t("agent.collapse") : t("agent.expand")}
              aria-label={isExpanded ? t("agent.collapse") : t("agent.expand")}
            >
              {isExpanded ? "🧭" : "🗺️"}
            </button>
            <button
              onClick={close}
              className="rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground border border-transparent hover:border-border"
              title={t("agent.toggleClose")}
              aria-label={t("agent.toggleClose")}
            >
              🚪
            </button>
          </div>
        </div>

        {/* ── Messages Container ────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 py-4 relative">
          {/* Subtly animated background compass rose watermark */}
          <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04] pointer-events-none select-none flex items-center justify-center overflow-hidden">
            <svg className="w-80 h-80 animate-rhumb-spin" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.5">
              <circle cx="50" cy="50" r="45" />
              <circle cx="50" cy="50" r="40" strokeDasharray="2 2" />
              <path d="M50 5 L50 95 M5 50 L95 50 M18.2 18.2 L81.8 81.8 M18.2 81.8 L81.8 18.2" />
            </svg>
          </div>

          {messages.length === 0 && !isLoading ? (
            /* Empty state / Quest board */
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center z-10 relative">
              <div className="relative">
                <div className="absolute inset-[-6px] rounded-full border-2 border-[#C4A77D]/25 animate-pulse" />
                <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-[#C4A77D]/60">
                  <img
                    src="/agent-mentor.apng"
                    alt="AI Mentor"
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold font-civ-serif text-[oklch(0.3_0.02_80)] dark:text-[oklch(0.85_0.04_80)]">
                  {t("agent.greeting", { name: "there" })}
                </p>
                <p className="text-xs text-muted-foreground italic max-w-[240px]">
                  {t("agent.empty")}
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full max-w-[280px]">
                {suggestions.map((s, idx) => {
                  const emojis = ["📊", "🗺️", "🌍"];
                  return (
                    <button
                      key={s.key}
                      onClick={() => sendMessage(s.text)}
                      disabled={isLoading}
                      className="rounded-lg border border-[oklch(0.8_0.05_85)] bg-gradient-to-br from-[oklch(0.995_0.003_95)] to-[oklch(0.985_0.003_95)] dark:from-[oklch(0.24_0.008_85)] dark:to-[oklch(0.22_0.008_85)] dark:border-[oklch(0.3_0.02_80)] px-4 py-2.5 text-left text-xs font-bold font-civ-serif text-muted-foreground hover:text-foreground hover:border-[#C4A77D] hover:shadow-sm transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
                    >
                      <span className="text-sm">{emojis[idx] || "📜"}</span>
                      <span className="flex-1">
                        {(() => {
                          const tr = t(s.key);
                          return tr !== s.key ? tr : s.text;
                        })()}
                      </span>
                      <span className="text-[10px] opacity-45">→</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Message list */
            <div className="flex flex-col gap-4 z-10 relative">
              {messages.map((msg) => (
                <AgentMessageBubble
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  timestamp={msg.timestamp}
                  cards={msg.cards}
                  isStreaming={msg.isStreaming}
                  userAvatarUrl={user?.avatar_url}
                />
              ))}
              {/* Only show generic loading when no streaming message is active */}
              {isLoading && !messages.some((m) => m.isStreaming) && (
                <AgentMessageBubble
                  role="agent"
                  content=""
                  isLoading
                  userAvatarUrl={user?.avatar_url}
                />
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ── Input ─────────────────────────────────────────── */}
        <div className="border-t border-border/80 p-3 bg-secondary/5">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={t("agent.placeholder")}
              rows={1}
              disabled={isLoading}
              className="flex-1 resize-none rounded-lg border border-[oklch(0.8_0.05_85)] dark:border-[oklch(0.3_0.02_80)] bg-background/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[#C4A77D]/35 focus:border-[#C4A77D] transition-all disabled:opacity-50"
              style={{ maxHeight: "120px" }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 rounded-lg bg-[#C4A77D] p-2.5 text-white transition-all hover:bg-[#A38A5E] disabled:opacity-40 shadow-sm border border-[#A38A5E]/20"
              aria-label={t("agent.send")}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.125A59.769 59.769 0 0121.485 12 59.768 59.768 0 013.27 20.875L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground text-center">
            <kbd className="rounded border border-border px-1 py-0.5 font-mono text-[9px]">Ctrl</kbd>+
            <kbd className="rounded border border-border px-1 py-0.5 font-mono text-[9px] mr-1">.</kbd>
            {t("agent.toggleOpen")}
          </p>
        </div>
      </aside>
    </>
  );
}
