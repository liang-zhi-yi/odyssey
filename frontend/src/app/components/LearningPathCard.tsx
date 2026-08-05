"use client";

import Link from "next/link";
import { QuestScrollIcon, type ScrollIconName } from "./QuestScrollIcon";
import { useLocale } from "@/hooks/useLocale";
import { skillDisplayName } from "@/lib/skillNames";
import type { LearningPath } from "@/types/learningPath";
import { PATH_STATUS_LABELS, PATH_STATUS_LABELS_ZH } from "@/types/learningPath";

interface LearningPathCardProps {
  path: LearningPath;
  onSelect?: (pathId: string) => void;
  selecting?: boolean;
  /** Optional: world buildings for showing target building pills */
  worldBuildings?: { template: { skill_id: string; name: string; name_en: string | null; icon: string } | null; level: number }[];
}

// Low-key text status markers (◉ ◎ ○) — no colored backgrounds.
const STATUS_MARK: Record<string, string> = {
  ACTIVE: "◉",
  COMPLETED: "◎",
  ABANDONED: "○",
};

const STATUS_ICON: Record<string, ScrollIconName> = {
  ACTIVE: "mission",
  COMPLETED: "scroll",
  ABANDONED: "lock",
};

export function LearningPathCard({
  path,
  onSelect,
  selecting,
  worldBuildings,
}: LearningPathCardProps) {
  const { locale } = useLocale();

  const statusLabel =
    locale === "zh"
      ? PATH_STATUS_LABELS_ZH[path.status] ?? path.status
      : PATH_STATUS_LABELS[path.status] ?? path.status;
  const statusMark = STATUS_MARK[path.status] ?? "◉";
  const statusIcon = STATUS_ICON[path.status] ?? "mission";

  // Resolve target buildings: prefer API-provided targeted_buildings, fallback to worldBuildings
  const targetBuildings =
    path.targeted_buildings && path.targeted_buildings.length > 0
      ? path.targeted_buildings.map((tb) => ({
          name: tb.building_name,
          name_en: tb.building_name_en,
          icon: tb.building_icon,
          level: 0, // API returns building info, not user level
          skill_name: tb.skill_name,
          remaining_milestones: tb.remaining_milestones,
        }))
      : (() => {
          // Fallback: resolve from path metadata + worldBuildings prop
          const targetSkills: string[] = path.path_metadata?.recommended_skills ?? [];
          return worldBuildings
            ? targetSkills
                .map((skillName) => {
                  const b = worldBuildings.find(
                    (wb) =>
                      wb.template?.name === skillName ||
                      wb.template?.name_en === skillName
                  );
                  return b?.template
                    ? { name: b.template.name, name_en: b.template.name_en, icon: b.template.icon, level: b.level, skill_name: null, remaining_milestones: 0 }
                    : null;
                })
                .filter(Boolean) as { name: string; name_en: string | null; icon: string; level: number; skill_name: string | null; remaining_milestones: number }[]
            : [];
        })();

  const typeLabel =
    path.path_type === "AI_GENERATED"
      ? locale === "zh" ? (
          <>
            <QuestScrollIcon name="sparkle" size={11} className="inline-block align-middle" /> AI 定制
          </>
        ) : (
          <>
            <QuestScrollIcon name="sparkle" size={11} className="inline-block align-middle" /> AI Customized
          </>
        )
      : locale === "zh" ? (
          <>
            <QuestScrollIcon name="building" size={11} className="inline-block align-middle" /> 官方预设
          </>
        ) : (
          <>
            <QuestScrollIcon name="building" size={11} className="inline-block align-middle" /> Official
          </>
        );

  return (
    <div className="relative flex gap-4">
      {/* ── Left growth-node spine ─────────────────────────────── */}
      <div className="flex flex-col items-center">
        <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[oklch(0.6_0.10_85_/_0.4)] bg-[oklch(0.99_0.003_95)] text-[oklch(0.6_0.10_85)] dark:bg-[oklch(0.2_0.008_85)] dark:text-[oklch(0.72_0.12_82)]">
          <QuestScrollIcon name={statusIcon} size={16} strokeWidth={1.4} />
        </div>
        <div className="w-px flex-1 min-h-[2rem] bg-gradient-to-b from-[oklch(0.6_0.10_85_/_0.35)] to-[oklch(0.6_0.10_85_/_0.08)]" />
      </div>

      {/* ── Right content ────────────────────────────────────── */}
      <div className="relative flex-1 min-w-0 border-l border-[oklch(0.6_0.10_85_/_0.25)] pl-4 pb-7">
        <span className="absolute left-0 top-0 -translate-x-[5px] h-2 w-2 rotate-45 border border-[oklch(0.6_0.10_85_/_0.4)] bg-[oklch(0.99_0.003_95)] dark:bg-[oklch(0.2_0.008_85)]" aria-hidden />

        {/* Header: title + low-key status */}
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/paths/${path.id}`}
            className="group inline-flex items-center gap-2 min-w-0"
          >
            <h4 className="truncate font-bold font-civ-serif text-sm text-[oklch(0.3_0.02_80)] dark:text-[oklch(0.85_0.04_80)] transition-colors group-hover:text-[oklch(0.4_0.12_85)]">
              {path.title}
            </h4>
            <span className="text-[oklch(0.6_0.10_85)] opacity-0 transition-opacity group-hover:opacity-100">
              <QuestScrollIcon name="arrow-right" size={13} strokeWidth={1.5} />
            </span>
          </Link>
          <span
            className={`shrink-0 text-[11px] font-medium tracking-wide ${
              path.status === "ACTIVE"
                ? "text-[oklch(0.55_0.10_85)]"
                : path.status === "COMPLETED"
                ? "text-[oklch(0.5_0.05_80)]"
                : "text-muted-foreground"
            }`}
          >
            <span className="mr-1" aria-hidden>{statusMark}</span>
            {statusLabel}
          </span>
        </div>

        {/* Path type + difficulty (low-key text, no badges) */}
        <div className="mt-1.5 flex items-center gap-3 text-[10px] text-muted-foreground/80">
          <span className="inline-flex items-center gap-1">{typeLabel}</span>
          {path.difficulty > 0 && (
            <span className="tracking-wider text-[11px]">
              {"★".repeat(path.difficulty)}
              <span className="opacity-30">{"★".repeat(5 - path.difficulty)}</span>
            </span>
          )}
          {path.milestone_count != null && (
            <span className="inline-flex items-center gap-1">
              <QuestScrollIcon name="mission" size={11} />
              {path.milestone_count} {locale === "zh" ? "里程碑" : "milestones"}
            </span>
          )}
        </div>

        {/* Description */}
        {path.description && (
          <p className="mt-2 text-xs italic leading-relaxed text-muted-foreground line-clamp-2">
            {path.description}
          </p>
        )}

        {/* ── Thin-line growth trajectory (replaces progress bar) ── */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70">
              {locale === "zh" ? "成长进度" : "Growth"}
            </span>
            <span className="font-mono text-[10px] font-bold text-[oklch(0.55_0.10_85)]">
              {path.progress_pct}%
            </span>
          </div>
          <div className="relative h-px w-full bg-[oklch(0.6_0.10_85_/_0.18)]">
            <div
              className="absolute left-0 top-0 h-px bg-gradient-to-r from-[oklch(0.6_0.10_85_/_0.35)] to-[#C4A77D] transition-all duration-500"
              style={{ width: `${path.progress_pct}%` }}
            />
            <span
              className="absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#C4A77D] transition-all duration-500"
              style={{ left: `calc(${path.progress_pct}% - 3px)` }}
            />
          </div>
        </div>

        {/* ── Associated buildings ─────────────────────────────── */}
        {targetBuildings.length > 0 ? (
          <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground/60">
              {locale === "zh" ? "关联建筑" : "Buildings"}
            </span>
            {targetBuildings.map((b) => (
              <span
                key={b.name}
                title={b.skill_name ? `Skill: ${skillDisplayName(b.skill_name, undefined, locale)}` : undefined}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"
              >
                <span className="text-xs">{b.icon}</span>
                <span className="font-medium text-muted-foreground/90 truncate max-w-[6rem]">
                  {locale === "en" && b.name_en ? b.name_en : b.name}
                </span>
                {b.level > 0 && <span className="font-mono text-[9px] opacity-70">Lv.{b.level}</span>}
                {b.remaining_milestones > 0 && (
                  <span className="text-[9px] font-bold text-[oklch(0.55_0.10_85)]">+{b.remaining_milestones}</span>
                )}
              </span>
            ))}
          </div>
        ) : (
          <div className="mt-3.5 text-[10px] italic text-muted-foreground/40">
            {locale === "zh" ? "未关联文明建筑" : "No linked buildings"}
          </div>
        )}

        {/* Select button for preset paths */}
        {onSelect && (
          <div className="mt-4">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelect(path.id);
              }}
              disabled={selecting}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#C4A77D]/40 px-4 py-1.5 text-xs font-bold font-civ-serif tracking-wider text-[oklch(0.55_0.10_85)] transition-all duration-300 hover:border-[#C4A77D] hover:shadow-[0_0_10px_rgba(196,167,125,0.2)] disabled:opacity-50"
            >
              {selecting ? (
                locale === "zh" ? "关联中..." : "Selecting..."
              ) : (
                locale === "zh" ? "采纳此路径" : "Select Path"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}