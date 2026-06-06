"use client";

import { useState } from "react";
import { useLocale } from "@/hooks/useLocale";
import { learningPathService } from "@/services/learningPath.service";
import type {
  LearningPathMilestone,
  PathCheckpoint,
  GeneratedQuest,
  TargetedBuilding,
} from "@/types/learningPath";

interface PathMilestoneListProps {
  pathId: string;
  milestones: LearningPathMilestone[];
  onToggle?: (milestoneId: string) => void;
  /** Optional: targeted buildings from path → skill mapping */
  targetedBuildings?: TargetedBuilding[] | null;
}

function resolveName(
  zh: string,
  en: string | null | undefined,
  locale: string
): string {
  return locale === "en" && en ? en : zh;
}

const QUEST_GEN_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: {
    label: "Awaiting",
    color:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  GENERATED: {
    label: "Ready",
    color:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  FAILED: {
    label: "Failed",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
};

export function PathMilestoneList({
  pathId,
  milestones,
  onToggle,
  targetedBuildings,
}: PathMilestoneListProps) {
  const { locale } = useLocale();
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(
    null
  );
  const [generatingCheckpoint, setGeneratingCheckpoint] = useState<
    string | null
  >(null);
  const [generatedQuests, setGeneratedQuests] = useState<
    Record<string, GeneratedQuest[]>
  >({});
  const [genError, setGenError] = useState<Record<string, string>>({});

  const handleGenerateQuests = async (
    milestoneId: string,
    checkpointId: string
  ) => {
    setGeneratingCheckpoint(checkpointId);
    setGenError((prev) => {
      const next = { ...prev };
      delete next[checkpointId];
      return next;
    });
    try {
      const res = await learningPathService.generateQuests(
        pathId,
        milestoneId,
        checkpointId
      );
      setGeneratedQuests((prev) => ({
        ...prev,
        [checkpointId]: res.quests,
      }));
    } catch (err: any) {
      setGenError((prev) => ({
        ...prev,
        [checkpointId]: err?.message || "Failed to generate quests",
      }));
    } finally {
      setGeneratingCheckpoint(null);
    }
  };

  if (milestones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground">No milestones yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {milestones.map((milestone) => {
        const isExpanded = expandedMilestone === milestone.id;
        return (
          <div
            key={milestone.id}
            className="rounded-xl border border-border bg-background overflow-hidden"
          >
            {/* Milestone header */}
            <button
              type="button"
              onClick={() =>
                setExpandedMilestone(isExpanded ? null : milestone.id)
              }
              className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                {/* Completion checkbox */}
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    milestone.is_completed
                      ? "bg-success border-success text-success-foreground"
                      : "border-border"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle?.(milestone.id);
                  }}
                >
                  {milestone.is_completed && (
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-semibold">
                    {resolveName(milestone.title, milestone.title_en, locale)}
                  </h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    {milestone.skill_name && (
                      <span className="text-xs text-muted-foreground">
                        🎯 {milestone.skill_name}
                      </span>
                    )}
                    {/* Building indicator from targetedBuildings */}
                    {milestone.skill_id && targetedBuildings && (() => {
                      const tb = targetedBuildings.find(
                        (b) => b.skill_id === milestone.skill_id
                      );
                      return tb ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-primary/70 bg-primary/5 rounded px-1.5 py-0.5">
                          <span>{tb.building_icon}</span>
                          <span>{locale === "en" && tb.building_name_en ? tb.building_name_en : tb.building_name}</span>
                        </span>
                      ) : null;
                    })()}
                  </div>
                </div>
              </div>

              {/* Expand/collapse chevron + checkpoint count */}
              <div className="flex items-center gap-2">
                {milestone.checkpoints && milestone.checkpoints.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {milestone.checkpoints.length} checkpoints
                  </span>
                )}
                <svg
                  className={`w-4 h-4 text-muted-foreground transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </button>

            {/* Milestone description (always visible when present) */}
            {milestone.description && (
              <div className="px-4 pb-3">
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {resolveName(
                    milestone.description,
                    milestone.description_en,
                    locale
                  )}
                </p>
              </div>
            )}

            {/* Checkpoints (expandable) */}
            {isExpanded && milestone.checkpoints && (
              <div className="border-t border-border px-4 py-3 space-y-2 bg-secondary/10">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  Checkpoints
                </p>
                {milestone.checkpoints.map((checkpoint) => {
                  const genStatus =
                    QUEST_GEN_LABELS[checkpoint.quest_generation_status] ??
                    QUEST_GEN_LABELS.PENDING;
                  const quests = generatedQuests[checkpoint.id];
                  const isGenerating = generatingCheckpoint === checkpoint.id;
                  const errorMsg = genError[checkpoint.id];

                  return (
                    <div
                      key={checkpoint.id}
                      className="rounded-lg border border-border bg-background p-3 space-y-2"
                    >
                      {/* Checkpoint header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-semibold">
                            {resolveName(
                              checkpoint.title,
                              checkpoint.title_en,
                              locale
                            )}
                          </h5>
                          {checkpoint.description && (
                            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                              {resolveName(
                                checkpoint.description,
                                checkpoint.description_en,
                                locale
                              )}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-muted-foreground">
                            Score: {checkpoint.required_score}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${genStatus.color}`}
                          >
                            {genStatus.label}
                          </span>
                        </div>
                      </div>

                      {/* Generate quests button */}
                      {checkpoint.quest_generation_status === "PENDING" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleGenerateQuests(
                              milestone.id,
                              checkpoint.id
                            )
                          }
                          disabled={isGenerating}
                          className="w-full rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 disabled:opacity-50 transition-colors"
                        >
                          {isGenerating ? "Generating..." : "Generate Quests"}
                        </button>
                      )}

                      {/* Generation error */}
                      {errorMsg && (
                        <p className="text-xs text-destructive">{errorMsg}</p>
                      )}

                      {/* Generated quests */}
                      {quests && quests.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                            Generated Quests ({quests.length})
                          </p>
                          {quests.map((q) => (
                            <div
                              key={q.id}
                              className="flex items-center gap-2 rounded bg-secondary/50 px-2.5 py-1.5"
                            >
                              <span className="flex-1 text-xs truncate">
                                {q.title || q.skill_name || "Quest"}
                              </span>
                              {q.quest_id && (
                                <a
                                  href={`/quests/${q.quest_id}`}
                                  className="text-[10px] text-primary hover:underline shrink-0"
                                >
                                  View
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Pre-generated quests from API */}
                      {!quests &&
                        checkpoint.generated_quests &&
                        checkpoint.generated_quests.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                              Quests ({checkpoint.generated_quests.length})
                            </p>
                            {checkpoint.generated_quests.map((q) => (
                              <div
                                key={q.id}
                                className="flex items-center gap-2 rounded bg-secondary/50 px-2.5 py-1.5"
                              >
                                <span className="flex-1 text-xs truncate">
                                  {q.title || q.skill_name || "Quest"}
                                </span>
                                {q.quest_id && (
                                  <a
                                    href={`/quests/${q.quest_id}`}
                                    className="text-[10px] text-primary hover:underline shrink-0"
                                  >
                                    View
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
