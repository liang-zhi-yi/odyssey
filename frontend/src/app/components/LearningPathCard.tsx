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

const DIFFICULTY_STYLE: Record<number, string> = {
  1: "bg-[#8B9D83]/10 text-[#8B9D83] border-[#8B9D83]/20",
  2: "bg-[#8B9D83]/15 text-[#8B9D83] border-[#8B9D83]/30",
  3: "bg-[#C4A77D]/10 text-[#C4A77D] border-[#C4A77D]/20",
  4: "bg-[#C4A77D]/15 text-[#C4A77D] border-[#C4A77D]/30",
  5: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
};

const STATUS_STYLE: Record<string, { bg: string; text: string; icon: string }> = {
  ACTIVE: { bg: "bg-[#8B9D83]/15 text-[#8B9D83] border-[#8B9D83]/35", text: "text-[#8B9D83]", icon: "🧭" },
  COMPLETED: { bg: "bg-[#C4A77D]/15 text-[#C4A77D] border-[#C4A77D]/35", text: "text-[#C4A77D]", icon: "📜" },
  ABANDONED: { bg: "bg-muted/30 text-muted-foreground border-muted/20", text: "text-muted-foreground", icon: "⚓" },
};

export function LearningPathCard({
  path,
  onSelect,
  selecting,
  worldBuildings,
}: LearningPathCardProps) {
  const { locale } = useLocale();

  const status = STATUS_STYLE[path.status] ?? STATUS_STYLE.ACTIVE;
  const diffStyle = DIFFICULTY_STYLE[path.difficulty] ?? DIFFICULTY_STYLE[3];

  const statusLabel =
    locale === "zh"
      ? PATH_STATUS_LABELS_ZH[path.status] ?? path.status
      : PATH_STATUS_LABELS[path.status] ?? path.status;

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

  return (
    <Link
      href={`/paths/${path.id}`}
      className="relative block rounded-xl border border-[oklch(0.88_0.02_90)] bg-gradient-to-br from-[oklch(0.99_0.003_95)] to-[oklch(0.975_0.005_92)] dark:from-[oklch(0.22_0.008_85)] dark:to-[oklch(0.2_0.006_85)] p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-[oklch(0.7_0.12_85)] group overflow-hidden"
    >
      {/* Background sector mark coordinates */}
      <div className="absolute -bottom-1 -right-1 text-[8px] font-mono opacity-[0.06] pointer-events-none select-none text-[oklch(0.3_0.02_80)]">
        [PATH {path.id.slice(0, 4).toUpperCase()}]
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <h4 className="font-bold font-civ-serif text-sm truncate flex-1 text-[oklch(0.3_0.02_80)] dark:text-[oklch(0.85_0.04_80)] group-hover:text-[oklch(0.35_0.12_85)] dark:group-hover:text-[oklch(0.9_0.05_80)] transition-colors pr-6">
          {path.title}
        </h4>
        <span
          className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold border flex items-center gap-1 ${status.bg} ${status.text}`}
        >
          <span>{status.icon}</span>
          {statusLabel}
        </span>
      </div>

      {/* Description */}
      {path.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed italic">
          {path.description}
        </p>
      )}

      {/* Badges: type + difficulty */}
      <div className="flex items-center gap-2 text-xs mb-4 flex-wrap">
        {/* Path type badge */}
        <span className="rounded bg-secondary/80 px-2 py-0.5 border border-border/40 text-muted-foreground font-medium text-[10px]">
          {path.path_type === "AI_GENERATED" ? "🔮 AI Customized" : "🏛️ Official"}
        </span>

        {/* Difficulty dots */}
        <span className={`rounded px-2 py-0.5 text-[10px] font-bold border ${diffStyle}`}>
          {"★".repeat(path.difficulty)}
          {"☆".repeat(5 - path.difficulty)}
        </span>

        {/* Milestone count */}
        {path.milestone_count != null && (
          <span className="rounded bg-secondary/80 px-2 py-0.5 border border-border/40 text-muted-foreground font-medium text-[10px] flex items-center gap-0.5">
            <span>📍</span> {path.milestone_count} {locale === "zh" ? "里程碑" : "milestones"}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2.5 mb-2">
        <div className="h-2 flex-1 rounded-full bg-[oklch(0.95_0.005_90)] dark:bg-[oklch(0.25_0.008_85)] border border-[oklch(0.88_0.02_90_/_0.7)] overflow-hidden relative shadow-inner">
          <div
            className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[#C4A77D] to-[#A38A5E]"
            style={{ width: `${path.progress_pct}%` }}
          />
        </div>
        <span className="text-[10px] font-bold font-mono text-muted-foreground w-9 text-right">
          {path.progress_pct}%
        </span>
      </div>

      {/* Target buildings */}
      {targetBuildings.length > 0 && (
        <div className="mt-3.5 pt-3 border-t border-border/60 flex items-center gap-1.5 flex-wrap">
          <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-wider">
            {locale === "zh" ? "驱动文明:" : "Drives:"}
          </span>
          {targetBuildings.map((b) => (
            <span
              key={b.name}
              title={b.skill_name ? `Skill: ${b.skill_name}` : undefined}
              className="inline-flex items-center gap-0.5 rounded border border-border/60 bg-background/50 px-1.5 py-0.5 text-[9px] text-muted-foreground"
            >
              <span className="text-xs">{b.icon}</span>
              <span className="truncate max-w-[5rem] font-medium">
                {locale === "en" && b.name_en ? b.name_en : b.name}
              </span>
              {b.level > 0 && <span className="tabular-nums opacity-85">Lv.{b.level}</span>}
              {b.remaining_milestones > 0 && (
                <span className="text-[8px] text-[#C4A77D] font-bold">+{b.remaining_milestones}</span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Select button for preset paths */}
      {onSelect && (
        <div className="mt-4 pt-3.5 border-t border-border/60">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect(path.id);
            }}
            disabled={selecting}
            className="w-full rounded-lg bg-primary/90 text-primary-foreground py-2 text-xs font-bold font-civ-serif tracking-wider hover:bg-primary transition-colors disabled:opacity-50 border border-primary/20"
          >
            {selecting ? "Selecting..." : "Select Path"}
          </button>
        </div>
      )}
    </Link>
  );
}
