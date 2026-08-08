"use client";

import Link from "next/link";
import { useLocale } from "@/hooks/useLocale";
import type { AIInsight, InsightType, AnalyticsSummary } from "@/types/analytics";
import type { UserSkill } from "@/types/skill";

/* ═══════════════════════════════════════════════════════════════
   CivilizationArchive — 文明成长记录
   ───────────────────────────────────────────────────────────────
   将三个成长洞察区域改造为横向连续的文明卷轴展示。
   不使用卡片边框、圆角、阴影，而是以极细黄金分割线
   将三个章节连接为同一张文明档案。

   设计语言：古文明档案 × 未来文明终端
   ═══════════════════════════════════════════════════════════════ */

/** 颜色体系 — 羊皮纸暖色调 */
const COLORS = {
  bg: "#F7F2E8",
  text: "#4A3825",
  subText: "#8C7655",
  accent: "#C9A45C",
  divider: "#C9A45C",
};

/** 洞察类型 → 章节配置 */
interface ChapterConfig {
  number: string;
  titleKey: string;
  titleEn: string;
  iconSvg: JSX.Element;
  metricLabelKey: string;
  metricLabelEn: string;
}

/** 根据洞察类型返回章节配置 */
function getChapterConfig(type: InsightType, idx: number): ChapterConfig {
  // 优势类
  if (type === "strength_area" || type === "growth_acceleration") {
    return {
      number: "01",
      titleKey: "dashboard.archive.advantage",
      titleEn: "ADVANTAGE",
      iconSvg: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          {/* 勋章纹章 — 古文明优势符号 */}
          <path d="M12 2 L15 8 L22 9 L17 14 L18 21 L12 18 L6 21 L7 14 L2 9 L9 8 Z" opacity="0.8" />
          <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" opacity="0.3" />
        </svg>
      ),
      metricLabelKey: "dashboard.archive.civIndex",
      metricLabelEn: "CIVILIZATION INDEX",
    };
  }
  // 成长趋势类
  if (type === "recommended_focus") {
    return {
      number: "02",
      titleKey: "dashboard.archive.growthTrend",
      titleEn: "GROWTH TREND",
      iconSvg: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          {/* 萌芽环 — 成长中的符号 */}
          <path d="M3 18 L8 13 L12 15 L21 6" opacity="0.8" />
          <path d="M21 6 L15 6 M21 6 L21 12" />
          <circle cx="8" cy="13" r="1.5" fill="currentColor" stroke="none" opacity="0.4" />
          <circle cx="12" cy="15" r="1.5" fill="currentColor" stroke="none" opacity="0.4" />
        </svg>
      ),
      metricLabelKey: "dashboard.archive.latestAssessment",
      metricLabelEn: "LATEST ASSESSMENT",
    };
  }
  // 待探索类
  // skill_gap, plateau_warning
  return {
    number: idx === 0 ? "01" : idx === 1 ? "02" : "03",
    titleKey: "dashboard.archive.nextExploration",
    titleEn: "NEXT EXPLORATION",
    iconSvg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        {/* 星门 — 待探索的符号 */}
        <circle cx="12" cy="12" r="9" opacity="0.5" />
        <path d="M12 3 L12 21 M3 12 L21 12" opacity="0.3" />
        <path d="M12 7 L16 12 L12 17 L8 12 Z" opacity="0.8" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" opacity="0.5" />
      </svg>
    ),
    metricLabelKey: "dashboard.archive.explorationStatus",
    metricLabelEn: "EXPLORATION STATUS",
  };
}

