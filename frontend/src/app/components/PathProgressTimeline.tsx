"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useLocale } from "@/hooks/useLocale";
import { ProgressTimeline } from "./ProgressTimeline";
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

const C = {
  gold: "#C9A45C",
  goldLight: "#D4B068",
  goldDark: "#A08850",
  deepBrown: "#3A3028",
  warmBrown: "#8B8068",
  parchment: "#F8F4EA",
  dimGold: "#C9A45C40",
} as const;

/**
 * Civilization Chronicle — 文明成长纪年轴
 * 记录个人文明演化历程：当前文明状态 + 纪年轨迹 + 文明档案摘要。
 */
export function PathProgressTimeline({
  allPaths,
  selectedPathId,
  onSelectPath,
  pathDatasets,
  pathName,
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
      "quests", "domains",
    ];
    const obj: Record<string, string> = {};
    keys.forEach((k) => (obj[k] = tr(k)));
    return obj;
  }, [t]);

  // 文明时代 — 使用后端 World 记录的真实 era 字段（与「我的世界」一致），
  // 通过 ERA_LABELS 映射，不再由 worldTier 自行推导。
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
        {/* ── 头部：标题 + 路径选择器 ── */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <svg className="w-4 h-4 text-[#C9A45C] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 17 L9 11 L13 15 L21 7" strokeWidth="1.4" />
              <circle cx="3" cy="17" r="1" fill="currentColor" stroke="none" />
              <circle cx="9" cy="11" r="0.8" fill="currentColor" stroke="none" opacity="0.7" />
              <circle cx="13" cy="15" r="0.8" fill="currentColor" stroke="none" opacity="0.7" />
              <circle cx="21" cy="7" r="1.2" fill="currentColor" stroke="none" />
            </svg>
            <h3 className="text-base font-bold font-civ-serif text-[#3A3028] dark:text-[oklch(0.85_0.04_80)] truncate">
              {selectedPathId ? t("dashboard.pathGrowth") : t("dashboard.growthCurve")}
            </h3>
          </div>

          {/* 路径选择器 — 远征选择器 */}
          {allPaths.length > 0 ? (
            <div className="relative">
              <select
                value={selectedPathId || ""}
                onChange={(e) => onSelectPath(e.target.value || null)}
                className="appearance-none bg-[#F8F4EA]/60 dark:bg-[oklch(0.2_0.008_85)] pl-9 pr-8 py-1.5 text-sm text-foreground transition-all duration-300 focus:outline-none hover:bg-[#F8F4EA] dark:hover:bg-[oklch(0.22_0.008_85)] cursor-pointer font-medium border-b border-[#C9A45C]/30"
                style={{ clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))" }}
              >
                <option value="">{t("dashboard.selectPath")}</option>
                {allPaths.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-accent/60 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 3 L14 12 L12 21 L10 12 Z" fill="oklch(0.7 0.12 85 / 0.2)" />
              </svg>
              <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          ) : (
            <Link
              href="/paths"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              {t("dashboard.createPath")}
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          )}
        </div>

        {/* ── 当前文明状态 ── */}
        <div className="flex items-center gap-3 mb-4 px-1">
          <span className="text-[10px] font-mono tracking-[0.18em] uppercase text-[#8B8068]/60">
            {txt.civStatus}
          </span>
          <span className="h-px w-6 bg-[#C9A45C]/30" />
          <span className="inline-flex items-center gap-1.5 text-xs font-civ-serif text-[#3A3028] dark:text-[oklch(0.85_0.04_80)]">
            <svg className="w-3.5 h-3.5 text-[#C9A45C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M12 2 L18 9 L12 22 L6 9 Z" />
              <path d="M6 9 L18 9" strokeWidth="1" />
            </svg>
            {era}
            <span className="text-[#8B8068]/60">·</span>
            {txt.civLevel} Lv.{worldTier}
          </span>
        </div>

        {/* ── 文明纪年轨迹 / 空状态 ── */}
        {!selectedPathId ? (
          <FutureBlueprintEmptyState hasPaths={allPaths.length > 0} t={t} />
        ) : pathDatasets.length === 0 ? (
          <FutureBlueprintEmptyState hasPaths={true} t={t} variant="no-data" />
        ) : (
          <ProgressTimeline datasets={pathDatasets} skillName={pathName} isLoading={false} />
        )}

        {/* ── 文明档案摘要（博物馆说明牌） ── */}
        <div className="mt-5 pt-4 border-t border-[#C9A45C]/20">
          <div className="flex items-center gap-2 mb-3 px-1">
            <span className="text-[9px] font-mono tracking-[0.2em] uppercase text-[#8B8068]/60">
              {txt.archiveTitle}
            </span>
            <span className="h-px flex-1 bg-gradient-to-r from-[#C9A45C]/25 to-transparent" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-1">
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

/** 博物馆说明牌式单条档案统计 */
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
    <div className="flex flex-col gap-1 min-w-0">
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

/* ═══════════════════════════════════════════════════════════ */

function FutureBlueprintEmptyState({
  hasPaths,
  t,
  variant = "no-path",
}: {
  hasPaths: boolean;
  t: (key: string, vars?: Record<string, string>) => string;
  variant?: "no-path" | "no-data";
}) {
  const tr = (k: string) => t(`skills.trajectory.${k}`);
  return (
    <div className="relative flex flex-col items-center justify-center py-8 px-4 text-center">
      {/* 未来虚线路径 */}
      <div className="relative w-full max-w-md h-32 mb-6">
        <svg className="w-full h-full" viewBox="0 0 400 130" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="bp-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#C9A45C" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#C9A45C" stopOpacity="0.5" />
            </linearGradient>
          </defs>
          <path d="M 10 110 Q 80 105 120 90 T 220 60 T 320 35 T 390 20" stroke="url(#bp-grad)" strokeWidth="1.5" strokeDasharray="5 4" fill="none" />
          {[
            { x: 80, y: 105 },
            { x: 160, y: 82 },
            { x: 240, y: 55 },
            { x: 320, y: 35 },
          ].map((dot, i) => (
            <circle key={i} cx={dot.x} cy={dot.y} r="2.5" fill="#C9A45C" opacity="0.4" />
          ))}
          <circle cx="390" cy="20" r="4" fill="none" stroke="#C9A45C" strokeWidth="1.2" opacity="0.6" />
          <circle cx="390" cy="20" r="2" fill="#C9A45C" opacity="0.7" />
          <text x="10" y="126" fill="#8B8068" opacity="0.5" fontSize="7" fontFamily="monospace">
            {variant === "no-data" ? tr("phaseSeed") : tr("nodeOrigin")}
          </text>
          <text x="390" y="14" textAnchor="end" fill="#C9A45C" opacity="0.6" fontSize="7" fontFamily="monospace">
            ★
          </text>
        </svg>
      </div>

      <div className="space-y-2 max-w-sm">
        <h4 className="text-sm font-bold font-civ-serif text-[#3A3028] dark:text-[oklch(0.85_0.04_80)]">
          {variant === "no-data" ? t("dashboard.emptyStates.unchartedTerritory") : tr("noPathTitle")}
        </h4>
        <p className="text-xs text-[#8B8068]">
          {variant === "no-data" ? t("dashboard.emptyStates.territoryDesc") : tr("noPathDesc")}
        </p>
        <p className="text-[11px] text-[#8B8068]/60 font-civ-serif italic">
          {variant === "no-data" ? t("dashboard.emptyStates.blueprintHint") : tr("noPathHint")}
        </p>
      </div>

      {!hasPaths && (
        <Link
          href="/paths"
          className="mt-5 inline-flex items-center gap-2 bg-gradient-to-r from-[#C9A45C] to-[#A08850] px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:shadow-[0_4px_16px_-2px_#C9A45C40] hover:-translate-y-0.5"
          style={{ clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))" }}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {t("dashboard.createFirstPath")}
        </Link>
      )}
    </div>
  );
}