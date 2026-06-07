"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useLocale } from "@/hooks/useLocale";
import { learningPathService } from "@/services/learningPath.service";
import { CivilizationStatusBanner } from "./CivilizationStatusBanner";
import { MentorPlanner } from "./MentorPlanner";
import { GrowthPreview } from "./GrowthPreview";
import type { GeneratePathResponse, TargetedBuilding } from "@/types/learningPath";
import type { World, CivilizationDirection } from "@/types/world";

interface CivilizationPlannerProps {
  world: World | null;
  direction: CivilizationDirection | null;
  isWorldLoading: boolean;
  isDirectionLoading: boolean;
  activePathsCount: number;
  onPathCreated: (pathId: string) => void;
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
      if (phase <= 4) {
        setGenerationPhase(phase);
      }
      if (phase >= 4) {
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
    async (goal: string, category: string, _targetWeeks: number) => {
      if (!goal.trim() || isGenerating) return;

      setIsGenerating(true);
      setError(null);
      setGenerationResult(null);
      setCreatedPathId(null);
      setTargetedBuildings(null);
      setSubmittedGoal(goal);
      startPhaseAnimation();

      try {
        const result = await learningPathService.createPath({
          title: goal.slice(0, 200), // Use goal as title
          description: goal, // Full goal as description
          category: category || null,
          target_date: null,
          generate_with_ai: true,
        });

        stopPhaseAnimation();
        setCreatedPathId(result.id);

        // Extract targeted buildings from the response
        if (result.targeted_buildings) {
          setTargetedBuildings(result.targeted_buildings);
        }

        // Build generation result from path metadata
        const genResult: GeneratePathResponse = {
          path_id: result.id,
          path_summary: result.path_metadata?.path_summary || "",
          difficulty: result.difficulty,
          estimated_weeks: result.path_metadata?.estimated_weeks || 0,
          milestone_count: result.milestone_count || 0,
          total_checkpoints: 0,
        };
        setGenerationResult(genResult);

        onPathCreated(result.id);
      } catch (err: any) {
        stopPhaseAnimation();
        setError(err?.message || t("pathGenerator.createError"));
      } finally {
        setIsGenerating(false);
      }
    },
    [isGenerating, startPhaseAnimation, stopPhaseAnimation, onPathCreated, t]
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