/** 从洞察和用户数据中提取指标值 */
function getMetricValue(
  insight: AIInsight,
  analyticsSummary: AnalyticsSummary | null | undefined,
  userSkills: UserSkill[],
  locale: string
): { value: string; subValue?: string } {
  const isEn = locale === "en";

  // 优势类 — 显示技能分数
  if (insight.type === "strength_area") {
    const skill = userSkills.find((s) => s.skill_id === insight.related_skill_id);
    if (skill) {
      return { value: `${skill.overall}`, subValue: "/ 100" };
    }
    if (analyticsSummary?.strongest_skill_score != null) {
      return { value: `${analyticsSummary.strongest_skill_score}`, subValue: "/ 100" };
    }
    return { value: isEn ? "Forming" : "形成中" };
  }

  // 成长加速 — 显示成长率
  if (insight.type === "growth_acceleration") {
    if (analyticsSummary?.growth_rate != null && analyticsSummary.growth_rate > 0) {
      return { value: `${analyticsSummary.growth_rate}`, subValue: "↑" };
    }
    return { value: isEn ? "Rising" : "上升中" };
  }

  // 推荐关注 — 显示评估次数
  if (insight.type === "recommended_focus") {
    if (analyticsSummary?.total_assessments != null) {
      return { value: `${analyticsSummary.total_assessments}`, subValue: isEn ? " assessed" : " 次评估" };
    }
    return { value: isEn ? "Active" : "进行中" };
  }

  // 能力短板 — 显示分数
  if (insight.type === "skill_gap") {
    const skill = userSkills.find((s) => s.skill_id === insight.related_skill_id);
    if (skill) {
      return { value: `${skill.overall}`, subValue: "/ 100" };
    }
    if (analyticsSummary?.weakest_skill_score != null) {
      return { value: `${analyticsSummary.weakest_skill_score}`, subValue: "/ 100" };
    }
    return { value: isEn ? "Gap" : "待补齐" };
  }

  // 平台期 — 显示状态
  if (insight.type === "plateau_warning") {
    return { value: isEn ? "Plateau" : "平台期" };
  }

  return { value: isEn ? "—" : "—" };
}

/** 获取洞察的英文副标题（作为大写展示） */
function getEnglishSubtitle(insight: AIInsight, userSkills: UserSkill[]): string {
  // 如果洞察有英文标题，提取关键词作为副标题
  if (insight.title_en) {
    const words = insight.title_en.split(/\s+/).slice(0, 3).join(" ");
    return words.toUpperCase();
  }
  // 如果有关联技能，尝试从技能名生成
  if (insight.related_skill_id) {
    const skill = userSkills.find((s) => s.skill_id === insight.related_skill_id);
    if (skill?.skill_name) {
      return skill.skill_name.toUpperCase();
    }
  }
  return insight.type.toUpperCase().replace(/_/g, " ");
}

/** 获取洞察的动作链接 */
function getActionHref(insight: AIInsight): string | undefined {
  if (!insight.related_skill_id) return undefined;
  if (insight.type === "strength_area" || insight.type === "growth_acceleration") {
    return `/skills?skill=${insight.related_skill_id}`;
  }
  return `/quests?skill=${insight.related_skill_id}`;
}

