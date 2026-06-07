"use client";

import { useLocale } from "@/hooks/useLocale";
import type { QuestRewardPreview } from "@/types/quest";

interface RewardBadgeProps {
  reward: QuestRewardPreview;
  /** Compact: single-row of dimension pills. Expanded: all details with labels. */
  variant?: "compact" | "expanded";
  className?: string;
}

/** Dimension display: key → { icon, label key } */
const DIMENSIONS = [
  { key: "knowledge" as const, icon: "📚", labelKey: "skills.dimensions.knowledge" },
  { key: "reasoning" as const, icon: "🧠", labelKey: "skills.dimensions.reasoning" },
  { key: "application" as const, icon: "🔧", labelKey: "skills.dimensions.application" },
  { key: "creation" as const, icon: "🎨", labelKey: "skills.dimensions.creation" },
];

/**
 * Reward badge showing the estimated gains from completing a quest.
 *
 * Compact variant (card): four dimension pills in a single row.
 * Expanded variant (detail page): full breakdown with building EXP
 * and civilization contribution shown as separate rows.
 */
export function RewardBadge({ reward, variant = "compact", className = "" }: RewardBadgeProps) {
  const { t, locale } = useLocale();

  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-1.5 flex-wrap ${className}`}>
        {DIMENSIONS.map((dim) => {
          const val = reward[dim.key];
          if (!val) return null;
          return (
            <span
              key={dim.key}
              className="inline-flex items-center gap-0.5 rounded-md bg-[#C4A77D]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#8B7355]"
              title={`${t(dim.labelKey)}: +${val}`}
            >
              <span className="text-xs leading-none">{dim.icon}</span>
              <span>+{val}</span>
            </span>
          );
        })}
        {reward.building_exp > 0 && (
          <span
            className="inline-flex items-center gap-0.5 rounded-md bg-[#8B9D83]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#6B7D63]"
            title={locale === "zh" ? "建筑经验" : "Building EXP"}
          >
            <span className="text-xs leading-none">🏛️</span>
            <span>+{reward.building_exp}</span>
          </span>
        )}
      </div>
    );
  }

  // ── Expanded variant ──────────────────────────────────
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Four-dimension rewards */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">
          {locale === "zh" ? "📊 能力收益" : "📊 Capability Gains"}
        </p>
        <div className="grid grid-cols-4 gap-2">
          {DIMENSIONS.map((dim) => {
            const val = reward[dim.key];
            return (
              <div
                key={dim.key}
                className="rounded-xl bg-[#C4A77D]/5 border border-[#C4A77D]/10 p-2.5 text-center"
              >
                <span className="text-lg">{dim.icon}</span>
                <p className="text-lg font-bold text-[#8B7355] tabular-nums mt-1">
                  +{val}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {t(dim.labelKey)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Building EXP + Civilization contribution */}
      <div className="flex items-center gap-3">
        {reward.building_exp > 0 && (
          <div className="flex-1 rounded-xl bg-[#8B9D83]/5 border border-[#8B9D83]/10 p-3 flex items-center gap-3">
            <span className="text-2xl">🏛️</span>
            <div>
              <p className="text-xs text-muted-foreground">
                {locale === "zh" ? "建筑经验" : "Building EXP"}
              </p>
              <p className="text-lg font-bold text-[#6B7D63] tabular-nums">
                +{reward.building_exp}
              </p>
            </div>
          </div>
        )}
        {reward.civilization_contribution > 0 && (
          <div className="flex-1 rounded-xl bg-[#C4A77D]/5 border border-[#C4A77D]/10 p-3 flex items-center gap-3">
            <span className="text-2xl">🌍</span>
            <div>
              <p className="text-xs text-muted-foreground">
                {locale === "zh" ? "文明贡献" : "Civ Contribution"}
              </p>
              <p className="text-lg font-bold text-[#8B7355] tabular-nums">
                +{reward.civilization_contribution}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
