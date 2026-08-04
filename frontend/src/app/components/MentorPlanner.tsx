"use client";

import { useState } from "react";
import { useLocale } from "@/hooks/useLocale";
import { CIVILIZATION_TYPE_LABELS } from "@/types/world";
import type { World } from "@/types/world";

interface MentorPlannerProps {
  world: World | null;
  activePathsCount: number;
  isGenerating: boolean;
  onGenerate: (goal: string, category: string, targetWeeks: number, pathTitle: string) => void;
}

const QUICK_GOALS = [
  {
    emoji: "✨",
    key: "agent",
    prompt: "我想成为Agent工程师，掌握从Prompt Engineering到多智能体系统的完整技能栈",
  },
  {
    emoji: "🏛",
    key: "ai_civ",
    prompt: "我想建设AI文明，解锁所有AI相关的建筑和技能",
  },
  {
    emoji: "⚙️",
    key: "automation",
    prompt: "我想掌握自动化工作流，从基础脚本到复杂的CI/CD和LLM自动化管道",
  },
];

const DURATION_OPTIONS = [
  { weeks: 4, key: "short" },
  { weeks: 8, key: "medium" },
  { weeks: 12, key: "long" },
];

/**
 * Left-side mentor-guided planning panel for the Civilization Planner.
 *
 * Features:
 * - Personalized mentor greeting based on world state
 * - Quick-goal suggestion cards
 * - Large natural-language goal textarea
 * - De-emphasized optional fields (civilization type, duration)
 * - Civilization-themed submit button
 */
