"use client";

import Link from "next/link";
import { useLocale } from "@/hooks/useLocale";
import { StarRating, difficultyToLevel } from "./StarRating";
import { QuestStatusBadge } from "./QuestStatusBadge";
import type { QuestListItem, UserQuest } from "@/types/quest";

/** Flexible quest type — accepts nullable skill_name and optional description */
type HallCardQuest = Omit<QuestListItem, "skill_name"> & {
  skill_name?: string | null;
  description?: string | null;
  description_en?: string | null;
};

interface QuestHallCardProps {
  quest: HallCardQuest;
  userQuest?: UserQuest;
  /** Civilization type for theming */
  civType?: string;
  className?: string;
}

/** Quest type — SVG geometric icon (replaces emoji) */
function QuestTypeIcon({ type, className = "" }: { type: string; className?: string }) {
  const icons: Record<string, JSX.Element> = {
    KNOWLEDGE: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path d="M3 5 L 10 3 L 17 5 L 17 15 L 10 17 L 3 15 Z" opacity="0.5" />
        <path d="M10 3 L 10 17" />
        <path d="M5 7 L 8 6.5 M 5 10 L 8 9.5 M 12 6.5 L 15 7 M 12 9.5 L 15 10" strokeWidth="0.8" opacity="0.6" />
      </svg>
    ),
    APPLICATION: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path d="M5 3 L 15 3 L 15 17 L 5 17 Z" />
        <path d="M7 7 L 13 7 M 7 10 L 13 10 M 7 13 L 11 13" strokeWidth="1" />
        <circle cx="14" cy="14" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
    PROJECT: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path d="M3 16 L 7 8 L 11 12 L 17 4" />
        <circle cx="7" cy="8" r="1.5" />
        <circle cx="11" cy="12" r="1.5" />
        <circle cx="17" cy="4" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
    MASTERY: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path d="M10 2 L 12 7 L 17 7 L 13 10 L 15 15 L 10 12 L 5 15 L 7 10 L 3 7 L 8 7 Z" />
      </svg>
    ),
  };
  return icons[type] || icons.APPLICATION;
}

/** Status-aware left border color */
function statusBorder(status?: string): string {
  if (!status) return "border-l-[#C4A77D]";
  switch (status) {
    case "PASSED": return "border-l-success";
    case "FAILED": return "border-l-destructive";
    case "ACCEPTED":
    case "IN_PROGRESS": return "border-l-primary";
    case "SUBMITTED":
    case "ASSESSING": return "border-l-warning";
    default: return "border-l-[#C4A77D]";
  }
}

/**
 * Redesigned quest card for the RPG Quest Hall.
 *
 * Features:
 * - Background story (narrative description)
 * - Quest type geometric SVG icon
 * - Civilization impact preview
 * - Building/title reward display
 * - Hover float animation
 * - Difficulty stars
 * - Status badge
 *
 * Design: Parchment quest board card with ornamental accents.
 * No emoji — all visuals are SVG-based.
 */
