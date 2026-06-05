"use client";

import Link from "next/link";
import type { QuestListItem } from "@/types/quest";
import { DIFFICULTY_LABELS, QUEST_TYPE_LABELS } from "@/types/quest";
import { useLocale } from "@/hooks/useLocale";
import { StarRating, difficultyToLevel } from "./StarRating";
import { BuildingBadge } from "./BuildingBadge";

interface QuestCardProps {
  quest: QuestListItem;
}

/** Left accent border color by quest type */
function questAccentColor(questType: string): string {
  switch (questType) {
    case "DAILY": return "border-l-accent";       // Gold for daily
    case "STORY": return "border-l-primary";       // Sage for story
    case "APPLICATION": return "border-l-success"; // Moss for skill
    default: return "border-l-border";
  }
}

/**
 * Quest card redesigned as a "challenge card" — left accent border,
 * star difficulty rating, and warm card styling.
 */
export function QuestCard({ quest }: QuestCardProps) {
  const { t, locale } = useLocale();

  const displayTitle =
    locale === "en" && quest.title_en ? quest.title_en : quest.title;

  const accentBorder = questAccentColor(quest.quest_type);
  const level = difficultyToLevel(quest.difficulty);

  return (
    <Link
      href={`/quests/${quest.id}`}
      className={`group block rounded-2xl border border-border bg-card p-5 shadow-card transition-all duration-300 hover:shadow-card-hover hover:border-primary/20 border-l-[3px] ${accentBorder}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {displayTitle}
        </h4>
        {/* Difficulty as stars */}
        <div className="shrink-0">
          <StarRating level={level} />
        </div>
      </div>

      {/* Description / flavor text */}
      {"description" in quest && (quest as any).description && (
        <p className="text-xs text-muted-foreground italic line-clamp-2 mb-2">
          {((quest as any).description as string).length > 80
            ? ((quest as any).description as string).slice(0, 80) + "..."
            : (quest as any).description}
        </p>
      )}

      {/* Meta row */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium">
          {t(`quests.type.${quest.quest_type}`) || QUEST_TYPE_LABELS[quest.quest_type] || quest.quest_type}
        </span>
        {quest.skill_name && (
          <>
            <span className="text-muted-foreground/40">·</span>
            <span className="truncate">{quest.skill_name}</span>
          </>
        )}
        {quest.skill_id && (
          <BuildingBadge skillId={quest.skill_id} />
        )}
        {quest.expected_deliverable && (
          <>
            <span className="text-muted-foreground/40">·</span>
            <span className="truncate rounded bg-secondary/50 px-1.5 py-0.5 text-[10px]">
              {quest.expected_deliverable}
            </span>
          </>
        )}
      </div>
    </Link>
  );
}
