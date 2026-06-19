"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { Skill, UserSkill } from "@/types/skill";
import type { SkillGrowthPoint, ProgressLog } from "@/types/progress";
import type { World, UserBuilding, UserCompoundBuilding } from "@/types/world";
import type { QuestListItem, UserQuest } from "@/types/quest";
import { RANK_LABELS } from "@/types/skill";
import { SUBMISSION_STATUS_LABELS } from "@/types/quest";
import { RadarChart } from "@/app/components/RadarChart";
import { Sparkline } from "@/app/components/Sparkline";
import { masteryColor } from "@/app/components/GrowthRing";
import { computeAggregateScores } from "@/lib/scores";
import { useLocale } from "@/hooks/useLocale";
import { VintageShieldIcon } from "./VintageShieldIcon";
import type { DimensionScores } from "@/types/assessment";

// ── Civilization group lookup (shared with SkillTreeSidebar) ──────

const DOMAIN_TO_CIV: Record<string, { label: string; labelEn: string; icon: string }> = {
  AI: { label: "AI文明", labelEn: "AI Civilization", icon: "🤖" },
  PROGRAMMING: { label: "工程文明", labelEn: "Engineering", icon: "⚙️" },
  RESEARCH: { label: "知识文明", labelEn: "Knowledge", icon: "📚" },
  BUSINESS: { label: "商业文明", labelEn: "Business", icon: "💼" },
  DESIGN: { label: "设计文明", labelEn: "Design", icon: "🎨" },
  LANGUAGE: { label: "语言文明", labelEn: "Language", icon: "🗣️" },
  SCIENCE: { label: "科学文明", labelEn: "Science", icon: "🔬" },
  HEALTH: { label: "健康文明", labelEn: "Health", icon: "💪" },
  FINANCE: { label: "金融文明", labelEn: "Finance", icon: "💰" },
  MANAGEMENT: { label: "社会文明", labelEn: "Society", icon: "🌐" },
  CAREER: { label: "社会文明", labelEn: "Society", icon: "🌐" },
  MEDIA: { label: "社会文明", labelEn: "Society", icon: "🌐" },
};

// ── Props ─────────────────────────────────────────────────────────

interface SkillDetailPanelProps {
  /** The selected skill definition */
  selectedSkill: Skill | null;
  /** The user's state for the selected skill */
  selectedUserSkill: UserSkill | null;
  /** Growth curve points */
  growthPoints: SkillGrowthPoint[];
  /** 30-day trend for sparkline */
  trendPoints: SkillGrowthPoint[];
  /** World data for building lookup */
  worldData: World | null;
  /** Recent progress logs for this skill */
  recentLogs: ProgressLog[];
  /** Skills in the same domain */
  relatedSkills: { skill: Skill; userSkill: UserSkill | undefined }[];
  /** Completed quests for this skill */
  completedQuests: UserQuest[];
  /** Recommended quests for this skill */
  recommendedQuests: QuestListItem[];
  /** All user skills (for aggregate radar in welcome state) */
  allUserSkills: UserSkill[];
  /** Callback to select a different skill */
  onSelectSkill: (skillId: string) => void;
}

// ── Constants ─────────────────────────────────────────────────────

const DIMENSIONS: (keyof DimensionScores)[] = [
  "knowledge",
  "reasoning",
  "application",
  "creation",
];

// ── Component ─────────────────────────────────────────────────────

