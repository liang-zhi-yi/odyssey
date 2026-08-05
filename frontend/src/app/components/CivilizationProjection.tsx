"use client";

import { useLocale } from "@/hooks/useLocale";
import { QuestScrollIcon } from "@/app/components/QuestScrollIcon";
import { BuildingSealIcon, inferSkillId } from "@/app/components/CivArchiveTheme";
import { skillDisplayName } from "@/lib/skillNames";

interface ProjectionSkill {
  id: string;
  name: string;
  name_en?: string | null;
}

interface CivilizationProjectionProps {
  title: string;
  field: string | null;
  skillId: string;
  description: string;
  allSkills: ProjectionSkill[];
  isAnalyzing?: boolean;
  analyzeError?: string | null;
  onAnalyze?: () => void;
}

/**
 * 文明档案投影 — 新建项目时的实时水晶舱预览。
 * 半透明水晶舱，随表单书写实时凝实，映照档案的五个侧影：
 * 项目名称 / 探索领域 / 能力印记 / 文明贡献 / 档案状态。
 */
export function CivilizationProjection({
  title,
  field,
  skillId,
  description,
  allSkills,
  isAnalyzing = false,
  analyzeError = null,
  onAnalyze,
}: CivilizationProjectionProps) {
  const { t, locale } = useLocale();

  const selectedSkill = allSkills.find((s) => s.id === skillId);

  // 档案完整度 — 名称 / 探索日志 / 领域或印记
  const filled = [
    title.trim().length > 0,
    description.trim().length > 0,
    !!field || !!skillId,
  ].filter(Boolean).length;
  const completeness = filled / 3;

  // 档案状态
  const status =
    filled === 0
      ? "awaiting"
      : filled < 3
        ? "draft"
        : "ready";

  // 文明贡献等级
  const hasContent = title.trim().length > 0 && description.trim().length > 0;
  const contribution =
    !hasContent
      ? "empty"
      : description.trim().length >= 60 && !!skillId
        ? "monument"
        : description.trim().length >= 30
          ? "deep"
          : "seed";

  const statusLabel =
    status === "awaiting"
      ? t("projects.projectionStatusAwaiting")
      : status === "draft"
        ? t("projects.projectionStatusDraft")
        : t("projects.projectionStatusReady");

  const statusColor =
    status === "ready"
      ? "[oklch(0.6_0.08_145_/_0.5)]"
      : status === "draft"
        ? "[oklch(0.7_0.12_85_/_0.5)]"
        : "[oklch(0.5_0.03_75_/_0.4)]";

  const contributionLabel =
    contribution === "empty"
      ? t("projects.projectionContributionEmpty")
      : contribution === "seed"
        ? t("projects.projectionContributionSeed")
        : contribution === "deep"
          ? t("projects.projectionContributionDeep")
          : t("projects.projectionContributionMonument");

  const contributionColor =
    contribution === "monument"
      ? "[oklch(0.6_0.08_145_/_0.5)]"
      : contribution === "deep"
        ? "[oklch(0.7_0.12_85_/_0.5)]"
        : contribution === "seed"
          ? "[oklch(0.65_0.10_55_/_0.5)]"
          : "[oklch(0.5_0.03_75_/_0.4)]";

  return (
    <div className="relative rounded-2xl border border-[oklch(0.7_0.12_85_/_0.3)] bg-gradient-to-br from-[oklch(0.99_0.003_95_/_0.12)] to-[oklch(0.975_0.005_92_/_0.08)] dark:from-[oklch(0.22_0.008_85_/_0.22)] dark:to-[oklch(0.2_0.006_85_/_0.18)] p-6 overflow-hidden">
      {/* 微弱光晕 */}
      <div className="absolute inset-0 bg-[oklch(0.7_0.12_85_/_0.05)] blur-[40px] pointer-events-none" />
      {/* 顶部金色细线 */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[oklch(0.7_0.12_85_/_0.5)] to-transparent" />
      {/* 边框金色细线装饰 */}
      <div className="absolute top-3 left-3 w-5 h-5 border-l border-t border-[oklch(0.7_0.12_85_/_0.35)]" />
      <div className="absolute bottom-3 right-3 w-5 h-5 border-r border-b border-[oklch(0.7_0.12_85_/_0.35)]" />

      {/* 标题栏 */}
      <div className="relative flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold italic font-civ-serif text-[oklch(0.35_0.02_70)] dark:text-[oklch(0.85_0.04_80)]">
          {t("projects.projectionTitle")}
        </h2>
        <span className="text-[9px] font-mono tracking-[0.2em] bg-[oklch(0.7_0.12_85_/_0.15)] text-[oklch(0.6_0.10_85)] dark:text-[oklch(0.72_0.12_82)] px-2 py-0.5 rounded-full">
          {t("projects.projectionBadge")}
        </span>
      </div>

      <p className="relative text-xs leading-relaxed font-civ-serif text-[oklch(0.5_0.03_75)] dark:text-[oklch(0.62_0.02_80)] mb-5">
        {t("projects.projectionSubtitle")}
      </p>

      {/* 文明核心图标 */}
      <div className="relative flex items-center justify-center mb-5">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[oklch(0.7_0.12_85_/_0.25)] blur-[6px] animate-pulse" />
          <div className="absolute inset-2 rounded-full bg-[oklch(0.7_0.12_85_/_0.12)] blur-[4px]" />
          <QuestScrollIcon
            name="world-core"
            size={40}
            strokeWidth={1.1}
            className="relative text-[oklch(0.6_0.11_85)] dark:text-[oklch(0.75_0.12_82)]"
          />
        </div>
      </div>

      {/* 五个投影切片 */}
      <div className="relative space-y-4">
        {/* 项目名称 */}
        <ProjectionRow label={t("projects.projectionName")} icon="seal">
          <p className="text-base font-civ-serif text-[oklch(0.3_0.02_70)] dark:text-[oklch(0.88_0.04_80)]">
            {title.trim() || (
              <span className="italic text-[oklch(0.5_0.03_75_/_0.6)]">
                {t("projects.projectionNameEmpty")}
              </span>
            )}
          </p>
        </ProjectionRow>

        {/* 探索领域 */}
        <ProjectionRow label={t("projects.projectionField")} icon="compass">
          {field ? (
            <span className="inline-flex items-center rounded-full border border-[oklch(0.6_0.08_145_/_0.3)] bg-[oklch(0.6_0.08_145_/_0.1)] px-2 py-0.5 text-xs font-medium text-[oklch(0.4_0.08_145)] dark:text-[oklch(0.72_0.09_145)]">
              {field}
            </span>
          ) : (
            <p className="text-sm italic font-civ-serif text-[oklch(0.5_0.03_75_/_0.6)]">
              {t("projects.projectionFieldEmpty")}
            </p>
          )}
        </ProjectionRow>

        {/* 能力印记 */}
        <ProjectionRow label={t("projects.projectionSeal")} icon="seal">
          {selectedSkill ? (
            <span className="inline-flex items-center gap-2">
              <BuildingSealIcon type={inferSkillId(selectedSkill.name, selectedSkill.id)} size={26} />
              <span className="text-sm font-civ-serif text-[oklch(0.4_0.08_85)] dark:text-[oklch(0.75_0.04_85)]">
                {skillDisplayName(selectedSkill.name, selectedSkill.name_en, locale)}
              </span>
            </span>
          ) : (
            <p className="text-sm italic font-civ-serif text-[oklch(0.5_0.03_75_/_0.6)]">
              {t("projects.projectionSealEmpty")}
            </p>
          )}
        </ProjectionRow>

        {/* 文明贡献 */}
        <ProjectionRow label={t("projects.projectionContribution")} icon="world-core">
          <div className="w-full">
            <span
              className={`inline-flex items-center text-sm font-civ-serif text-[oklch(0.4_0.08_85)] dark:text-[oklch(0.75_0.04_85)] border px-2 py-0.5 rounded-full bg-[oklch(0.7_0.12_85_/_0.08)] ${contributionColor}`}
            >
              {contributionLabel}
            </span>
          </div>
        </ProjectionRow>

        {/* 档案状态 + 完整度 */}
        <div className="pt-1 border-t border-[oklch(0.7_0.12_85_/_0.2)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[oklch(0.5_0.03_75)] font-civ-serif">
              {t("projects.projectionCompleteness")}
            </span>
            <span className="text-[10px] font-mono text-[oklch(0.5_0.03_75)]">
              {Math.round(completeness * 100)}%
            </span>
          </div>
          <div className="relative h-1 rounded-full bg-[oklch(0.7_0.12_85_/_0.12)] overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[oklch(0.7_0.12_85_/_0.5)] to-[oklch(0.6_0.08_145_/_0.6)] transition-all duration-500 ${statusColor}`}
              style={{ width: `${completeness * 100}%` }}
            />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[oklch(0.5_0.03_75)] font-civ-serif">
              {t("projects.projectionStatus")}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-bold font-civ-serif px-2 py-0.5 rounded-full border ${statusColor}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              {statusLabel}
            </span>
          </div>
        </div>
      </div>

      {/* 智慧核心实时推演 */}
      <div className="relative mt-5 pt-3 border-t border-[oklch(0.7_0.12_85_/_0.15)]">
        {isAnalyzing ? (
          <div className="flex items-center gap-2">
            <span className="relative flex items-center justify-center w-4 h-4">
              <span className="absolute inset-0 rounded-full bg-[oklch(0.7_0.12_85_/_0.3)] animate-ping" />
              <span className="relative w-2 h-2 rounded-full bg-[oklch(0.7_0.12_85)]" />
            </span>
            <p className="text-[11px] leading-relaxed font-civ-serif italic text-[oklch(0.55_0.10_85)] dark:text-[oklch(0.72_0.12_82)]">
              {t("projects.projectionAnalyzing")}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] leading-relaxed font-civ-serif italic text-[oklch(0.5_0.03_75_/_0.7)] dark:text-[oklch(0.6_0.02_80_/_0.7)]">
                {t("projects.projectionAuto")}
              </p>
              {onAnalyze && (
                <button
                  type="button"
                  onClick={onAnalyze}
                  className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-bold font-civ-serif italic px-2 py-0.5 rounded-full border border-[oklch(0.7_0.12_85_/_0.35)] text-[oklch(0.55_0.10_85)] dark:text-[oklch(0.72_0.12_82)] transition-all duration-300 hover:border-[oklch(0.6_0.12_85)] hover:shadow-[0_0_10px_rgba(201,164,92,0.2)]"
                >
                  <QuestScrollIcon name="sparkle" size={9} strokeWidth={1.5} />
                  {t("projects.projectionReanalyze")}
                </button>
              )}
            </div>
            {analyzeError && (
              <p className="mt-1 text-[10px] text-destructive italic">{analyzeError}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* 单行投影切片 */
function ProjectionRow({
  label,
  icon,
  children,
}: {
  label: string;
  icon: "seal" | "compass" | "world-core";
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <QuestScrollIcon
          name={icon}
          size={12}
          strokeWidth={1.4}
          className="text-[oklch(0.6_0.10_85)] dark:text-[oklch(0.72_0.12_82)]"
        />
        <span className="text-[10px] font-bold uppercase tracking-wider text-[oklch(0.5_0.03_75)] font-civ-serif">
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}