"use client";

import { useState, useRef, useEffect } from "react";
import { useAgent } from "@/hooks/useAgent";
import { useLocale } from "@/hooks/useLocale";
import { useAuth } from "@/hooks/useAuth";
import { AgentAvatar } from "./AgentAvatar";
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
  const { isAuthenticated } = useAuth();
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
          className="fixed inset-0 z-40 bg-black/20 md:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-screen w-full flex-col border-l border-border bg-background shadow-2xl transition-all duration-300 ease-in-out ${
          isExpanded ? "max-w-[50vw]" : "max-w-[380px]"
        } ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="complementary"
        aria-label={t("agent.title")}
      >
        {/* ── Header ────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2.5">
            <AgentAvatar mood="neutral" size="sm" />
            <div>
              <h2 className="text-sm font-semibold">{t("agent.title")}</h2>
              <p className="text-xs text-muted-foreground">
                {t("agent.subtitle")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={startNewChat}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              title={t("agent.newChat")}
              aria-label={t("agent.newChat")}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
            <button
              onClick={() => setIsExpanded((prev) => !prev)}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              title={isExpanded ? t("agent.collapse") : t("agent.expand")}
              aria-label={isExpanded ? t("agent.collapse") : t("agent.expand")}
            >
              {isExpanded ? (
                /* Collapse icon — shrink to right */
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5M15 15l5.25 5.25" />
                </svg>
              ) : (
                /* Expand icon — expand to half screen */
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9M20.25 20.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
              )}
            </button>
            <button
              onClick={close}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              title={t("agent.toggleClose")}
              aria-label={t("agent.toggleClose")}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Messages ──────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 && !isLoading ? (
            /* Empty state */
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <AgentAvatar mood="happy" size="lg" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {t("agent.greeting", { name: "there" })}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("agent.empty")}
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full max-w-[280px]">
                {suggestions.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => sendMessage(s.text)}
                    disabled={isLoading}
                    className="rounded-lg border border-border px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
                  >
                    {(() => {
                      const tr = t(s.key);
                      return tr !== s.key ? tr : s.text;
                    })()}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Message list */
            <div className="flex flex-col gap-3">
              {messages.map((msg) => (
                <AgentMessageBubble
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  timestamp={msg.timestamp}
                  cards={msg.cards}
                  isStreaming={msg.isStreaming}
                />
              ))}
              {/* Only show generic loading when no streaming message is active */}
              {isLoading && !messages.some((m) => m.isStreaming) && (
                <AgentMessageBubble
                  role="agent"
                  content=""
                  isLoading
                />
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ── Input ─────────────────────────────────────────── */}
        <div className="border-t border-border p-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={t("agent.placeholder")}
              rows={1}
              disabled={isLoading}
              className="flex-1 resize-none rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
              style={{ maxHeight: "120px" }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 rounded-lg bg-primary p-2 text-primary-foreground transition-all hover:opacity-90 disabled:opacity-40"
              aria-label={t("agent.send")}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.125A59.769 59.769 0 0121.485 12 59.768 59.768 0 013.27 20.875L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground text-center">
            <kbd className="rounded border border-border px-1 py-0.5 font-mono text-xs">Ctrl</kbd>+
            <kbd className="rounded border border-border px-1 py-0.5 font-mono text-xs">.</kbd>{" "}
            {t("agent.toggleOpen")}
          </p>
        </div>
      </aside>
    </>
  );
}
