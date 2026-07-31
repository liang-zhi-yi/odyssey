"use client";

import { useLocale } from "@/hooks/useLocale";
import { QuestScrollIcon, type ScrollIconName } from "./QuestScrollIcon";
import type { QuestDifficulty, QuestType } from "@/types/quest";

interface QuestHeaderProps {
  title: string;
  titleEn: string | null;
  subtitle: string;
  difficulty: QuestDifficulty;
  questType: QuestType;
  skillName: string;
}

/** Map quest difficulty to star level (1-4) */
function difficultyToStars(difficulty: QuestDifficulty): number {
  const map: Record<QuestDifficulty, number> = {
    LEVEL_1: 1,
    LEVEL_2: 2,
    LEVEL_3: 3,
    LEVEL_4: 4,
  };
  return map[difficulty] ?? 1;
}

/** Quest type → SVG emblem icon name (古文明纹章) */
function questTypeIcon(type: QuestType): ScrollIconName {
  const map: Record<QuestType, ScrollIconName> = {
    KNOWLEDGE: "knowledge",
    APPLICATION: "application",
    PROJECT: "mission",
    MASTERY: "sparkle",
  };
  return map[type] ?? "knowledge";
}

/**
 * QuestHeader — RPG scroll header with civilization emblem + difficulty stars.
 *
 * Layout:
 *   Left: Emblem icon (badge-emblem) + type label + skill name
 *   Right: Difficulty stars (★★★☆☆) with Lv. prefix
 *   Below: Quest title (宋体衬线) + subtitle (archive italic)
 *   Divider: gold scroll-divider
 */
export function QuestHeader({
  title,
  titleEn,
  subtitle,
  difficulty,
  questType,
  skillName,
}: QuestHeaderProps) {
  const { locale } = useLocale();
  const displayTitle = locale === "en" && titleEn ? titleEn : title;
  const starCount = difficultyToStars(difficulty);
  const iconName = questTypeIcon(questType);

  const typeLabels: Record<QuestType, { zh: string; en: string }> = {
    KNOWLEDGE: { zh: "知识任务", en: "Knowledge" },
    APPLICATION: { zh: "应用任务", en: "Application" },
    PROJECT: { zh: "项目任务", en: "Project" },
    MASTERY: { zh: "精通任务", en: "Mastery" },
  };
  const typeLabel = locale === "en" ? typeLabels[questType].en : typeLabels[questType].zh;
  const levelLabel = locale === "zh" ? `等级 ${starCount}` : `Lv. ${starCount}`;

  return (
    <header className="relative">
      {/* Top row: emblem (left) + difficulty (right) */}
      <div className="flex items-start justify-between gap-4 mb-5">
        {/* Emblem icon — badge-emblem with glow */}
        <div className="flex items-center gap-3">
          <div className="badge-emblem flex items-center justify-center w-12 h-12 rounded-lg">
            <QuestScrollIcon name={iconName} size={22} strokeWidth={1.4} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-[oklch(0.50_0.04_75)] dark:text-[oklch(0.62_0.05_80)] uppercase tracking-[0.18em] font-civ-serif">
              {typeLabel}
            </p>
            <p className="text-xs font-semibold text-[oklch(0.42_0.05_72)] dark:text-[oklch(0.75_0.06_80)] font-civ-serif mt-0.5 truncate">
              {skillName}
            </p>
          </div>
        </div>

        {/* Difficulty stars — archive-style */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-[10px] text-muted-foreground uppercase tracking-[0.18em] font-civ-serif">
            {locale === "zh" ? "难度" : "Difficulty"}
          </span>
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-[oklch(0.50_0.06_75)] dark:text-[oklch(0.72_0.08_80)] font-civ-serif tabular-nums mr-1.5">
              {levelLabel}
            </span>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 4 }, (_, i) => (
                <QuestScrollIcon
                  key={i}
                  name={i < starCount ? "star" : "star-outline"}
                  size={13}
                  className={i < starCount
                    ? "text-[oklch(0.65_0.10_78)] dark:text-[oklch(0.78_0.10_80)]"
                    : "text-muted-foreground/25"
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Title — 宋体书卷感 */}
      <h1 className="font-civ-serif text-[22px] sm:text-[26px] font-bold leading-[1.25] text-[oklch(0.28_0.025_70)] dark:text-[oklch(0.88_0.04_80)] tracking-tight mb-2">
        {displayTitle}
      </h1>

      {/* Subtitle — archive italic */}
      <p className="font-civ-serif text-[13px] text-[oklch(0.45_0.03_72)] dark:text-[oklch(0.62_0.035_80)] italic leading-relaxed">
        {subtitle}
      </p>

      {/* Decorative gold divider */}
      <div className="scroll-divider mt-5" />
    </header>
  );
}
