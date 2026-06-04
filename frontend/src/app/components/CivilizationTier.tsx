"use client";

import { CIVILIZATION_TIER_LABELS } from "@/types/world";
import type { CivilizationTierValue } from "@/types/world";
import { useLocale } from "@/hooks/useLocale";

interface CivilizationTierProps {
  tier: CivilizationTierValue;
  tierScore: number;
  nextTierAt: number;
}

export function CivilizationTier({ tier, tierScore, nextTierAt }: CivilizationTierProps) {
  const { locale } = useLocale();
  const tierInfo = CIVILIZATION_TIER_LABELS[tier] ?? CIVILIZATION_TIER_LABELS.SETTLER;
  const name = locale === "en" ? tierInfo.en : tierInfo.zh;

  // Calculate progress to next tier
  const isMaxTier = nextTierAt === 0 || tier === "CIVILIZATION";
  const progressPercent = isMaxTier
    ? 100
    : Math.min(100, Math.round((tierScore / Math.max(1, nextTierAt)) * 100));
  // Use a more meaningful scale: progress within the current tier band
  const progressLabel = isMaxTier
    ? "MAX"
    : `${tierScore}/${nextTierAt}`;

  return (
    <div className="rounded-xl border border-border bg-gradient-to-r from-yellow-500/10 to-amber-500/10 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-3xl">{tierInfo.icon}</span>
        <span className="text-xl font-bold text-foreground">{name}</span>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {locale === "en" ? "Tier Score" : "文明分数"}
          </span>
          <span className="font-mono text-muted-foreground">{progressLabel}</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isMaxTier
                ? "bg-gradient-to-r from-yellow-400 to-amber-500"
                : "bg-gradient-to-r from-yellow-500 to-amber-600"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {!isMaxTier && (
        <p className="text-xs text-muted-foreground">
          {locale === "en"
            ? `${nextTierAt - tierScore} points to next tier`
            : `距下一等级还需 ${nextTierAt - tierScore} 分`}
        </p>
      )}
      {isMaxTier && (
        <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
          {locale === "en" ? "Maximum tier reached!" : "已达最高文明等级！"}
        </p>
      )}
    </div>
  );
}
