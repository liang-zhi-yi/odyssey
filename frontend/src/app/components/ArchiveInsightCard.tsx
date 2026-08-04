"use client";

import Link from "next/link";
import type { AIInsight, InsightType } from "@/types/analytics";
import { useLocale } from "@/hooks/useLocale";
import { OdysseyIcon, type OdysseyIconName } from "./OdysseyIcon";

/**
 * 三类色彩体系（文明档案风格）
 * - 优势方向（已成长）：暖金
 * - 成长中的能力：灰绿
 * - 待探索领域：雾紫
 */
const archiveStyles: Record<
  InsightType,
  {
    accent: string;
    border: string;
    bg: string;
    iconBg: string;
    icon: OdysseyIconName;
    labelKey: string;
  }
> = {
  // 优势方向 — 暖金
  strength_area: {
    accent: "oklch(0.62 0.12 75)",
    border: "oklch(0.72 0.12 80 / 0.3)",
    bg: "oklch(0.98 0.015 80 / 0.5)",
    iconBg: "oklch(0.72 0.12 80 / 0.08)",
    icon: "strength",
    labelKey: "dashboard.insights.strength",
  },
  growth_acceleration: {
    accent: "oklch(0.62 0.12 75)",
    border: "oklch(0.72 0.12 80 / 0.3)",
    bg: "oklch(0.98 0.015 80 / 0.5)",
    iconBg: "oklch(0.72 0.12 80 / 0.08)",
    icon: "growth",
    labelKey: "dashboard.insights.strength",
  },
  // 成长中 — 灰绿
  recommended_focus: {
    accent: "oklch(0.48 0.06 150)",
    border: "oklch(0.58 0.06 150 / 0.3)",
    bg: "oklch(0.97 0.01 150 / 0.4)",
    iconBg: "oklch(0.58 0.06 150 / 0.08)",
    icon: "growing",
    labelKey: "dashboard.insights.growing",
  },
  skill_gap: {
    accent: "oklch(0.48 0.06 150)",
    border: "oklch(0.58 0.06 150 / 0.3)",
    bg: "oklch(0.97 0.01 150 / 0.4)",
    iconBg: "oklch(0.58 0.06 150 / 0.08)",
    icon: "growing",
    labelKey: "dashboard.insights.growing",
  },
  // 待探索 — 雾紫
  plateau_warning: {
    accent: "oklch(0.5 0.05 300)",
    border: "oklch(0.6 0.05 300 / 0.3)",
    bg: "oklch(0.97 0.012 300 / 0.35)",
    iconBg: "oklch(0.6 0.05 300 / 0.08)",
    icon: "explore",
    labelKey: "dashboard.insights.explore",
  },
};

interface ArchiveInsightCardProps {
  insight: AIInsight;
}

/**
 * 成长洞察记录卡 — 文明档案风格
 * 替代原 InsightCard，移除 emoji 和警告红色
 * 三类色彩：暖金 / 灰绿 / 雾紫
 */
export function ArchiveInsightCard({ insight }: ArchiveInsightCardProps) {
  const { t, locale } = useLocale();

  const isEn = locale === "en";
  const title = isEn && insight.title_en ? insight.title_en : insight.title;
  const description =
    isEn && insight.description_en
      ? insight.description_en
      : insight.description;
  const actionLabel =
    isEn && insight.action_label_en
      ? insight.action_label_en
      : insight.action_label;

  const style = archiveStyles[insight.type] || archiveStyles.recommended_focus;

  const actionHref =
    insight.type === "recommended_focus" && insight.related_skill_id
      ? `/quests?skill=${insight.related_skill_id}`
      : insight.type === "growth_acceleration" && insight.related_skill_id
        ? `/skills/${insight.related_skill_id}`
        : insight.type === "plateau_warning" && insight.related_skill_id
          ? `/quests?skill=${insight.related_skill_id}`
          : insight.type === "strength_area" && insight.related_skill_id
            ? `/skills/${insight.related_skill_id}`
            : insight.type === "skill_gap" && insight.related_skill_id
              ? `/quests?skill=${insight.related_skill_id}`
              : undefined;

  const inner = (
    <div
      className="group relative rounded-xl border p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 overflow-hidden h-full"
      style={{
        borderColor: style.border,
        backgroundColor: style.bg,
      }}
    >
      {/* 左侧色条 */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: style.accent, opacity: 0.7 }}
      />

      <div className="flex items-start gap-3 pl-2">
        {/* 统一图标 */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: style.iconBg, color: style.accent }}
        >
          <OdysseyIcon name={style.icon} size={20} />
        </div>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          {/* 状态标签 + 标题 */}
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[9px] font-bold uppercase tracking-[0.15em] font-mono"
              style={{ color: style.accent }}
            >
              {t(style.labelKey)}
            </span>
          </div>
          <h4
            className="font-semibold text-sm leading-snug"
            style={{ color: "oklch(0.32 0.02 60)" }}
          >
            {title}
          </h4>
          <p
            className="mt-1.5 text-xs leading-relaxed line-clamp-3"
            style={{ color: "oklch(0.45 0.02 60)" }}
          >
            {description}
          </p>

          {/* 建议入口 */}
          {actionLabel && actionHref && (
            <span
              className="inline-flex items-center gap-1 mt-2.5 text-xs font-medium transition-opacity group-hover:opacity-80"
              style={{ color: style.accent }}
            >
              {actionLabel}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12 H19 M13 6 L19 12 L13 18" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (actionHref) {
    return <Link href={actionHref}>{inner}</Link>;
  }

  return inner;
}
