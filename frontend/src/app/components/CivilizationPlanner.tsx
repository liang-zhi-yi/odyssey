"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/hooks/useLocale";
import { learningPathService } from "@/services/learningPath.service";
import { CivilizationStatusBanner } from "./CivilizationStatusBanner";
import { MentorPlanner } from "./MentorPlanner";
import { GrowthPreview } from "./GrowthPreview";
import type {
  GeneratePathResponse,
  LearningPathDetail,
  TargetedBuilding,
} from "@/types/learningPath";
import type { World, CivilizationDirection } from "@/types/world";

interface CivilizationPlannerProps {
  world: World | null;
  direction: CivilizationDirection | null;
  isWorldLoading: boolean;
  isDirectionLoading: boolean;
  activePathsCount: number;
  onPathCreated: (pathId: string) => void;
}

/** Build a GeneratePathResponse from a resolved path detail (used when the
 *  direct generate call timed out but the backend finished in the background). */
function buildResultFromPath(
  p: LearningPathDetail,
  pathId: string
): GeneratePathResponse {
  const totalCheckpoints = (p.milestones ?? []).reduce(
    (sum, m) => sum + (m.checkpoints?.length ?? 0),
    0
  );
  const totalQuests = (p.milestones ?? []).reduce(
    (sum, m) =>
      sum +
      (m.checkpoints ?? []).reduce((s, cp) => s + (cp.generated_quests?.length ?? 0), 0),
    0
  );
  return {
    path_id: pathId,
    path_summary: p.path_metadata?.path_summary ?? p.description ?? "",
    difficulty: p.difficulty ?? 0,
    estimated_weeks: p.path_metadata?.estimated_weeks ?? 0,
    milestone_count: p.milestones?.length ?? 0,
    total_checkpoints: totalCheckpoints,
    quests_generated: totalQuests,
  };
}

/** Poll until the path's structure (milestones + checkpoints) exists.
 *
 * The AI generation is a long backend call; if it times out at the proxy the
 * backend still continues. We keep the planner's generating preview visible
 * and poll until the structure is committed before navigating to the detail.
 */
async function pollUntilReady(pathId: string): Promise<GeneratePathResponse> {
  const MAX = 60; // 60 * 3s = 180s
  for (let i = 0; i < MAX; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const p = await learningPathService.getPath(pathId).catch(() => null);
    if (p && p.milestones && p.milestones.length > 0) {
      return buildResultFromPath(p, pathId);
    }
  }
  throw new Error("Generation timed out");
}

/**
 * Civilization Planner — reimagined "create learning path" page.
 *
 * Replaces the form-centric PathGeneratorForm with a civilization-themed
 * dual-column layout: left side is mentor-guided goal input, right side
 * shows real-time preview of the projected growth route.
 *
 * Layout:
 * - Top: CivilizationStatusBanner (era, tier, civ score, next target)
 * - Left (3/5): MentorPlanner (greeting, quick goals, goal input, optional fields, submit)
 * - Right (2/5): GrowthPreview (empty → generating → result)
 */
