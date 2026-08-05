"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { Skill, UserSkill } from "@/types/skill";
import type { SkillGrowthPoint, ProgressLog } from "@/types/progress";
import type { World, UserBuilding, UserCompoundBuilding } from "@/types/world";
import type { QuestListItem, UserQuest } from "@/types/quest";
import { RANK_LABELS } from "@/types/skill";
import { SUBMISSION_STATUS_LABELS } from "@/types/quest";
import { computeAggregateScores } from "@/lib/scores";
import { useLocale } from "@/hooks/useLocale";
import { skillDisplayName } from "@/lib/skillNames";
import { QuestScrollIcon, type ScrollIconName } from "./QuestScrollIcon";
import type { DimensionScores } from "@/types/assessment";
import {
  CIV_COLORS,
  CopperDivider,
  SealRing,
  AbilityEmblem,
  BuildingSealIcon,
  ParchmentBackground,
  CivArchiveStyles,
} from "./CivArchiveTheme";

// ── Civilization group lookup (shared with SkillTreeSidebar) ──────

const DOMAIN_TO_CIV: Record<string, { label: string; labelEn: string; icon: ScrollIconName; civKey: string }> = {
  AI: { label: "AI文明", labelEn: "AI Civilization", icon: "sparkle", civKey: "ai" },
  PROGRAMMING: { label: "工程文明", labelEn: "Engineering", icon: "application", civKey: "engineering" },
  RESEARCH: { label: "知识文明", labelEn: "Knowledge", icon: "knowledge", civKey: "knowledge" },
  WRITING: { label: "知识文明", labelEn: "Knowledge", icon: "knowledge", civKey: "knowledge" },
  BUSINESS: { label: "商业文明", labelEn: "Business", icon: "building", civKey: "business" },
  PRODUCT: { label: "商业文明", labelEn: "Business", icon: "building", civKey: "business" },
  DESIGN: { label: "设计文明", labelEn: "Design", icon: "creation", civKey: "design" },
  MEDIA: { label: "媒体文明", labelEn: "Media", icon: "creation", civKey: "media" },
  LANGUAGE: { label: "语言文明", labelEn: "Language", icon: "seal", civKey: "language" },
  SCIENCE: { label: "科学文明", labelEn: "Science", icon: "reasoning", civKey: "science" },
  HEALTH: { label: "健康文明", labelEn: "Health", icon: "shield", civKey: "health" },
  FITNESS: { label: "健康文明", labelEn: "Health", icon: "shield", civKey: "health" },
  FINANCE: { label: "金融文明", labelEn: "Finance", icon: "building-emblem", civKey: "finance" },
  MANAGEMENT: { label: "社会文明", labelEn: "Society", icon: "civilization", civKey: "society" },
  CAREER: { label: "社会文明", labelEn: "Society", icon: "civilization", civKey: "society" },
};

// ── Props ─────────────────────────────────────────────────────────

