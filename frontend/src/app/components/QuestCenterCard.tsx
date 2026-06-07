"use client";

import Link from "next/link";
import type { QuestListItem } from "@/types/quest";
import { QUEST_TYPE_LABELS } from "@/types/quest";
import { useLocale } from "@/hooks/useLocale";
import { StarRating, difficultyToLevel } from "./StarRating";
import { BuildingBadge } from "./BuildingBadge";
import { RewardBadge } from "./RewardBadge";
import { QuestStatusBadge } from "./QuestStatusBadge";
import type { UserQuest } from "@/types/quest";

interface QuestCenterCardProps {
  quest: QuestListItem;
  /** Optional: user quest status for showing status badge */
  userQuest?: UserQuest;
  /** Optional: cached world buildings for BuildingBadge (avoids extra SWR fetch) */
  worldBuildings?: { template: { skill_id: string; name: string; name_en: string | null; icon: string } | null; level: number }[];
  className?: string;
}

/** Left accent border color by quest type */
function questAccent(questType: string): string {
  switch (questType) {
    case "KNOWLEDGE": return "border-l-[#8B9D83]";
    case "APPLICATION": return "border-l-[#C4A77D]";
    case "PROJECT": return "border-l-[#D4A76A]";
    case "MASTERY": return "border-l-[#B8860B]";
    default: return "border-l-border";
  }
}

/**
 * Enhanced quest card — "Quest Center" style with building association,
 * reward preview, difficulty stars, and status badge.
 *
 * Design: Civilization strategy game "mission card" with warm theme.
 */
export function QuestCenterCard({ quest, userQuest, worldBuildings, className = "" }: QuestCenterCardProps) {
  const { t, locale } = useLocale();

  const displayTitle =
    locale === "en" && quest.title_en ? quest.title_en : quest.title;
  const level = difficultyToLevel(quest.difficulty);
  const accentBorder = questAccent(quest.quest_type);

  // Associated building from enhanced API or building_context fallback
  const building = quest.associated_building || (quest.building_context ? {
    id: "",
    name: quest.building_context.building_name,
    name_en: quest.building_context.building_name_en,
    icon: quest.building_context.building_icon,
    current_level: quest.building_context.current_level,
  } : null);

  const buildingDisplayName =
    locale === "en" && building?.name_en ? building.name_en : building?.name;

  // Determine if there's a reward preview to show
  const hasRewards = quest.reward_preview && (
    quest.reward_preview.knowledge > 0 ||
    quest.reward_preview.reasoning > 0 ||
    quest.reward_preview.application > 0 ||
    quest.reward_preview.creation > 0 ||
    quest.reward_preview.building_exp > 0
  );

  return (
    <Link
      href={`/quests/${quest.id}`}
      className={`group block rounded-2xl border border-border bg-card p-5 shadow-card transition-all duration-300 hover:shadow-card-hover hover:border-primary/20 border-l-[3px] ${accentBorder} ${className}`}
    >
      {/* ── Header: Building association + Difficulty ───── */}
      <div className="flex items-start justify-between gap-2 mb-3">
        {/* Building pill */}
        {building && buildingDisplayName ? (
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-[#C4A77D]/8 border border-[#C4A77D]/12 px-2 py-1 max-w-[70%]">
            <span className="text-sm leading-none flex-shrink-0">
              {building.icon || "🏛️"}
            </span>
            <span className="text-[10px] font-medium text-[#8B7355] truncate">
              {buildingDisplayName}
            </span>
            {building.current_level > 0 && (
              <span className="text-[10px] tabular-nums text-[#8B7355]/60 flex-shrink-0">
                Lv.{building.current_level}
              </span>
            )}
          </div>
        ) : (
          <div /> /* empty spacer to keep difficulty right-aligned */
        )}
        {/* Difficulty stars */}
        <div className="flex-shrink-0">
          <StarRating level={level} />
        </div>
      </div>

      {/* ── Title ────────────────────────────────────────── */}
      <h4 className="font-semibold text-sm leading-snug line-clamp-2 mb-1.5 group-hover:text-primary transition-colors">
        {displayTitle}
      </h4>

      {/* ── Meta row: type + skill + deliverable ─────────── */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap mb-3">
        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium">
          {t(`quests.type.${quest.quest_type}` as any) || QUEST_TYPE_LABELS[quest.quest_type] || quest.quest_type}
        </span>
        {quest.skill_name && (
          <>
            <span className="text-muted-foreground/30">·</span>
            <span className="truncate max-w-[8rem]">{quest.skill_name}</span>
          </>
        )}
        {quest.expected_deliverable && (
          <>
            <span className="text-muted-foreground/30">·</span>
            <span className="truncate rounded bg-secondary/50 px-1.5 py-0.5 text-[10px]">
              {quest.expected_deliverable}
            </span>
          </>
        )}
        {/* Building badge (from world, not associated_building) */}
        {quest.skill_id && !building && (
          <BuildingBadge skillId={quest.skill_id} worldBuildings={worldBuildings} />
        )}
      </div>

      {/* ── Reward preview ───────────────────────────────── */}
      {hasRewards && quest.reward_preview && (
        <div className="mb-3 pt-2 border-t border-border/50">
          <RewardBadge reward={quest.reward_preview} variant="compact" />
        </div>
      )}

      {/* ── Footer: Civ contribution + Status ────────────── */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        {/* Civilization contribution */}
        {quest.reward_preview && quest.reward_preview.civilization_contribution > 0 ? (
          <span className="inline-flex items-center gap-1 text-[10px] text-[#8B7355]">
            <span>🌍</span>
            <span className="font-medium tabular-nums">
              +{quest.reward_preview.civilization_contribution}
            </span>
            <span className="text-muted-foreground">
              {locale === "zh" ? "文明贡献" : "Civ"}
            </span>
          </span>
        ) : (
          <span /> /* spacer */
        )}

        {/* Status badge for user quests */}
        {userQuest ? (
          <QuestStatusBadge status={userQuest.status} size="sm" />
        ) : (
          <span className="text-[10px] text-muted-foreground">
            {locale === "zh" ? "未开始" : "Not started"}
          </span>
        )}
      </div>
    </Link>
  );
}
