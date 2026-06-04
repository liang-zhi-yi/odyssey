"use client";

import useSWR from "swr";
import { worldService } from "@/services/world.service";
import type { UserMilestone } from "@/types/world";
import { useLocale } from "@/hooks/useLocale";

interface MilestoneChecklistProps {
  /** Pre-fetched milestones (optional — falls back to SWR fetch) */
  milestones?: UserMilestone[];
  /** Pre-computed counts */
  unlockedCount?: number;
  totalCount?: number;
}

export function MilestoneChecklist({
  milestones: initialMilestones,
  unlockedCount: initialUnlocked,
  totalCount: initialTotal,
}: MilestoneChecklistProps) {
  const { t, locale } = useLocale();

  const { data: milestones } = useSWR(
    "world-milestones",
    () => worldService.getMilestones(),
    { fallbackData: initialMilestones }
  );

  if (!milestones || milestones.length === 0) {
    return null;
  }

  const unlocked = milestones.filter((m) => m.unlocked).length;
  const total = milestones.length;

  return (
    <div className="space-y-3">
      {/* Progress header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          {t("world.milestones")}
        </h3>
        <span className="text-xs font-medium text-muted-foreground">
          {t("world.milestoneProgress", {
            unlocked: String(unlocked),
            total: String(total),
          })}
        </span>
      </div>

      {/* Overall progress bar */}
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 transition-all duration-500"
          style={{ width: `${total > 0 ? Math.round((unlocked / total) * 100) : 0}%` }}
        />
      </div>

      {/* Milestone items */}
      <div className="space-y-1.5">
        {milestones.map((m) => (
          <MilestoneItem key={m.id} milestone={m} locale={locale} t={t} />
        ))}
      </div>
    </div>
  );
}

function MilestoneItem({
  milestone,
  locale,
  t,
}: {
  milestone: UserMilestone;
  locale: string;
  t: (key: string, vars?: Record<string, string>) => string;
}) {
  const name =
    locale === "en" && milestone.name_en
      ? milestone.name_en
      : milestone.name;
  const desc =
    locale === "en" && milestone.description_en
      ? milestone.description_en
      : milestone.description;

  const categoryClass =
    milestone.category === "FOUNDATION"
      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
      : milestone.category === "EXPANSION"
        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
        : "bg-purple-500/10 text-purple-600 dark:text-purple-400";

  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
        milestone.unlocked
          ? "bg-secondary/30"
          : "bg-muted/20 opacity-50"
      }`}
    >
      {/* Icon */}
      <span className={`text-lg ${milestone.unlocked ? "" : "grayscale"}`}>
        {milestone.icon}
      </span>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-medium ${
              milestone.unlocked ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {name}
          </span>
          {milestone.unlocked && (
            <span className="text-xs text-green-500">✓</span>
          )}
        </div>
        {desc && (
          <p className="text-xs text-muted-foreground truncate">{desc}</p>
        )}
        {milestone.unlocked && milestone.unlocked_at && (
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {new Date(milestone.unlocked_at).toLocaleDateString(
              locale === "zh" ? "zh-CN" : "en-US"
            )}
          </p>
        )}
      </div>

      {/* Category badge */}
      <span className={`text-[10px] font-medium rounded-full px-2 py-0.5 ${categoryClass}`}>
        {t(`world.milestoneCategories.${milestone.category}`)}
      </span>
    </div>
  );
}