export function MentorPlanner({
  world,
  activePathsCount,
  isGenerating,
  onGenerate,
}: MentorPlannerProps) {
  const { locale } = useLocale();

  const [goal, setGoal] = useState("");
  const [pathTitle, setPathTitle] = useState("");
  const [category, setCategory] = useState("");
  const [targetWeeks, setTargetWeeks] = useState(8);

  // ── Mentor greeting ─────────────────────────────────────────────────
  const greeting = buildGreeting(world, activePathsCount, locale);

  // ── Quick goal handler ──────────────────────────────────────────────
  const handleQuickGoal = (prompt: string) => {
    setGoal(prompt);
  };

  // ── Submit ──────────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!goal.trim() || isGenerating) return;
    onGenerate(goal.trim(), category || "", targetWeeks, pathTitle.trim());
  };

  const canSubmit = goal.trim().length > 0 && !isGenerating;

  return (
    <div className="relative rounded-xl scroll-fuse ornamental-border p-6 space-y-5 overflow-hidden">
      <div className="absolute inset-0 parchment-texture pointer-events-none opacity-40" />
      <div className="relative z-10 space-y-5">
      {/* ── Mentor greeting ──────────────────────────────────────── */}
      <div className="flex items-start gap-3">
        {/* Agent avatar — emoji 图标 */}
        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[oklch(0.72_0.12_85_/_0.12)] border border-[oklch(0.72_0.12_85_/_0.30)] flex items-center justify-center text-lg">
          🧭
        </div>
        <div>
          <p className="text-sm font-bold font-civ-serif text-[oklch(0.30_0.025_70)] dark:text-[oklch(0.88_0.04_80)]">
            {locale === "zh" ? "奥德赛导师" : "Odyssey Mentor"}
          </p>
          <p className="text-xs text-[oklch(0.50_0.03_75)] dark:text-[oklch(0.65_0.035_82)] leading-relaxed mt-0.5 font-civ-serif italic">
            {greeting}
          </p>
        </div>
      </div>

      {/* ── Quick goals ──────────────────────────────────────────── */}
      <div className="space-y-2">
        <p className="text-[10px] text-[oklch(0.50_0.03_75)] dark:text-[oklch(0.62_0.04_80)] uppercase tracking-wider font-civ-serif font-bold">
          {locale === "zh" ? "快速目标" : "Quick Goals"}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {QUICK_GOALS.map((qg) => (
            <button
              key={qg.key}
              type="button"
              onClick={() => handleQuickGoal(qg.prompt)}
              disabled={isGenerating}
              className="rounded-xl border border-[oklch(0.72_0.06_80_/_0.20)] bg-[oklch(0.99_0.003_95_/_0.5)] dark:bg-[oklch(0.22_0.012_78_/_0.4)] hover:bg-[oklch(0.96_0.02_80_/_0.6)] dark:hover:bg-[oklch(0.25_0.015_78_/_0.5)] hover:border-[oklch(0.72_0.12_85_/_0.40)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all p-3 text-left group"
            >
              <span className="block mb-1 text-lg leading-none">{qg.emoji}</span>
              <span className="text-xs font-medium font-civ-serif text-[oklch(0.35_0.02_70)] dark:text-[oklch(0.85_0.04_80)] group-hover:text-[oklch(0.35_0.12_85)] dark:group-hover:text-[oklch(0.9_0.05_80)] transition-colors">
                {locale === "zh"
                  ? qg.key === "agent"
                    ? "成为Agent工程师"
                    : qg.key === "ai_civ"
                    ? "建设AI文明"
                    : "掌握自动化工作流"
                  : qg.key === "agent"
                  ? "Become Agent Engineer"
                  : qg.key === "ai_civ"
                  ? "Build AI Civilization"
                  : "Master Automation"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Divider ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[oklch(0.72_0.12_85_/_0.3)] to-transparent" />
        <span className="text-[10px] text-[oklch(0.50_0.03_75)] dark:text-[oklch(0.62_0.04_80)] font-civ-serif italic">
          {locale === "zh" ? "或自定义目标" : "or custom goal"}
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[oklch(0.72_0.12_85_/_0.3)] to-transparent" />
      </div>

      {/* ── Goal input ───────────────────────────────────────────── */}
      <div>
        <label className="block text-sm font-civ-serif font-bold mb-2 text-[oklch(0.30_0.025_70)] dark:text-[oklch(0.85_0.04_80)]">
          {locale === "zh"
            ? <>🔖 路径名称（简短标题）</>
            : <>🔖 Path Name (short title)</>}
        </label>
        <input
          type="text"
          value={pathTitle}
          onChange={(e) => setPathTitle(e.target.value.slice(0, 50))}
          placeholder={
            locale === "zh"
              ? "给你的学习路径起个简短的名字，如：AI Agent 工程师之路"
              : "Give your path a short name, e.g.: AI Agent Engineer Journey"
          }
          maxLength={50}
          disabled={isGenerating}
          className="w-full rounded-xl border border-[oklch(0.72_0.06_80_/_0.25)] bg-[oklch(0.99_0.003_95_/_0.6)] dark:bg-[oklch(0.22_0.012_78_/_0.5)] px-4 py-3 text-sm font-civ-serif text-[oklch(0.3_0.02_70)] dark:text-[oklch(0.88_0.04_80)] placeholder:text-[oklch(0.55_0.02_80_/_0.6)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.72_0.12_85_/_0.2)] focus:border-[oklch(0.72_0.12_85)] resize-none disabled:opacity-50 transition-all"
        />
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-[oklch(0.50_0.03_75)] dark:text-[oklch(0.62_0.04_80)] font-civ-serif italic">
            {locale === "zh"
              ? "将显示在仪表盘和路径列表中，建议 50 字以内"
              : "Shows in dashboard & path list, keep under 50 chars"}
          </span>
          <span className="text-[10px] text-[oklch(0.50_0.03_75)] dark:text-[oklch(0.62_0.04_80)] font-civ-serif tabular-nums">
            {pathTitle.length > 0
              ? `${pathTitle.length}/50`
              : ""}
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-civ-serif font-bold mb-2 text-[oklch(0.30_0.025_70)] dark:text-[oklch(0.85_0.04_80)]">
          {locale === "zh"
            ? <>✨ 描述你的成长目标</>
            : <>✨ Describe your growth goal</>}
        </label>
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder={
            locale === "zh"
              ? "描述你的成长目标，例如：我想在3个月内掌握Agent开发，从LangChain基础到多智能体系统..."
              : "Describe your growth goal, e.g.: I want to master Agent development in 3 months, from LangChain basics to multi-agent systems..."
          }
          rows={4}
          disabled={isGenerating}
          className="w-full rounded-xl border border-[oklch(0.72_0.06_80_/_0.25)] bg-[oklch(0.99_0.003_95_/_0.6)] dark:bg-[oklch(0.22_0.012_78_/_0.5)] px-4 py-3 text-sm font-civ-serif text-[oklch(0.3_0.02_70)] dark:text-[oklch(0.88_0.04_80)] placeholder:text-[oklch(0.55_0.02_80_/_0.6)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.72_0.12_85_/_0.2)] focus:border-[oklch(0.72_0.12_85)] resize-none disabled:opacity-50 transition-all"
        />
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-[oklch(0.50_0.03_75)] dark:text-[oklch(0.62_0.04_80)] font-civ-serif italic">
            {goal.length > 0
              ? `${goal.length} ${locale === "zh" ? "字" : "chars"}`
              : ""}
          </span>
        </div>
      </div>

      {/* ── Optional fields (de-emphasized) ──────────────────────── */}
      <div className="flex gap-3 flex-wrap">
        {/* Civilization type */}
        <div className="flex-1 min-w-[140px]">
          <label className="block text-[10px] text-[oklch(0.50_0.03_75)] dark:text-[oklch(0.62_0.04_80)] mb-1 font-civ-serif font-bold uppercase tracking-wider">
            {locale === "zh" ? "文明方向（可选）" : "Civ Direction (optional)"}
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={isGenerating}
            className="w-full rounded-lg border border-[oklch(0.72_0.06_80_/_0.25)] bg-[oklch(0.99_0.003_95_/_0.6)] dark:bg-[oklch(0.22_0.012_78_/_0.5)] px-3 py-2 text-xs font-civ-serif text-[oklch(0.35_0.02_70)] dark:text-[oklch(0.85_0.04_80)] focus:outline-none focus:ring-1 focus:ring-[oklch(0.72_0.12_85_/_0.3)] disabled:opacity-50"
          >
            <option value="">
              {locale === "zh" ? "不限方向" : "Any Direction"}
            </option>
            {(Object.entries(CIVILIZATION_TYPE_LABELS) as [string, { zh: string; en: string }][]).map(
              ([key, label]) => (
                <option key={key} value={key}>
                  {locale === "en" ? label.en : label.zh}
                </option>
              )
            )}
          </select>
        </div>

        {/* Duration selector */}
        <div className="flex-1 min-w-[160px]">
          <label className="block text-[10px] text-[oklch(0.50_0.03_75)] dark:text-[oklch(0.62_0.04_80)] mb-1 font-civ-serif font-bold uppercase tracking-wider">
            {locale === "zh" ? "预计周期（可选）" : "Duration (optional)"}
          </label>
          <div className="flex gap-1">
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.weeks}
                type="button"
                onClick={() => setTargetWeeks(opt.weeks)}
                disabled={isGenerating}
                className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-civ-serif transition-all disabled:opacity-50 ${
                  targetWeeks === opt.weeks
                    ? "border-[oklch(0.72_0.12_85_/_0.4)] bg-[oklch(0.72_0.12_85_/_0.10)] text-[oklch(0.35_0.12_85)] dark:text-[oklch(0.85_0.06_80)] font-bold"
                    : "border-[oklch(0.72_0.06_80_/_0.25)] text-[oklch(0.50_0.03_75)] dark:text-[oklch(0.62_0.04_80)] hover:bg-[oklch(0.96_0.02_80_/_0.5)]"
                }`}
              >
                {locale === "zh"
                  ? opt.key === "short"
                    ? "4周"
                    : opt.key === "medium"
                    ? "8周"
                    : "12周+"
                  : opt.key === "short"
                  ? "4w"
                  : opt.key === "medium"
                  ? "8w"
                  : "12w+"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Submit button — 文明卷轴印记风格 ───────────────────── */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="scroll-seal-btn w-full text-base disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={locale === "zh" ? "规划文明成长路线" : "Plan Civilization Growth"}
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span>
              {locale === "zh"
                ? "奥德赛正在分析你的目标..."
                : "Odyssey is analyzing your goal..."}
            </span>
          </span>
        ) : (
          <span>
            ✨ {locale === "zh" ? "规划文明成长路线" : "Plan Civilization Growth"}
          </span>
        )}
      </button>
      </div>
    </div>
  );
}

/** Build a personalized mentor greeting based on world state */
function buildGreeting(
  world: World | null,
  activePathsCount: number,
  locale: string
): string {
  if (!world) {
    return locale === "zh"
      ? "你好，开拓者！让我们开始规划你的文明成长路线吧。告诉我你想往哪个方向发展？"
      : "Hello, pioneer! Let's start planning your civilization growth route. Which direction would you like to explore?";
  }

  const eraInfo = {
    WILDERNESS: { zh: "荒野时代", en: "the Wilderness Era" },
    AGRICULTURE: { zh: "农耕时代", en: "the Agriculture Era" },
    ACADEMY: { zh: "学院时代", en: "the Academy Era" },
    INDUSTRY: { zh: "工业时代", en: "the Industry Era" },
    INFORMATION: { zh: "信息时代", en: "the Information Era" },
    AI: { zh: "AI时代", en: "the AI Era" },
    INTELLIGENCE: { zh: "智能时代", en: "the Intelligence Era" },
    DIGITAL: { zh: "数字文明时代", en: "the Digital Civilization Era" },
    FUTURE: { zh: "未来文明时代", en: "the Future Civilization Era" },
  }[world.era] ?? { zh: "荒野时代", en: "the Wilderness Era" };

  const buildingCount = world.buildings?.filter(b => b.status !== "LOCKED")?.length ?? 0;
  const eraName = locale === "en" ? eraInfo.en : eraInfo.zh;

  if (activePathsCount > 0) {
    return locale === "zh"
      ? `你好，开拓者！你的文明正处于${eraName}，已有${buildingCount}座建筑和${activePathsCount}条活跃成长路线。接下来你想往哪个方向发展？`
      : `Hello, pioneer! Your civilization is in ${eraName} with ${buildingCount} buildings and ${activePathsCount} active growth routes. Which direction next?`;
  }

  return locale === "zh"
    ? `你好，开拓者！你的文明正处于${eraName}，已有${buildingCount}座建筑。接下来你想往哪个方向发展？`
    : `Hello, pioneer! Your civilization is in ${eraName} with ${buildingCount} buildings. Which direction would you like to grow?`;
}