/** 单个章节 */
function ArchiveChapter({
  insight,
  index,
  analyticsSummary,
  userSkills,
  isLast,
}: {
  insight: AIInsight;
  index: number;
  analyticsSummary: AnalyticsSummary | null | undefined;
  userSkills: UserSkill[];
  isLast: boolean;
}) {
  const { t, locale } = useLocale();
  const isEn = locale === "en";
  const config = getChapterConfig(insight.type, index);
  const description = isEn && insight.description_en ? insight.description_en : insight.description;
  const metric = getMetricValue(insight, analyticsSummary, userSkills, locale);
  const englishSubtitle = getEnglishSubtitle(insight, userSkills);
  const actionHref = getActionHref(insight);
  const actionLabel = isEn && insight.action_label_en ? insight.action_label_en : insight.action_label;
  const chapterTitle = isEn ? config.titleEn : t(config.titleKey);
  const metricLabel = isEn ? config.metricLabelEn : t(config.metricLabelKey);

  const content = (
    <div className="flex-1 px-4 sm:px-6 lg:px-8 py-5 group cursor-pointer transition-all duration-300 hover:bg-[#C9A45C]/[0.04]">
      {/* 编号 + 图标 */}
      <div className="flex items-center gap-3 mb-3">
        <span
          className="font-mono text-[11px] font-bold tracking-[0.2em] opacity-50"
          style={{ color: COLORS.accent }}
        >
          {config.number}
        </span>
        <div
          className="w-4 h-4 opacity-60 transition-opacity group-hover:opacity-100"
          style={{ color: COLORS.accent }}
        >
          {config.iconSvg}
        </div>
      </div>

      {/* 章节标题 */}
      <h3
        className="font-civ-serif text-sm font-bold tracking-wide mb-1 text-[#4A3825] dark:text-[oklch(0.85_0.04_80)]"
      >
        {chapterTitle}
      </h3>

      {/* 英文副标题 — 文明档案中的能力名称 */}
      <p
        className="font-civ-serif text-[11px] tracking-[0.15em] uppercase font-medium mb-3 opacity-70 dark:opacity-90 text-[#8C7655] dark:text-[oklch(0.6_0.012_80)]"
      >
        {englishSubtitle}
      </p>

      {/* 简短文明记录 */}
      <p
        className="font-civ-serif text-xs leading-relaxed italic mb-4 line-clamp-2 text-[#8C7655] dark:text-[oklch(0.6_0.012_80)]"
      >
        {description}
      </p>

      {/* 核心状态 */}
      <div className="flex items-baseline gap-1.5">
        <span
          className="font-mono text-lg font-bold tabular-nums text-[#4A3825] dark:text-[oklch(0.85_0.04_80)]"
        >
          {metric.value}
        </span>
        {metric.subValue && (
          <span
            className="font-mono text-[10px] opacity-60 dark:opacity-90 text-[#8C7655] dark:text-[oklch(0.6_0.012_80)]"
          >
            {metric.subValue}
          </span>
        )}
      </div>
      <p
        className="font-civ-serif text-[9px] tracking-[0.15em] uppercase mt-0.5 opacity-50 dark:opacity-80 text-[#8C7655] dark:text-[oklch(0.6_0.012_80)]"
      >
        {metricLabel}
      </p>

      {/* 动作入口 */}
      {actionLabel && actionHref && (
        <div
          className="inline-flex items-center gap-1 mt-3 text-[10px] font-medium transition-opacity group-hover:opacity-80"
          style={{ color: COLORS.accent }}
        >
          <span className="italic font-civ-serif">{actionLabel}</span>
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12 H19 M13 6 L19 12 L13 18" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </div>
  );

  // 分割线 — 古文明纹理线
  const divider = !isLast && (
    <div className="hidden sm:flex flex-col items-center justify-center w-px relative">
      {/* 主线 */}
      <div
        className="w-px h-full"
        style={{
          background: `linear-gradient(to bottom, transparent 0%, ${COLORS.divider}40 15%, ${COLORS.divider}80 50%, ${COLORS.divider}40 85%, transparent 100%)`,
        }}
      />
      {/* 中心符文装饰 */}
      <div
        className="absolute w-2 h-2 rotate-45 border opacity-40 bg-[#F7F2E8] dark:bg-[oklch(0.17_0.015_70)]"
        style={{
          borderColor: COLORS.divider,
        }}
      />
    </div>
  );

  if (actionHref) {
    return (
      <>
        <Link href={actionHref} className="flex-1 block">
          {content}
        </Link>
        {divider}
      </>
    );
  }

  return (
    <>
      <div className="flex-1">{content}</div>
      {divider}
    </>
  );
}

/** 空状态 */
function EmptyArchive() {
  const { locale } = useLocale();
  const isEn = locale === "en";

  return (
    <div className="px-6 py-12 text-center">
      {/* 神秘几何符号 */}
      <div className="flex justify-center mb-4">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={COLORS.accent} strokeWidth="1" opacity="0.4">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3 V21 M3 12 H21" opacity="0.5" />
          <path d="M12 7 L16 12 L12 17 L8 12 Z" opacity="0.6" />
        </svg>
      </div>
      <p
        className="font-civ-serif text-xs italic text-[#8C7655] dark:text-[oklch(0.6_0.012_80)]"
      >
        {isEn
          ? "The archive awaits your first marks of growth..."
          : "文明档案静待你的第一次成长印记..."}
      </p>
    </div>
  );
}

interface CivilizationArchiveProps {
  insights: AIInsight[];
  analyticsSummary?: AnalyticsSummary | null;
  userSkills?: UserSkill[];
  isLoading?: boolean;
}

/**
 * 文明成长记录 Civilization Archive
 *
 * 横向连续展示三个成长洞察章节，以极细黄金分割线连接。
 * 不使用卡片边框、圆角、阴影，呈现为同一张文明卷轴上的三个章节。
 */
export function CivilizationArchive({
  insights,
  analyticsSummary,
  userSkills = [],
  isLoading = false,
}: CivilizationArchiveProps) {
  const { locale } = useLocale();
  const isEn = locale === "en";

  if (isLoading) {
    return (
      <div
        className="rounded-sm overflow-hidden bg-[#F7F2E8] dark:bg-[oklch(0.17_0.015_70)]"
      >
        <div className="flex flex-col sm:flex-row">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex-1 px-6 py-5">
              <div className="h-3 w-8 rounded bg-[#C9A45C]/20 skeleton-shimmer mb-3" />
              <div className="h-4 w-24 rounded bg-[#4A3825]/10 skeleton-shimmer mb-2" />
              <div className="h-3 w-32 rounded bg-[#8C7655]/10 skeleton-shimmer mb-4" />
              <div className="h-2 w-full rounded bg-[#8C7655]/8 skeleton-shimmer" />
              <div className="h-6 w-12 rounded bg-[#4A3825]/15 skeleton-shimmer mt-4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const topInsights = insights.slice(0, 3);

  if (topInsights.length === 0) {
    return (
      <div
        className="rounded-sm overflow-hidden border border-[#C9A45C]/15 bg-[#F7F2E8] dark:bg-[oklch(0.17_0.015_70)]"
      >
        <EmptyArchive />
      </div>
    );
  }

  return (
    <div
      className="rounded-sm overflow-hidden border border-[#C9A45C]/15 relative bg-[#F7F2E8] dark:bg-[oklch(0.17_0.015_70)]"
    >
      {/* 顶部装饰条 — 古文明纹理 */}
      <div className="flex items-center px-4 sm:px-6 lg:px-8 pt-3 pb-1">
        <div className="flex items-center gap-2">
          {/* 卷轴符号 */}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={COLORS.accent} strokeWidth="1.5" opacity="0.5">
            <path d="M4 4 H20 V20 H4 Z" />
            <path d="M4 4 Q2 4 2 6 Q2 8 4 8 M20 4 Q22 4 22 6 Q22 8 20 8" />
          </svg>
          <span
            className="font-civ-serif text-[10px] tracking-[0.25em] uppercase font-medium opacity-50"
            style={{ color: COLORS.accent }}
          >
            {isEn ? "Civilization Archive" : "文明成长记录"}
          </span>
        </div>
        <div
          className="flex-1 h-px ml-3"
          style={{
            background: `linear-gradient(to right, ${COLORS.accent}40, transparent)`,
          }}
        />
      </div>

      {/* 三个章节 — 横向连续展示 */}
      <div className="flex flex-col sm:flex-row">
        {topInsights.map((insight, i) => (
          <ArchiveChapter
            key={i}
            insight={insight}
            index={i}
            analyticsSummary={analyticsSummary}
            userSkills={userSkills}
            isLast={i === topInsights.length - 1}
          />
        ))}
      </div>

      {/* 底部装饰条 */}
      <div
        className="h-px mx-4 sm:mx-6 lg:mx-8 mb-2"
        style={{
          background: `linear-gradient(to right, transparent, ${COLORS.accent}30, transparent)`,
        }}
      />
    </div>
  );
}
