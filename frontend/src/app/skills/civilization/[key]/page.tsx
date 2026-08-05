"use client";

import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { skillDisplayName } from "@/lib/skillNames";
import { skillService } from "@/services/skill.service";
import { Loading } from "@/app/components/Loading";
import { ErrorState } from "@/app/components/ErrorState";
import { RadarChart } from "@/app/components/RadarChart";
import { QuestScrollIcon, type ScrollIconName } from "@/app/components/QuestScrollIcon";
import { masteryColor } from "@/app/components/GrowthRing";
import { CIVILIZATION_GROUPS } from "@/types/world";
import type { Skill, UserSkill } from "@/types/skill";
import type { DimensionScores } from "@/types/assessment";
import { computeAggregateScores } from "@/lib/scores";

const DIMENSIONS: (keyof DimensionScores)[] = [
  "knowledge",
  "reasoning",
  "application",
  "creation",
];

export default function CivilizationDetailPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, locale } = useLocale();
  const router = useRouter();
  const params = useParams();
  const civKey = (params?.key as string) ?? "";

  // ── Auth guard ─────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // ── Look up civilization group ─────────────────────────────────
  const civGroup = useMemo(
    () => CIVILIZATION_GROUPS.find((g) => g.key === civKey) ?? null,
    [civKey]
  );

  // ── Data fetching ──────────────────────────────────────────────
  const { data: allSkills = [], error: skillsError } = useSWR(
    isAuthenticated ? "all-skills" : null,
    () => skillService.listSkills(),
    { revalidateOnFocus: false, dedupingInterval: 300000 }
  );

  const { data: userSkills = [] } = useSWR(
    isAuthenticated ? "user-skills" : null,
    () => skillService.listUserSkills(),
    { revalidateOnFocus: false, dedupingInterval: 120000 }
  );

  // ── Filter skills by civilization domains ──────────────────────
  const civSkills = useMemo(() => {
    if (!civGroup) return [];
    return allSkills.filter((s: Skill) => civGroup.domains.includes(s.domain));
  }, [allSkills, civGroup]);

  // Map skill_id → domain for cross-referencing
  const skillDomainMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of civSkills) m.set(s.id, s.domain);
    return m;
  }, [civSkills]);

  // User skills belonging to this civilization
  const civUserSkills = useMemo(() => {
    if (!civGroup) return [];
    return userSkills.filter((us: UserSkill) => skillDomainMap.has(us.skill_id));
  }, [userSkills, skillDomainMap, civGroup]);

  // Aggregate radar scores for this civilization
  const civAggregateScores = useMemo(
    () => computeAggregateScores(civUserSkills),
    [civUserSkills]
  );

  // ── Loading / Error states ─────────────────────────────────────
  if (authLoading || !isAuthenticated) {
    return <Loading text={t("auth.validating")} />;
  }

  if (skillsError) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <ErrorState message={t("skills.loadError")} />
      </div>
    );
  }

  if (!civGroup) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <ErrorState message={locale === "en" ? "Civilization not found" : "未找到该文明类型"} />
      </div>
    );
  }

  const civName = locale === "en" ? civGroup.labelEn : civGroup.label;

  return (
    <div className="flex-1 overflow-y-auto bg-cartography-grid relative scrollbar-hide min-h-[calc(100vh-3.5rem)]">
      {/* Decorative Compass Rose Watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 opacity-[0.05] dark:opacity-[0.08] pointer-events-none select-none animate-rhumb-spin">
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.5">
          <circle cx="50" cy="50" r="45" strokeDasharray="2 2" />
          <circle cx="50" cy="50" r="38" />
          <path d="M 50,5 L 50,95 M 5,50 L 95,50 M 18.2,18.2 L 81.8,81.8 M 18.2,81.8 L 81.8,18.2" />
          <polygon points="50,50 50,15 47,35" fill="currentColor" opacity="0.3" />
          <polygon points="50,50 50,15 53,35" fill="currentColor" />
          <polygon points="50,50 50,85 47,65" fill="currentColor" opacity="0.3" />
          <polygon points="50,50 50,85 53,65" fill="currentColor" />
          <polygon points="50,50 85,50 65,47" fill="currentColor" opacity="0.3" />
          <polygon points="50,50 85,50 65,53" fill="currentColor" />
          <polygon points="50,50 15,50 35,47" fill="currentColor" opacity="0.3" />
          <polygon points="50,50 15,50 35,53" fill="currentColor" />
        </svg>
      </div>

      <div className="max-w-3xl mx-auto px-8 py-12 animate-fade-in relative z-10">
        {/* ── Breadcrumb ──────────────────────────────────── */}
        <nav className="flex items-center gap-1.5 text-xs text-[oklch(0.5_0.02_85)] mb-6 font-civ-serif font-semibold">
          <Link href="/skills" className="hover:text-[oklch(0.3_0.02_80)] transition-colors">
            {locale === "en" ? "Skills" : "技能"}
          </Link>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          <span className="font-bold text-[oklch(0.3_0.02_80)] truncate">
            {civName}
          </span>
        </nav>

        {/* ── Header ────────────────────────────────────── */}
        <div className="text-center mb-10 flex flex-col items-center">
          <div className="w-18 h-18 rounded-2xl border-2 border-double border-[oklch(0.7_0.12_85)] bg-gradient-to-br from-[oklch(0.99_0.003_95)] to-[oklch(0.72_0.12_82_/_0.2)] shadow-md animate-pedestal-glow text-[oklch(0.35_0.12_85)] dark:from-[oklch(0.22_0.008_85)] dark:to-[oklch(0.72_0.12_82_/_0.2)] mb-4 animate-gentle-float flex items-center justify-center shrink-0 relative overflow-hidden">
            <svg className="absolute inset-0 w-full h-full opacity-[0.12] dark:opacity-[0.18] pointer-events-none select-none" viewBox="0 0 100 100" fill="none" stroke="currentColor">
              <path d="M 10,10 L 90,10 L 90,45 C 90,75 50,92 50,92 C 50,92 10,75 10,45 Z" strokeWidth="3.5" strokeLinejoin="round" />
              <line x1="50" y1="5" x2="50" y2="92" strokeWidth="2" strokeDasharray="3 3" />
              <line x1="10" y1="40" x2="90" y2="40" strokeWidth="1.5" strokeDasharray="4 4" />
            </svg>
            <QuestScrollIcon name={(civGroup.icon as ScrollIconName) ?? "civilization"} size={36} className="relative z-10" />
          </div>
          <h1 className="text-2xl font-bold font-civ-serif text-[oklch(0.3_0.02_80)] mb-2">
            {civName}
          </h1>
          <p className="text-sm text-[oklch(0.5_0.02_85)] max-w-md mx-auto leading-relaxed font-civ-serif">
            {locale === "en"
              ? `Comprehensive capability radar for ${civName}. Skills unlocked: ${civUserSkills.length} / ${civSkills.length}.`
              : `${civName}的综合能力雷达图。已解锁技能：${civUserSkills.length} / ${civSkills.length}。`}
          </p>
        </div>

        {/* ── Aggregate Radar + Stats ────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Civilization aggregate radar */}
          <div className="vintage-parchment-card rounded-2xl border border-[oklch(0.88_0.02_90)] p-6 shadow-sm">
            <h3 className="text-sm font-bold font-civ-serif text-[oklch(0.3_0.02_80)] mb-4 flex items-center gap-1.5">
              <QuestScrollIcon name="mission" size={14} /> {locale === "en" ? "Capability Landscape" : "综合能力星图"}
            </h3>
            <div className="flex justify-center">
              <RadarChart scores={civAggregateScores} size={220} />
            </div>
          </div>

          {/* Civilization stats summary */}
          <div className="vintage-parchment-card rounded-2xl border border-[oklch(0.88_0.02_90)] p-6 shadow-sm flex flex-col justify-center">
            <h3 className="text-sm font-bold font-civ-serif text-[oklch(0.3_0.02_80)] mb-4 flex items-center gap-1.5">
              <QuestScrollIcon name="scroll" size={14} /> {locale === "en" ? "Ledger Summary" : "账目统计"}
            </h3>
            <div className="space-y-3">
              <StatRow
                label={locale === "en" ? "Total Skills" : "技能总数"}
                value={civSkills.length}
              />
              <StatRow
                label={locale === "en" ? "Unlocked Skills" : "已解锁技能"}
                value={civUserSkills.length}
              />
              <StatRow
                label={locale === "en" ? "Top Skill" : "最高技能"}
                value={
                  civUserSkills.length > 0
                    ? (() => {
                        const top = civUserSkills.reduce((a, b) =>
                          b.overall > a.overall ? b : a
                        );
                        return `${top.skill_name || top.skill_id} (${top.overall})`;
                      })()
                    : "—"
                }
              />
              <StatRow
                label={locale === "en" ? "Average Score" : "平均分"}
                value={
                  civUserSkills.length > 0
                    ? Math.round(
                        civUserSkills.reduce((s, us) => s + us.overall, 0) /
                          civUserSkills.length
                      )
                    : "—"
                }
                highlight
              />
            </div>
          </div>
        </div>

        {/* ── Dimension Breakdown ─────────────────────────── */}
        {civUserSkills.length > 0 && (
          <div className="mt-6 vintage-parchment-card rounded-2xl border border-[oklch(0.88_0.02_90)] p-6 shadow-sm">
            <h3 className="text-sm font-bold font-civ-serif text-[oklch(0.3_0.02_80)] mb-4 flex items-center gap-1.5">
              <QuestScrollIcon name="world-core" size={14} /> {locale === "en" ? "Dimension Breakdown" : "四维能力剖面"}
            </h3>
            <div className="space-y-2">
              {DIMENSIONS.map((dim) => (
                <div key={dim} className="flex items-center gap-2 text-xs">
                  <span className="w-16 shrink-0 font-civ-serif font-bold text-[oklch(0.35_0.02_80)] truncate">
                    {t(`skills.dimensions.${dim}`) || dim}
                  </span>
                  <div className="flex-1 h-2.5 rounded-full bg-[oklch(0.95_0.005_90)] dark:bg-[oklch(0.25_0.008_85)] border border-[oklch(0.88_0.02_90_/_0.7)] overflow-hidden relative">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[oklch(0.55_0.08_160)] to-[oklch(0.6_0.1_150)] animate-route-flow transition-all duration-500"
                      style={{ width: `${civAggregateScores[dim]}%` }}
                    />
                  </div>
                  <span className="w-7 text-right font-mono tabular-nums font-bold text-[oklch(0.3_0.02_80)]">
                    {civAggregateScores[dim]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Skill List ──────────────────────────────────── */}
        {civSkills.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-bold font-civ-serif text-[oklch(0.3_0.02_80)] mb-3">
              {locale === "en" ? "Skills in this Civilization" : "该文明的技能列表"}
            </h3>
            <div className="flex flex-wrap gap-2">
              {civSkills.map((skill) => {
                const us = userSkills.find((u: UserSkill) => u.skill_id === skill.id);
                return (
                  <Link
                    key={skill.id}
                    href={`/skills/${skill.id}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[oklch(0.88_0.02_90)] bg-[oklch(0.99_0.003_95)] dark:bg-[oklch(0.22_0.008_85)] px-3 py-1.5 text-xs font-semibold text-[oklch(0.35_0.02_80)] transition-all hover:border-[oklch(0.7_0.12_85)] hover:bg-[oklch(0.72_0.12_82_/_0.05)] hover:shadow-sm"
                  >
                    {us && (
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: masteryColor(us.overall) }}
                      />
                    )}
                    {skillDisplayName(skill.name, skill.name_en, locale)}
                    {us && (
                      <span className="text-[10px] text-[oklch(0.4_0.02_80)] font-mono tabular-nums ml-1">
                        {us.overall}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Back Link ───────────────────────────────────── */}
        <div className="mt-8 text-center">
          <Link
            href="/skills"
            className="inline-flex items-center gap-1.5 text-xs font-civ-serif font-semibold text-[oklch(0.5_0.02_85)] hover:text-[oklch(0.3_0.02_80)] transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            {locale === "en" ? "Back to Skills" : "返回技能总览"}
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────

function StatRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={`text-sm font-semibold tabular-nums ${
          highlight ? "text-accent" : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
