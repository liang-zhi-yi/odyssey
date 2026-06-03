"use client";

import type { QuestDetail as QuestDetailType } from "@/types/quest";
import {
  DIFFICULTY_LABELS,
  QUEST_TYPE_LABELS,
} from "@/types/quest";
import { Loading } from "./Loading";
import { ErrorState } from "./ErrorState";

interface QuestDetailProps {
  quest: QuestDetailType | null;
  isLoading: boolean;
  error?: string | null;
  onAccept?: () => void;
  isAccepting?: boolean;
  alreadyAccepted?: boolean;
}

/**
 * Full quest detail display used in the quest detail page.
 * Shows all quest info with accept / go-to-submission action.
 */
export function QuestDetail({
  quest,
  isLoading,
  error,
  onAccept,
  isAccepting = false,
  alreadyAccepted = false,
}: QuestDetailProps) {
  if (isLoading) {
    return <Loading text="Loading quest..." />;
  }

  if (error) {
    return <ErrorState message="加载失败" detail={error} />;
  }

  if (!quest) {
    return (
      <div className="rounded-xl border border-border bg-background p-6 text-center">
        <p className="text-sm text-muted-foreground">Quest not found</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-background p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <h2 className="text-xl font-bold">{quest.title}</h2>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            {DIFFICULTY_LABELS[quest.difficulty] || quest.difficulty}
          </span>
          <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {QUEST_TYPE_LABELS[quest.quest_type] || quest.quest_type}
          </span>
        </div>
      </div>

      {/* Description */}
      {quest.description && (
        <div className="prose prose-sm max-w-none text-muted-foreground mb-6">
          <p className="whitespace-pre-wrap">{quest.description}</p>
        </div>
      )}

      {/* Meta */}
      <div className="grid grid-cols-2 gap-3 text-sm mb-6">
        <div>
          <span className="text-muted-foreground">交付物类型</span>
          <p className="font-medium mt-0.5">{quest.expected_deliverable}</p>
        </div>
        <div>
          <span className="text-muted-foreground">关联技能</span>
          <p className="font-medium mt-0.5 font-mono text-xs">{quest.skill_id}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-border pt-4">
        {alreadyAccepted ? (
          <div className="rounded-lg bg-success/10 px-4 py-3 text-sm text-success font-medium text-center">
            ✅ 你已接受此Quest — 前往提交你的成果
          </div>
        ) : (
          <button
            onClick={onAccept}
            disabled={isAccepting}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
          >
            {isAccepting ? "接受中..." : "接受 Quest"}
          </button>
        )}
      </div>
    </div>
  );
}
