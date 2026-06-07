"use client";

import Link from "next/link";
import { useLocale } from "@/hooks/useLocale";
import type { PathRewardsPreview as PathRewardsPreviewType } from "@/types/learningPath";

interface PathRewardsPreviewProps {
  rewards: PathRewardsPreviewType | null;
  isLoading: boolean;
}

/**
 * Bottom rewards preview section — shows what buildings will be upgraded
 * and civilization tier progression after completing the current path.
 * Design: Strategy game "completion rewards" panel.
 */
export function PathRewardsPreview({ rewards, isLoading }: PathRewardsPreviewProps) {
  const { locale } = useLocale();

  // ── Loading Skeleton ──────────────────────────────────────
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-card">
        <div className="h-4 w-32 rounded-md bg-muted skeleton-shimmer" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-muted skeleton-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  // ── Empty State ───────────────────────────────────────────
  if (!rewards || (!rewards.buildings.length && !rewards.civilization_level_projection)) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">🏆</span>
          <h3 className="text-sm font-semibold">
            {locale === "zh" ? "路径奖励预览" : "Path Rewards"}
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">
          {locale === "zh"
            ? "完成路径中的里程碑后，这里将显示你将获得的建筑升级和文明成长。"
            : "Building upgrades and civilization growth will appear here as you complete milestones."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#C4A77D]/10 to-[#D4A76A]/10 px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏆</span>
          <div>
            <h3 className="text-sm font-semibold">
              {locale === "zh" ? "路径奖励预览" : "Path Rewards"}
            </h3>
            <p className="text-[10px] text-muted-foreground">
              {locale === "zh"
                ? "完成此路径后的预计收益"
                : "Projected gains after completing this path"}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Building upgrades */}
        {rewards.buildings.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              {locale === "zh" ? "🏗️ 建筑升级" : "🏗️ Building Upgrades"}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {rewards.buildings.map((b, idx) => {
                const name =
                  locale === "en" && b.name_en ? b.name_en : b.name;
                const leveledUp = b.projected_level > b.current_level;
                return (
                  <Link
                    key={idx}
                    href={`/world?building=${name}`}
                    className="flex items-center gap-3 rounded-xl border border-border bg-secondary/20 px-3 py-3 transition-all hover:border-[#C4A77D]/30 hover:bg-[#C4A77D]/5 group"
                  >
                    <span className="text-2xl transition-transform group-hover:scale-110">
                      {b.icon || "🏛️"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          Lv.{b.current_level}
                        </span>
                        {leveledUp && (
                          <>
                            <svg
                              className="w-3 h-3 text-[#C4A77D]"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M13 7l5 5m0 0l-5 5m5-5H6"
                              />
                            </svg>
                            <span className="text-xs font-semibold text-[#C4A77D]">
                              Lv.{b.projected_level}
                            </span>
                            <span className="text-[10px] text-[#8B9D83]">
                              (+{b.projected_score - b.current_score})
                            </span>
                          </>
                        )}
                        {!leveledUp && (
                          <span className="text-[10px] text-muted-foreground">
                            {locale === "zh" ? "（已达上限）" : "(maxed)"}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Civilization tier projection */}
        {rewards.tier_projection && (
          <div className="rounded-xl bg-gradient-to-br from-[#C4A77D]/10 to-[#D4A76A]/5 border border-[#C4A77D]/15 p-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              {locale === "zh" ? "🌍 文明层级进化" : "🌍 Civilization Tier Evolution"}
            </p>
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground">
                  {locale === "zh" ? "当前" : "Current"}
                </p>
                <span className="inline-block mt-1 rounded-lg bg-secondary px-2 py-0.5 text-xs font-medium">
                  {rewards.tier_projection.current_tier_name}
                </span>
              </div>
              <svg
                className="w-5 h-5 text-[#C4A77D]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground">
                  {locale === "zh" ? "预计" : "Projected"}
                </p>
                <span className="inline-block mt-1 rounded-lg bg-[#C4A77D]/15 px-2 py-0.5 text-xs font-semibold text-[#8B7355]">
                  {rewards.tier_projection.projected_tier_name}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Civilization level projection (fallback if no tier detail) */}
        {rewards.civilization_level_projection != null && !rewards.tier_projection && (
          <div className="rounded-xl bg-gradient-to-br from-[#C4A77D]/10 to-[#D4A76A]/5 border border-[#C4A77D]/15 p-4 flex items-center gap-3">
            <span className="text-2xl">🏛️</span>
            <div>
              <p className="text-xs text-muted-foreground">
                {locale === "zh" ? "预计文明等级" : "Projected Civilization Level"}
              </p>
              <p className="text-lg font-bold text-[#8B7355]">
                Lv.{rewards.civilization_level_projection}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
