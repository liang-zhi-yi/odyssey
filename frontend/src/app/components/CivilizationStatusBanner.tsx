"use client";

import { useLocale } from "@/hooks/useLocale";
import { ERA_LABELS, CIVILIZATION_TIER_LABELS } from "@/types/world";
import type { World, CivilizationDirection } from "@/types/world";

interface CivilizationStatusBannerProps {
  world: World | null;
  direction: CivilizationDirection | null;
  isLoading: boolean;
}

/**
 * Horizontal civilization status banner — replaces the generic stat cards
 * with era-aware, civ-thematic status display.
 *
 * Shows: current era, civilization tier/level, era score progress bar,
 * exploration progress, and next target building from active paths.
 */
export function CivilizationStatusBanner({
  world,
  direction,
  isLoading,
}: CivilizationStatusBannerProps) {
  const { locale } = useLocale();

  // ── Loading skeleton ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center gap-6 flex-wrap">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-muted skeleton-shimmer" />
              <div className="space-y-1">
                <div className="h-3 w-12 rounded bg-muted skeleton-shimmer" />
                <div className="h-4 w-16 rounded bg-muted skeleton-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── No world data — minimal banner ──────────────────────────────────
  if (!world) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/50 p-5">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🌍</span>
          <div>
            <p className="text-sm font-medium">
              {locale === "zh" ? "文明尚未初始化" : "Civilization not initialized"}
            </p>
            <p className="text-xs text-muted-foreground">
              {locale === "zh"
                ? "完成首次评估以开启你的文明"
                : "Complete your first assessment to start your civilization"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Active data ─────────────────────────────────────────────────────
  const eraInfo = ERA_LABELS[world.era] ?? ERA_LABELS.WILDERNESS;
  const eraName = locale === "en" ? eraInfo.en : eraInfo.zh;
  const tierInfo =
    CIVILIZATION_TIER_LABELS[world.tier] ?? CIVILIZATION_TIER_LABELS.SETTLER;
  const tierName = locale === "en" ? tierInfo.en : tierInfo.zh;

  // Era score progress
  const nextEraAt = world.next_era_at ?? 0;
  const isMaxEra = world.next_era_at === null || world.era === "FUTURE";
  const eraProgress = isMaxEra
    ? 100
    : Math.min(100, Math.round((world.era_score / Math.max(1, nextEraAt)) * 100));
  const eraProgressLabel = isMaxEra
    ? "MAX"
    : `${world.era_score}/${nextEraAt}`;

  // Next era key for progress label
  const nextEraKey = getNextEra(world.era) ?? "WILDERNESS";
  const nextEraLabel = ERA_LABELS[nextEraKey as keyof typeof ERA_LABELS];

  // Next target building from civilization direction
  const nextTarget =
    direction?.active_paths?.[0]?.targeted_buildings?.[0] ?? null;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card space-y-4">
      {/* ── Main status row ──────────────────────────────────────── */}
      <div className="flex items-center gap-4 lg:gap-8 flex-wrap">
        {/* Current Era */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-2xl flex-shrink-0">{eraInfo.icon}</span>
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              {locale === "zh" ? "当前时代" : "Current Era"}
            </p>
            <p className="text-sm font-semibold truncate">{eraName}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-8 bg-border" />

        {/* Civilization Tier + Level */}
        <div className="flex items-center gap-2">
          <span className="text-2xl">{tierInfo.icon}</span>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              {locale === "zh" ? "文明等级" : "Civ Level"}
            </p>
            <p className="text-sm font-semibold">
              {tierName}{" "}
              <span className="text-muted-foreground">
                Lv.{world.civilization_level}
              </span>
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-8 bg-border" />

        {/* Era Score progress */}
        <div className="flex-1 min-w-[160px] max-w-[280px]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
              {locale === "zh" ? "文明指数" : "Civ Score"}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
              {eraProgressLabel}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-[#C4A77D] transition-all duration-700"
              style={{ width: `${eraProgress}%` }}
            />
          </div>
          {!isMaxEra && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {locale === "zh"
                ? `距${nextEraLabel.zh}还需 ${nextEraAt - world.era_score} 分`
                : `${nextEraAt - world.era_score} pts to next era`}
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px h-8 bg-border" />

        {/* Exploration progress (desktop only) */}
        <div className="hidden md:flex items-center gap-2">
          <span className="text-lg">🌍</span>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              {locale === "zh" ? "探索进度" : "Exploration"}
            </p>
            <p className="text-sm font-semibold tabular-nums">
              {world.exploration_progress}%
            </p>
          </div>
        </div>
      </div>

      {/* ── Next target building ──────────────────────────────────── */}
      {nextTarget && (
        <div className="flex items-center gap-2 pt-3 border-t border-border/60">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide flex-shrink-0">
            {locale === "zh" ? "下一目标" : "Next Target"}:
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#8B9D83]/10 border border-[#8B9D83]/20 px-3 py-1 text-xs">
            <span>{nextTarget.building_icon}</span>
            <span className="font-medium">
              {locale === "en" && nextTarget.building_name_en
                ? nextTarget.building_name_en
                : nextTarget.building_name}
            </span>
            <span className="text-muted-foreground">
              Lv.{nextTarget.current_level}
              {nextTarget.projected_level > nextTarget.current_level
                ? ` → ${nextTarget.projected_level}`
                : ""}
            </span>
          </span>
          {direction && direction.active_paths.length > 0 && (
            <span className="text-[10px] text-muted-foreground ml-auto">
              {direction.active_paths.length}{" "}
              {locale === "zh" ? "条活跃路径" : "active paths"}
            </span>
          )}
        </div>
      )}

      {/* No active direction — gentle nudge */}
      {!nextTarget && (
        <div className="flex items-center gap-2 pt-3 border-t border-border/60">
          <span className="text-[10px] text-muted-foreground">
            {locale === "zh"
              ? "💡 创建第一条学习路径来设定文明发展方向"
              : "💡 Create your first learning path to set a civilization direction"}
          </span>
        </div>
      )}
    </div>
  );
}

/** Get the next era key for the progress label */
function getNextEra(current: string): string | null {
  const ERA_ORDER = [
    "WILDERNESS",
    "AGRICULTURE",
    "ACADEMY",
    "INDUSTRY",
    "INFORMATION",
    "AI",
    "INTELLIGENCE",
    "DIGITAL",
    "FUTURE",
  ];
  const idx = ERA_ORDER.indexOf(current);
  if (idx < 0 || idx >= ERA_ORDER.length - 1) return null;
  return ERA_ORDER[idx + 1];
}
