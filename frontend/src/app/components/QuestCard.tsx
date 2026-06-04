"use client";

import Link from "next/link";
import type { QuestListItem } from "@/types/quest";
import { DIFFICULTY_LABELS, QUEST_TYPE_LABELS } from "@/types/quest";
import { useLocale } from "@/hooks/useLocale";

interface QuestCardProps {
  quest: QuestListItem;
}

const difficultyColors: Record<string, string> = {
  LEVEL_1: "bg-success/10 text-success",
  LEVEL_2: "bg-primary/10 text-primary",
  LEVEL_3: "bg-warning/10 text-warning",
  LEVEL_4: "bg-destructive/10 text-destructive",
};

/**
 * Compact quest card for list display.
 */
export function QuestCard({ quest }: QuestCardProps) {
  const { t } = useLocale();
  const diffColor = difficultyColors[quest.difficulty] || "bg-secondary text-muted-foreground";

  return (
    <Link
      href={`/quests/${quest.id}`}
      className="block rounded-xl border border-border bg-background p-4 transition-all hover:shadow-md hover:border-primary/30"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-semibold text-sm leading-snug line-clamp-2">{quest.title}</h4>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${diffColor}`}>
          {t(`quests.difficulty.${quest.difficulty}`) || DIFFICULTY_LABELS[quest.difficulty] || quest.difficulty}
        </span>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{t(`quests.type.${quest.quest_type}`) || QUEST_TYPE_LABELS[quest.quest_type] || quest.quest_type}</span>
        <span>·</span>
        <span className="truncate">{quest.skill_name}</span>
        <span>·</span>
        <span className="truncate">{quest.expected_deliverable}</span>
      </div>
    </Link>
  );
}
