"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "@/hooks/useLocale";
import { QuestScrollIcon } from "@/app/components/QuestScrollIcon";
import { GrowthChain } from "./GrowthChain";
import type { GrowthChainNode } from "./GrowthChain";
import type { GeneratePathResponse, TargetedBuilding } from "@/types/learningPath";
import type { World, CivilizationDirection } from "@/types/world";

interface GrowthPreviewProps {
  /** Current world state */
  world: World | null;
  /** Current civilization direction */
  direction: CivilizationDirection | null;
  /** Generation state */
  isGenerating: boolean;
  generationPhase: number;
  /** Generation result (null = not yet generated) */
  generationResult: GeneratePathResponse | null;
  /** Targeted buildings from the API response */
  targetedBuildings: TargetedBuilding[] | null;
  /** Created path ID for navigation */
  createdPathId: string | null;
  /** The growth goal text that was submitted */
  goalText: string;
  /** Reset callback */
  onReset: () => void;
}

const GENERATION_PHASES = [
  { icon: (<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-5-5" /></svg>), zh: "分析成长目标", en: "Analyzing growth goal" },
  { icon: <QuestScrollIcon name="reasoning" size={16} />, zh: "匹配能力技能", en: "Matching skills" },
  { icon: <QuestScrollIcon name="building" size={16} />, zh: "规划建筑路径", en: "Planning building path" },
  { icon: <QuestScrollIcon name="checklist" size={16} />, zh: "生成成长路线", en: "Generating growth route" },
];

/**
 * Right-side preview panel for the Civilization Planner.
 *
 * Three states:
 * 1. Empty — civilization compass + guidance copy
 * 2. Generating — phase indicator animation
 * 3. Result — growth chain, targeted buildings, reward estimates, actions
 */
export function GrowthPreview({
  world,
  direction,
  isGenerating,
  generationPhase,
  generationResult,
  targetedBuildings,
  createdPathId,
  goalText,
  onReset,
}: GrowthPreviewProps) {
  const { locale } = useLocale();
  const router = useRouter();

  // ── State 1: Generating ─────────────────────────────────────────────
  if (isGenerating) {
    return (
      <div className="relative rounded-xl scroll-fuse ornamental-border p-6 space-y-6 sticky top-6 overflow-hidden">
        <div className="absolute inset-0 parchment-texture pointer-events-none opacity-40" />
        <div className="relative z-10 space-y-6">
        <h3 className="text-sm font-bold font-civ-serif text-[oklch(0.30_0.025_70)] dark:text-[oklch(0.88_0.04_80)] tracking-wide">
          {locale === "zh" ? "文明成长预览" : "Civilization Growth Preview"}
        </h3>

        {/* Pulsing center */}
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="relative">
            <div className="h-16 w-16 rounded-full bg-[oklch(0.55_0.08_145_/_0.10)] border-2 border-[oklch(0.55_0.08_145_/_0.30)] flex items-center justify-center">
              <span className="animate-pulse text-[oklch(0.45_0.08_145)] dark:text-[oklch(0.72_0.09_145)]"><QuestScrollIcon name="sparkle" size={28} /></span>
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-[oklch(0.55_0.08_145_/_0.20)] animate-ping" />
          </div>
          <p className="text-sm font-medium font-civ-serif italic text-[oklch(0.45_0.06_145)] dark:text-[oklch(0.72_0.08_145)]">
            {locale === "zh"
              ? "奥德赛正在规划你的文明路线..."
              : "Odyssey is planning your civilization route..."}
          </p>
        </div>

        {/* Phase indicator */}
        <div className="space-y-2">
          {GENERATION_PHASES.map((phase, i) => {
            const isActive = i === generationPhase;
            const isDone = i < generationPhase;
            return (
              <div
                key={i}
                className={`flex items-center gap-3 text-xs transition-all duration-500 font-civ-serif ${
                  isActive
                    ? "text-[oklch(0.40_0.08_145)] dark:text-[oklch(0.75_0.09_145)] font-bold"
                    : isDone
                    ? "text-[oklch(0.50_0.03_75_/_0.5)] dark:text-[oklch(0.62_0.04_80_/_0.5)]"
                    : "text-[oklch(0.50_0.03_75_/_0.3)] dark:text-[oklch(0.62_0.04_80_/_0.3)]"
                }`}
              >
                <span className="w-5 flex items-center justify-center">{phase.icon}</span>
                <span>{locale === "en" ? phase.en : phase.zh}</span>
                {isActive && (
                  <span className="ml-auto flex gap-0.5">
                    <span className="h-1 w-1 rounded-full bg-[oklch(0.55_0.08_145)] animate-bounce" />
                    <span
                      className="h-1 w-1 rounded-full bg-[oklch(0.55_0.08_145)] animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="h-1 w-1 rounded-full bg-[oklch(0.55_0.08_145)] animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </span>
                )}
                {isDone && <svg className="ml-auto text-[oklch(0.45_0.08_145)] dark:text-[oklch(0.72_0.09_145)]" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>}
              </div>
            );
          })}
        </div>
        </div>
      </div>
    );
  }

  // ── State 2: Result ─────────────────────────────────────────────────
  if (generationResult && createdPathId) {
    // Build growth chain nodes from the generation result metadata
    const chainNodes: GrowthChainNode[] = buildGrowthChainNodes(
      generationResult,
      targetedBuildings,
      goalText
    );

    return (
      <div className="relative rounded-xl scroll-fuse ornamental-border p-6 space-y-5 sticky top-6 overflow-hidden">
        <div className="absolute inset-0 parchment-texture pointer-events-none opacity-40" />
        <div className="relative z-10 space-y-5">
        <h3 className="text-sm font-bold font-civ-serif text-[oklch(0.40_0.08_145)] dark:text-[oklch(0.75_0.09_145)] tracking-wide">
          {locale === "zh" ? "成长路线已生成" : "Growth Route Generated"}
        </h3>

        {/* Growth Chain */}
        {chainNodes.length > 0 && (
          <GrowthChain nodes={chainNodes} className="overflow-x-auto pb-2" />
        )}

        {/* Targeted Buildings */}
        {targetedBuildings && targetedBuildings.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold font-civ-serif text-[oklch(0.50_0.03_75)] dark:text-[oklch(0.65_0.035_82)] uppercase tracking-wider">
              {locale === "zh" ? "目标建筑" : "Targeted Buildings"}
            </h4>
            <div className="space-y-1.5">
              {targetedBuildings.slice(0, 5).map((tb) => (
                <div
                  key={tb.building_id}
                  className="flex items-center gap-2 rounded-lg bg-[oklch(0.55_0.08_145_/_0.06)] dark:bg-[oklch(0.55_0.08_145_/_0.10)] border border-[oklch(0.55_0.08_145_/_0.15)] px-3 py-2"
                >
                  <span className="text-lg">{tb.building_icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium font-civ-serif text-[oklch(0.35_0.02_70)] dark:text-[oklch(0.85_0.04_80)] truncate">
                      {locale === "en" && tb.building_name_en
                        ? tb.building_name_en
                        : tb.building_name}
                    </p>
                    {tb.remaining_milestones > 0 && (
                      <p className="text-[10px] font-civ-serif text-[oklch(0.50_0.03_75)] dark:text-[oklch(0.62_0.04_80)]">
                        {tb.remaining_milestones}{" "}
                        {locale === "zh" ? "个里程碑" : "milestones"}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] font-civ-serif text-[oklch(0.50_0.03_75)] dark:text-[oklch(0.62_0.04_80)] tabular-nums">
                    Lv.{tb.max_level > 0 ? `1→${tb.max_level}` : "1"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reward Estimates */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-[oklch(0.65_0.10_80_/_0.06)] border border-[oklch(0.65_0.10_80_/_0.15)] p-3 text-center">
            <p className="text-lg font-bold text-[oklch(0.55_0.10_80)] dark:text-[oklch(0.78_0.10_80)] flex justify-center">
              <QuestScrollIcon name="star" size={20} />
            </p>
            <p className="text-[10px] font-civ-serif text-[oklch(0.50_0.03_75)] dark:text-[oklch(0.62_0.04_80)] mt-1">
              {locale === "zh" ? "文明指数提升" : "Civ Score Boost"}
            </p>
          </div>
          <div className="rounded-lg bg-[oklch(0.55_0.08_145_/_0.06)] border border-[oklch(0.55_0.08_145_/_0.15)] p-3 text-center">
            <p className="text-lg font-bold font-civ-serif text-[oklch(0.45_0.08_145)] dark:text-[oklch(0.72_0.09_145)]">
              {generationResult.estimated_weeks}w
            </p>
            <p className="text-[10px] font-civ-serif text-[oklch(0.50_0.03_75)] dark:text-[oklch(0.62_0.04_80)] mt-1">
              {locale === "zh" ? "预计周期" : "Est. Duration"}
            </p>
          </div>
          <div className="rounded-lg bg-[oklch(0.72_0.05_80_/_0.10)] dark:bg-[oklch(0.45_0.04_80_/_0.15)] p-3 text-center">
            <p className="text-lg font-bold font-civ-serif text-[oklch(0.35_0.02_70)] dark:text-[oklch(0.85_0.04_80)]">
              {targetedBuildings?.length ?? generationResult.milestone_count}
            </p>
            <p className="text-[10px] font-civ-serif text-[oklch(0.50_0.03_75)] dark:text-[oklch(0.62_0.04_80)] mt-1">
              {locale === "zh" ? "涉及技能" : "Skills"}
            </p>
          </div>
          <div className="rounded-lg bg-[oklch(0.72_0.05_80_/_0.10)] dark:bg-[oklch(0.45_0.04_80_/_0.15)] p-3 text-center">
            <p className="text-lg font-bold font-civ-serif text-[oklch(0.35_0.02_70)] dark:text-[oklch(0.85_0.04_80)]">
              {generationResult.quests_generated ?? "-"}
            </p>
            <p className="text-[10px] font-civ-serif text-[oklch(0.50_0.03_75)] dark:text-[oklch(0.62_0.04_80)] mt-1">
              {locale === "zh" ? "生成Quest" : "Quests"}
            </p>
          </div>
        </div>

        {/* Path summary */}
        {generationResult.path_summary && (
          <p className="text-xs font-civ-serif italic text-[oklch(0.50_0.03_75)] dark:text-[oklch(0.65_0.035_82)] leading-relaxed">
            {generationResult.path_summary}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => router.push(`/paths/${createdPathId}`)}
            className="flex-1 scroll-seal-btn px-4 py-2.5 text-sm"
          >
            {locale === "zh" ? "查看完整路线" : "View Full Route"}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="rounded-xl border border-[oklch(0.72_0.06_80_/_0.25)] px-4 py-2.5 text-sm font-medium font-civ-serif text-[oklch(0.50_0.03_75)] dark:text-[oklch(0.65_0.035_82)] hover:bg-[oklch(0.92_0.02_80_/_0.40)] dark:hover:bg-[oklch(0.22_0.012_78_/_0.35)] transition-colors"
          >
            {locale === "zh" ? "重新规划" : "Replan"}
          </button>
        </div>
        </div>
      </div>
    );
  }

  // ── State 3: Empty (default) ────────────────────────────────────────
  return (
    <div className="relative rounded-xl scroll-fuse ornamental-border p-6 space-y-6 sticky top-6 overflow-hidden">
      <div className="absolute inset-0 parchment-texture pointer-events-none opacity-40" />
      <div className="relative z-10 space-y-6">
      <h3 className="text-sm font-bold font-civ-serif text-[oklch(0.30_0.025_70)] dark:text-[oklch(0.88_0.04_80)] tracking-wide">
        {locale === "zh" ? "成长路线预览" : "Growth Route Preview"}
      </h3>

      {/* Simplified compass / direction indicator */}
      <div className="flex flex-col items-center gap-4 py-8">
        {/* Mini compass SVG */}
        <svg
          viewBox="0 0 120 120"
          width={120}
          height={120}
          className="overflow-visible"
        >
          {/* Outer ring */}
          <circle
            cx={60}
            cy={60}
            r={50}
            fill="none"
            stroke="oklch(0.65 0.06 80)"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            opacity={0.5}
          />
          {/* Inner ring */}
          <circle
            cx={60}
            cy={60}
            r={30}
            fill="none"
            stroke="oklch(0.65 0.06 80)"
            strokeWidth={0.75}
            opacity={0.35}
          />
          {/* Center */}
          <circle
            cx={60}
            cy={60}
            r={20}
            fill="oklch(0.7 0.12 85 / 0.08)"
            stroke="oklch(0.7 0.12 85 / 0.2)"
            strokeWidth={1}
          />
          <g transform="translate(60, 58)">
            <circle cx="0" cy="0" r="8" fill="none" stroke="oklch(0.5 0.08 85)" strokeWidth="1.5" />
            <path d="M0 -6 L2 0 L0 6 L-2 0 Z" fill="oklch(0.65 0.12 85)" stroke="none" />
            <circle cx="0" cy="0" r="1.5" fill="oklch(0.5 0.08 85)" />
          </g>
          <text
            x={60}
            y={78}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={8}
            fill="oklch(0.45 0.01 90)"
            fontWeight={500}
          >
            {locale === "zh" ? "文明方向" : "Direction"}
          </text>
          {/* Cardinal dots */}
          {[0, 90, 180, 270].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const cx = 60 + 42 * Math.cos(rad);
            const cy = 60 + 42 * Math.sin(rad);
            return (
              <circle
                key={angle}
                cx={cx}
                cy={cy}
                r={3}
                fill="oklch(0.65 0.08 85)"
                opacity={0.5}
              />
            );
          })}
        </svg>

        <div className="text-center space-y-2">
          <p className="text-sm font-medium font-civ-serif text-[oklch(0.35_0.02_70)] dark:text-[oklch(0.85_0.04_80)]">
            {locale === "zh"
              ? "描述你的成长目标"
              : "Describe your growth goal"}
          </p>
          <p className="text-xs font-civ-serif italic text-[oklch(0.50_0.03_75)] dark:text-[oklch(0.62_0.04_80)] max-w-[240px]">
            {locale === "zh"
              ? "奥德赛将为你规划文明成长路线，展示预计解锁的建筑、涉及技能和文明指数变化"
              : "Odyssey will plan your civilization growth route, showing projected buildings, skills, and civ score changes"}
          </p>
        </div>
      </div>

      {/* If there's an existing direction, show mini direction info */}
      {direction && direction.active_paths.length > 0 && (
        <div className="rounded-lg bg-[oklch(0.55_0.08_145_/_0.06)] dark:bg-[oklch(0.55_0.08_145_/_0.10)] border border-[oklch(0.55_0.08_145_/_0.15)] p-3">
          <p className="text-[10px] font-civ-serif text-[oklch(0.50_0.03_75)] dark:text-[oklch(0.62_0.04_80)] mb-1 uppercase tracking-wider">
            {locale === "zh" ? "当前方向" : "Current Direction"}
          </p>
          <div className="flex items-center gap-1.5 flex-wrap">
            {direction.active_paths.slice(0, 2).map((p) => (
              <span
                key={p.path_id}
                className="rounded-full bg-[oklch(0.55_0.08_145_/_0.10)] border border-[oklch(0.55_0.08_145_/_0.15)] px-2 py-0.5 text-[10px] font-medium font-civ-serif text-[oklch(0.40_0.08_145)] dark:text-[oklch(0.72_0.09_145)]"
              >
                {p.path_title}
              </span>
            ))}
          </div>
          {direction.suggested_focus && (
            <p className="text-[10px] font-civ-serif italic text-[oklch(0.50_0.03_75)] dark:text-[oklch(0.62_0.04_80)] mt-1.5">
              {direction.suggested_focus}
            </p>
          )}
        </div>
      )}
      </div>
    </div>
  );
}

/** Build growth chain visualization nodes from generation results */
function buildGrowthChainNodes(
  result: GeneratePathResponse,
  buildings: TargetedBuilding[] | null,
  _goalText: string
): GrowthChainNode[] {
  const nodes: GrowthChainNode[] = [];

  // If we have targeted buildings, use their names for a skill chain
  if (buildings && buildings.length > 0) {
    // Use the first 3-4 building names as skill nodes, last one as building target
    const skillBuildings = buildings.slice(0, Math.min(4, buildings.length));
    skillBuildings.forEach((b, i) => {
      const isLast = i === skillBuildings.length - 1;
      nodes.push({
        label: b.building_name_en || b.building_name,
        icon: b.building_icon,
        isBuilding: isLast,
      });
    });
    return nodes;
  }

  // Fallback: use milestone count to create generic nodes
  const count = Math.max(3, Math.min(result.milestone_count, 5));
  for (let i = 0; i < count; i++) {
    const isLast = i === count - 1;
    nodes.push({
      label: `Stage ${i + 1}`,
      isBuilding: isLast,
    });
  }
  return nodes;
}
