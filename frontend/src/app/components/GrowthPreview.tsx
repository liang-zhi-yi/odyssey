"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "@/hooks/useLocale";
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
  { icon: "🔍", zh: "分析成长目标", en: "Analyzing growth goal" },
  { icon: "🧠", zh: "匹配能力技能", en: "Matching skills" },
  { icon: "🏗️", zh: "规划建筑路径", en: "Planning building path" },
  { icon: "📋", zh: "生成成长路线", en: "Generating growth route" },
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
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-6 sticky top-6">
        <h3 className="text-sm font-semibold">
          {locale === "zh" ? "🧭 文明成长预览" : "🧭 Civilization Growth Preview"}
        </h3>

        {/* Pulsing center */}
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="relative">
            <div className="h-16 w-16 rounded-full bg-[#8B9D83]/10 border-2 border-[#8B9D83]/30 flex items-center justify-center">
              <span className="text-2xl animate-pulse">🌟</span>
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-[#8B9D83]/20 animate-ping" />
          </div>
          <p className="text-sm font-medium text-[#8B9D83]">
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
                className={`flex items-center gap-3 text-xs transition-all duration-500 ${
                  isActive
                    ? "text-[#8B9D83] font-medium"
                    : isDone
                    ? "text-muted-foreground/50"
                    : "text-muted-foreground/30"
                }`}
              >
                <span className="w-5 text-center">{phase.icon}</span>
                <span>{locale === "en" ? phase.en : phase.zh}</span>
                {isActive && (
                  <span className="ml-auto flex gap-0.5">
                    <span className="h-1 w-1 rounded-full bg-[#8B9D83] animate-bounce" />
                    <span
                      className="h-1 w-1 rounded-full bg-[#8B9D83] animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="h-1 w-1 rounded-full bg-[#8B9D83] animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </span>
                )}
                {isDone && <span className="ml-auto text-[#8B9D83]">✓</span>}
              </div>
            );
          })}
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
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-5 sticky top-6">
        <h3 className="text-sm font-semibold text-[#8B9D83]">
          {locale === "zh" ? "🌱 成长路线已生成" : "🌱 Growth Route Generated"}
        </h3>

        {/* Growth Chain */}
        {chainNodes.length > 0 && (
          <GrowthChain nodes={chainNodes} className="overflow-x-auto pb-2" />
        )}

        {/* Targeted Buildings */}
        {targetedBuildings && targetedBuildings.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground">
              {locale === "zh" ? "🏗️ 目标建筑" : "🏗️ Targeted Buildings"}
            </h4>
            <div className="space-y-1.5">
              {targetedBuildings.slice(0, 5).map((tb) => (
                <div
                  key={tb.building_id}
                  className="flex items-center gap-2 rounded-lg bg-secondary/30 px-3 py-2"
                >
                  <span className="text-lg">{tb.building_icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      {locale === "en" && tb.building_name_en
                        ? tb.building_name_en
                        : tb.building_name}
                    </p>
                    {tb.remaining_milestones > 0 && (
                      <p className="text-[10px] text-muted-foreground">
                        {tb.remaining_milestones}{" "}
                        {locale === "zh" ? "个里程碑" : "milestones"}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    Lv.{tb.max_level > 0 ? `1→${tb.max_level}` : "1"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reward Estimates */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-[#C4A77D]/5 border border-[#C4A77D]/10 p-3 text-center">
            <p className="text-lg font-bold text-[#C4A77D]">
              ⭐
            </p>
            <p className="text-[10px] text-muted-foreground">
              {locale === "zh" ? "文明指数提升" : "Civ Score Boost"}
            </p>
          </div>
          <div className="rounded-lg bg-[#8B9D83]/5 border border-[#8B9D83]/10 p-3 text-center">
            <p className="text-lg font-bold text-[#8B9D83]">
              {generationResult.estimated_weeks}w
            </p>
            <p className="text-[10px] text-muted-foreground">
              {locale === "zh" ? "预计周期" : "Est. Duration"}
            </p>
          </div>
          <div className="rounded-lg bg-secondary/50 p-3 text-center">
            <p className="text-lg font-bold">
              {targetedBuildings?.length ?? generationResult.milestone_count}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {locale === "zh" ? "涉及技能" : "Skills"}
            </p>
          </div>
          <div className="rounded-lg bg-secondary/50 p-3 text-center">
            <p className="text-lg font-bold">
              {generationResult.quests_generated ?? "-"}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {locale === "zh" ? "生成Quest" : "Quests"}
            </p>
          </div>
        </div>

        {/* Path summary */}
        {generationResult.path_summary && (
          <p className="text-xs text-muted-foreground leading-relaxed">
            {generationResult.path_summary}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => router.push(`/paths/${createdPathId}`)}
            className="flex-1 rounded-xl bg-[#8B9D83] hover:bg-[#7A8C72] px-4 py-2.5 text-sm font-semibold text-white transition-colors"
          >
            {locale === "zh" ? "查看完整路线" : "View Full Route"}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
          >
            {locale === "zh" ? "重新规划" : "Replan"}
          </button>
        </div>
      </div>
    );
  }

  // ── State 3: Empty (default) ────────────────────────────────────────
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-6 sticky top-6">
      <h3 className="text-sm font-semibold">
        {locale === "zh" ? "🧭 成长路线预览" : "🧭 Growth Route Preview"}
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
            stroke="oklch(0.85 0.02 100)"
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
            stroke="oklch(0.85 0.02 100)"
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
          <text
            x={60}
            y={58}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={18}
          >
            🧭
          </text>
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
          <p className="text-sm font-medium text-foreground">
            {locale === "zh"
              ? "描述你的成长目标"
              : "Describe your growth goal"}
          </p>
          <p className="text-xs text-muted-foreground max-w-[240px]">
            {locale === "zh"
              ? "奥德赛将为你规划文明成长路线，展示预计解锁的建筑、涉及技能和文明指数变化"
              : "Odyssey will plan your civilization growth route, showing projected buildings, skills, and civ score changes"}
          </p>
        </div>
      </div>

      {/* If there's an existing direction, show mini direction info */}
      {direction && direction.active_paths.length > 0 && (
        <div className="rounded-lg bg-secondary/30 p-3">
          <p className="text-[10px] text-muted-foreground mb-1">
            {locale === "zh" ? "当前方向" : "Current Direction"}
          </p>
          <div className="flex items-center gap-1.5 flex-wrap">
            {direction.active_paths.slice(0, 2).map((p) => (
              <span
                key={p.path_id}
                className="rounded-full bg-[#8B9D83]/10 border border-[#8B9D83]/15 px-2 py-0.5 text-[10px] font-medium text-[#8B9D83]"
              >
                {p.path_title}
              </span>
            ))}
          </div>
          {direction.suggested_focus && (
            <p className="text-[10px] text-muted-foreground mt-1.5">
              💡 {direction.suggested_focus}
            </p>
          )}
        </div>
      )}
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
