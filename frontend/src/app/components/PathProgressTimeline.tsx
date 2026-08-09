"use client";

import { useMemo } from "react";
import { useLocale } from "@/hooks/useLocale";
import { CivilizationEvolutionTrajectory } from "./CivilizationEvolutionTrajectory";
import type { LearningPath } from "@/types/learningPath";
import type { SkillGrowthPoint } from "@/types/progress";
import type { UserSkill } from "@/types/skill";
import { ERA_LABELS } from "@/types/world";

interface PathProgressTimelineProps {
  allPaths: LearningPath[];
  selectedPathId: string | null;
  onSelectPath: (id: string | null) => void;
  pathDatasets: { name: string; points: SkillGrowthPoint[] }[];
  pathName?: string;
  isLoading: boolean;
  /* ── 真实文明档案数据 ── */
  worldTier?: number;
  worldEra?: string;
  buildingCount?: number;
  questsCompleted?: number;
  userSkills?: UserSkill[];
}

/**
 * 文明演化轨迹 — 记录个人文明从诞生到未来的每一次跃迁。
 * 顶部标题 + 当前文明状态 + 演化轨迹 + 文明档案铭文（横向、少边框）。
 */
export function PathProgressTimeline({
  isLoading,
  worldTier = 0,
  worldEra,
  buildingCount = 0,
  questsCompleted = 0,
  userSkills = [],
}: PathProgressTimelineProps) {
  const { t, locale } = useLocale();
  // 逐个解析轨迹文案键（t() 仅返回叶子字符串，不能直接返回嵌套对象）
  const txt = useMemo(() => {
    const tr = (k: string) => t(`skills.trajectory.${k}`);
    const keys = [
      "civStatus", "civLevel", "archiveTitle", "era", "buildings",
      "quests", "domains", "evoTitle", "evoSubtitle", "evoStatus", "evoLevel",
    ];
    const obj: Record<string, string> = {};
    keys.forEach((k) => (obj[k] = tr(k)));
    return obj;
  }, [t]);

  // 文明时代 — 使用后端 World 记录的真实 era 字段（与「我的世界」一致）
  const eraLabel =
    ERA_LABELS[(worldEra ?? "WILDERNESS") as keyof typeof ERA_LABELS] ??
    ERA_LABELS.WILDERNESS;
  const era = locale === "en" ? eraLabel.en : eraLabel.zh;

  // 主要领域：取真实技能中综合分最高的前 3 项
  const topSkills = [...userSkills]
    .sort((a, b) => b.overall - a.overall)
    .slice(0, 3)
    .filter((s) => s.skill_name)
    .map((s) => s.skill_name!);

  // 是否存在任何成长数据（决定是否进入「文明火种阶段」空态）
  const hasAnyData =
    userSkills.length > 0 || buildingCount > 0 || questsCompleted > 0;

  if (isLoading) {
    return (
      <div
        className="relative bg-gradient-to-br from-[#F8F4EA]/80 to-[#F0E8D8]/50 dark:from-[oklch(0.22_0.008_85)] dark:to-[oklch(0.2_0.006_85)] p-6 h-full"
        style={{ clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))" }}
      >
        <div className="h-5 w-40 bg-[#C9A45C]/15 skeleton-shimmer mb-4" />
        <div className="h-56 w-full bg-[#C9A45C]/10 skeleton-shimmer" />
      </div>
    );
  }

  return (
    <div
      className="group relative bg-gradient-to-br from-[#F8F4EA]/70 to-[#F0E8D8]/40 dark:from-[oklch(0.22_0.008_85)] dark:to-[oklch(0.2_0.006_85)] p-6 h-full overflow-hidden transition-all duration-300 hover:from-[#F8F4EA]/90 hover:to-[#F0E8D8]/60"
      style={{ clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))" }}
    >
      {/* 顶部金色细线 */}
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-[#C9A45C]/40 to-transparent" />
      {/* 极淡档案纹理 */}
      <div
        className="absolute inset-0 opacity-[0.4] dark:opacity-[0.2] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.5 0.02 85 / 0.03) 1px, transparent 1px), linear-gradient(90deg, oklch(0.5 0.02 85 / 0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10">
        {/* ── 头部：标题 + 副标题 ── */}
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#C9A45C] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 20 L9 11 L13 15 L21 6" />
              <circle cx="3" cy="20" r="1.1" fill="currentColor" stroke="none" />
              <circle cx="9" cy="11" r="0.8" fill="currentColor" stroke="none" opacity="0.6" />
              <circle cx="13" cy="15" r="0.8" fill="currentColor" stroke="none" opacity="0.6" />
              <circle cx="21" cy="6" r="1.3" fill="currentColor" stroke="none" />
            </svg>
            <h3 className="text-base font-bold font-civ-serif text-[#3A3028] dark:text-[oklch(0.85_0.04_80)] truncate">
              {txt.evoTitle}
            </h3>
          </div>
          <p className="mt-1 pl-6 text-xs text-[#8B8068]/80 font-civ-serif italic">
            {txt.evoSubtitle}
          </p>
        </div>

        {/* ── 当前文明状态 ── */}
        <div className="flex items-center gap-3 mb-4 px-1">
          <span className="text-[10px] font-mono tracking-[0.18em] uppercase text-[#8B8068]/60">
            {txt.evoStatus}
          </span>
          <span className="h-px w-6 bg-[#C9A45C]/30" />
          <span className="inline-flex items-center gap-1.5 text-xs font-civ-serif text-[#3A3028] dark:text-[oklch(0.85_0.04_80)]">
            <svg className="w-3.5 h-3.5 text-[#C9A45C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M12 2 L18 9 L12 22 L6 9 Z" />
              <path d="M6 9 L18 9" strokeWidth="1" />
            </svg>
            {era}
            <span className="text-[#8B8068]/60">·</span>
            {txt.evoLevel} Lv.{worldTier}
          </span>
        </div>

        {/* ── 文明演化轨迹 / 空状态 ── */}
        <CivilizationEvolutionTrajectory
          worldEra={worldEra}
          hasAnyData={hasAnyData}
          isLoading={false}
        />

        {/* ── 文明档案铭文（横向、少边框、古文明记录感） ── */}
        <div className="mt-6 pt-4 border-t border-[#C9A45C]/20">
          <div className="flex items-center gap-2 mb-3 px-1">
            <span className="text-[9px] font-mono tracking-[0.2em] uppercase text-[#8B8068]/60">
              {txt.archiveTitle}
            </span>
            <span className="h-px flex-1 bg-gradient-to-r from-[#C9A45C]/25 to-transparent" />
          </div>
          <div className="flex flex-wrap items-stretch divide-x divide-[#C9A45C]/15 px-1">
            {/* 文明时代 */}
            <ArchiveStat icon="era" label={txt.era} value={era} />
            {/* 已建立建筑 */}
            <ArchiveStat icon="building" label={txt.buildings} value={String(buildingCount)} />
            {/* 已完成任务 */}
            <ArchiveStat icon="quest" label={txt.quests} value={String(questsCompleted)} />
            {/* 主要领域 */}
            <ArchiveStat icon="domain" label={txt.domains} value={topSkills.length ? topSkills.join(" / ") : "—"} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */

/** 文明档案铭文式单条档案统计（横向、细线分隔、少边框） */
function ArchiveStat({
  icon,
  label,
  value,
}: {
  icon: "era" | "building" | "quest" | "domain";
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0 px-4 first:pl-0 last:pr-0 py-1">
      <div className="flex items-center gap-1.5">
        <svg className="w-3 h-3 text-[#C9A45C]/70 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          {icon === "era" && <><path d="M12 2 L18 9 L12 22 L6 9 Z" /><path d="M6 9 L18 9" strokeWidth="1" /></>}
          {icon === "building" && <path d="M7 21V8l5-4 5 4v13M7 21h10M9 21v-4h2v4M13 21v-4h2v4" />}
          {icon === "quest" && <><path d="M4 6h16M4 12h16M4 18h10" /><path d="M19 15l2 2 3-4" /></>}
          {icon === "domain" && <><path d="M3 12h18M12 3v18" opacity="0.4" /><circle cx="12" cy="12" r="9" /></>}
        </svg>
        <span className="text-[10px] text-[#8B8068]">{label}</span>
      </div>
      <span className="text-sm font-semibold font-civ-serif text-[#3A3028] dark:text-[oklch(0.85_0.04_80)] truncate">
        {value}
      </span>
    </div>
  );
}
