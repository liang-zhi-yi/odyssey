"use client";

import { type ReactNode } from "react";
import Image from "next/image";
import type { AgentCard as AgentCardType } from "@/types/agent";
import { CARD_TYPE_LABELS } from "@/types/agent";

interface AgentMessageBubbleProps {
  role: "user" | "agent";
  content: string;
  timestamp?: string;
  cards?: AgentCardType[];
  isLoading?: boolean;
  isStreaming?: boolean;
  /** User's avatar URL — shown for user messages */
  userAvatarUrl?: string | null;
}

/** Renders markdown-like text: headers, bold, italic, code, links, lists, blockquotes, hr */
function SimpleMarkdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];

    // Empty line
    if (!raw.trim()) {
      elements.push(<div key={`br-${i}`} className="h-2" />);
      i++;
      continue;
    }

    // Horizontal rule
    if (/^(---|\*\*\*|___)\s*$/.test(raw.trim())) {
      elements.push(
        <hr key={`hr-${i}`} className="my-2 border-t border-border/50" />
      );
      i++;
      continue;
    }

    // Header: #, ##, ###, ####
    const headerMatch = raw.match(/^(#{1,4})\s+(.+)/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const content = headerMatch[2];
      const cls =
        level === 1
          ? "text-base font-bold font-civ-serif text-[#C4A77D] mb-1.5 mt-2"
          : level === 2
            ? "text-sm font-bold font-civ-serif text-[#C4A77D] mb-1 mt-1.5"
            : level === 3
              ? "text-[13px] font-bold text-foreground/90 mb-0.5 mt-1"
              : "text-xs font-semibold text-foreground/85 mb-0.5 mt-1";
      elements.push(
        <div key={`h-${i}`} className={cls}>
          {renderInline(content)}
        </div>
      );
      i++;
      continue;
    }

    // Blockquote: > text
    if (/^>\s?/.test(raw)) {
      const content = raw.replace(/^>\s?/, "");
      elements.push(
        <blockquote
          key={`bq-${i}`}
          className="border-l-3 border-[#C4A77D]/40 pl-3 py-0.5 my-1 text-xs text-foreground/80 italic bg-[#C4A77D]/5 rounded-r"
        >
          {content}
        </blockquote>
      );
      i++;
      continue;
    }

    // Unordered list: - item or * item
    const ulMatch = raw.match(/^[\-\*]\s+(.+)/);
    if (ulMatch) {
      elements.push(
        <div key={`ul-${i}`} className="flex items-start gap-1.5 mb-0.5 ml-1">
          <span className="text-[#C4A77D] mt-0.5 shrink-0 select-none">·</span>
          <span className="text-xs text-foreground/90">
            {renderInline(ulMatch[1])}
          </span>
        </div>
      );
      i++;
      continue;
    }

    // Ordered list: 1. item
    const olMatch = raw.match(/^(\d+)\.\s+(.+)/);
    if (olMatch) {
      elements.push(
        <div key={`ol-${i}`} className="flex items-start gap-1.5 mb-0.5 ml-1">
          <span className="text-[#C4A77D] mt-0.5 shrink-0 select-none text-xs font-mono">
            {olMatch[1]}.
          </span>
          <span className="text-xs text-foreground/90">
            {renderInline(olMatch[2])}
          </span>
        </div>
      );
      i++;
      continue;
    }

    // Markdown table: collect consecutive rows starting with |
    if (/^\|.+\|$/.test(raw.trim())) {
      const tableRows: string[][] = [];
      let j = i;
      while (j < lines.length && /^\|.+\|$/.test(lines[j].trim())) {
        const cells = lines[j]
          .split("|")
          .map((c) => c.trim())
          .filter((c) => c.length > 0);
        // Skip separator rows like |---|---|
        if (!cells.every((c) => /^[-:]+$/.test(c))) {
          tableRows.push(cells);
        }
        j++;
      }

      if (tableRows.length > 0) {
        const headerRow = tableRows[0];
        const dataRows = tableRows.slice(1);

        elements.push(
          <div key={`table-${i}`} className="my-2 overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-[#C4A77D]/30">
                  {headerRow.map((cell, ci) => (
                    <th
                      key={ci}
                      className="px-2 py-1 text-left font-bold font-civ-serif text-[#C4A77D] dark:text-[#E6C594]"
                    >
                      {renderInline(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataRows.map((row, ri) => (
                  <tr
                    key={ri}
                    className="border-b border-border/30 hover:bg-[#C4A77D]/5 transition-colors"
                  >
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        className="px-2 py-1 text-foreground/85"
                      >
                        {renderInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        i = j;
        continue;
      }
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${i}`} className="mb-1 last:mb-0 text-xs leading-relaxed">
        {renderInline(raw)}
      </p>
    );
    i++;
  }

  return <>{elements}</>;
}

/** Render inline markdown: bold, italic, code, links. Returns array of ReactNode. */
function renderInline(text: string): ReactNode {
  const parts: ReactNode[] = [];
  let lastIdx = 0;
  // Match: **bold**, *italic*, `code`, [text](url)
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\[(.+?)\]\((.+?)\))/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.slice(lastIdx, match.index));
    }

    if (match[0].startsWith("**")) {
      parts.push(
        <strong key={`${match.index}`} className="font-bold text-[#C4A77D] dark:text-[#E6C594]">
          {match[2]}
        </strong>
      );
    } else if (match[0].startsWith("*")) {
      parts.push(
        <em key={`${match.index}`} className="italic text-foreground/85">
          {match[3]}
        </em>
      );
    } else if (match[0].startsWith("`")) {
      parts.push(
        <code
          key={`${match.index}`}
          className="rounded bg-secondary/80 border border-border/40 px-1 py-0.5 font-mono text-[11px] text-foreground/90"
        >
          {match[4]}
        </code>
      );
    } else if (match[0].startsWith("[")) {
      parts.push(
        <a
          key={`${match.index}`}
          href={match[6]}
          className="text-primary font-bold font-civ-serif underline hover:opacity-85"
          target="_blank"
          rel="noopener noreferrer"
        >
          {match[5]}
        </a>
      );
    }

    lastIdx = match.index + match[0].length;
  }

  if (lastIdx < text.length) {
    parts.push(text.slice(lastIdx));
  }

  return parts.length > 0 ? parts : text;
}

/** Mini card rendered inside agent messages */
function InlineCard({ card }: { card: AgentCardType }) {
  const label = CARD_TYPE_LABELS[card.card_type] || card.card_type;
  const data = card.data || {};

  return (
    <div className="mt-2.5 rounded-lg border border-[oklch(0.88_0.02_90)] bg-background/55 p-3 shadow-inner relative overflow-hidden border-l-4 border-l-[#C4A77D]">
      <div className="absolute -bottom-1 -right-1 text-[7px] font-mono opacity-[0.05] pointer-events-none select-none text-[oklch(0.3_0.02_80)]">
        [ORACLE_{label.slice(0, 4).toUpperCase()}]
      </div>
      <div className="mb-1 text-[9px] font-bold font-civ-serif text-[#C4A77D] uppercase tracking-wider">
        {label}
      </div>
      {card.card_type === "skill_summary" && (
        <div className="text-xs">
          <span className="font-bold text-foreground">{String(data.skill_name || "Skill")}</span>
          <span className="ml-2 text-[10px] text-muted-foreground font-mono">
            Level {String(data.level || "?")} · {String(data.rank_label || "")}
          </span>
        </div>
      )}
      {card.card_type === "quest_recommendation" && (
        <div className="text-xs">
          <span className="font-bold text-foreground">📍 {String(data.quest_title || "Quest")}</span>
          {data.why != null && (
            <p className="mt-1 text-[11px] text-muted-foreground italic leading-relaxed">"{String(data.why)}"</p>
          )}
        </div>
      )}
      {card.card_type === "world_update" && (
        <div className="text-xs">
          <span className="font-bold text-foreground">🏗️ {String(data.building_name || "Building")}</span>
          <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">
            {String(data.description || "")}
          </p>
        </div>
      )}
      {card.card_type === "progress_insight" && (
        <div className="text-xs">
          <span className="font-bold text-foreground">💡 {String(data.title || "Insight")}</span>
          {data.summary != null && (
            <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">{String(data.summary)}</p>
          )}
        </div>
      )}
      {card.card_type === "path_suggestion" && (
        <div className="text-xs">
          <span className="font-bold text-foreground">🧭 {String(data.path_title || "Path")}</span>
          {data.match_reason != null && (
            <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">{String(data.match_reason)}</p>
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
  isStreaming,
  userAvatarUrl,
}: AgentMessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div
      className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"} animate-fade-in-up`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mt-1">
        {isUser ? (
          /* User avatar */
          <div className="relative w-7 h-7 rounded-full overflow-hidden border border-border bg-muted">
            {userAvatarUrl ? (
              <Image
                src={userAvatarUrl}
                alt="User avatar"
                width={28}
                height={28}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-xs font-bold">
                👤
              </div>
            )}
          </div>
        ) : (
          /* Agent avatar — uses agent-mentor.apng */
          <div className={`relative w-7 h-7 rounded-full overflow-hidden border-2 ${isLoading || isStreaming ? "border-warning/60 animate-pulse" : "border-[#C4A77D]/60"}`}>
            <img
              src="/agent-mentor.apng"
              alt="AI Mentor"
              width={28}
              height={28}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Message bubble */}
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
          isUser
            ? "bg-gradient-to-br from-[#8B9D83]/20 to-[#8B9D83]/10 border border-[#8B9D83]/45 text-foreground rounded-tr-none"
            : "bg-gradient-to-br from-[oklch(0.995_0.003_95)] to-[oklch(0.985_0.003_95)] dark:from-[oklch(0.24_0.008_85)] dark:to-[oklch(0.22_0.008_85)] border border-[oklch(0.7_0.12_85_/_0.55)] rounded-tl-none text-foreground"
        }`}
      >
        {isLoading ? (
          <div className="flex items-center gap-1.5 py-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#C4A77D] animate-pulse" />
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#C4A77D] animate-pulse" style={{ animationDelay: "0.15s" }} />
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#C4A77D] animate-pulse" style={{ animationDelay: "0.3s" }} />
          </div>
        ) : (
          <>
            <SimpleMarkdown text={content} />
            {/* Blinking cursor while streaming */}
            {isStreaming && (
              <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-primary animate-pulse align-middle" />
            )}
            {/* Inline cards */}
            {cards?.map((card, i) => (
              <InlineCard key={i} card={card} />
            ))}
            {/* Timestamp */}
            {timestamp && (
              <div
                className={`mt-1.5 text-[9px] font-mono opacity-50 ${
                  isUser ? "text-right" : "text-left"
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
