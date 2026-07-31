"use client";

import { useLocale } from "@/hooks/useLocale";
import { QuestScrollIcon } from "./QuestScrollIcon";

interface QuestObjectiveProps {
  /** The description text — used as the "background story" */
  background: string | null;
  /** Quest title — used to derive the mission statement */
  questTitle: string;
  /** Expected deliverable type — used to generate objectives */
  expectedDeliverable: string;
}

/**
 * QuestObjective — Three fixed sections of the quest scroll:
 *   1. 任务背景 (Background) — why civilization needs this task
 *   2. 你的使命 (Mission) — one clear action goal
 *   3. 任务目标 (Objectives) — archive-style list with seal markers
 *
 * No emoji, no modern checkbox. Uses archive-list-item + seal SVG.
 */
export function QuestObjective({
  background,
  questTitle,
  expectedDeliverable,
}: QuestObjectiveProps) {
  const { locale } = useLocale();

  // Derive mission statement from quest title
  const mission = locale === "zh"
    ? `完成「${questTitle}」，提交符合要求的交付物`
    : `Complete "${questTitle}" and submit the required deliverable`;

  // Derive objectives from expected_deliverable (matches DeliverableType)
  const deliverableLabels: Record<string, { zh: string; en: string }> = {
    PROMPT: { zh: "提示词作品", en: "Prompt" },
    ARCHITECTURE: { zh: "架构设计", en: "Architecture" },
    WORKFLOW: { zh: "工作流设计", en: "Workflow" },
    CODE: { zh: "代码实现", en: "Code Implementation" },
    REPORT: { zh: "分析报告", en: "Report" },
  };
  const deliverableLabel = deliverableLabels[expectedDeliverable]
    ? (locale === "en" ? deliverableLabels[expectedDeliverable].en : deliverableLabels[expectedDeliverable].zh)
    : expectedDeliverable;

  const objectives = locale === "zh"
    ? [
        `理解任务要求，明确${deliverableLabel}的核心内容`,
        "按要求完成任务并提交交付物",
        "通过评估模型评测达到合格标准",
      ]
    : [
        `Understand the requirements and identify the core of the ${deliverableLabel}`,
        "Complete the task and submit the deliverable",
        "Pass the assessment with a qualifying score",
      ];

  const sectionTitleClass =
    "text-[13px] font-bold font-civ-serif text-[oklch(0.32_0.025_70)] dark:text-[oklch(0.85_0.04_80)] tracking-wide";

  return (
    <div className="space-y-7 relative">
      {/* ── 1. 任务背景 ──────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2.5 mb-3">
          <QuestScrollIcon name="scroll" size={15} className="text-[oklch(0.50_0.05_75)] dark:text-[oklch(0.70_0.06_80)]" strokeWidth={1.4} />
          <h3 className={sectionTitleClass}>
            {locale === "zh" ? "任务背景" : "Background"}
          </h3>
          <div className="flex-1 h-px bg-[oklch(0.72_0.06_80_/_0.18)] dark:bg-[oklch(0.55_0.05_80_/_0.20)]" />
        </div>
        <div className="pl-6 border-l-2 border-[oklch(0.72_0.06_80_/_0.20)] dark:border-[oklch(0.55_0.05_80_/_0.22)]">
          <p className="font-civ-serif text-[13.5px] text-[oklch(0.40_0.025_72)] dark:text-[oklch(0.70_0.035_82)] leading-[1.85] whitespace-pre-wrap">
            {background || (locale === "zh"
              ? "文明的发展需要每一位建设者的贡献。此任务是文明成长路径中的一个重要环节。"
              : "The growth of civilization requires the contribution of every builder. This task is an important step in the civilization growth path.")}
          </p>
        </div>
      </section>

      {/* ── 2. 你的使命 ─────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2.5 mb-3">
          <QuestScrollIcon name="mission" size={15} className="text-[oklch(0.45_0.08_145)] dark:text-[oklch(0.62_0.09_145)]" strokeWidth={1.4} />
          <h3 className={sectionTitleClass}>
            {locale === "zh" ? "你的使命" : "Your Mission"}
          </h3>
          <div className="flex-1 h-px bg-[oklch(0.72_0.06_80_/_0.18)] dark:bg-[oklch(0.55_0.05_80_/_0.20)]" />
        </div>
        <div className="pl-6 border-l-2 border-[oklch(0.55_0.09_145_/_0.25)] dark:border-[oklch(0.50_0.08_145_/_0.30)]">
          <p className="font-civ-serif text-[14px] text-[oklch(0.30_0.025_70)] dark:text-[oklch(0.85_0.04_80)] leading-[1.8] font-medium">
            {mission}
          </p>
        </div>
      </section>

      {/* ── 3. 任务目标 — 古籍档案列表 ─────────────── */}
      <section>
        <div className="flex items-center gap-2.5 mb-3">
          <QuestScrollIcon name="seal" size={15} className="text-[oklch(0.50_0.05_75)] dark:text-[oklch(0.70_0.06_80)]" strokeWidth={1.4} />
          <h3 className={sectionTitleClass}>
            {locale === "zh" ? "任务目标" : "Objectives"}
          </h3>
          <div className="flex-1 h-px bg-[oklch(0.72_0.06_80_/_0.18)] dark:bg-[oklch(0.55_0.05_80_/_0.20)]" />
        </div>
        <div className="pl-6 space-y-3">
          {objectives.map((obj, idx) => (
            <div key={idx} className="archive-list-item">
              <p className="font-civ-serif text-[13px] text-[oklch(0.42_0.025_72)] dark:text-[oklch(0.72_0.035_82)] leading-[1.7]">
                <span className="text-[oklch(0.55_0.06_75)] dark:text-[oklch(0.72_0.08_80)] font-bold mr-1.5 tabular-nums">
                  {locale === "zh" ? `之${["一", "二", "三", "四"][idx] || idx + 1}` : `${idx + 1}.`}
                </span>
                {obj}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