export function SkillDetailPanel({
  selectedSkill,
  selectedUserSkill,
  growthPoints,
  trendPoints,
  worldData,
  recentLogs,
  relatedSkills,
  completedQuests,
  recommendedQuests,
  allUserSkills,
  onSelectSkill,
}: SkillDetailPanelProps) {
  const { t, locale } = useLocale();

  // Compute related buildings from world data
  const relatedBuildings = useMemo(() => {
    if (!worldData || !selectedSkill) return [];
    const allBuildings: (UserBuilding | UserCompoundBuilding)[] = [
      ...(worldData.buildings ?? []),
      ...(worldData.compound_buildings ?? []),
    ];
    return allBuildings.filter(
      (b) => (b as any).template?.skill_id === selectedSkill.id
    );
  }, [worldData, selectedSkill]);

  // Aggregate radar scores for welcome state
  const aggregateScores = useMemo(
    () => computeAggregateScores(allUserSkills),
    [allUserSkills]
  );

  // Compute trend change (last vs first)
  const trendChange = useMemo(() => {
    if (trendPoints.length < 2) return null;
    const first = trendPoints[0].score;
    const last = trendPoints[trendPoints.length - 1].score;
    return last - first;
  }, [trendPoints]);

  // Domain label for breadcrumb
  const domainInfo = selectedSkill
    ? DOMAIN_TO_CIV[selectedSkill.domain]
    : null;

  // ── Welcome State (no skill selected) ─────────────────────────

  if (!selectedSkill) {
    return (
      <div className="flex-1 overflow-y-auto bg-cartography-grid relative scrollbar-hide">
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
          {/* Welcome header */}
          <div className="text-center mb-10 flex flex-col items-center">
            <VintageShieldIcon icon="🌱" size="lg" tier="gold" className="mb-4 animate-gentle-float" />
            <h1 className="text-2xl font-bold font-civ-serif text-[oklch(0.3_0.02_80)] mb-2">
              {locale === "en" ? "Capability Ledger" : "能力技能大总账"}
            </h1>
            <p className="text-sm text-[oklch(0.5_0.02_85)] max-w-md mx-auto leading-relaxed font-civ-serif">
              {locale === "en"
                ? "Select a skill from the left journal index to inspect its detailed ledger. Every unlocked capability is a milestone in your civilization's expansion."
                : "从左侧账本索引中选择一项技能，开始审阅其详细的成长总账。每一个解锁的能力，都是你文明扩张中的关键里程碑。"}
            </p>
          </div>

          {/* Aggregate overview cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Aggregate radar */}
            <div className="vintage-parchment-card rounded-2xl border border-[oklch(0.88_0.02_90)] p-6 shadow-sm">
              <h3 className="text-sm font-bold font-civ-serif text-[oklch(0.3_0.02_80)] mb-4 flex items-center gap-1.5">
                <span>🧭</span> {locale === "en" ? "Capability Landscape" : "综合能力星图"}
              </h3>
              <div className="flex justify-center">
                <RadarChart scores={aggregateScores} size={220} />
              </div>
            </div>

            {/* Skill stats summary */}
            <div className="vintage-parchment-card rounded-2xl border border-[oklch(0.88_0.02_90)] p-6 shadow-sm flex flex-col justify-center">
              <h3 className="text-sm font-bold font-civ-serif text-[oklch(0.3_0.02_80)] mb-4 flex items-center gap-1.5">
                <span>📜</span> {locale === "en" ? "Ledger Summary" : "账目统计"}
              </h3>
              <div className="space-y-3">
                <StatRow
                  label={locale === "en" ? "Unlocked Skills" : "已解锁技能"}
                  value={allUserSkills.length}
                />
                <StatRow
                  label={locale === "en" ? "Top Skill" : "最高技能"}
                  value={
                    allUserSkills.length > 0
                      ? (() => {
                          const top = allUserSkills.reduce((a, b) =>
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
                    allUserSkills.length > 0
                      ? Math.round(
                          allUserSkills.reduce((s, us) => s + us.overall, 0) /
                            allUserSkills.length
                        )
                      : "—"
                  }
                  highlight
                />
              </div>
            </div>
          </div>

          {/* Quick-jump: top skills */}
          {allUserSkills.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-bold font-civ-serif text-[oklch(0.3_0.02_80)] mb-3">
                {locale === "en" ? "Top Skills" : "最高技能"}
              </h3>
              <div className="flex flex-wrap gap-2">
                {allUserSkills
                  .sort((a, b) => b.overall - a.overall)
                  .slice(0, 8)
                  .map((us) => (
                    <button
                      key={us.skill_id}
                      onClick={() => onSelectSkill(us.skill_id)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[oklch(0.88_0.02_90)] bg-[oklch(0.99_0.003_95)] dark:bg-[oklch(0.22_0.008_85)] px-3 py-1.5 text-xs font-semibold text-[oklch(0.35_0.02_80)] transition-all hover:border-[oklch(0.7_0.12_85)] hover:bg-[oklch(0.72_0.12_82_/_0.05)] hover:shadow-sm"
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: masteryColor(us.overall) }}
                      />
                      {us.skill_name || us.skill_id}
                      <span className="text-muted-foreground tabular-nums ml-1">
                        {us.overall}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Skill Detail State ─────────────────────────────────────────

  const skillName = selectedSkill.name;
  const rank = selectedUserSkill?.rank;

  return (
    <div className="flex-1 overflow-y-auto bg-cartography-grid relative scrollbar-hide">
      {/* Decorative wind rose watermark for detailed view */}
      <div className="absolute top-12 right-12 w-64 h-64 opacity-[0.03] dark:opacity-[0.06] pointer-events-none select-none animate-rhumb-spin">
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.5">
          <circle cx="50" cy="50" r="45" strokeDasharray="3 3" />
          <path d="M 50,5 L 50,95 M 5,50 L 95,50" />
          <polygon points="50,50 50,15 47,35" fill="currentColor" />
          <polygon points="50,50 50,85 53,65" fill="currentColor" />
          <polygon points="50,50 85,50 65,47" fill="currentColor" />
          <polygon points="50,50 15,50 35,53" fill="currentColor" />
        </svg>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-8 animate-fade-in relative z-10">
        {/* ── Breadcrumb ──────────────────────────────────── */}
        <nav className="flex items-center gap-1.5 text-xs text-[oklch(0.5_0.02_85)] mb-6 font-civ-serif font-semibold">
          <Link
            href="/skills"
            className="hover:text-[oklch(0.3_0.02_80)] transition-colors"
          >
            {locale === "en" ? "Skills" : "技能"}
          </Link>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          {domainInfo && (
            <>
              <span className="hover:text-[oklch(0.3_0.02_80)] transition-colors cursor-pointer">
                {domainInfo.icon} {locale === "en" ? domainInfo.labelEn : domainInfo.label}
              </span>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </>
          )}
          <span className="font-bold text-[oklch(0.3_0.02_80)] truncate">
            {skillName}
          </span>
        </nav>

        {/* ── Skill Header ────────────────────────────────── */}
        <div className="vintage-parchment-card rounded-2xl border-2 border-double border-[oklch(0.7_0.12_85_/_0.65)] p-6 shadow-md mb-6 relative overflow-hidden">
          {/* Coordinates watermark */}
          <div className="absolute top-2 right-3 text-[9px] font-mono opacity-25 text-[oklch(0.3_0.02_80)] select-none">
            [S {10 + (selectedSkill.id.charCodeAt(0) % 80)}° {(selectedSkill.id.charCodeAt(1) ?? 44) % 60}' / W {20 + (selectedSkill.id.charCodeAt(2) ?? 33) % 150}° {(selectedSkill.id.charCodeAt(3) ?? 22) % 60}']
          </div>
          <div className="flex items-start justify-between gap-4 relative z-10">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold font-civ-serif text-[oklch(0.3_0.02_80)] mb-1">
                {skillName}
              </h1>
              {selectedSkill.description && (
                <p className="text-sm text-[oklch(0.5_0.02_85)] leading-relaxed line-clamp-2">
                  {locale === "en" && selectedSkill.description_en
                    ? selectedSkill.description_en
                    : selectedSkill.description}
                </p>
              )}
            </div>
            {selectedUserSkill && (
              <div className="flex items-center gap-3 shrink-0">
                {rank && (
                  <span className="rounded-full bg-[oklch(0.72_0.12_82_/_0.15)] border border-[oklch(0.72_0.12_82_/_0.4)] px-3 py-1 text-xs font-bold font-civ-serif text-[oklch(0.35_0.12_85)]">
                    {t(`skills.rank.${rank}`) || RANK_LABELS[rank] || rank}
                  </span>
                )}
                <div className="text-right">
                  <div className="text-3xl font-bold text-[oklch(0.3_0.02_80)] tabular-nums">
                    {selectedUserSkill.overall}
                  </div>
                  <div className="text-[10px] text-[oklch(0.5_0.02_85)] font-bold">
                    {locale === "en" ? "Overall Score" : "综合评分"}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Growth phase indicator */}
          {selectedUserSkill && (
            <div className="mt-4 pt-4 border-t border-border flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {locale === "en" ? "Growth Phase" : "成长阶段"}:
              </span>
              <PhaseIndicator overall={selectedUserSkill.overall} locale={locale} />
            </div>
          )}
        </div>

        {/* ── 4D Radar + Trend ────────────────────────────── */}
        {selectedUserSkill && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Radar chart */}
            <div className="vintage-parchment-card rounded-2xl border border-[oklch(0.88_0.02_90)] p-6 shadow-sm">
              <h3 className="text-sm font-bold font-civ-serif text-[oklch(0.3_0.02_80)] mb-4 flex items-center gap-1.5">
                <span>🗺️</span> {locale === "en" ? "4-Dimension Analysis" : "四维能力剖面"}
              </h3>
              <div className="flex items-center gap-4">
                <RadarChart
                  scores={{
                    knowledge: selectedUserSkill.knowledge,
                    reasoning: selectedUserSkill.reasoning,
                    application: selectedUserSkill.application,
                    creation: selectedUserSkill.creation,
                  }}
                  size={180}
                  showLabels={false}
                />
                <div className="flex-1 space-y-2 min-w-0">
                  {DIMENSIONS.map((dim) => (
                    <div key={dim} className="flex items-center gap-2 text-xs">
                      <span className="w-16 shrink-0 font-civ-serif font-bold text-[oklch(0.35_0.02_80)] truncate">
                        {t(`skills.dimensions.${dim}`) || dim}
                      </span>
                      <div className="flex-1 h-2.5 rounded-full bg-[oklch(0.95_0.005_90)] dark:bg-[oklch(0.25_0.008_85)] border border-[oklch(0.88_0.02_90_/_0.7)] overflow-hidden relative">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[oklch(0.55_0.08_160)] to-[oklch(0.6_0.1_150)] animate-route-flow transition-all duration-500"
                          style={{ width: `${selectedUserSkill[dim]}%` }}
                        />
                      </div>
                      <span className="w-7 text-right font-mono tabular-nums font-bold text-[oklch(0.3_0.02_80)]">
                        {selectedUserSkill[dim]}
                      </span>
                    </div>
                  ))}
                  {/* Dimension weights */}
                  <div className="pt-1 border-t border-[oklch(0.88_0.02_90_/_0.5)] mt-2">
                    <div className="flex gap-3 text-[10px] font-mono text-[oklch(0.5_0.02_85)]">
                      <span>K×0.2</span>
                      <span>R×0.25</span>
                      <span>A×0.35</span>
                      <span>C×0.2</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Growth trend */}
            <div className="vintage-parchment-card rounded-2xl border border-[oklch(0.88_0.02_90)] p-6 shadow-sm relative overflow-hidden">
              <h3 className="text-sm font-bold font-civ-serif text-[oklch(0.3_0.02_80)] mb-4 flex items-center gap-1.5">
                <span>📈</span> {locale === "en" ? "Growth Trend" : "文明成长曲线"}
              </h3>
              {trendPoints.length >= 2 ? (
                <div className="space-y-3 relative z-10">
                  <Sparkline
                    points={trendPoints}
                    width={260}
                    height={48}
                    className="w-full"
                  />
                  {trendChange !== null && (
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-0.5 text-xs font-bold ${
                          trendChange >= 0 ? "text-[oklch(0.55_0.1_150)]" : "text-[oklch(0.5_0.15_25)]"
                        }`}
                      >
                        {trendChange >= 0 ? (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                          </svg>
                        )}
                        {trendChange > 0 ? "+" : ""}
                        {trendChange}
                      </span>
                      <span className="text-[10px] font-civ-serif font-semibold text-[oklch(0.5_0.02_85)]">
                        {locale === "en" ? "in 30 days" : "近30天变化"}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[oklch(0.55_0.02_85)] py-8 text-center">
                  {locale === "en"
                    ? "Not enough data for trend analysis"
                    : "数据不足以分析趋势"}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Related Buildings ────────────────────────────── */}
        {relatedBuildings.length > 0 && (
          <section className="mb-6">
            <h3 className="text-sm font-bold font-civ-serif text-[oklch(0.3_0.02_80)] mb-3 flex items-center gap-1.5">
              <span>🏛️</span> {locale === "en" ? "Related Buildings" : "所辖领域内建筑"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {relatedBuildings.map((building) => {
                const tpl = (building as any).template;
                const name =
                  locale === "en" && tpl?.name_en
                    ? tpl.name_en
                    : tpl?.name ?? building.id;
                return (
                  <Link
                    key={building.id}
                    href={`/world?building=${building.id}`}
                    className="flex items-center gap-3 rounded-xl border border-[oklch(0.88_0.02_90)] bg-gradient-to-br from-[oklch(0.99_0.003_95)] to-[oklch(0.96_0.005_90)] dark:from-[oklch(0.22_0.008_85)] dark:to-[oklch(0.2_0.006_85)] p-3.5 transition-all hover:shadow-md hover:border-[oklch(0.7_0.12_85)] group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 border border-double border-[oklch(0.7_0.12_85_/_0.2)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl" />
                    <span className="text-2xl transition-transform group-hover:scale-110">
                      {tpl?.icon ?? "🏛️"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[oklch(0.3_0.02_80)] truncate">
                        {name}
                      </p>
                      <p className="text-xs text-[oklch(0.5_0.02_85)]">
                        Lv.{building.level}
                      </p>
                    </div>
                    <svg
                      className="w-3.5 h-3.5 text-[oklch(0.5_0.02_85)] shrink-0 transition-transform group-hover:translate-x-0.5"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Related Skills ───────────────────────────────── */}
        {relatedSkills.length > 1 && (
          <section className="mb-6">
            <h3 className="text-sm font-bold font-civ-serif text-[oklch(0.3_0.02_80)] mb-3 flex items-center gap-1.5">
              <span>🔗</span> {locale === "en" ? "Related Skills" : "同源关联技能"}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {relatedSkills
                .filter((rs) => rs.skill.id !== selectedSkill.id)
                .map((rs) => (
                  <button
                    key={rs.skill.id}
                    onClick={() => onSelectSkill(rs.skill.id)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[oklch(0.88_0.02_90)] bg-[oklch(0.99_0.003_95)] dark:bg-[oklch(0.22_0.008_85)] px-3 py-1.5 text-xs font-semibold text-[oklch(0.35_0.02_80)] transition-all hover:border-[oklch(0.7_0.12_85)] hover:bg-[oklch(0.72_0.12_82_/_0.05)]"
                  >
                    {rs.userSkill && (
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          backgroundColor: masteryColor(rs.userSkill.overall),
                        }}
                      />
                    )}
                    <span
                      className={
                        rs.userSkill
                          ? "font-bold text-[oklch(0.3_0.02_80)]"
                          : "text-[oklch(0.5_0.02_85)]"
                      }
                    >
                      {rs.skill.name}
                    </span>
                    {rs.userSkill && (
                      <span className="text-[10px] text-[oklch(0.4_0.02_80)] font-mono tabular-nums ml-1">
                        {rs.userSkill.overall}
                      </span>
                    )}
                  </button>
                ))}
            </div>
          </section>
        )}

        {/* ── Quests: Completed + Recommended ──────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Completed quests */}
          <section>
            <h3 className="text-sm font-bold font-civ-serif text-[oklch(0.3_0.02_80)] mb-3 flex items-center gap-1.5">
              <span>⚔️</span> {locale === "en" ? "Completed Quests" : "已征服探索任务"}
            </h3>
            {completedQuests.length > 0 ? (
              <div className="vintage-parchment-card rounded-xl border border-[oklch(0.88_0.02_90)] divide-y divide-[oklch(0.88_0.02_90_/_0.4)] shadow-sm">
                {completedQuests.slice(0, 5).map((q) => (
                  <div
                    key={q.quest_id}
                    className="flex items-center gap-2 px-4 py-2.5"
                  >
                    <span className="text-xs text-[oklch(0.55_0.1_150)] font-bold shrink-0">✓</span>
                    <span className="text-xs text-[oklch(0.3_0.02_80)] font-semibold flex-1 truncate">
                      {q.quest_title}
                    </span>
                    <span className="text-[10px] text-[oklch(0.5_0.02_85)] shrink-0">
                      {SUBMISSION_STATUS_LABELS[q.status] || q.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="vintage-parchment-card rounded-xl border border-border p-4 text-center">
                <p className="text-xs text-[oklch(0.55_0.02_85)]">
                  {locale === "en"
                    ? "No completed quests yet"
                    : "暂无已完成任务"}
                </p>
              </div>
            )}
          </section>

          {/* Recommended quests */}
          <section>
            <h3 className="text-sm font-bold font-civ-serif text-[oklch(0.3_0.02_80)] mb-3 flex items-center gap-1.5">
              <span>🧭</span> {locale === "en" ? "Recommended Quests" : "建议开拓路线"}
            </h3>
            {recommendedQuests.length > 0 ? (
              <div className="vintage-parchment-card rounded-xl border border-[oklch(0.88_0.02_90)] divide-y divide-[oklch(0.88_0.02_90_/_0.4)] shadow-sm">
                {recommendedQuests.slice(0, 5).map((q) => (
                  <Link
                    key={q.id}
                    href={`/quests/${q.id}`}
                    className="flex items-center gap-2 px-4 py-2.5 hover:bg-[oklch(0.72_0.12_82_/_0.06)] transition-colors group"
                  >
                    <span className="text-xs text-[oklch(0.72_0.12_82)] shrink-0">◆</span>
                    <span className="text-xs text-[oklch(0.3_0.02_80)] font-semibold flex-1 truncate group-hover:text-[oklch(0.35_0.12_85)] transition-colors">
                      {q.title}
                    </span>
                    <span className="text-[10px] text-[oklch(0.5_0.02_85)] shrink-0">
                      {q.difficulty}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="vintage-parchment-card rounded-xl border border-border p-4 text-center">
                <p className="text-xs text-[oklch(0.55_0.02_85)]">
                  {locale === "en"
                    ? "No recommended quests"
                    : "暂无推荐任务"}
                </p>
              </div>
            )}
          </section>
        </div>

        {/* ── Recent Growth Records ─────────────────────────── */}
        <section>
          <h3 className="text-sm font-bold font-civ-serif text-[oklch(0.3_0.02_80)] mb-3 flex items-center gap-1.5">
            <span>📖</span> {locale === "en" ? "Recent Growth Records" : "航海开发成长日志"}
          </h3>
          {recentLogs.length > 0 ? (
            <div className="vintage-parchment-card rounded-xl border border-[oklch(0.88_0.02_90)] divide-y divide-[oklch(0.88_0.02_90_/_0.4)] shadow-sm">
              {recentLogs.slice(0, 10).map((log, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 px-4 py-2.5"
                >
                  <span className="text-[10px] text-[oklch(0.5_0.02_85)] shrink-0 w-16 tabular-nums">
                    {formatDate(log.created_at)}
                  </span>
                  <span
                    className={`text-xs font-mono font-bold tabular-nums shrink-0 w-16 text-right ${
                      log.delta > 0
                        ? "text-[oklch(0.55_0.1_150)]"
                        : log.delta < 0
                          ? "text-[oklch(0.5_0.15_25)]"
                          : "text-[oklch(0.5_0.02_85)]"
                    }`}
                  >
                    {log.delta > 0 ? "+" : ""}
                    {log.delta} {locale === "en" ? "pts" : "分"}
                  </span>
                  <span className="text-xs text-[oklch(0.3_0.02_80)] font-semibold flex-1 truncate">
                    {log.reason}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="vintage-parchment-card rounded-xl border border-border p-4 text-center">
              <p className="text-xs text-[oklch(0.55_0.02_85)]">
                {locale === "en"
                  ? "No growth records yet"
                  : "暂无成长记录"}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────

/** Simple stat row for the welcome view */
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

/** Growth phase indicator based on overall score */
function PhaseIndicator({
  overall,
  locale,
}: {
  overall: number;
  locale: string;
}) {
  const phase = getPhase(overall);
  const phaseColors: Record<string, string> = {
    seed: "oklch(0.55 0.08 160)",
    sprout: "oklch(0.6 0.1 150)",
    growing: "oklch(0.65 0.12 140)",
    blooming: "oklch(0.7 0.12 85)",
    thriving: "oklch(0.75 0.13 80)",
  };

  const phaseLabels: Record<string, { zh: string; en: string }> = {
    seed: { zh: "播种期", en: "Seed" },
    sprout: { zh: "萌芽期", en: "Sprout" },
    growing: { zh: "成长期", en: "Growing" },
    blooming: { zh: "盛放期", en: "Blooming" },
    thriving: { zh: "繁盛期", en: "Thriving" },
  };

  const info = phaseLabels[phase] ?? phaseLabels.seed;

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
      style={{ backgroundColor: phaseColors[phase] ?? phaseColors.seed }}
    >
      {phase === "seed" && "🌱"}
      {phase === "sprout" && "🌿"}
      {phase === "growing" && "🪴"}
      {phase === "blooming" && "🌺"}
      {phase === "thriving" && "🌳"}
      {locale === "en" ? info.en : info.zh}
    </span>
  );
}

function getPhase(overall: number): string {
  if (overall <= 20) return "seed";
  if (overall <= 40) return "sprout";
  if (overall <= 60) return "growing";
  if (overall <= 80) return "blooming";
  return "thriving";
}

/** Format ISO date to MM/DD */
function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${mm}/${dd}`;
  } catch {
    return "";
  }
}
