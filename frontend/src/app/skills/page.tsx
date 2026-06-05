"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { skillService } from "@/services/skill.service";
import { SkillCard } from "@/app/components/SkillCard";
import { ScoreCard } from "@/app/components/ScoreCard";
import { RadarChart } from "@/app/components/RadarChart";
import { Loading } from "@/app/components/Loading";
import { EmptyState } from "@/app/components/EmptyState";
import { DomainPicker } from "@/app/components/DomainPicker";
import type { UserSkill, Skill } from "@/types/skill";
import type { DimensionScores } from "@/types/assessment";
import { computeAggregateScores } from "@/lib/scores";
import { ErrorState } from "@/app/components/ErrorState";

export default function SkillsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const [selectedSkill, setSelectedSkill] = useState<UserSkill | null>(null);
  const [domainFilter, setDomainFilter] = useState<string>("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch all defined skills
  const { data: allSkills = [] } = useSWR(
    isAuthenticated ? "all-skills" : null,
    () => skillService.listSkills()
  );

  // Fetch user's skill states
  const {
    data: userSkills = [],
    isLoading,
    error,
  } = useSWR(isAuthenticated ? "user-skills" : null, () =>
    skillService.listUserSkills()
  );

  if (authLoading || !isAuthenticated) {
    return <Loading text={t("auth.validating")} />;
  }

  const userSkillMap = new Map(userSkills.map((us) => [us.skill_id, us]));

  // Filter skills by domain
  const filteredAllSkills = useMemo(() => {
    if (!domainFilter) return allSkills;
    return allSkills.filter((s: Skill) => s.domain === domainFilter);
  }, [allSkills, domainFilter]);

  const filteredUserSkills = useMemo(() => {
    if (!domainFilter) return userSkills;
    const filteredIds = new Set(filteredAllSkills.map((s: Skill) => s.id));
    return userSkills.filter((us) => filteredIds.has(us.skill_id));
  }, [userSkills, filteredAllSkills, domainFilter]);

  // Compute radar scores for selected skill or aggregate (use all user skills, not filtered)
  const radarScores: DimensionScores = selectedSkill
    ? {
        knowledge: selectedSkill.knowledge,
        reasoning: selectedSkill.reasoning,
        application: selectedSkill.application,
        creation: selectedSkill.creation,
      }
    : computeAggregateScores(userSkills);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold">{t("skills.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("skills.fourDimensionProfile")}
        </p>
      </div>

      {/* Selected skill detail / Overview radar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Radar overview */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card flex flex-col items-center">
          <h3 className="text-sm font-semibold mb-4">
            {selectedSkill
              ? selectedSkill.skill_name || selectedSkill.skill_id
              : t("skills.aggregateRadar")}
          </h3>
          <RadarChart scores={radarScores} size={240} />
          {selectedSkill && (
            <button
              onClick={() => setSelectedSkill(null)}
              className="mt-4 text-xs text-primary hover:underline"
            >
              {t("skills.viewOverview")}
            </button>
          )}
        </div>

        {/* Score cards or skill list */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <Loading variant="skeleton-cards" cardCount={6} />
          ) : error ? (
            <ErrorState message={t("skills.loadError")} />
          ) : filteredUserSkills.length === 0 ? (
            <EmptyState
              title={t("skills.noSkills")}
              description={t("skills.noSkillDesc")}
              actionLabel={t("skills.browseQuests")}
              actionHref="/quests"
            />
          ) : selectedSkill ? (
            /* Show detailed score card for selected skill */
            <ScoreCard
              title={selectedSkill.skill_name || selectedSkill.skill_id}
              overall={selectedSkill.overall}
              scores={{
                knowledge: selectedSkill.knowledge,
                reasoning: selectedSkill.reasoning,
                application: selectedSkill.application,
                creation: selectedSkill.creation,
              }}
              rank={selectedSkill.rank}
              size={200}
            />
          ) : (
            /* Show skill cards grid */
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 animate-stagger">
              {filteredUserSkills.map((skill) => (
                <div
                  key={skill.skill_id}
                  onClick={() => setSelectedSkill(skill)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedSkill(skill);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={t("skills.viewSkillDetail", { name: skill.skill_name || skill.skill_id })}
                  className="cursor-pointer card-hover"
                >
                  <SkillCard skill={skill} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Domain filter + all defined skills reference */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">{t("skills.allSkillsDirectory")}</h2>
        </div>
        <div className="mb-3">
          <DomainPicker selected={domainFilter} onChange={setDomainFilter} />
        </div>
        {filteredAllSkills.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filteredAllSkills.map((skill: Skill) => {
              const userSkill = userSkillMap.get(skill.id);
              return (
                <div
                  key={skill.id}
                  className={`rounded-xl border px-3 py-2.5 text-xs transition-all duration-300 ${
                    userSkill
                      ? "border-primary/30 bg-primary/5 cursor-pointer hover:shadow-card"
                      : "border-border bg-secondary/30"
                  }`}
                  onClick={() => {
                    if (userSkill) setSelectedSkill(userSkill);
                  }}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === " ") && userSkill) {
                      e.preventDefault();
                      setSelectedSkill(userSkill);
                    }
                  }}
                  tabIndex={userSkill ? 0 : undefined}
                  role={userSkill ? "button" : undefined}
                  aria-label={userSkill ? t("skills.viewSkillDetail", { name: skill.name }) : undefined}
                >
                  <p className="font-medium truncate">{skill.name}</p>
                  {userSkill ? (
                    <p className="text-primary font-bold mt-0.5 tabular-nums">
                      {userSkill.overall}
                    </p>
                  ) : (
                    <p className="text-muted-foreground mt-0.5">{t("skills.inactive")}</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground py-2">
            {domainFilter ? t("quests.noQuests") : t("common.noData")}
          </p>
        )}
      </section>
    </div>
  );
}
