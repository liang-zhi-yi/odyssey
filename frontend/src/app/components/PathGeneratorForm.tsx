"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/hooks/useLocale";
import { learningPathService } from "@/services/learningPath.service";
import type { GeneratePathResponse } from "@/types/learningPath";

interface PathGeneratorFormProps {
  onSuccess?: (pathId: string) => void;
}

export function PathGeneratorForm({ onSuccess }: PathGeneratorFormProps) {
  const { t } = useLocale();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generation result state
  const [generationResult, setGenerationResult] =
    useState<GeneratePathResponse | null>(null);
  const [createdPathId, setCreatedPathId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setCreating(true);
    setError(null);
    setGenerationResult(null);
    setCreatedPathId(null);

    try {
      const result = await learningPathService.createPath({
        title: title.trim(),
        description: description.trim() || null,
        category: category.trim() || null,
        target_date: targetDate || null,
        generate_with_ai: true,
      });

      setCreatedPathId(result.id);

      // Notify parent so checkpoint tab can refresh
      onSuccess?.(result.id);

      if (result.path_metadata) {
        setGenerationResult({
          path_id: result.id,
          path_summary: result.path_metadata.path_summary || "",
          difficulty: result.difficulty,
          estimated_weeks: result.path_metadata.estimated_weeks || 0,
          milestone_count: result.milestone_count || 0,
          total_checkpoints: 0,
        });
      }
    } catch (err: any) {
      setError(err?.message || t("pathGenerator.createError"));
    } finally {
      setCreating(false);
    }
  };

  const handleViewPath = () => {
    if (createdPathId) {
      router.push(`/paths/${createdPathId}`);
    }
  };

  const handleReset = () => {
    setTitle("");
    setDescription("");
    setCategory("");
    setTargetDate("");
    setError(null);
    setGenerationResult(null);
    setCreatedPathId(null);
  };

  if (generationResult) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-success/10 p-1.5">
            <svg
              className="w-5 h-5 text-success"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold">{t("pathGenerator.success")}</h3>
        </div>

        <p className="text-sm text-muted-foreground">
          {generationResult.path_summary}
        </p>

        {/* Generation stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="rounded-lg bg-secondary/30 p-3 text-center">
            <p className="text-xl font-bold">
              {"★".repeat(Math.min(generationResult.difficulty, 5))}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {t("pathGenerator.difficulty")}
            </p>
          </div>
          <div className="rounded-lg bg-secondary/30 p-3 text-center">
            <p className="text-xl font-bold">
              {generationResult.estimated_weeks}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {t("pathGenerator.estimatedWeeks")}
            </p>
          </div>
          <div className="rounded-lg bg-secondary/30 p-3 text-center">
            <p className="text-xl font-bold">
              {generationResult.milestone_count}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {t("pathGenerator.milestones")}
            </p>
          </div>
          {generationResult.quests_generated != null && generationResult.quests_generated > 0 && (
            <div className="rounded-lg bg-success/10 p-3 text-center">
              <p className="text-xl font-bold text-success">
                {generationResult.quests_generated}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {t("pathGenerator.questsGenerated")}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleViewPath}
            className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
          >
            {t("pathGenerator.viewPath")}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
          >
            {t("pathGenerator.createAnother")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border bg-card p-6 space-y-4"
    >
      <div>
        <h3 className="text-lg font-semibold mb-1">{t("pathGenerator.title")}</h3>
        <p className="text-xs text-muted-foreground">
          {t("pathGenerator.subtitle")}
        </p>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium mb-1">{t("pathGenerator.fieldTitle")}</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("pathGenerator.titlePlaceholder")}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-1">
          {t("pathGenerator.fieldDescription")}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("pathGenerator.descriptionPlaceholder")}
          rows={3}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Category + Target Date */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">
            {t("pathGenerator.fieldCategory")}
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder={t("pathGenerator.categoryPlaceholder")}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">
            {t("pathGenerator.fieldTargetDate")}
          </label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={creating || !title.trim()}
        className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {creating ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            {t("pathGenerator.generating")}
          </>
        ) : (
          t("pathGenerator.generateButton")
        )}
      </button>
    </form>
  );
}