export function QuestHallCard({ quest, userQuest, civType, className = "" }: QuestHallCardProps) {
  const { locale } = useLocale();

  const displayTitle = locale === "en" && quest.title_en ? quest.title_en : quest.title;
  const displayDesc = locale === "en" && quest.description_en ? quest.description_en : quest.description;
  const level = difficultyToLevel(quest.difficulty);
  const borderClass = statusBorder(userQuest?.status);

  const building = quest.associated_building || (quest.building_context ? {
    name: quest.building_context.building_name,
    name_en: quest.building_context.building_name_en,
    icon: quest.building_context.building_icon,
    current_level: quest.building_context.current_level,
  } : null);
  const buildingName = locale === "en" && building?.name_en ? building.name_en : building?.name;

  const hasRewards = quest.reward_preview && (
    quest.reward_preview.knowledge > 0 ||
    quest.reward_preview.reasoning > 0 ||
    quest.reward_preview.application > 0 ||
    quest.reward_preview.creation > 0
  );

  const civContribution = quest.reward_preview?.civilization_contribution || 0;
  const buildingExp = quest.reward_preview?.building_exp || 0;
  const isCompleted = userQuest?.status === "PASSED";

  return (
    <Link
      href={`/quests/${quest.id}`}
      className={`group block rounded-xl border border-border bg-card p-4 border-l-[3px] ${borderClass} quest-card-hover parchment-texture relative ${isCompleted ? "ring-1 ring-success/20" : ""} ${className}`}
      style={{
        ["--civ-glow" as string]: civType ? `var(--civ-${civType}-glow, oklch(0.6 0.1 80 / 0.15))` : undefined,
      }}
    >
      {/* ── Top Row: Quest Type + Difficulty + Status ──────── */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          {/* Quest type geometric icon */}
          <div className="w-5 h-5 text-[#8B7355] opacity-70">
            <QuestTypeIcon type={quest.quest_type} className="w-full h-full" />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            {quest.quest_type}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {userQuest && <QuestStatusBadge status={userQuest.status} size="sm" />}
          <StarRating level={level} />
        </div>
      </div>

      {/* ── Quest Title ────────────────────────────────────── */}
      <h4 className="font-bold text-sm leading-snug line-clamp-2 mb-2 group-hover:text-primary transition-colors">
        {displayTitle}
      </h4>

      {/* ── Background Story (truncated) ──────────────────── */}
      {displayDesc && (
        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 mb-3 italic">
          {displayDesc}
        </p>
      )}

      {/* ── Reward Dimensions (compact, no emoji) ────────── */}
      {hasRewards && quest.reward_preview && (
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          {([
            ["knowledge", "K"],
            ["reasoning", "R"],
            ["application", "A"],
            ["creation", "C"],
          ] as const).map(([key, label]) => {
            const val = quest.reward_preview![key];
            if (!val) return null;
            return (
              <span
                key={key}
                className="inline-flex items-center gap-0.5 rounded-md bg-[#C4A77D]/8 border border-[#C4A77D]/15 px-1.5 py-0.5 text-[10px] font-medium text-[#8B7355] tabular-nums"
                title={key}
              >
                <span className="font-mono opacity-60">{label}</span>
                <span>+{val}</span>
              </span>
            );
          })}
        </div>
      )}

      {/* ── Footer: Impact + Building Reward ──────────────── */}
      <div className="flex items-center justify-between pt-2 border-t border-border/40 gap-2">
        {/* Civilization impact */}
        {civContribution > 0 && (
          <div className="flex items-center gap-1.5 min-w-0">
            {/* Impact icon — geometric SVG */}
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="oklch(0.65 0.12 75)" strokeWidth="1.5">
              <circle cx="10" cy="10" r="8" strokeWidth="0.5" opacity="0.4" strokeDasharray="2 2" />
              <path d="M10 4 L 12 8 L 16 8 L 13 11 L 14 15 L 10 13 L 6 15 L 7 11 L 4 8 L 8 8 Z" strokeWidth="0.8" />
            </svg>
            <span className="text-[10px] text-[#8B7355] font-medium tabular-nums">
              +{civContribution}
            </span>
            <span className="text-[10px] text-muted-foreground truncate">
              {locale === "zh" ? "文明影响" : "Impact"}
            </span>
          </div>
        )}

        {/* Building reward */}
        {buildingName && (
          <div className="flex items-center gap-1.5 min-w-0">
            {/* Building icon — geometric SVG (replaces emoji) */}
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="oklch(0.55 0.08 150)" strokeWidth="1.5">
              <path d="M4 16 L 4 8 L 10 4 L 16 8 L 16 16 Z" />
              <path d="M8 16 L 8 11 L 12 11 L 12 16" strokeWidth="1" />
              <line x1="4" y1="16" x2="16" y2="16" strokeWidth="1.5" />
            </svg>
            <span className="text-[10px] text-[#6B7D63] font-medium truncate max-w-[6rem]">
              {buildingName}
            </span>
            {building?.current_level && building.current_level > 0 && (
              <span className="text-[9px] text-[#6B7D63]/70 tabular-nums">
                Lv.{building.current_level}
              </span>
            )}
          </div>
        )}

        {/* Building EXP */}
        {buildingExp > 0 && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="text-[10px] text-muted-foreground">
              {locale === "zh" ? "经验" : "EXP"}
            </span>
            <span className="text-[10px] font-bold text-[#6B7D63] tabular-nums">
              +{buildingExp}
            </span>
          </div>
        )}
      </div>

      {/* ── Completion Celebration Overlay ────────────────── */}
      {isCompleted && (
        <div className="absolute top-2 right-2 pointer-events-none">
          <svg
            width="20" height="20" viewBox="0 0 20 20"
            fill="none" stroke="oklch(0.55 0.12 145)" strokeWidth="1.5"
            className="animate-glow-pulse"
          >
            <path d="M10 2 L 12 7 L 17 7 L 13 10 L 15 15 L 10 12 L 5 15 L 7 10 L 3 7 L 8 7 Z"
              fill="oklch(0.55 0.12 145 / 0.15)" />
          </svg>
        </div>
      )}
    </Link>
  );
}
