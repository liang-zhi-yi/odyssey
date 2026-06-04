"use client";

import Link from "next/link";
import type { UserSkill } from "@/types/skill";
import type { SkillGrowthPoint } from "@/types/progress";
import { RANK_LABELS } from "@/types/skill";
import { useLocale } from "@/hooks/useLocale";
import { Sparkline } from "@/app/components/Sparkline";

interface SkillCardProps {
  skill: UserSkill;
  trend?: SkillGrowthPoint[];
}

/**
 * Card displaying a single skill with dimension bars and rank badge.
 * Links to the skill detail page.
 */
export function SkillCard({ skill, trend }: SkillCardProps) {
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
      className="block rounded-xl border border-border bg-background p-4 transition-all hover:shadow-md hover:border-primary/30"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-sm">
            {skill.skill_name || skill.skill_id}
          </h4>
        </div>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          {t(`skills.rank.${skill.rank}`) || RANK_LABELS[skill.rank] || skill.rank}
        </span>
      </div>

      {/* Dimension bars */}
      <div className="space-y-1.5">
        {dimensions.map((d) => (
          <div key={d.key} className="flex items-center gap-1.5 text-xs">
            <span className="w-[4.5rem] shrink-0 text-muted-foreground truncate" title={t(`skills.dimensions.${d.key}`)}>
              {t(`skills.dimensions.${d.key}`)}
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${d.value}%` }}
              />
            </div>
            <span className="w-7 text-right font-mono text-muted-foreground tabular-nums">
              {d.value}
            </span>
          </div>
        ))}
      </div>

      {/* 30d trend sparkline */}
      {trend && trend.length >= 2 && (
        <div className="mt-2 flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground">{t("skills.trend")}</span>
          <Sparkline points={trend} className="ml-auto" />
        </div>
      )}

      {/* Overall */}
      <div className="mt-3 flex items-center gap-2 border-t border-border pt-2">
        <span className="text-xs text-muted-foreground">{t("skills.overall")}</span>
        <span className="text-lg font-bold text-primary tabular-nums">{skill.overall}</span>
      </div>
    </Link>
  );
}
