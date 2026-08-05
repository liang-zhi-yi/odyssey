"use client";

import useSWR from "swr";
import Link from "next/link";
import { worldService } from "@/services/world.service";
import { questService } from "@/services/quest.service";
import { useLocale } from "@/hooks/useLocale";
import { skillDisplayName } from "@/lib/skillNames";
import { getBuildingLevelLabel } from "@/types/world";
import { RANK_LABELS } from "@/types/skill";
import { StarRating, difficultyToLevel } from "./StarRating";
import type { UserBuilding, UserCompoundBuilding, BuildingTemplate, BuildingDetail, CompoundBuildingDetail } from "@/types/world";
import type { QuestListItem } from "@/types/quest";
import { QuestScrollIcon } from "./QuestScrollIcon";
import {
  CIV_COLORS,
  CopperDivider,
  SealRing,
  BuildingSealIcon,
  ParchmentBackground,
  CivArchiveStyles,
} from "./CivArchiveTheme";

interface BuildingDetailPanelProps {
  building: UserBuilding | UserCompoundBuilding;
  onClose: () => void;
}

/**
 * Building Detail Panel — "建筑档案卷宗" (Building Archive Scroll).
 *
 * 设计方案 C：古卷轴档案风格
 *   - 羊皮纸纹理 + 铜色/金色/暗红配色（继承 CivArchiveTheme）
 *   - 圆形建筑印章 SVG 替代 emoji 图标
 *   - 衬线字体标题 + 卷轴边角装饰 + 半透印章水印
 *   - 局部 civ-archive-* 样式，不污染全局
 *   - 自包含档案，不跳出至技能页
 */
