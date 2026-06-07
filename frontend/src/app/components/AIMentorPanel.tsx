"use client";

import Link from "next/link";
import { useLocale } from "@/hooks/useLocale";
import type { MentorSuggestion } from "@/types/learningPath";

interface AIMentorPanelProps {
  suggestion: MentorSuggestion | null;
  isLoading: boolean;
  pathId?: string;
}

/**
 * AI Mentor side panel — shows personalized growth suggestions,
 * recommended quests, estimated growth projections, and quick actions.
 * Design: Strategy game advisor panel (Civilization 6 advisor style).
 */
export function AIMentorPanel({ suggestion, isLoading, pathId }: AIMentorPanelProps) {
  const { locale } = useLocale();

  // ── Loading Skeleton ──────────────────────────────────────
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-card">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-muted skeleton-shimmer" />
          <div className="h-4 w-24 rounded-md bg-muted skeleton-shimmer" />
        </div>
        <div className="h-3 w-full rounded-md bg-muted skeleton-shimmer" />
        <div className="h-3 w-3/4 rounded-md bg-muted skeleton-shimmer" />
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-14 rounded-lg bg-muted skeleton-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  // ── Empty State ───────────────────────────────────────────
  if (!suggestion) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🧙</span>
          <h3 className="text-sm font-semibold">
            {locale === "zh" ? "AI 导师" : "AI Mentor"}
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">
          {locale === "zh"
            ? "选择一个学习路径后，AI导师将为你提供个性化建议。"
            : "Select a learning path and the AI mentor will provide personalized guidance."}
        </p>
      </div>
    );
  }

  // ── Action Type Icons ─────────────────────────────────────
  const actionIcons: Record<string, string> = {
    continue: "▶️",
    plan: "📋",
    chat: "💬",
  };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#8B9D83]/10 to-[#C4A77D]/10 px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🧙</span>
          <div>
            <h3 className="text-sm font-semibold">
              {locale === "zh" ? "AI 导师" : "AI Mentor"}
            </h3>
            <p className="text-[10px] text-muted-foreground">
              {locale === "zh" ? "奥德赛" : "Odyssey"}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Current suggestion */}
        <div className="rounded-xl bg-[#8B9D83]/5 border border-[#8B9D83]/10 p-3">
          <p className="text-xs text-muted-foreground mb-1">
            {locale === "zh" ? "💡 当前建议" : "💡 Current Suggestion"}
          </p>
          <p className="text-sm leading-relaxed">{suggestion.current_suggestion}</p>
        </div>

        {/* Estimated growth */}
        {suggestion.estimated_growth && (
          <div className="rounded-xl bg-[#C4A77D]/5 border border-[#C4A77D]/10 p-3">
            <p className="text-xs text-muted-foreground mb-2">
              {locale === "zh" ? "📈 预计成长" : "📈 Estimated Growth"}
            </p>
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {suggestion.estimated_growth.building_icon || "🏛️"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {suggestion.estimated_growth.building_name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    Lv.{suggestion.estimated_growth.current_level}
                  </span>
                  <svg
                    className="w-3 h-3 text-[#8B9D83]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                  <span className="text-xs font-semibold text-[#8B9D83]">
                    Lv.{suggestion.estimated_growth.projected_level}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recommended quests */}
        {suggestion.recommended_quests && suggestion.recommended_quests.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">
              {locale === "zh" ? "🎯 推荐任务" : "🎯 Recommended Quests"}
            </p>
            <div className="space-y-2">
              {suggestion.recommended_quests.slice(0, 3).map((q) => (
                <Link
                  key={q.quest_id}
                  href={`/quests/${q.quest_id}`}
                  className="flex items-center gap-2 rounded-lg border border-border bg-secondary/30 px-3 py-2.5 transition-all hover:border-[#8B9D83]/30 hover:bg-[#8B9D83]/5 group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate group-hover:text-foreground transition-colors">
                      {q.title}
                    </p>
                    {q.skill_name && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {q.skill_name} · {q.difficulty}
                      </p>
                    )}
                  </div>
                  <svg
                    className="w-3 h-3 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Quick actions */}
        {suggestion.actions && suggestion.actions.length > 0 && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">
              {locale === "zh" ? "⚡ 快捷操作" : "⚡ Quick Actions"}
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestion.actions.map((action, idx) => (
                <Link
                  key={idx}
                  href={action.url}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-[#8B9D83]/30 hover:bg-[#8B9D83]/5 transition-all"
                >
                  <span>{actionIcons[action.type] || "→"}</span>
                  <span>{action.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
