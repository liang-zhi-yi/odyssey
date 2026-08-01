"use client";

import { useLocale } from "@/hooks/useLocale";
import type { QuestRewardPreview } from "@/types/quest";
import { QuestScrollIcon, type ScrollIconName } from "./QuestScrollIcon";

interface RewardBadgeProps {
  reward: QuestRewardPreview;
  /** Compact: single-row of dimension pills. Expanded: all details with labels. */
  variant?: "compact" | "expanded";
  className?: string;
}

/** Dimension display: key → { icon name, label key } */
const DIMENSIONS: { key: keyof QuestRewardPreview; iconName: ScrollIconName; labelKey: string }[] = [
  { key: "knowledge" as const, iconName: "knowledge", labelKey: "skills.dimensions.knowledge" },
  { key: "reasoning" as const, iconName: "reasoning", labelKey: "skills.dimensions.reasoning" },
  { key: "application" as const, iconName: "application", labelKey: "skills.dimensions.application" },
  { key: "creation" as const, iconName: "creation", labelKey: "skills.dimensions.creation" },
];

/** Inline bar-chart SVG (ancient-civilization style, 1.5px stroke) */
function ChartIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <rect x="7" y="13" width="3" height="5" />
      <rect x="12" y="9" width="3" height="9" />
      <rect x="17" y="6" width="3" height="12" />
    </svg>
  );
}

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
              <QuestScrollIcon name={dim.iconName} size={12} />
              <span>+{val}</span>
            </span>
          );
        })}
        {reward.building_exp > 0 && (
          <span
            className="inline-flex items-center gap-0.5 rounded-md bg-[#8B9D83]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#6B7D63]"
            title={locale === "zh" ? "建筑经验" : "Building EXP"}
          >
            <QuestScrollIcon name="building" size={12} />
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
          <span className="inline-flex items-center gap-1">
            <ChartIcon size={12} />
            {locale === "zh" ? "能力收益" : "Capability Gains"}
          </span>
        </p>
        <div className="grid grid-cols-4 gap-2">
          {DIMENSIONS.map((dim) => {
            const val = reward[dim.key];
            return (
              <div
                key={dim.key}
                className="rounded-xl bg-[#C4A77D]/5 border border-[#C4A77D]/10 p-2.5 text-center"
              >
                <span className="inline-flex">
                  <QuestScrollIcon name={dim.iconName} size={18} />
                </span>
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
            <QuestScrollIcon name="building" size={24} />
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
            <QuestScrollIcon name="civilization" size={24} />
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