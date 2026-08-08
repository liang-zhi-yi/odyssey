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
import {
  QuestScrollIcon,
  type ScrollIconName,
} from "@/app/components/QuestScrollIcon";
import { CivIcon } from "@/app/components/CivIcon";
import { CIVILIZATION_GROUPS } from "@/types/world";
import type { Skill, UserSkill } from "@/types/skill";
import type { DimensionScores } from "@/types/assessment";
import { computeAggregateScores } from "@/lib/scores";

/* ── 能力谱系：为每个技能分配一个纯线条文明图标 ────────── */
const LINE_ICONS: ScrollIconName[] = [
  "knowledge",
  "reasoning",
  "application",
  "creation",
  "building",
  "compass",
  "mission",
  "path",
  "chart-up",
  "map",
  "idea",
  "tree",
  "monitor",
  "robot",
  "language",
  "science",
  "business",
  "health",
  "finance",
  "seal",
  "scroll",
];

function skillLineIcon(name: string): ScrollIconName {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) | 0;
  }
  return LINE_ICONS[Math.abs(h) % LINE_ICONS.length];
}

/* ── 当前阶段：由平均能力分数映射为文明成长阶段 ────────── */
function stageForScore(score: number, locale: string): string {
  if (score >= 80) return locale === "en" ? "Flourishing" : "繁盛期";
  if (score >= 60) return locale === "en" ? "Thriving" : "繁荣期";
  if (score >= 40) return locale === "en" ? "Developing" : "耕耘期";
  if (score >= 20) return locale === "en" ? "Settling" : "拓荒期";
  return locale === "en" ? "Nascent" : "萌芽期";
}

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

  // 平均分 → 当前阶段
  const avgScore =
    civUserSkills.length > 0
      ? Math.round(
          civUserSkills.reduce((s, us) => s + us.overall, 0) /
            civUserSkills.length
        )
      : 0;
  const stage = stageForScore(avgScore, locale);

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

      <div className="max-w-4xl mx-auto px-8 py-12 animate-fade-in relative z-10">
        {/* ── Breadcrumb ──────────────────────────────────── */}
        <nav className="flex items-center gap-1.5 text-xs text-[oklch(0.5_0.02_85)] mb-8 font-civ-serif font-semibold">
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

        {/* ══ Header — 文明徽章 + 文明档案标题 ══ */}
        <div className="mb-12 flex flex-col items-center text-center">
          <div className="relative mb-6">
            {/* 徽章呼吸发光 */}
            <div className="badge-breathe relative flex h-20 w-20 items-center justify-center border border-[oklch(0.68_0.12_85_/_0.6)] bg-[oklch(0.99_0.003_95)] text-[oklch(0.35_0.12_85)] dark:bg-[oklch(0.22_0.008_85)]">
              <svg
                className="absolute inset-0 h-full w-full opacity-[0.1] dark:opacity-[0.16] pointer-events-none select-none"
                viewBox="0 0 100 100"
                fill="none"
                stroke="currentColor"
              >
                <path d="M 50,3 L 97,20 L 97,80 L 50,97 L 3,80 L 3,20 Z" strokeWidth="1.5" strokeLinejoin="round" />
                <circle cx="50" cy="50" r="34" strokeWidth="0.8" strokeDasharray="3 3" />
              </svg>
              <CivIcon
                type="type"
                name={civGroup.key}
                size={42}
                alt={civName}
                fallback={
                  <QuestScrollIcon
                    name={(civGroup.icon as ScrollIconName) ?? "civilization"}
                    size={42}
                    className="relative z-10 skill-icon-act"
                  />
                }
              />
              {/* 徽章底部角标 */}
              <span className="pointer-events-none absolute -bottom-1.5 left-1/2 h-1.5 w-10 -translate-x-1/2 bg-gradient-to-r from-transparent via-[oklch(0.62_0.1_85)] to-transparent" />
            </div>
          </div>

          <p className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.32em] text-[oklch(0.52_0.06_75)]">
            <span className="inline-block h-px w-6 bg-[oklch(0.6_0.08_80_/_0.6)]" />
            {locale === "en" ? "Civilization Capability Archive" : "文明能力档案"}
            <span className="inline-block h-px w-6 bg-[oklch(0.6_0.08_80_/_0.6)]" />
          </p>
          <h1 className="text-3xl md:text-4xl font-bold font-civ-serif text-[oklch(0.28_0.02_80)]">
            {civName}
          </h1>
          <div className="archive-line mt-4 h-px w-24 bg-gradient-to-r from-transparent via-[oklch(0.62_0.1_85)] to-transparent" />
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-[oklch(0.48_0.02_85)] font-civ-serif">
            {locale === "en"
              ? `The capability record of ${civName}. A total of ${civSkills.length} skills surveyed, ${civUserSkills.length} unlocked across the four dimensions of knowledge, reasoning, application and creation.`
              : `${civName}的能力成长档案。共测绘 ${civSkills.length} 项技能，已解锁 ${civUserSkills.length} 项，覆盖知识、推理、应用、创造四维能力。`}
          </p>
        </div>

        {/* ══ Middle — 无边框双栏：星图 + 档案信息 ══ */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-12">
          {/* Left — 综合能力星图（雷达直接融入页面） */}
          <div className="relative flex items-center justify-center">
            {/* 文明测绘线条 + 节点 */}
            <svg
              className="survey-line pointer-events-none absolute left-0 right-0 top-1/2 h-64 w-full -translate-y-1/2 select-none"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              fill="none"
              stroke="oklch(0.7 0.1 84)"
              strokeWidth="0.12"
            >
              <line x1="0" y1="12" x2="100" y2="12" strokeDasharray="1 1" opacity="0.4" />
              <line x1="0" y1="50" x2="100" y2="50" strokeDasharray="0.6 1.4" opacity="0.5" />
              <line x1="0" y1="88" x2="100" y2="88" strokeDasharray="1 1" opacity="0.4" />
              <line x1="14" y1="0" x2="14" y2="100" strokeDasharray="0.6 1.4" opacity="0.35" />
              <line x1="50" y1="0" x2="50" y2="100" strokeDasharray="0.6 1.4" opacity="0.5" />
              <line x1="86" y1="0" x2="86" y2="100" strokeDasharray="0.6 1.4" opacity="0.35" />
            </svg>
            <span className="survey-node absolute left-[12%] top-[16%] h-1.5 w-1.5 rounded-full bg-[oklch(0.62_0.1_85)]" style={{ animationDelay: "0.5s" }} />
            <span className="survey-node absolute right-[10%] top-[22%] h-1 w-1 rounded-full border border-[oklch(0.62_0.1_85)]" style={{ animationDelay: "0.7s" }} />
            <span className="survey-node absolute left-[18%] bottom-[14%] h-1 w-1 rounded-full border border-[oklch(0.62_0.1_85)]" style={{ animationDelay: "0.9s" }} />
            <span className="survey-node absolute right-[16%] bottom-[10%] h-1.5 w-1.5 rounded-full bg-[oklch(0.62_0.1_85)]" style={{ animationDelay: "1.1s" }} />

            {/* 星图标题 */}
            <div className="absolute left-1/2 top-0 flex -translate-x-1/2 items-center gap-2 text-xs font-civ-serif font-bold tracking-[0.14em] text-[oklch(0.35_0.03_80)]">
              <QuestScrollIcon name="compass" size={14} />
              {locale === "en" ? "Capability Star Map" : "综合能力星图"}
            </div>

            <RadarChart scores={civAggregateScores} size={250} tone="archive" />
          </div>

          {/* Right — 文明档案信息（文字分层） */}
          <div className="relative flex flex-col justify-center">
            <div className="archive-line mb-6 h-px w-full bg-gradient-to-r from-[oklch(0.62_0.1_85_/_0.5)] to-transparent" />
            <div className="space-y-0 divide-y divide-[oklch(0.7_0.05_82_/_0.18)]">
              <ArchiveRow
                index={0}
                label={locale === "en" ? "Total Skills" : "技能总数"}
                value={String(civSkills.length)}
                hint={locale === "en" ? "surveyed" : "已测绘"}
              />
              <ArchiveRow
                index={1}
                label={locale === "en" ? "Unlocked Skills" : "已解锁技能"}
                value={String(civUserSkills.length)}
                hint={locale === "en" ? "awakened" : "已觉醒"}
              />
              <ArchiveRow
                index={2}
                label={locale === "en" ? "Top Skill" : "最高技能"}
                value={
                  civUserSkills.length > 0
                    ? (() => {
                        const top = civUserSkills.reduce((a, b) =>
                          b.overall > a.overall ? b : a
                        );
                        return skillDisplayName(
                          top.skill_name || top.skill_id,
                          "",
                          locale
                        );
                      })()
                    : "—"
                }
                score={
                  civUserSkills.length > 0
                    ? Math.round(
                        civUserSkills.reduce((a, b) =>
                          b.overall > a.overall ? b : a
                        ).overall
                      )
                    : undefined
                }
              />
              <ArchiveRow
                index={3}
                label={locale === "en" ? "Current Stage" : "当前阶段"}
                value={stage}
                hint={locale === "en" ? "of growth" : "成长阶段"}
              />
            </div>
            <div className="archive-line mt-6 h-px w-full bg-gradient-to-r from-transparent via-[oklch(0.62_0.1_85_/_0.5)] to-transparent" />
          </div>
        </div>

        {/* ══ Bottom — 能力谱系（技能节点） ══ */}
        {civSkills.length > 0 && (
          <div className="mt-14">
            <div className="mb-6 flex items-center gap-3">
              <QuestScrollIcon name="tree" size={16} className="text-[oklch(0.55_0.1_84)]" />
              <h3 className="font-civ-serif text-sm font-bold tracking-[0.14em] text-[oklch(0.32_0.02_80)]">
                {locale === "en" ? "Capability Lineage" : "能力谱系"}
              </h3>
              <span className="h-px flex-1 bg-[oklch(0.72_0.05_84_/_0.4)]" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-[oklch(0.5_0.02_84)]">
                {locale === "en" ? `${civSkills.length} skills` : `${civSkills.length} 项技能`}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-px overflow-hidden border border-[oklch(0.72_0.05_84_/_0.35)] bg-[oklch(0.72_0.05_84_/_0.35)] sm:grid-cols-3 lg:grid-cols-4">
              {civSkills.map((skill, i) => {
                const us = userSkills.find((u: UserSkill) => u.skill_id === skill.id);
                const name = skillDisplayName(skill.name, skill.name_en, locale);
                return (
                  <Link
                    key={skill.id}
                    href={`/skills?skill=${skill.id}`}
                    className="skill-node group relative flex items-center gap-3 bg-[oklch(0.985_0.004_94)] px-4 py-5 transition-colors hover:bg-[oklch(0.95_0.01_90)] dark:bg-[oklch(0.2_0.008_84)] dark:hover:bg-[oklch(0.24_0.01_84)]"
                    style={{ animationDelay: `${0.1 + i * 0.06}s` }}
                  >
                    {/* 节点连接线 */}
                    <span className="pointer-events-none absolute left-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-[oklch(0.62_0.1_85_/_0.45)] to-transparent" />
                    {/* 图标 — 所属文明类型图标 */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[oklch(0.7_0.08_84_/_0.5)] bg-[oklch(0.99_0.004_94)] text-[oklch(0.45_0.05_80)] dark:bg-[oklch(0.25_0.01_84)]">
                      <CivIcon
                        type="type"
                        name={civGroup.key}
                        size={22}
                        alt={civName}
                        className="skill-icon-act transition-colors duration-300"
                        fallback={
                          <QuestScrollIcon
                            name={skillLineIcon(skill.name)}
                            size={20}
                            className="skill-icon-act transition-colors duration-300"
                          />
                        }
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-civ-serif text-sm font-semibold text-[oklch(0.32_0.02_80)]">
                        {name}
                      </p>
                      {us && (
                        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[oklch(0.52_0.02_82)]">
                          <span className="inline-block h-1 w-1 rounded-full bg-[oklch(0.62_0.12_85)]" />
                          <span className="font-mono tabular-nums">{us.overall}</span>
                          <span className="opacity-70">
                            {locale === "en" ? "awakened" : "已觉醒"}
                          </span>
                        </p>
                      )}
                    </div>
                    <QuestScrollIcon
                      name="arrow-right"
                      size={13}
                      className="shrink-0 text-[oklch(0.55_0.05_84)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    />
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Back Link ───────────────────────────────────── */}
        <div className="mt-10 text-center">
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

/* ── 文明档案信息行（文字分层） ─────────────────────────── */
function ArchiveRow({
  index,
  label,
  value,
  hint,
  score,
}: {
  index: number;
  label: string;
  value: string;
  hint?: string;
  score?: number;
}) {
  return (
    <div
      className="archive-row flex items-baseline justify-between gap-4 py-4"
      style={{ animationDelay: `${0.3 + index * 0.12}s` }}
    >
      <div className="flex items-baseline gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[oklch(0.5_0.04_75)]">
          {label}
        </span>
        {hint && (
          <span className="text-[10px] text-[oklch(0.6_0.03_80)]">{hint}</span>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        {typeof score === "number" && (
          <span className="text-sm font-semibold text-[oklch(0.5_0.08_80)]">
            {score}
          </span>
        )}
        <span className="font-civ-serif text-2xl font-bold text-[oklch(0.3_0.02_80)]">
          {value}
        </span>
      </div>
    </div>
  );
}
