"use client";

import { useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { skillService } from "@/services/skill.service";
import { Loading } from "@/app/components/Loading";
import { ErrorState } from "@/app/components/ErrorState";
import { EmptyState } from "@/app/components/EmptyState";
import { RANK_LABELS, type SkillRank } from "@/types/skill";
import type { Skill, UserSkill } from "@/types/skill";

/** Score-to-color mapping using oklch hues */
function scoreColor(score: number): string {
  if (score >= 80) return "oklch(0.55 0.2 160)"; // green
  if (score >= 60) return "oklch(0.55 0.2 260)"; // blue
  if (score >= 40) return "oklch(0.55 0.2 80)";  // amber
  if (score >= 20) return "oklch(0.55 0.2 40)";  // orange
  return "oklch(0.55 0.05 0)";                    // gray
}

function rankColor(rank: SkillRank): string {
  switch (rank) {
    case "ARCHITECT": return "oklch(0.55 0.2 160)";
    case "ENGINEER": return "oklch(0.55 0.2 220)";
    case "PRACTITIONER": return "oklch(0.55 0.2 260)";
    case "BEGINNER": return "oklch(0.55 0.2 80)";
    default: return "oklch(0.55 0.05 0)";
  }
}

export default function SkillTreePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useLocale();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch all defined skills
  const {
    data: allSkills = [],
    isLoading: skillsLoading,
    error: skillsError,
  } = useSWR(isAuthenticated ? "all-skills-tree" : null, () =>
    skillService.listSkills()
  );

  // Fetch user's skill states
  const {
    data: userSkills = [],
    isLoading: userLoading,
  } = useSWR(isAuthenticated ? "user-skills-tree" : null, () =>
    skillService.listUserSkills()
  );

  if (authLoading || !isAuthenticated) {
    return <Loading text={t("auth.validating")} />;
  }

  const isLoading = skillsLoading || userLoading;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <div>
          <h1 className="text-2xl font-bold">{t("skillTree.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("skillTree.interactiveMap")}
          </p>
        </div>
        <div className="flex items-center justify-center py-24">
          <div className="h-64 w-64 animate-pulse rounded-full bg-secondary" />
        </div>
      </div>
    );
  }

  if (skillsError) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <div>
          <h1 className="text-2xl font-bold">{t("skillTree.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("skillTree.interactiveMap")}
          </p>
        </div>
        <ErrorState message={t("skillTree.loadError")} />
      </div>
    );
  }

  if (allSkills.length === 0) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <div>
          <h1 className="text-2xl font-bold">{t("skillTree.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("skillTree.interactiveMap")}
          </p>
        </div>
        <EmptyState
          title={t("skillTree.noSkillData")}
          description={t("skillTree.noSkillDesc")}
        />
      </div>
    );
  }

  // Build lookup maps
  const userSkillMap = new Map<string, UserSkill>(
    userSkills.map((us) => [us.skill_id, us])
  );

  // Group skills by category
  const categories = new Map<string, Skill[]>();
  for (const skill of allSkills) {
    const cat = skill.category || t("skillTree.uncategorized");
    if (!categories.has(cat)) categories.set(cat, []);
    categories.get(cat)!.push(skill);
  }

  const categoryNames = Array.from(categories.keys());
  const totalSkills = allSkills.length;
  const unlockedCount = userSkills.length;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold">{t("skillTree.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("skillTree.stats", { unlocked: unlockedCount, total: totalSkills })}
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-primary" />
          <span className="text-muted-foreground">{t("skillTree.active")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full border-2 border-border bg-background" />
          <span className="text-muted-foreground">{t("skillTree.inactive")}</span>
        </div>
        {(["NOVICE", "BEGINNER", "PRACTITIONER", "ENGINEER", "ARCHITECT"] as SkillRank[]).map(
          (rank) => (
            <div key={rank} className="flex items-center gap-1.5">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: rankColor(rank) }}
              />
              <span className="text-muted-foreground">{RANK_LABELS[rank]}</span>
            </div>
          )
        )}
      </div>

      {/* Tree visualization — category sections with connector lines */}
      <div className="space-y-10">
        {categoryNames.map((category, catIdx) => {
          const skills = categories.get(category)!;
          return (
            <section key={category}>
              <h2 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
                {category}
              </h2>
              <div className="relative">
                {/* Category connector line */}
                <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

                <div className="space-y-4 pl-10">
                  {skills.map((skill, idx) => {
                    const userSkill = userSkillMap.get(skill.id);
                    const isUnlocked = !!userSkill;
                    return (
                      <div
                        key={skill.id}
                        className="relative animate-fade-in-up"
                        style={{ animationDelay: `${idx * 80 + catIdx * 200}ms` }}
                      >
                        {/* Horizontal connector dot */}
                        <div className="absolute -left-[26px] top-1/2 h-2 w-2 -translate-y-1/2 rounded-full border-2 border-border bg-background" />

                        {isUnlocked ? (
                          <Link
                            href={`/skills/${skill.id}`}
                            className="group block rounded-xl border border-border bg-background p-4 transition-all card-hover hover:border-primary/30"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="min-w-0">
                                <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                                  {skill.name}
                                </h3>
                                {skill.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                    {skill.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                {/* Score bar */}
                                <div className="hidden sm:flex items-center gap-2">
                                  <div className="h-1.5 w-20 rounded-full bg-secondary overflow-hidden">
                                    <div
                                      className="h-full rounded-full transition-all duration-500"
                                      style={{
                                        width: `${userSkill.overall}%`,
                                        backgroundColor: scoreColor(userSkill.overall),
                                      }}
                                    />
                                  </div>
                                  <span className="text-xs font-mono font-bold tabular-nums w-7 text-right">
                                    {userSkill.overall}
                                  </span>
                                </div>
                                {/* Rank badge */}
                                <span
                                  className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white shrink-0"
                                  style={{
                                    backgroundColor: rankColor(userSkill.rank),
                                  }}
                                >
                                  {RANK_LABELS[userSkill.rank]}
                                </span>
                              </div>
                            </div>
                          </Link>
                        ) : (
                          <div className="rounded-xl border border-dashed border-border/50 bg-secondary/20 p-4 opacity-50">
                            <div className="flex items-center justify-between gap-4">
                              <div className="min-w-0">
                                <h3 className="font-semibold text-sm text-muted-foreground">
                                  {skill.name}
                                </h3>
                                {skill.description && (
                                  <p className="text-xs text-muted-foreground/60 line-clamp-1 mt-0.5">
                                    {skill.description}
                                  </p>
                                )}
                              </div>
                              <span className="text-[10px] text-muted-foreground/60 shrink-0">
                                {t("skillTree.inactive")}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
