"use client";

import { useLocale } from "@/hooks/useLocale";
import { QuestScrollIcon, type ScrollIconName } from "./QuestScrollIcon";
import type { QuestRewardPreview } from "@/types/quest";

interface QuestRewardPanelProps {
  reward: QuestRewardPreview | null;
}

/** Reward cell config — 6 cells in 2×3 grid (4 dimensions + civ + building) */
interface RewardCell {
  key: keyof QuestRewardPreview;
  icon: ScrollIconName;
  zh: string;
  en: string;
  /** gold tone for capability, green for growth */
  tone: "gold" | "green";
}

const CELLS: RewardCell[] = [
  { key: "knowledge",                 icon: "knowledge",        zh: "知识",   en: "Knowledge",   tone: "gold" },
  { key: "reasoning",                 icon: "reasoning",        zh: "推理",   en: "Reasoning",   tone: "gold" },
  { key: "application",               icon: "application",      zh: "应用",   en: "Application", tone: "gold" },
  { key: "creation",                  icon: "creation",         zh: "创造",   en: "Creation",    tone: "gold" },
  { key: "civilization_contribution", icon: "world-core",       zh: "文明贡献", en: "Civ Contrib", tone: "green" },
  { key: "building_exp",              icon: "building-emblem",  zh: "建筑经验", en: "Building EXP", tone: "gold" },
];

/**
 * QuestRewardPanel — 文明能力收益面板.
 *
 * Layout:
 *   Title: 任务收益 + gold divider
 *   2×3 grid: 知识/推理/应用/创造 + 文明贡献/建筑经验
 *   Each cell: emblem icon + large number + small label
 *
 * No emoji — all icons are QuestScrollIcon SVG (world-core, building-emblem, etc.)
 */
export function QuestRewardPanel({ reward }: QuestRewardPanelProps) {
  const { locale } = useLocale();

  if (!reward) return null;

  return (
    <div className="relative rounded-xl border border-[oklch(0.72_0.06_80_/_0.22)] dark:border-[oklch(0.50_0.05_80_/_0.28)] bg-[oklch(0.94_0.018_82_/_0.45)] dark:bg-[oklch(0.21_0.013_78_/_0.45)] p-5 ornamental-border">
      {/* Title */}
      <div className="flex items-center gap-2.5 mb-2 relative z-10">
        <QuestScrollIcon name="sparkle" size={15} className="text-[oklch(0.55_0.08_78)] dark:text-[oklch(0.72_0.09_80)]" strokeWidth={1.4} />
        <h3 className="text-[13px] font-bold font-civ-serif text-[oklch(0.32_0.025_70)] dark:text-[oklch(0.85_0.04_80)] tracking-wide">
          {locale === "zh" ? "任务收益" : "Quest Rewards"}
        </h3>
        <div className="flex-1 h-px bg-[oklch(0.72_0.06_80_/_0.18)] dark:bg-[oklch(0.55_0.05_80_/_0.20)]" />
      </div>
      <p className="text-[10px] font-medium text-[oklch(0.50_0.04_75)] dark:text-[oklch(0.65_0.045_80)] uppercase tracking-[0.18em] mb-3 font-civ-serif relative z-10">
        {locale === "zh" ? "文明能力收益" : "Civilization Gains"}
      </p>

      {/* 2×3 grid — 6 reward cells */}
      <div className="grid grid-cols-2 gap-3 relative z-10">
        {CELLS.map((cell) => {
          const val = reward[cell.key] ?? 0;
          const isGreen = cell.tone === "green";
          return (
            <div
              key={cell.key}
              className="quest-card-hover rounded-xl bg-[oklch(0.95_0.02_85_/_0.50)] dark:bg-[oklch(0.22_0.015_78_/_0.45)] border border-[oklch(0.72_0.06_80_/_0.14)] dark:border-[oklch(0.48_0.04_80_/_0.20)] p-3.5 flex items-center gap-3"
            >
              {/* Emblem icon */}
              <div
                className={`flex items-center justify-center w-11 h-11 rounded-lg flex-shrink-0 ${
                  isGreen
                    ? "bg-[oklch(0.50_0.09_145_/_0.12)] text-[oklch(0.45_0.09_145)] dark:bg-[oklch(0.55_0.09_145_/_0.18)] dark:text-[oklch(0.68_0.10_145)]"
                    : "bg-[oklch(0.72_0.06_80_/_0.12)] text-[oklch(0.50_0.06_75)] dark:bg-[oklch(0.65_0.07_80_/_0.18)] dark:text-[oklch(0.78_0.08_80)]"
                }`}
              >
                <QuestScrollIcon name={cell.icon} size={19} strokeWidth={1.4} />
              </div>
              {/* Number + label */}
              <div className="min-w-0 flex-1">
                <p
                  className={`text-[22px] font-bold font-civ-serif tabular-nums leading-none ${
                    isGreen
                      ? "text-[oklch(0.42_0.09_145)] dark:text-[oklch(0.72_0.10_145)]"
                      : "text-[oklch(0.42_0.06_72)] dark:text-[oklch(0.82_0.07_80)]"
                  }`}
                >
                  +{val}
                </p>
                <p className="text-[10px] text-[oklch(0.50_0.035_75)] dark:text-[oklch(0.62_0.04_80)] font-civ-serif mt-1 truncate">
                  {locale === "en" ? cell.en : cell.zh}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