export function BuildingDetailPanel({ building, onClose }: BuildingDetailPanelProps) {
  const { t, locale } = useLocale();
  const isCompound = building.building_type === "compound";

  const { data: regularDetail, isLoading: regularLoading } = useSWR(
    !isCompound ? `building-detail-${building.id}` : null,
    () => worldService.getBuilding(building.id)
  );

  const { data: compoundDetail, isLoading: compoundLoading } = useSWR(
    isCompound ? `compound-detail-${building.id}` : null,
    () => worldService.getCompoundBuilding(building.id)
  );

  const detail = isCompound ? compoundDetail : regularDetail;
  const isLoading = isCompound ? compoundLoading : regularLoading;

  const tpl = building.template;
  const displayName =
    locale === "en" && tpl?.name_en ? tpl.name_en : tpl?.name ?? "";
  const levelLabel = getBuildingLevelLabel(building.level, tpl?.level_names, locale);
  const isLocked = building.status === "LOCKED";

  return (
    <div className="civ-archive-page relative">
      <CivArchiveStyles />

      <div
        className="civ-archive-card relative overflow-hidden civ-archive-fade-in"
        style={{
          borderColor: CIV_COLORS.gold + "80",
          borderWidth: "2px",
          borderRadius: "6px",
        }}
      >
        {/* 羊皮纸纹理背景 */}
        <ParchmentBackground opacity={0.5} />

        {/* 半透印章水印 — 神秘感 */}
        <div className="absolute -top-8 -right-8 w-40 h-40 opacity-[0.06] pointer-events-none select-none">
          <SealRing size={160} />
        </div>

        {/* 卷轴边角装饰 — 四角铜色花纹 */}
        <ScrollCornerDecor position="top-left" />
        <ScrollCornerDecor position="top-right" />
        <ScrollCornerDecor position="bottom-left" />
        <ScrollCornerDecor position="bottom-right" />

        <div className="relative z-10 p-5">
          {/* ── Header — 档案卷宗标题 ── */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* 建筑印章 SVG（替代 emoji） */}
              <div className="shrink-0 civ-archive-seal-hover">
                <BuildingSealIcon
                  type={(tpl as any)?.skill_id ?? "default"}
                  size={56}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-[9px] font-bold uppercase tracking-widest"
                  style={{ color: CIV_COLORS.textSecondary }}
                >
                  {locale === "en" ? "Building Archive" : "建筑档案卷宗"}
                </p>
                <h3
                  className="civ-archive-title text-lg leading-tight mt-0.5"
                  style={{ color: CIV_COLORS.textPrimary }}
                >
                  {displayName}
                </h3>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {/* 等级印章 */}
                  <span
                    className="text-[10px] font-bold rounded-full px-2.5 py-0.5"
                    style={{
                      backgroundColor: CIV_COLORS.darkRed + "18",
                      color: CIV_COLORS.darkRed,
                      border: `1px solid ${CIV_COLORS.darkRed}40`,
                    }}
                  >
                    {levelLabel}
                  </span>
                  {/* 复合建筑标识 */}
                  {isCompound && (
                    <span
                      className="text-[10px] font-bold rounded-full px-2.5 py-0.5"
                      style={{
                        backgroundColor: CIV_COLORS.gold + "20",
                        color: CIV_COLORS.darkRed,
                        border: `1px solid ${CIV_COLORS.gold}60`,
                      }}
                    >
                      {t("world.compoundBuilding")}
                    </span>
                  )}
                  {/* 状态铭文 */}
                  <span
                    className="text-[10px] font-medium"
                    style={{ color: CIV_COLORS.textSecondary }}
                  >
                    · {t("world.status." + building.status)}
                  </span>
                </div>
              </div>
            </div>

            {/* 关闭按钮 — 铜色，无 emoji */}
            <button
              onClick={onClose}
              className="shrink-0 rounded-lg p-1.5 transition-all duration-200 civ-archive-seal-hover"
              style={{
                color: CIV_COLORS.textSecondary,
                border: `1px solid ${CIV_COLORS.border}`,
                backgroundColor: CIV_COLORS.bgCard,
              }}
              aria-label={locale === "en" ? "Close" : "关闭"}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <CopperDivider className="mb-4" />

          {/* 加载态 — 铜色旋转 */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div
                className="h-7 w-7 animate-spin rounded-full border-[2.5px] border-t-transparent"
                style={{ borderColor: CIV_COLORS.gold, borderTopColor: "transparent" }}
              />
            </div>
          )}

          {/* 普通建筑详情 */}
          {detail && !isCompound && !isLoading && (
            <RegularDetail
              detail={detail as BuildingDetail}
              tpl={tpl as BuildingTemplate | null}
              isLocked={isLocked}
              t={t}
              locale={locale}
            />
          )}

          {/* 复合建筑详情 */}
          {detail && isCompound && !isLoading && (
            <CompoundDetail
              detail={detail as CompoundBuildingDetail}
              isLocked={isLocked}
              t={t}
              locale={locale}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ── 卷轴边角装饰 — 四角铜色花纹 SVG ── */
function ScrollCornerDecor({ position }: { position: "top-left" | "top-right" | "bottom-left" | "bottom-right" }) {
  const posClass =
    position === "top-left" ? "top-1.5 left-1.5" :
    position === "top-right" ? "top-1.5 right-1.5 scale-x-[-1]" :
    position === "bottom-left" ? "bottom-1.5 left-1.5 scale-y-[-1]" :
    "bottom-1.5 right-1.5 scale-[-1]";

  return (
    <svg
      className={`absolute ${posClass} w-4 h-4 pointer-events-none`}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path
        d="M 2 2 L 6 2 M 2 2 L 2 6 M 2 2 L 5 5"
        stroke={CIV_COLORS.gold}
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.5"
      />
      <circle cx="5" cy="5" r="0.8" fill={CIV_COLORS.gold} opacity="0.4" />
    </svg>
  );
}

/* ── 普通建筑详情 — 修行档案 ── */
function RegularDetail({
  detail,
  tpl,
  isLocked,
  t,
  locale,
}: {
  detail: BuildingDetail;
  tpl: BuildingTemplate | null;
  isLocked: boolean;
  t: (key: string, vars?: Record<string, string>) => string;
  locale: string;
}) {
  const { data: relatedQuests = [] } = useSWR(
    tpl?.skill_id ? `quests-skill-${tpl.skill_id}` : null,
    () => questService.listQuests({ skill_id: tpl!.skill_id }),
    { dedupingInterval: 60000 }
  );

  const { data: civDirection } = useSWR(
    "world-civ-direction-panel",
    () => worldService.getCivilizationDirection().catch(() => null),
    { revalidateOnFocus: false, dedupingInterval: 120000 }
  );

  const relatedPaths = (civDirection?.active_paths ?? []).filter((ap) =>
    ap.targeted_buildings?.some((tb) => tb.building_id === detail.id)
  );

  return (
    <div className="space-y-4">
      {/* ── 修行进度 — 卷轴风格进度条 ── */}
      {!isLocked && detail.skill_scores && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-xs font-bold uppercase tracking-wider civ-archive-subtitle"
              style={{ color: CIV_COLORS.textPrimary }}
            >
              {t("world.upgradePath")}
            </span>
            {detail.next_level_at > 100 ? (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: CIV_COLORS.gold + "20",
                  color: CIV_COLORS.darkRed,
                  border: `1px solid ${CIV_COLORS.gold}60`,
                }}
              >
                {t("world.maxLevelReached")}
              </span>
            ) : (
              <span
                className="text-[10px] font-mono tabular-nums"
                style={{ color: CIV_COLORS.textSecondary }}
              >
                {t("world.scoreToNext", {
                  score: String(detail.next_level_at - detail.skill_scores.overall),
                })}
              </span>
            )}
          </div>
          {/* 羊皮纸底进度条 + 金→暗红渐变填充 */}
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{
              backgroundColor: CIV_COLORS.bgContent,
              border: `1px solid ${CIV_COLORS.border}`,
            }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(100, detail.next_level_at > 100 ? 100 : (detail.skill_scores.overall / detail.next_level_at) * 100)}%`,
                background: `linear-gradient(90deg, ${CIV_COLORS.gold}, ${CIV_COLORS.darkRed})`,
              }}
            />
          </div>
        </div>
      )}

      {/* ── 能力铭文 — 四方向评分印章 ── */}
      {detail.skill_scores && (
        <div className="grid grid-cols-2 gap-2">
          <ScoreSeal label={t("skills.dimensions.knowledge")} value={detail.skill_scores.knowledge} />
          <ScoreSeal label={t("skills.dimensions.reasoning")} value={detail.skill_scores.reasoning} />
          <ScoreSeal label={t("skills.dimensions.application")} value={detail.skill_scores.application} />
          <ScoreSeal label={t("skills.dimensions.creation")} value={detail.skill_scores.creation} />
        </div>
      )}

      {/* ── 文明印记 — 总分 + 段位中央印章 ── */}
      {detail.skill_scores && (
        <div
          className="flex items-center gap-4 p-3 rounded-lg relative overflow-hidden"
          style={{
            backgroundColor: CIV_COLORS.bgContent + "80",
            border: `1px solid ${CIV_COLORS.gold}40`,
          }}
        >
          {/* 左侧总分 */}
          <div className="text-center shrink-0">
            <div
              className="text-2xl font-bold tabular-nums civ-archive-title"
              style={{ color: CIV_COLORS.darkRed }}
            >
              {detail.skill_scores.overall}
            </div>
            <div
              className="text-[9px] font-bold uppercase tracking-wider"
              style={{ color: CIV_COLORS.textSecondary }}
            >
              {t("skills.overall")}
            </div>
          </div>

          {/* 铜制竖分割线 */}
          <div
            className="w-px self-stretch"
            style={{ background: `linear-gradient(to bottom, transparent, ${CIV_COLORS.gold}60, transparent)` }}
          />

          {/* 右侧段位印章 */}
          <div className="flex-1 text-center">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
              style={{
                backgroundColor: CIV_COLORS.darkRed + "15",
                color: CIV_COLORS.darkRed,
                border: `1px solid ${CIV_COLORS.darkRed}50`,
              }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                <path d="M 5 1 L 6 4 L 9 5 L 6 6 L 5 9 L 4 6 L 1 5 L 4 4 Z" fill={CIV_COLORS.gold} opacity="0.7" />
              </svg>
              {locale === "en"
                ? detail.skill_scores.rank
                : RANK_LABELS[detail.skill_scores.rank as keyof typeof RANK_LABELS] ?? detail.skill_scores.rank}
            </span>
          </div>
        </div>
      )}

      {/* ── 使命召唤 — 相关任务卷轴列表 ── */}
      {tpl?.skill_id && (
        <RelatedQuests quests={relatedQuests} skillName={tpl?.name ?? ""} locale={locale} />
      )}

      {/* ── 文明脉络 — 相关学习路径 ── */}
      {relatedPaths.length > 0 && (
        <div>
          <CopperDivider className="mb-3" />
          <h4
            className="text-[10px] font-bold uppercase tracking-widest mb-2 civ-archive-subtitle"
            style={{ color: CIV_COLORS.textSecondary }}
          >
            {locale === "en" ? "Civilization Threads" : "文明脉络"}
          </h4>
          <div className="space-y-1.5">
            {relatedPaths.slice(0, 3).map((ap) => (
              <Link
                key={ap.path_id}
                href={`/paths/${ap.path_id}`}
                className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-all duration-200 civ-archive-seal-hover"
                style={{
                  border: `1px solid ${CIV_COLORS.border}`,
                  backgroundColor: CIV_COLORS.bgCard,
                }}
              >
                <span className="inline-flex shrink-0" style={{ color: CIV_COLORS.gold }}>
                  <QuestScrollIcon name="civilization" size={13} />
                </span>
                <span
                  className="flex-1 truncate font-medium civ-archive-body"
                  style={{ color: CIV_COLORS.textPrimary }}
                >
                  {ap.path_title}
                </span>
                <span
                  className="text-[10px] font-mono tabular-nums shrink-0"
                  style={{ color: CIV_COLORS.darkRed }}
                >
                  {ap.progress_pct}%
                </span>
                <svg className="h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke={CIV_COLORS.gold} strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            ))}
            {relatedPaths.length > 3 && (
              <p
                className="text-[10px] text-center pt-1 civ-archive-subtitle"
                style={{ color: CIV_COLORS.textSecondary }}
              >
                {locale === "en"
                  ? `+${relatedPaths.length - 3} more threads`
                  : `另有 ${relatedPaths.length - 3} 条脉络`}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── 相关任务 — 使命召唤卷轴 ── */
function RelatedQuests({ quests, skillName, locale }: { quests: QuestListItem[]; skillName: string; locale: string }) {
  const top3 = quests.slice(0, 3);
  if (top3.length === 0) return null;

  return (
    <div>
      <CopperDivider className="mb-3" />
      <h4
        className="text-[10px] font-bold uppercase tracking-widest mb-2 civ-archive-subtitle"
        style={{ color: CIV_COLORS.textSecondary }}
      >
        {locale === "en" ? "Summoned Quests" : "使命召唤"}
      </h4>
      <div className="space-y-1.5">
        {top3.map((q) => {
          const title = locale === "en" && q.title_en ? q.title_en : q.title;
          const level = difficultyToLevel(q.difficulty);
          return (
            <Link
              key={q.id}
              href={`/quests/${q.id}`}
              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-all duration-200 civ-archive-seal-hover"
              style={{
                border: `1px solid ${CIV_COLORS.border}`,
                backgroundColor: CIV_COLORS.bgCard,
              }}
            >
              <StarRating level={level} />
              <span
                className="flex-1 truncate civ-archive-body"
                style={{ color: CIV_COLORS.textPrimary }}
              >
                {title}
              </span>
              <svg className="h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke={CIV_COLORS.gold} strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          );
        })}
        {quests.length > 3 && (
          <p
            className="text-[10px] text-center pt-1 civ-archive-subtitle"
            style={{ color: CIV_COLORS.textSecondary }}
          >
            {locale === "en"
              ? `+${quests.length - 3} more quests`
              : `另有 ${quests.length - 3} 个使命`}
          </p>
        )}
      </div>
    </div>
  );
}

/* ── 复合建筑详情 — 源流印记 ── */
function CompoundDetail({
  detail,
  isLocked,
  t,
  locale,
}: {
  detail: CompoundBuildingDetail;
  isLocked: boolean;
  t: (key: string, vars?: Record<string, string>) => string;
  locale: string;
}) {
  return (
    <div className="space-y-4">
      {!isLocked && (
        <div className="flex items-center justify-between mb-1.5">
          <span
            className="text-xs font-bold uppercase tracking-wider civ-archive-subtitle"
            style={{ color: CIV_COLORS.textPrimary }}
          >
            {t("world.compoundLevel")}
          </span>
        </div>
      )}

      {/* ── 源流印记 — 源技能评分卷轴 ── */}
      {detail.source_skill_scores && detail.source_skill_scores.length > 0 && (
        <div>
          <h4
            className="text-[10px] font-bold uppercase tracking-widest mb-2.5 civ-archive-subtitle"
            style={{ color: CIV_COLORS.textSecondary }}
          >
            {t("world.sourceSkillScores")}
          </h4>
          <div className="space-y-2">
            {detail.source_skill_scores.map((src) => (
              <div
                key={skillDisplayName(src.skill_name, undefined, locale)}
                className="rounded-lg p-3 space-y-2 relative overflow-hidden"
                style={{
                  backgroundColor: CIV_COLORS.bgContent + "80",
                  border: `1px solid ${CIV_COLORS.border}`,
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="text-sm font-bold civ-archive-title truncate"
                    style={{ color: CIV_COLORS.textPrimary }}
                  >
                    {skillDisplayName(src.skill_name, undefined, locale)}
                  </span>
                  <span
                    className="text-[10px] font-bold rounded-full px-2 py-0.5 shrink-0"
                    style={{
                      backgroundColor: CIV_COLORS.darkRed + "15",
                      color: CIV_COLORS.darkRed,
                      border: `1px solid ${CIV_COLORS.darkRed}40`,
                    }}
                  >
                    {t("world.prerequisites")}: Lv.{src.min_level}
                  </span>
                </div>

                {/* 四维度迷你印章 */}
                <div className="grid grid-cols-4 gap-1">
                  <MiniSeal label={locale === "en" ? "K" : "知"} value={src.knowledge} />
                  <MiniSeal label={locale === "en" ? "R" : "推"} value={src.reasoning} />
                  <MiniSeal label={locale === "en" ? "A" : "用"} value={src.application} />
                  <MiniSeal label={locale === "en" ? "C" : "创"} value={src.creation} />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-baseline gap-1">
                    <span
                      className="text-lg font-bold tabular-nums civ-archive-title"
                      style={{ color: CIV_COLORS.darkRed }}
                    >
                      {src.overall}
                    </span>
                    <span
                      className="text-[9px] uppercase tracking-wider"
                      style={{ color: CIV_COLORS.textSecondary }}
                    >
                      {locale === "en" ? "overall" : "总分"}
                    </span>
                  </div>
                  <span
                    className="text-[10px] font-bold rounded-full px-2 py-0.5"
                    style={{
                      backgroundColor: CIV_COLORS.gold + "20",
                      color: CIV_COLORS.darkRed,
                      border: `1px solid ${CIV_COLORS.gold}60`,
                    }}
                  >
                    {locale === "en"
                      ? src.rank
                      : RANK_LABELS[src.rank as keyof typeof RANK_LABELS] ?? src.rank}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── 能力铭文 — 四方向评分印章 ── */
function ScoreSeal({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="flex items-center justify-between rounded-lg px-3 py-2 relative overflow-hidden"
      style={{
        backgroundColor: CIV_COLORS.bgCard,
        border: `1px solid ${CIV_COLORS.border}`,
      }}
    >
      <span
        className="text-[11px] font-medium civ-archive-body"
        style={{ color: CIV_COLORS.textSecondary }}
      >
        {label}
      </span>
      <span
        className="text-sm font-bold tabular-nums civ-archive-title"
        style={{ color: CIV_COLORS.darkRed }}
      >
        {value}
      </span>
    </div>
  );
}

/* ── 迷你印章 — 复合建筑源流四维度 ── */
function MiniSeal({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="text-center rounded py-1"
      style={{
        backgroundColor: CIV_COLORS.bgCard,
        border: `1px solid ${CIV_COLORS.border}80`,
      }}
    >
      <div
        className="text-[9px] font-bold uppercase tracking-wider"
        style={{ color: CIV_COLORS.textSecondary }}
      >
        {label}
      </div>
      <div
        className="text-xs font-bold tabular-nums civ-archive-title"
        style={{ color: CIV_COLORS.darkRed }}
      >
        {value}
      </div>
    </div>
  );
}