interface SkillDetailPanelProps {
  selectedSkill: Skill | null;
  selectedUserSkill: UserSkill | null;
  growthPoints: SkillGrowthPoint[];
  trendPoints: SkillGrowthPoint[];
  worldData: World | null;
  recentLogs: ProgressLog[];
  relatedSkills: { skill: Skill; userSkill: UserSkill | undefined }[];
  completedQuests: UserQuest[];
  recommendedQuests: QuestListItem[];
  allUserSkills: UserSkill[];
  onSelectSkill: (skillId: string) => void;
}

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

  const aggregateScores = useMemo(
    () => computeAggregateScores(allUserSkills),
    [allUserSkills]
  );

  const trendChange = useMemo(() => {
    if (trendPoints.length < 2) return null;
    const first = trendPoints[0].score;
    const last = trendPoints[trendPoints.length - 1].score;
    return last - first;
  }, [trendPoints]);

  const domainInfo = selectedSkill
    ? DOMAIN_TO_CIV[selectedSkill.domain]
    : null;

  // ── Welcome State (no skill selected) ─────────────────────────

  if (!selectedSkill) {
    return (
      <div className="civ-archive-page flex-1 overflow-y-auto relative scrollbar-hide">
        <CivArchiveStyles />
        <ParchmentBackground opacity={0.4} />

        {/* Decorative Seal Watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] opacity-[0.05] pointer-events-none select-none">
          <SealRing size={420} />
        </div>

        <div className="max-w-3xl mx-auto px-8 py-12 civ-archive-fade-in relative z-10">
          {/* Welcome header */}
          <div className="text-center mb-10 flex flex-col items-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center shrink-0 relative overflow-hidden civ-archive-seal-hover mb-5"
              style={{
                background: `radial-gradient(circle, ${CIV_COLORS.bgCard} 0%, ${CIV_COLORS.bgContent} 100%)`,
                border: `2px solid ${CIV_COLORS.gold}`,
                boxShadow: `0 4px 12px ${CIV_COLORS.gold}30`,
              }}
            >
              <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100" fill="none" stroke={CIV_COLORS.gold} strokeWidth="0.5">
                <circle cx="50" cy="50" r="45" strokeDasharray="2 2" />
                <circle cx="50" cy="50" r="38" />
                <path d="M 50,5 L 50,95 M 5,50 L 95,50" />
              </svg>
              <QuestScrollIcon name="sparkle" size={36} className="relative z-10" />
            </div>
            <h1 className="civ-archive-title text-3xl mb-3">
              {locale === "en" ? "Capability Archive" : "能力档案"}
            </h1>
            <p className="civ-archive-subtitle text-sm max-w-md mx-auto leading-relaxed">
              {locale === "en"
                ? "Select a skill from the left journal index to inspect its detailed archive. Every unlocked capability is a milestone in your civilization's expansion."
                : "从左侧档案索引中选择一项技能，审阅其详细成长卷宗。每一个解锁的能力，都是文明扩张中的关键里程碑。"}
            </p>
          </div>

          <CopperDivider className="mb-8" />

          {/* Aggregate overview cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Aggregate ability emblem */}
            <div
              className="civ-archive-card p-6"
              style={{ borderColor: CIV_COLORS.gold + "60" }}
            >
              <h3 className="civ-archive-title text-base mb-4 flex items-center gap-2">
                <QuestScrollIcon name="mission" size={14} />
                <span>{locale === "en" ? "Capability Emblem" : "综合能力纹章"}</span>
              </h3>
              <div className="flex justify-center">
                <AbilityEmblem
                  scores={aggregateScores}
                  size={240}
                  labels={{
                    knowledge: locale === "en" ? "Knowledge" : "知识",
                    reasoning: locale === "en" ? "Reasoning" : "推理",
                    application: locale === "en" ? "Application" : "应用",
                    creation: locale === "en" ? "Creation" : "创造",
                  }}
                />
              </div>
            </div>

            {/* Skill stats summary */}
            <div
              className="civ-archive-card p-6 flex flex-col justify-center"
              style={{ borderColor: CIV_COLORS.gold + "60" }}
            >
              <h3 className="civ-archive-title text-base mb-4 flex items-center gap-2">
                <QuestScrollIcon name="scroll" size={14} />
                <span>{locale === "en" ? "Archive Summary" : "档案统计"}</span>
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
                          return `${skillDisplayName(top.skill_name, undefined, locale) || top.skill_id} (${top.overall})`;
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
              <h3 className="civ-archive-title text-base mb-3">
                {locale === "en" ? "Top Skills" : "顶尖技能"}
              </h3>
              <div className="flex flex-wrap gap-2">
                {allUserSkills
                  .sort((a, b) => b.overall - a.overall)
                  .slice(0, 8)
                  .map((us) => (
                    <button
                      key={us.skill_id}
                      onClick={() => onSelectSkill(us.skill_id)}
                      className="civ-archive-card px-3 py-1.5 text-xs font-semibold civ-archive-seal-hover"
                      style={{ borderRadius: "9999px" }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full inline-block mr-1.5"
                        style={{ backgroundColor: CIV_COLORS.gold }}
                      />
                      {skillDisplayName(us.skill_name, undefined, locale) || us.skill_id}
                      <span
                        className="tabular-nums ml-1.5 font-mono"
                        style={{ color: CIV_COLORS.textSecondary }}
                      >
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

  const skillName = skillDisplayName(selectedSkill.name, selectedSkill.name_en, locale);
  const rank = selectedUserSkill?.rank;

  return (
    <div className="civ-archive-page flex-1 overflow-y-auto relative scrollbar-hide">
      <CivArchiveStyles />
      <ParchmentBackground opacity={0.35} />

      <div className="max-w-4xl mx-auto px-6 py-6 civ-archive-fade-in relative z-10">
        {/* ── Breadcrumb ──────────────────────────────────── */}
        <nav
          className="flex items-center gap-1.5 text-xs mb-4 civ-archive-subtitle font-semibold"
          style={{ color: CIV_COLORS.textSecondary }}
        >
          <Link href="/skills" className="hover:opacity-70 transition-opacity">
            {locale === "en" ? "Skills" : "技能"}
          </Link>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          {domainInfo && (
            <>
              <Link
                href={`/skills/civilization/${domainInfo.civKey}`}
                className="hover:opacity-70 transition-opacity cursor-pointer inline-flex items-center gap-1"
              >
                <QuestScrollIcon name={domainInfo.icon} size={12} className="inline-block align-middle" />
                {locale === "en" ? domainInfo.labelEn : domainInfo.label}
              </Link>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </>
          )}
          <span className="font-bold truncate civ-archive-title" style={{ color: CIV_COLORS.textPrimary }}>
            {skillName}
          </span>
        </nav>

        {/* ═══════ 1. 技能档案封面 (Skill Archive Cover) ═══════ */}
        <div
          className="civ-archive-card relative overflow-hidden mb-6"
          style={{
            borderColor: CIV_COLORS.gold,
            borderWidth: "2px",
            minHeight: "240px",
          }}
        >
          <ParchmentBackground opacity={0.5} />

          {/* Low-opacity civilization line decoration */}
          <div className="absolute -top-4 -right-4 w-40 h-40 opacity-[0.07] pointer-events-none select-none">
            <SealRing size={160} />
          </div>

          <div className="relative z-10 p-6 grid grid-cols-1 md:grid-cols-[30%_70%] gap-6 items-center">
            {/* Left: 技能徽章区域 */}
            <div className="flex flex-col items-center justify-center text-center">
              <div
                className="relative civ-archive-seal-hover"
                style={{ filter: `drop-shadow(0 4px 8px ${CIV_COLORS.gold}30)` }}
              >
                <SealRing size={120} className="absolute inset-0" />
                <div
                  className="w-[120px] h-[120px] rounded-full flex items-center justify-center relative"
                  style={{
                    background: `radial-gradient(circle, ${CIV_COLORS.bgCard} 0%, ${CIV_COLORS.bgContent} 100%)`,
                    border: `1.5px solid ${CIV_COLORS.darkRed}`,
                  }}
                >
                  <QuestScrollIcon
                    name={domainInfo?.icon ?? "seal"}
                    size={48}
                    className="relative z-10"
                  />
                </div>
              </div>
              {rank && selectedUserSkill && (
                <span
                  className="mt-3 rounded-full px-3 py-1 text-xs font-bold civ-archive-title"
                  style={{
                    backgroundColor: CIV_COLORS.gold + "20",
                    border: `1px solid ${CIV_COLORS.gold}`,
                    color: CIV_COLORS.darkRed,
                  }}
                >
                  {t(`skills.rank.${rank}`) || RANK_LABELS[rank] || rank}
                </span>
              )}
            </div>

            {/* Right: 技能名称 / 描述 / 等级 / 数据 */}
            <div className="min-w-0">
              <div
                className="text-[10px] font-bold uppercase tracking-widest mb-1"
                style={{ color: CIV_COLORS.textSecondary }}
              >
                {locale === "en" ? "Skill Archive · " : "技能档案 · "}
                {domainInfo ? (locale === "en" ? domainInfo.labelEn : domainInfo.label) : ""}
              </div>
              <h1
                className="civ-archive-title text-3xl mb-2 leading-tight"
                style={{ color: CIV_COLORS.textPrimary }}
              >
                {skillName}
              </h1>
              {selectedSkill.description && (
                <p
                  className="text-sm leading-relaxed mb-3 line-clamp-2"
                  style={{ color: CIV_COLORS.textSecondary }}
                >
                  {locale === "en" && selectedSkill.description_en
                    ? selectedSkill.description_en
                    : selectedSkill.description}
                </p>
              )}

              {/* 已有能力数据 */}
              {selectedUserSkill ? (
                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    <div
                      className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: CIV_COLORS.textSecondary }}
                    >
                      {locale === "en" ? "Overall Score" : "综合评分"}
                    </div>
                    <div
                      className="text-3xl font-bold tabular-nums civ-archive-title"
                      style={{ color: CIV_COLORS.darkRed }}
                    >
                      {selectedUserSkill.overall}
                    </div>
                  </div>
                  <div
                    className="h-10 w-px"
                    style={{ backgroundColor: CIV_COLORS.border }}
                  />
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {DIMENSIONS.map((dim) => (
                      <div key={dim} className="flex items-center gap-2 text-xs">
                        <span
                          className="font-civ-serif font-bold"
                          style={{ color: CIV_COLORS.textSecondary, minWidth: "32px" }}
                        >
                          {t(`skills.dimensions.${dim}`) || dim}
                        </span>
                        <span
                          className="font-mono font-bold tabular-nums"
                          style={{ color: CIV_COLORS.textPrimary }}
                        >
                          {selectedUserSkill[dim]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs"
                  style={{
                    backgroundColor: CIV_COLORS.bgContent,
                    border: `1px dashed ${CIV_COLORS.border}`,
                    color: CIV_COLORS.textSecondary,
                  }}
                >
                  <QuestScrollIcon name="sparkle" size={12} />
                  {locale === "en" ? "Not yet unlocked" : "尚未解锁"}
                </div>
              )}

              {/* Growth phase */}
              {selectedUserSkill && (
                <div className="mt-3 flex items-center gap-2">
                  <span
                    className="text-xs"
                    style={{ color: CIV_COLORS.textSecondary }}
                  >
                    {locale === "en" ? "Growth Phase" : "成长阶段"}:
                  </span>
                  <PhaseIndicator overall={selectedUserSkill.overall} locale={locale} />
                </div>
              )}
            </div>
          </div>

          <CopperDivider />
        </div>

        {/* ═══════ 2. 能力纹章 (Ability Emblem) ═══════ */}
        {selectedUserSkill && (
          <div
            className="civ-archive-card mb-6 p-6"
            style={{ borderColor: CIV_COLORS.border }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="civ-archive-title text-base flex items-center gap-2">
                <QuestScrollIcon name="world-core" size={14} />
                <span>{locale === "en" ? "Ability Emblem" : "能力纹章"}</span>
              </h3>
              <span
                className="text-[10px] font-mono uppercase tracking-wider"
                style={{ color: CIV_COLORS.textSecondary }}
              >
                {locale === "en" ? "4 Dimensions · Civilizational Seal" : "四维 · 文明印章"}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 items-center">
              {/* Emblem SVG */}
              <div className="flex justify-center civ-archive-seal-hover">
                <AbilityEmblem
                  scores={{
                    knowledge: selectedUserSkill.knowledge,
                    reasoning: selectedUserSkill.reasoning,
                    application: selectedUserSkill.application,
                    creation: selectedUserSkill.creation,
                  }}
                  size={280}
                  labels={{
                    knowledge: locale === "en" ? "Knowledge" : "知识",
                    reasoning: locale === "en" ? "Reasoning" : "推理",
                    application: locale === "en" ? "Application" : "应用",
                    creation: locale === "en" ? "Creation" : "创造",
                  }}
                />
              </div>

              {/* Dimension bars */}
              <div className="space-y-3">
                {DIMENSIONS.map((dim) => (
                  <div key={dim} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span
                        className="font-civ-serif font-bold"
                        style={{ color: CIV_COLORS.textPrimary }}
                      >
                        {t(`skills.dimensions.${dim}`) || dim}
                      </span>
                      <span
                        className="font-mono tabular-nums font-bold"
                        style={{ color: CIV_COLORS.darkRed }}
                      >
                        {selectedUserSkill[dim]}
                      </span>
                    </div>
                    <div
                      className="h-2 rounded-full overflow-hidden relative"
                      style={{
                        backgroundColor: CIV_COLORS.bgContent,
                        border: `1px solid ${CIV_COLORS.border}`,
                      }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${selectedUserSkill[dim]}%`,
                          background: `linear-gradient(90deg, ${CIV_COLORS.gold}90, ${CIV_COLORS.darkRed})`,
                        }}
                      />
                    </div>
                  </div>
                ))}
                <div
                  className="pt-2 mt-2 text-[10px] font-mono"
                  style={{ color: CIV_COLORS.textSecondary, borderTop: `1px solid ${CIV_COLORS.border}` }}
                >
                  <span className="mr-3">K×0.2</span>
                  <span className="mr-3">R×0.25</span>
                  <span className="mr-3">A×0.35</span>
                  <span>C×0.2</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════ 3. 文明设施卡 (Civilization Facility Cards) ═══════ */}
        {relatedBuildings.length > 0 && (
          <section className="mb-6">
            <h3 className="civ-archive-title text-base mb-3 flex items-center gap-2">
              <QuestScrollIcon name="building" size={14} />
              <span>{locale === "en" ? "Civilization Facilities" : "文明设施"}</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {relatedBuildings.map((building) => {
                const tpl = (building as any).template;
                const name =
                  locale === "en" && tpl?.name_en
                    ? tpl.name_en
                    : tpl?.name ?? building.id;
                const description =
                  locale === "en" && tpl?.description_en
                    ? tpl?.description_en
                    : tpl?.description;
                const domainType = selectedSkill.domain;
                return (
                  <Link
                    key={building.id}
                    href={`/world?building=${building.id}`}
                    className="civ-archive-card p-4 group relative overflow-hidden block"
                  >
                    <div className="flex items-start gap-4">
                      {/* Building seal icon */}
                      <div className="shrink-0 civ-archive-seal-hover">
                        <BuildingSealIcon type={domainType} size={56} />
                      </div>
                      {/* Building info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p
                            className="text-sm font-bold civ-archive-title truncate"
                            style={{ color: CIV_COLORS.textPrimary }}
                          >
                            {name}
                          </p>
                          <span
                            className="text-xs font-mono font-bold tabular-nums shrink-0 px-2 py-0.5 rounded"
                            style={{
                              backgroundColor: CIV_COLORS.gold + "20",
                              color: CIV_COLORS.darkRed,
                              border: `1px solid ${CIV_COLORS.gold}60`,
                            }}
                          >
                            Lv.{building.level}
                          </span>
                        </div>
                        {description && (
                          <p
                            className="text-xs leading-relaxed line-clamp-2 mb-2"
                            style={{ color: CIV_COLORS.textSecondary }}
                          >
                            {description}
                          </p>
                        )}
                        <div
                          className="inline-flex items-center gap-1 text-xs font-semibold"
                          style={{ color: CIV_COLORS.gold }}
                        >
                          <span>{locale === "en" ? "Enter facility" : "进入设施"}</span>
                          <svg
                            className="w-3 h-3 transition-transform group-hover:translate-x-1"
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ═══════ 4. 文明成长轨迹 (Civilization Growth Trajectory) ═══════ */}
        {selectedUserSkill && (
          <div
            className="civ-archive-card mb-6 p-6"
            style={{ borderColor: CIV_COLORS.border }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="civ-archive-title text-base flex items-center gap-2">
                <QuestScrollIcon name="star" size={14} />
                <span>{locale === "en" ? "Civilization Growth Trajectory" : "文明成长轨迹"}</span>
              </h3>
              {trendChange !== null && (
                <span
                  className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded"
                  style={{
                    backgroundColor: trendChange >= 0 ? CIV_COLORS.gold + "20" : CIV_COLORS.darkRed + "20",
                    color: trendChange >= 0 ? CIV_COLORS.gold : CIV_COLORS.darkRed,
                  }}
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
                  <span className="font-normal opacity-70 ml-1">
                    {locale === "en" ? "in 30d" : "近30天"}
                  </span>
                </span>
              )}
            </div>

            {trendPoints.length >= 2 ? (
              <GrowthTrajectory points={trendPoints} locale={locale} />
            ) : (
              <p
                className="text-xs py-8 text-center"
                style={{ color: CIV_COLORS.textSecondary }}
              >
                {locale === "en"
                  ? "Not enough data for growth trajectory"
                  : "数据不足以绘制成长轨迹"}
              </p>
            )}
          </div>
        )}

        {/* ── Related Skills ───────────────────────────────── */}
        {relatedSkills.length > 1 && (
          <section className="mb-6">
            <h3 className="civ-archive-title text-base mb-3 flex items-center gap-2">
              <QuestScrollIcon name="seal" size={14} />
              <span>{locale === "en" ? "Related Skills" : "同源关联技能"}</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {relatedSkills
                .filter((rs) => rs.skill.id !== selectedSkill.id)
                .map((rs) => (
                  <button
                    key={rs.skill.id}
                    onClick={() => onSelectSkill(rs.skill.id)}
                    className="civ-archive-card px-3 py-1.5 text-xs font-semibold civ-archive-seal-hover"
                    style={{ borderRadius: "9999px" }}
                  >
                    {rs.userSkill && (
                      <span
                        className="h-1.5 w-1.5 rounded-full inline-block mr-1.5"
                        style={{ backgroundColor: CIV_COLORS.gold }}
                      />
                    )}
                    <span
                      className={rs.userSkill ? "font-bold" : ""}
                      style={{ color: rs.userSkill ? CIV_COLORS.textPrimary : CIV_COLORS.textSecondary }}
                    >
                      {skillDisplayName(rs.skill.name, rs.skill.name_en, locale)}
                    </span>
                    {rs.userSkill && (
                      <span
                        className="text-[10px] font-mono tabular-nums ml-1.5"
                        style={{ color: CIV_COLORS.textSecondary }}
                      >
                        {rs.userSkill.overall}
                      </span>
                    )}
                  </button>
                ))}
            </div>
          </section>
        )}

        {/* ═══════ Quests ═══════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Completed quests */}
          <section>
            <h3 className="civ-archive-title text-base mb-3 flex items-center gap-2">
              <QuestScrollIcon name="quest" size={14} />
              <span>{locale === "en" ? "Conquered Quests" : "已征服探索任务"}</span>
            </h3>
            {completedQuests.length > 0 ? (
              <div
                className="rounded-lg overflow-hidden"
                style={{
                  backgroundColor: CIV_COLORS.bgCard,
                  border: `1.5px solid ${CIV_COLORS.border}`,
                }}
              >
                {completedQuests.slice(0, 5).map((q, i) => (
                  <div
                    key={q.quest_id}
                    className="flex items-center gap-2 px-4 py-2.5"
                    style={{
                      borderTop: i > 0 ? `1px solid ${CIV_COLORS.border}60` : "none",
                    }}
                  >
                    <svg
                      className="w-3 h-3 shrink-0"
                      fill="none" viewBox="0 0 24 24" stroke={CIV_COLORS.gold} strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span
                      className="text-xs font-semibold flex-1 truncate"
                      style={{ color: CIV_COLORS.textPrimary }}
                    >
                      {q.quest_title}
                    </span>
                    <span
                      className="text-[10px] shrink-0"
                      style={{ color: CIV_COLORS.textSecondary }}
                    >
                      {SUBMISSION_STATUS_LABELS[q.status] || q.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="rounded-lg p-4 text-center"
                style={{
                  backgroundColor: CIV_COLORS.bgCard,
                  border: `1px dashed ${CIV_COLORS.border}`,
                }}
              >
                <p className="text-xs" style={{ color: CIV_COLORS.textSecondary }}>
                  {locale === "en" ? "No completed quests yet" : "暂无已完成任务"}
                </p>
              </div>
            )}
          </section>

          {/* Recommended quests */}
          <section>
            <h3 className="civ-archive-title text-base mb-3 flex items-center gap-2">
              <QuestScrollIcon name="mission" size={14} />
              <span>{locale === "en" ? "Recommended Quests" : "建议开拓路线"}</span>
            </h3>
            {recommendedQuests.length > 0 ? (
              <div
                className="rounded-lg overflow-hidden"
                style={{
                  backgroundColor: CIV_COLORS.bgCard,
                  border: `1.5px solid ${CIV_COLORS.border}`,
                }}
              >
                {recommendedQuests.slice(0, 5).map((q, i) => (
                  <Link
                    key={q.id}
                    href={`/quests/${q.id}`}
                    className="flex items-center gap-2 px-4 py-2.5 transition-colors group"
                    style={{
                      borderTop: i > 0 ? `1px solid ${CIV_COLORS.border}60` : "none",
                    }}
                  >
                    <span
                      className="text-xs shrink-0"
                      style={{ color: CIV_COLORS.gold }}
                    >
                      ◆
                    </span>
                    <span
                      className="text-xs font-semibold flex-1 truncate transition-colors"
                      style={{ color: CIV_COLORS.textPrimary }}
                    >
                      {q.title}
                    </span>
                    <span
                      className="text-[10px] shrink-0"
                      style={{ color: CIV_COLORS.textSecondary }}
                    >
                      {q.difficulty}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div
                className="rounded-lg p-4 text-center"
                style={{
                  backgroundColor: CIV_COLORS.bgCard,
                  border: `1px dashed ${CIV_COLORS.border}`,
                }}
              >
                <p className="text-xs" style={{ color: CIV_COLORS.textSecondary }}>
                  {locale === "en" ? "No recommended quests" : "暂无推荐任务"}
                </p>
              </div>
            )}
          </section>
        </div>

        {/* ═══════ Recent Growth Records ═══════ */}
        <section>
          <h3 className="civ-archive-title text-base mb-3 flex items-center gap-2">
            <QuestScrollIcon name="scroll" size={14} />
            <span>{locale === "en" ? "Recent Growth Records" : "成长日志"}</span>
          </h3>
          {recentLogs.length > 0 ? (
            <div
              className="rounded-lg overflow-hidden"
              style={{
                backgroundColor: CIV_COLORS.bgCard,
                border: `1.5px solid ${CIV_COLORS.border}`,
              }}
            >
              {recentLogs.slice(0, 10).map((log, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 px-4 py-2.5"
                  style={{
                    borderTop: idx > 0 ? `1px solid ${CIV_COLORS.border}60` : "none",
                  }}
                >
                  <span
                    className="text-[10px] shrink-0 w-16 tabular-nums font-mono"
                    style={{ color: CIV_COLORS.textSecondary }}
                  >
                    {formatDate(log.created_at)}
                  </span>
                  <span
                    className="text-xs font-mono font-bold tabular-nums shrink-0 w-16 text-right"
                    style={{
                      color: log.delta > 0 ? CIV_COLORS.gold : log.delta < 0 ? CIV_COLORS.darkRed : CIV_COLORS.textSecondary,
                    }}
                  >
                    {log.delta > 0 ? "+" : ""}
                    {log.delta} {locale === "en" ? "pts" : "分"}
                  </span>
                  <span
                    className="text-xs font-semibold flex-1 truncate"
                    style={{ color: CIV_COLORS.textPrimary }}
                  >
                    {log.reason}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="rounded-lg p-4 text-center"
              style={{
                backgroundColor: CIV_COLORS.bgCard,
                border: `1px dashed ${CIV_COLORS.border}`,
              }}
            >
              <p className="text-xs" style={{ color: CIV_COLORS.textSecondary }}>
                {locale === "en" ? "No growth records yet" : "暂无成长记录"}
              </p>
            </div>
          )}
        </section>
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
      <span className="text-xs" style={{ color: CIV_COLORS.textSecondary }}>{label}</span>
      <span
        className="text-sm font-semibold tabular-nums"
        style={{ color: highlight ? CIV_COLORS.darkRed : CIV_COLORS.textPrimary }}
      >
        {value}
      </span>
    </div>
  );
}

/** Growth phase indicator — civilization archive styled */
function PhaseIndicator({
  overall,
  locale,
}: {
  overall: number;
  locale: string;
}) {
  const phase = getPhase(overall);
  const phaseColors: Record<string, string> = {
    seed: CIV_COLORS.textSecondary,
    sprout: CIV_COLORS.border,
    growing: CIV_COLORS.gold,
    blooming: CIV_COLORS.darkRed,
    thriving: CIV_COLORS.darkRed,
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
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold civ-archive-title"
      style={{
        backgroundColor: (phaseColors[phase] ?? CIV_COLORS.gold) + "20",
        border: `1px solid ${phaseColors[phase] ?? CIV_COLORS.gold}`,
        color: phaseColors[phase] ?? CIV_COLORS.darkRed,
      }}
    >
      {phase === "seed" && <QuestScrollIcon name="sparkle" size={12} className="inline-block" />}
      {phase === "sprout" && <QuestScrollIcon name="star-outline" size={12} className="inline-block" />}
      {phase === "growing" && <QuestScrollIcon name="star" size={12} className="inline-block" />}
      {phase === "blooming" && <QuestScrollIcon name="creation" size={12} className="inline-block" />}
      {phase === "thriving" && <QuestScrollIcon name="world-core" size={12} className="inline-block" />}
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

// ── Growth Trajectory Component ───────────────────────────────────

/**
 * Civilization Growth Trajectory — replaces the Sparkline.
 * Renders a timeline of growth nodes connected by a trajectory path,
 * styled like a civilization development route.
 */
function GrowthTrajectory({
  points,
  locale,
}: {
  points: SkillGrowthPoint[];
  locale: string;
}) {
  if (points.length < 2) return null;

  const width = 600;
  const height = 120;
  const padding = { top: 20, right: 20, bottom: 30, left: 30 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const scores = points.map((p) => p.score);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const range = maxScore - minScore || 1;

  const xPos = (i: number) => padding.left + (i / (points.length - 1)) * innerW;
  const yPos = (s: number) => padding.top + innerH - ((s - minScore) / range) * innerH;

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xPos(i)} ${yPos(p.score)}`)
    .join(" ");

  // Show every Nth point label to avoid crowding
  const labelStep = Math.max(1, Math.ceil(points.length / 6));

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ minWidth: "320px", maxHeight: "180px" }}
      >
        {/* Background grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = padding.top + innerH * ratio;
          return (
            <line
              key={i}
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              style={{ stroke: "var(--civ-border)" }}
              strokeWidth="0.5"
              opacity="0.4"
              strokeDasharray="2 4"
            />
          );
        })}

        {/* Trajectory path shadow */}
        <path
          d={pathD}
          fill="none"
          stroke={CIV_COLORS.darkRed}
          strokeWidth="3"
          opacity="0.15"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Trajectory path main */}
        <path
          d={pathD}
          fill="none"
          stroke={CIV_COLORS.gold}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Growth nodes */}
        {points.map((p, i) => {
          const x = xPos(i);
          const y = yPos(p.score);
          const showLabel = i % labelStep === 0 || i === points.length - 1;
          return (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r="5"
                style={{ fill: "var(--civ-bg-card)" }}
                stroke={CIV_COLORS.darkRed}
                strokeWidth="1.5"
              />
              <circle cx={x} cy={y} r="2" fill={CIV_COLORS.gold} />
              {showLabel && (
                <text
                  x={x}
                  y={y - 10}
                  textAnchor="middle"
                  style={{ fill: "var(--civ-text-primary)" }}
                  fontSize="9"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {p.score}
                </text>
              )}
            </g>
          );
        })}

        {/* X-axis labels (dates) */}
        {points.map((p, i) => {
          if (i % labelStep !== 0 && i !== points.length - 1) return null;
          const x = xPos(i);
          let label = "";
          try {
            const d = new Date(p.date || (p as any).timestamp);
            label = `${d.getMonth() + 1}/${d.getDate()}`;
          } catch {
            label = "";
          }
          return (
            <text
              key={`label-${i}`}
              x={x}
              y={height - 8}
              textAnchor="middle"
              style={{ fill: "var(--civ-text-secondary)" }}
              fontSize="9"
              fontFamily="monospace"
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