export function CivilizationPlanner({
  world,
  direction,
  isWorldLoading,
  isDirectionLoading,
  activePathsCount,
  onPathCreated,
}: CivilizationPlannerProps) {
  const { t } = useLocale();
  const router = useRouter();

  // ── Generation state ────────────────────────────────────────────────
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationPhase, setGenerationPhase] = useState(0);
  const [generationResult, setGenerationResult] =
    useState<GeneratePathResponse | null>(null);
  const [createdPathId, setCreatedPathId] = useState<string | null>(null);
  const [targetedBuildings, setTargetedBuildings] = useState<
    TargetedBuilding[] | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [submittedGoal, setSubmittedGoal] = useState("");

  const phaseIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ── Phase animation ─────────────────────────────────────────────────
  const startPhaseAnimation = useCallback(() => {
    setGenerationPhase(0);
    let phase = 0;
    phaseIntervalRef.current = setInterval(() => {
      phase += 1;
      if (phase <= 6) {
        setGenerationPhase(phase);
      }
      if (phase >= 6) {
        if (phaseIntervalRef.current) clearInterval(phaseIntervalRef.current);
      }
    }, 1200);
  }, []);

  const stopPhaseAnimation = useCallback(() => {
    if (phaseIntervalRef.current) {
      clearInterval(phaseIntervalRef.current);
      phaseIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopPhaseAnimation();
  }, [stopPhaseAnimation]);

  // ── Generate handler ────────────────────────────────────────────────
  const handleGenerate = useCallback(
    async (goal: string, category: string, _targetWeeks: number, pathTitle: string) => {
      if (!goal.trim() || isGenerating) return;

      setIsGenerating(true);
      setError(null);
      setGenerationResult(null);
      setCreatedPathId(null);
      setTargetedBuildings(null);
      setSubmittedGoal(goal);
      startPhaseAnimation();

      // AI 生成过程由右侧"成长路线预览"展示（阶段动画），不跳转新页面。
      // generatePath 是长耗时请求，可能因代理超时而中断，但后端仍会继续
      // 生成 → 用轮询等待结构就绪，再跳转到路径详情页。
      let createdId: string | null = null;
      try {
        // Step 1: Create path (fast — returns immediately)
        const path = await learningPathService.createPath({
          title: pathTitle || goal.slice(0, 50),
          description: goal,
          category: category || null,
          target_date: null,
          generate_with_ai: false, // 生成由下方 generatePath 显式触发
        });
        createdId = path.id;
        setCreatedPathId(path.id);

        // Step 2: Generate milestones + checkpoints + quests via LLM
        let genResult: GeneratePathResponse | null = null;
        try {
          genResult = await learningPathService.generatePath(path.id);
        } catch {
          genResult = null; // 超时 → 后端仍在后台生成，进入轮询
        }
        if (!genResult) {
          genResult = await pollUntilReady(path.id);
        }

        stopPhaseAnimation();
        setGenerationResult(genResult);
        setSubmittedGoal(goal);
        setIsGenerating(false); // 让成长路线预览显示结果

        // 创建完成 → 短暂展示成长路线结果后跳转到路径详情页
        onPathCreated(path.id);
        await new Promise((r) => setTimeout(r, 1500));
        router.push(`/paths/${path.id}`);
      } catch (err: any) {
        stopPhaseAnimation();
        setIsGenerating(false);
        // 若路径已创建但生成彻底失败，仍跳转详情页（详情页会自动重试生成）
        if (createdId) {
          onPathCreated(createdId);
          router.push(`/paths/${createdId}`);
        } else {
          setError(err?.message || t("pathGenerator.createError"));
        }
      } finally {
        setIsGenerating(false);
      }
    },
    [isGenerating, startPhaseAnimation, stopPhaseAnimation, onPathCreated, router, t]
  );

  // ── Reset handler ───────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setIsGenerating(false);
    setGenerationPhase(0);
    setGenerationResult(null);
    setCreatedPathId(null);
    setTargetedBuildings(null);
    setError(null);
    setSubmittedGoal("");
    stopPhaseAnimation();
  }, [stopPhaseAnimation]);

  return (
    <div className="space-y-6">
      {/* ── Top: Civilization Status Banner ──────────────────────── */}
      <CivilizationStatusBanner
        world={world}
        direction={direction}
        isLoading={isWorldLoading}
      />

      {/* ── Error banner ─────────────────────────────────────────── */}
      {error && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* ── Main: Dual-column layout ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Mentor Planner (3/5) */}
        <div className="lg:col-span-3">
          <MentorPlanner
            world={world}
            activePathsCount={activePathsCount}
            isGenerating={isGenerating}
            onGenerate={handleGenerate}
          />
        </div>

        {/* Right: Growth Preview (2/5) */}
        <div className="lg:col-span-2">
          <GrowthPreview
            world={world}
            direction={direction}
            isGenerating={isGenerating}
            generationPhase={generationPhase}
            generationResult={generationResult}
            targetedBuildings={targetedBuildings}
            createdPathId={createdPathId}
            goalText={submittedGoal}
            onReset={handleReset}
          />
        </div>
      </div>
    </div>
  );
}
