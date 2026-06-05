"use client";

import Link from "next/link";
import { useLocale } from "@/hooks/useLocale";
import type { LearningPath } from "@/types/learningPath";
import { PATH_STATUS_LABELS, PATH_STATUS_LABELS_ZH } from "@/types/learningPath";

interface LearningPathCardProps {
  path: LearningPath;
  onSelect?: (pathId: string) => void;
  selecting?: boolean;
  /** Optional: world buildings for showing target building pills */
  worldBuildings?: { template: { skill_id: string; name: string; name_en: string | null; icon: string } | null; level: number }[];
}

const DIFFICULTY_COLORS: Record<number, string> = {
  1: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  2: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  3: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  4: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  5: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  COMPLETED:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  ABANDONED:
    "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

const PROGRESS_COLORS: Record<string, string> = {
  ACTIVE: "bg-blue-500",
  COMPLETED: "bg-green-500",
  ABANDONED: "bg-gray-400",
};

function resolveName(
  zh: string,
  en: string | null | undefined,
  locale: string
): string {
  return locale === "en" && en ? en : zh;
}

export function LearningPathCard({
  path,
  onSelect,
  selecting,
  worldBuildings,
}: LearningPathCardProps) {
  const { locale } = useLocale();

  const statusColor = STATUS_COLORS[path.status] ?? STATUS_COLORS.ACTIVE;
  const progressColor = PROGRESS_COLORS[path.status] ?? PROGRESS_COLORS.ACTIVE;
  const diffColor =
    DIFFICULTY_COLORS[path.difficulty] ?? DIFFICULTY_COLORS[3];

  const statusLabel =
    locale === "zh"
      ? PATH_STATUS_LABELS_ZH[path.status] ?? path.status
      : PATH_STATUS_LABELS[path.status] ?? path.status;

  // Resolve target buildings from path metadata
  const targetSkills: string[] = path.path_metadata?.recommended_skills ?? [];
  const targetBuildings = worldBuildings
    ? targetSkills
        .map((skillName) => {
          const b = worldBuildings.find(
            (wb) =>
              wb.template?.name === skillName ||
              wb.template?.name_en === skillName
          );
          return b?.template
            ? { name: b.template.name, name_en: b.template.name_en, icon: b.template.icon, level: b.level }
            : null;
        })
        .filter(Boolean) as { name: string; name_en: string | null; icon: string; level: number }[]
    : [];

  return (
    <Link
      href={`/paths/${path.id}`}
      className="block rounded-2xl border border-border bg-card p-5 shadow-card transition-all duration-300 hover:shadow-card-hover hover:border-primary/20"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-semibold text-sm truncate flex-1">{path.title}</h4>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}
        >
          {statusLabel}
        </span>
      </div>

      {/* Description */}
      {path.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {path.description}
        </p>
      )}

      {/* Badges: type + difficulty */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 flex-wrap">
        {/* Path type badge */}
        <span className="rounded-md bg-secondary px-2 py-0.5">
          {path.path_type === "AI_GENERATED" ? "AI Customized" : "Official"}
        </span>

        {/* Difficulty dots */}
        <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${diffColor}`}>
          {"★".repeat(path.difficulty)}
          {"☆".repeat(5 - path.difficulty)}
        </span>

        {/* Milestone count */}
        {path.milestone_count != null && (
          <span className="rounded-md bg-secondary px-2 py-0.5">
            {path.milestone_count} milestones
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 rounded-full bg-secondary overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
            style={{ width: `${path.progress_pct}%` }}
          />
        </div>
        <span className="text-xs font-medium text-muted-foreground w-9 text-right">
          {path.progress_pct}%
        </span>
      </div>

      {/* Target buildings */}
      {targetBuildings.length > 0 && (
        <div className="mt-2 flex items-center gap-1 flex-wrap">
          <span className="text-[10px] text-muted-foreground/60">
            {locale === "zh" ? "目标:" : "Targets:"}
          </span>
          {targetBuildings.map((b) => (
            <span
              key={b.name}
              className="inline-flex items-center gap-0.5 rounded bg-secondary/60 px-1.5 py-0.5 text-[10px] text-muted-foreground"
            >
              <span>{b.icon}</span>
              <span className="truncate max-w-[5rem]">
                {locale === "en" && b.name_en ? b.name_en : b.name}
              </span>
              <span className="tabular-nums">Lv.{b.level}</span>
            </span>
          ))}
        </div>
      )}

      {/* Select button for preset paths */}
      {onSelect && (
        <div className="mt-3 pt-3 border-t border-border">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect(path.id);
            }}
            disabled={selecting}
            className="w-full rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
          >
            {selecting ? "Selecting..." : "Select"}
          </button>
        </div>
      )}
    </Link>
  );
}
