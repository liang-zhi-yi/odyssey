"use client";

import { type ReactNode } from "react";
import { AgentAvatar } from "./AgentAvatar";
import type { AgentCard as AgentCardType } from "@/types/agent";
import { CARD_TYPE_LABELS } from "@/types/agent";

interface AgentMessageBubbleProps {
  role: "user" | "agent";
  content: string;
  timestamp?: string;
  cards?: AgentCardType[];
  isLoading?: boolean;
}

/** Simple markdown-like text renderer (bold, italic, code, links) */
function SimpleMarkdown({ text }: { text: string }) {
  // Split by newlines for paragraphs
  const paragraphs = text.split("\n");
  const elements: ReactNode[] = [];

  paragraphs.forEach((para, pi) => {
    if (!para.trim()) {
      elements.push(<br key={`br-${pi}`} />);
      return;
    }

    // Process inline formatting
    let processed: ReactNode = para;

    // Bold: **text**
    const boldRegex = /\*\*(.+?)\*\*/g;
    // Inline code: `text`
    const codeRegex = /`(.+?)`/g;
    // Link: [text](url)
    const linkRegex = /\[(.+?)\]\((.+?)\)/g;

    // Simple approach: replace patterns with spans
    const parts: ReactNode[] = [];
    let lastIdx = 0;
    const combinedRegex = /(\*\*(.+?)\*\*|`(.+?)`|\[(.+?)\]\((.+?)\))/g;
    let match: RegExpExecArray | null;

    while ((match = combinedRegex.exec(para)) !== null) {
      // Add text before match
      if (match.index > lastIdx) {
        parts.push(para.slice(lastIdx, match.index));
      }

      if (match[0].startsWith("**")) {
        parts.push(
          <strong key={`${pi}-${match.index}`} className="font-semibold">
            {match[2]}
          </strong>
        );
      } else if (match[0].startsWith("`")) {
        parts.push(
          <code
            key={`${pi}-${match.index}`}
            className="rounded bg-secondary px-1 py-0.5 font-mono text-xs"
          >
            {match[3]}
          </code>
        );
      } else if (match[0].startsWith("[")) {
        parts.push(
          <a
            key={`${pi}-${match.index}`}
            href={match[5]}
            className="text-primary underline hover:opacity-80"
            target="_blank"
            rel="noopener noreferrer"
          >
            {match[4]}
          </a>
        );
      }

      lastIdx = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIdx < para.length) {
      parts.push(para.slice(lastIdx));
    }

    elements.push(
      <p key={`p-${pi}`} className={parts.length === 0 ? "" : ""}>
        {parts.length > 0 ? parts : para}
      </p>
    );
  });

  return <>{elements}</>;
}

/** Mini card rendered inside agent messages */
function InlineCard({ card }: { card: AgentCardType }) {
  const label = CARD_TYPE_LABELS[card.card_type] || card.card_type;
  const data = card.data || {};

  return (
    <div className="mt-2 rounded-lg border border-border bg-background/50 p-3">
      <div className="mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </div>
      {card.card_type === "skill_summary" && (
        <div>
          <span className="font-medium">{String(data.skill_name || "Skill")}</span>
          <span className="ml-2 text-sm text-muted-foreground">
            Level {String(data.level || "?")} · {String(data.rank_label || "")}
          </span>
        </div>
      )}
      {card.card_type === "quest_recommendation" && (
        <div>
          <span className="font-medium">{String(data.quest_title || "Quest")}</span>
          {data.why != null && (
            <p className="mt-1 text-xs text-muted-foreground">{String(data.why)}</p>
          )}
        </div>
      )}
      {card.card_type === "world_update" && (
        <div>
          <span className="font-medium">{String(data.building_name || "Building")}</span>
          <span className="ml-2 text-sm text-muted-foreground">
            {String(data.description || "")}
          </span>
        </div>
      )}
      {card.card_type === "progress_insight" && (
        <div>
          <span className="font-medium">{String(data.title || "Insight")}</span>
          {data.summary != null && (
            <p className="mt-1 text-xs text-muted-foreground">{String(data.summary)}</p>
          )}
        </div>
      )}
      {card.card_type === "path_suggestion" && (
        <div>
          <span className="font-medium">{String(data.path_title || "Path")}</span>
          {data.match_reason != null && (
            <p className="mt-1 text-xs text-muted-foreground">{String(data.match_reason)}</p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * A single chat message bubble.
 *
 * User messages: right-aligned, primary bg.
 * Agent messages: left-aligned, with AgentAvatar, card bg.
 * Supports inline card rendering for structured data.
 */
export function AgentMessageBubble({
  role,
  content,
  timestamp,
  cards,
  isLoading,
}: AgentMessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} animate-fade-in-up`}
    >
      {/* Agent avatar (only for agent messages) */}
      {!isUser && (
        <div className="flex-shrink-0 mt-1">
          <AgentAvatar
            mood={isLoading ? "thinking" : "neutral"}
            size="sm"
          />
        </div>
      )}

      {/* Message bubble */}
      <div
        className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-card text-foreground border border-border"
        }`}
      >
        {isLoading ? (
          <div className="flex items-center gap-1 py-1">
            <span className="inline-block h-2 w-2 rounded-full bg-current opacity-60 animate-pulse" />
            <span className="inline-block h-2 w-2 rounded-full bg-current opacity-40 animate-pulse" style={{ animationDelay: "0.15s" }} />
            <span className="inline-block h-2 w-2 rounded-full bg-current opacity-20 animate-pulse" style={{ animationDelay: "0.3s" }} />
          </div>
        ) : (
          <>
            <SimpleMarkdown text={content} />
            {/* Inline cards */}
            {cards?.map((card, i) => (
              <InlineCard key={i} card={card} />
            ))}
            {/* Timestamp */}
            {timestamp && (
              <div
                className={`mt-1 text-xs ${
                  isUser ? "text-primary-foreground/60" : "text-muted-foreground"
                }`}
              >
                {timestamp}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
