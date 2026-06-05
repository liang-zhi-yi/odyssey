"use client";

import Link from "next/link";
import type { UserSkill } from "@/types/skill";
import type { SkillGrowthPoint } from "@/types/progress";
import { RANK_LABELS } from "@/types/skill";
import { useLocale } from "@/hooks/useLocale";
import { GrowthRing, masteryColor } from "@/app/components/GrowthRing";
import { Sparkline } from "@/app/components/Sparkline";
import { BuildingBadge } from "./BuildingBadge";

export interface BuildingMapEntry {
  name: string;
  name_en: string | null;
  level: number;
  icon: string;
}

interface SkillCardProps {
  skill: UserSkill;
  trend?: SkillGrowthPoint[];
  /** Optional: pre-resolved building info for this skill */
  buildingInfo?: BuildingMapEntry | null;
  /** Optional: pre-fetched world buildings for BuildingBadge to use (avoids extra fetch) */
  worldBuildings?: { template: { skill_id: string; name: string; name_en: string | null; icon: string } | null; level: number }[];
}

/**
 * Skill card redesigned with organic growth indicators — replaces
 * flat progress bars with concentric GrowthRings. Color intensity
 * reflects mastery depth: light sage → deep sage → gold.
 */
export function SkillCard({ skill, trend, worldBuildings }: SkillCardProps) {
  const { t } = useLocale();

  const dimensions = [
    { key: "knowledge", value: skill.knowledge },
    { key: "reasoning", value: skill.reasoning },
    { key: "application", value: skill.application },
    { key: "creation", value: skill.creation },
  ];

  return (
    <Link
      href={`/skills/${skill.skill_id}`}
      className="group block rounded-2xl border border-border bg-card p-5 shadow-card transition-all duration-300 hover:shadow-card-hover hover:border-primary/20"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="min-w-0">
          <h4 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
            {skill.skill_name || skill.skill_id}
          </h4>
        </div>
        <span className="flex-shrink-0 ml-2 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
          {t(`skills.rank.${skill.rank}`) || RANK_LABELS[skill.rank] || skill.rank}
        </span>
      </div>

      {/* Dimension growth rings */}
      <div className="flex items-center justify-between gap-1">
        {dimensions.map((d) => (
          <div key={d.key} className="flex flex-col items-center gap-1">
            <GrowthRing value={d.value} size="sm" />
            <span className="text-[10px] text-muted-foreground leading-tight text-center max-w-[3rem] truncate">
              {(() => {
                const label = t(`skills.dimensions.${d.key}`);
                return label.length > 4 ? label.slice(0, 4) : label;
              })()}
            </span>
          </div>
        ))}
      </div>

      {/* Trend sparkline */}
      {trend && trend.length >= 2 && (
        <div className="mt-3 flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground">{t("skills.trend")}</span>
          <Sparkline points={trend} className="ml-auto" />
        </div>
      )}

      {/* Overall score + mastery dot */}
      <div className="mt-3 flex items-center gap-2.5 border-t border-border pt-3">
        <span
          className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
          style={{ backgroundColor: masteryColor(skill.overall) }}
        />
        <span className="text-xs text-muted-foreground">{t("skills.overall")}</span>
        <span className="ml-auto text-lg font-bold tabular-nums text-foreground">
          {skill.overall}
        </span>
      </div>

      {/* Building link */}
      {skill.skill_id && (
        <div className="mt-2">
          <BuildingBadge
            skillId={skill.skill_id}
            worldBuildings={worldBuildings}
          />
        </div>
      )}
    </Link>
  );
}
