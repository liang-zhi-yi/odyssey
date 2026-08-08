"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAgent } from "@/hooks/useAgent";
import { useLocale } from "@/hooks/useLocale";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import { AgentMessageBubble } from "./AgentMessage";
import { QuestScrollIcon, type ScrollIconName } from "./QuestScrollIcon";

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
 * - Conversation navigation rail: vertical circles on the left edge,
 *   hover to enlarge + show the user's question, click to jump.
 * - Caching: reopens to the last conversation (handled in useAgent).
 */
export function AgentSidebar() {
  const { t, locale } = useLocale();
  const { isAuthenticated, user } = useAuth();
  const pathname = usePathname();
  const {
    isOpen,
    messages,
    isLoading,
    sendMessage,
    startNewChat,
    close,
    conversations,
    activeConversationId,
    loadConversation,
    refreshConversations,
    deleteConversation,
    clearAllConversations,
  } = useAgent();

  const [input, setInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<
    null | { type: "single"; id: string; title?: string } | { type: "all" }
  >(null);
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

  // ── Refresh conversation list when panel opens ────────────────

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      refreshConversations();
    }
  }, [isOpen, isAuthenticated, refreshConversations]);

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

  // ── Hide on intro-video page (full-screen cinematic) ──────────
  if (pathname === "/intro-video") return null;

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
        className={`fixed right-0 top-0 z-50 flex h-screen w-full border-l-2 border-double border-[oklch(0.7_0.12_85_/_0.55)] bg-gradient-to-b from-[oklch(0.995_0.003_95)] to-[oklch(0.98_0.003_95)] dark:from-[oklch(0.24_0.008_85)] dark:to-[oklch(0.2_0.006_85)] shadow-2xl transition-all duration-300 ease-in-out ${
          isExpanded
            ? "md:w-[50vw] md:max-w-[50vw]"
            : "md:w-[380px] md:max-w-[380px]"
        } ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="complementary"
        aria-label={t("agent.title")}
      >
        {/* ── Conversation Navigation Rail ────────────────────── */}
        <div className="flex-shrink-0 w-7 border-r border-border/40 flex flex-col items-center py-3 gap-2.5 overflow-y-auto bg-secondary/5 scrollbar-hide">
          {/* Divider */}
          {conversations.length > 0 && (
            <div className="w-3 h-px bg-border/40 flex-shrink-0" />
          )}

          {/* Conversation circles with delete on hover */}
          {conversations.map((conv) => {
            const isActive = conv.id === activeConversationId;
            return (
              <div
                key={conv.id}
                className="group relative flex items-center justify-center w-6 h-6 flex-shrink-0"
              >
                <button
                  onClick={() => loadConversation(conv.id)}
                  aria-label={conv.title || t("agent.newChat")}
                  className="flex items-center justify-center w-full h-full"
                >
                  {/* Circle */}
                  <span
                    className={`block rounded-full transition-all duration-200 ${
                      isActive
                        ? "w-3 h-3 bg-[#C4A77D] shadow-sm ring-2 ring-[#C4A77D]/25"
                        : "w-2 h-2 border border-muted-foreground/40 bg-transparent group-hover:w-3 group-hover:h-3 group-hover:border-[#C4A77D] group-hover:bg-[#C4A77D]/20"
                    }`}
                  />
                </button>
                {/* Delete button — appears on hover (triggers confirmation) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete({ type: "single", id: conv.id, title: conv.title });
                  }}
                  className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-destructive/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:bg-destructive"
                  title={locale === "zh" ? "删除对话" : "Delete conversation"}
                  aria-label="delete"
                >
                  <span className="text-[8px] leading-none select-none">✕</span>
                </button>
                {/* Tooltip — appears to the LEFT on hover */}
                <span className="pointer-events-none absolute right-full mr-3 top-1/2 -translate-y-1/2 hidden group-hover:block z-50">
                  <span className="block max-w-[220px] rounded-lg border border-[#C4A77D]/40 bg-[oklch(0.99_0.003_95)] dark:bg-[oklch(0.22_0.008_85)] px-3 py-2 text-xs text-[oklch(0.3_0.02_80)] dark:text-[oklch(0.85_0.04_80)] shadow-lg whitespace-normal break-words text-left font-civ-serif">
                    {conv.title || t("agent.newChat")}
                  </span>
                  {/* Arrow pointing right */}
                  <span className="absolute left-full top-1/2 -translate-y-1/2 -ml-px border-4 border-transparent border-l-[#C4A77D]/40" />
                </span>
              </div>
            );
          })}

          {/* Clear all button — at the bottom */}
          {conversations.length > 1 && (
            <>
              <div className="flex-1 min-h-2" />
              <div className="w-3 h-px bg-border/40 flex-shrink-0" />
              <button
                onClick={() => setConfirmDelete({ type: "all" })}
                className="group relative flex items-center justify-center w-6 h-6 rounded-full hover:bg-destructive/10 transition-all duration-200 flex-shrink-0"
                title={locale === "zh" ? "清空所有对话" : "Clear all conversations"}
                aria-label={locale === "zh" ? "清空所有对话" : "Clear all"}
              >
                <span className="text-xs leading-none select-none opacity-60 group-hover:opacity-100">🗑</span>
              </button>
            </>
          )}
        </div>

        {/* ── Main Content Column ────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
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
                  <QuestScrollIcon name="sparkle" size={14} />
                  {t("agent.title")}
                </h2>
                <p className="text-[10px] text-muted-foreground italic leading-tight">
                  {t("agent.subtitle")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <button
                onClick={startNewChat}
                className="rounded-lg p-2 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground border border-transparent hover:border-border"
                title={t("agent.newChat")}
                aria-label={t("agent.newChat")}
              >
                <span className="text-sm leading-none select-none">📜</span>
              </button>
              <button
                onClick={() => setIsExpanded((prev) => !prev)}
                className="hidden md:flex rounded-lg p-2 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground border border-transparent hover:border-border"
                title={isExpanded ? t("agent.collapse") : t("agent.expand")}
                aria-label={isExpanded ? t("agent.collapse") : t("agent.expand")}
              >
                <span className="text-sm leading-none select-none">{isExpanded ? "⬅" : "↔"}</span>
              </button>
              <button
                onClick={close}
                className="rounded-lg p-2 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground border border-transparent hover:border-border"
                title={t("agent.toggleClose")}
                aria-label={t("agent.toggleClose")}
              >
                <span className="text-sm leading-none select-none">✖</span>
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
                    const iconNames: ScrollIconName[] = ["reasoning", "world-core", "civilization"];
                    return (
                      <button
                        key={s.key}
                        onClick={() => sendMessage(s.text)}
                        disabled={isLoading}
                        className="rounded-lg border border-[oklch(0.8_0.05_85)] bg-gradient-to-br from-[oklch(0.995_0.003_95)] to-[oklch(0.985_0.003_95)] dark:from-[oklch(0.24_0.008_85)] dark:to-[oklch(0.22_0.008_85)] dark:border-[oklch(0.3_0.02_80)] px-4 py-2.5 text-left text-xs font-bold font-civ-serif text-muted-foreground hover:text-foreground hover:border-[#C4A77D] hover:shadow-sm transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
                      >
                        <QuestScrollIcon name={iconNames[idx] || "scroll"} size={14} />
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
        </div>
      </aside>

      {/* ── Confirmation Dialog for Deletion ─────────────────── */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={() => setConfirmDelete(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-[320px] rounded-xl border-2 border-double border-[#C4A77D]/50 bg-gradient-to-b from-[oklch(0.995_0.003_95)] to-[oklch(0.98_0.005_92)] dark:from-[oklch(0.24_0.008_85)] dark:to-[oklch(0.2_0.006_85)] p-5 shadow-2xl"
          >
            {/* Decorative corner accents */}
            <span className="absolute top-1 left-1 w-3 h-3 border-t border-l border-[#C4A77D]/60" />
            <span className="absolute top-1 right-1 w-3 h-3 border-t border-r border-[#C4A77D]/60" />
            <span className="absolute bottom-1 left-1 w-3 h-3 border-b border-l border-[#C4A77D]/60" />
            <span className="absolute bottom-1 right-1 w-3 h-3 border-b border-r border-[#C4A77D]/60" />

            <div className="flex flex-col items-center text-center gap-3">
              {/* Warning emblem */}
              <div className="w-12 h-12 rounded-full border-2 border-destructive/40 bg-destructive/8 flex items-center justify-center">
                <span className="text-xl select-none">⚠</span>
              </div>

              <h3 className="text-base font-bold font-civ-serif text-[oklch(0.3_0.02_80)] dark:text-[oklch(0.85_0.04_80)]">
                {confirmDelete.type === "all"
                  ? locale === "zh" ? "清空所有对话？" : "Clear all conversations?"
                  : locale === "zh" ? "删除此对话？" : "Delete this conversation?"}
              </h3>

              <p className="text-xs text-muted-foreground italic leading-relaxed max-w-[260px]">
                {confirmDelete.type === "all"
                  ? locale === "zh"
                    ? "此操作将永久删除所有对话记录，无法恢复。"
                    : "This will permanently delete all conversations. This cannot be undone."
                  : locale === "zh"
                    ? confirmDelete.title
                      ? "即将删除「" + confirmDelete.title + "」，此操作无法恢复。"
                      : "此操作将永久删除该对话，无法恢复。"
                    : confirmDelete.title
                      ? '"' + confirmDelete.title + '" will be permanently deleted. This cannot be undone.'
                      : "This conversation will be permanently deleted. This cannot be undone."}
              </p>

              {/* Action buttons */}
              <div className="flex gap-2 w-full mt-1">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 rounded-lg border border-[oklch(0.8_0.05_85)] dark:border-[oklch(0.3_0.02_80)] bg-transparent px-3 py-2 text-xs font-bold font-civ-serif text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-all"
                >
                  {locale === "zh" ? "取消" : "Cancel"}
                </button>
                <button
                  onClick={() => {
                    if (confirmDelete.type === "all") {
                      clearAllConversations();
                    } else {
                      deleteConversation(confirmDelete.id);
                    }
                    setConfirmDelete(null);
                  }}
                  className="flex-1 rounded-lg bg-destructive/90 hover:bg-destructive px-3 py-2 text-xs font-bold font-civ-serif text-white transition-all shadow-sm"
                >
                  {locale === "zh" ? "确认删除" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
