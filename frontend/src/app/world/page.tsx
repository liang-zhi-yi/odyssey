"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { worldService } from "@/services/world.service";
import { WorldMap } from "@/app/components/WorldMap";
import { BuildingDetailPanel } from "@/app/components/BuildingDetailPanel";
import { CivilizationTier } from "@/app/components/CivilizationTier";
import { WorldEventTimeline } from "@/app/components/WorldEventTimeline";
import { MilestoneChecklist } from "@/app/components/MilestoneChecklist";
import { TechTreeView } from "@/app/components/TechTreeView";
import { Loading } from "@/app/components/Loading";
import { ErrorState } from "@/app/components/ErrorState";
import { EmptyState } from "@/app/components/EmptyState";
import type {
  UserBuilding,
  UserCompoundBuilding,
  RegionInfo,
  WorldStats,
} from "@/types/world";

type SelectedBuilding = UserBuilding | UserCompoundBuilding;
type ViewMode = "map" | "techtree";

export default function WorldPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, locale } = useLocale();
  const router = useRouter();
  const [selectedBuilding, setSelectedBuilding] = useState<SelectedBuilding | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("map");

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch world state
  const {
    data: world,
    isLoading,
    error,
  } = useSWR(isAuthenticated ? "world" : null, () =>
    worldService.getWorld().catch(() => null)
  );

  if (authLoading || !isAuthenticated) {
    return <Loading text={t("auth.validating")} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Top HUD Bar ── */}
      <div className="sticky top-0 z-40 border-b border-border/50 bg-background/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Title */}
            <div className="flex items-center gap-3 shrink-0">
              <h1 className="text-xl font-bold text-foreground">
                {t("world.myWorld")}
              </h1>
              {/* View toggle */}
              <div className="flex rounded-lg border border-border bg-muted/40 p-0.5">
                <button
                  onClick={() => setViewMode("map")}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                    viewMode === "map"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  🗺️ {t("world.mapView")}
                </button>
                <button
                  onClick={() => setViewMode("techtree")}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                    viewMode === "techtree"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  🌳 {t("world.techTreeView")}
                </button>
              </div>
            </div>


            {/* Right: Quick stats */}
            {world && (
              <div className="hidden lg:flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                <StatPill icon="🏛️" label={t("world.activeBuildings")} value={String(world.stats.active_buildings)} />
                <StatPill icon="⭐" label={t("world.compoundBuildings")} value={String(world.stats.active_compound_buildings)} />
                <StatPill icon="🎯" label={t("world.milestones")} value={`${world.stats.milestones_unlocked}/${world.stats.total_milestones}`} />
                <StatPill icon="📊" label={t("world.averageLevel")} value={world.stats.average_level.toFixed(1)} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="mx-auto max-w-7xl px-4 py-4">
        {isLoading && (
          <div className="flex items-center justify-center py-32">
            <div className="h-10 w-10 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          </div>
        )}

        {error && !isLoading && (
          <ErrorState
            message={t("common.error")}
            detail={error?.message ?? undefined}
          />
        )}

        {world && !isLoading && (
          <>
            {viewMode === "map" ? (
              <div className="space-y-4">
                {/* ── Game Map Area ── */}
                <div className="grid gap-4 lg:grid-cols-4">
                  {/* Map — 3 cols on desktop */}
                  <div className="lg:col-span-3 rounded-2xl border border-border bg-gradient-to-b from-muted/5 to-muted/20 overflow-hidden">
                    {/* Map header with world name */}
                    <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 bg-muted/10">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {world.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground bg-muted/50 rounded-full px-2 py-0.5">
                          {world.buildings.length + world.compound_buildings.length} {locale === "en" ? "Buildings" : "建筑"}
                        </span>
                      </div>
                      {selectedBuilding && (
                        <button
                          onClick={() => setSelectedBuilding(null)}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          {locale === "en" ? "Deselect" : "取消选中"}
                        </button>
                      )}
                    </div>
                    <WorldMap
                      buildings={world.buildings}
                      compoundBuildings={world.compound_buildings}
                      selectedBuildingId={selectedBuilding?.id}
                      onSelectBuilding={setSelectedBuilding}
                    />
                  </div>

                  {/* ── Right Sidebar ── */}
                  <div className="space-y-4">
                    {/* Civilization Tier (full card) */}
                    <CivilizationTier
                      tier={world.tier}
                      tierScore={world.tier_score}
                      nextTierAt={world.next_tier_at}
                    />

                    {/* Stats Card */}
                    <StatsCard
                      stats={world.stats}
                      regions={world.regions}
                      t={t}
                      locale={locale}
                    />

                    {/* Selected building detail */}
                    {selectedBuilding ? (
                      <BuildingDetailPanel
                        building={selectedBuilding}
                        onClose={() => setSelectedBuilding(null)}
                      />
                    ) : (
                      <div className="rounded-xl border-2 border-dashed border-border/60 bg-muted/10 p-5 text-center">
                        <span className="text-3xl block mb-2">👆</span>
                        <p className="text-xs text-muted-foreground">
                          {t("world.selectBuilding")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Bottom Panels: Events + Milestones ── */}
                {world.stats.active_buildings > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* World Events */}
                    <div className="rounded-xl border border-border bg-background p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">📜</span>
                        <h3 className="text-sm font-semibold text-foreground">
                          {t("world.recentEvents")}
                        </h3>
                        {world.recent_events.length > 0 && (
                          <span className="text-[10px] bg-primary/10 text-primary rounded-full px-2 py-0.5 font-medium">
                            {world.recent_events.length}
                          </span>
                        )}
                      </div>
                      <WorldEventTimeline events={world.recent_events} />
                    </div>

                    {/* Milestones */}
                    <div className="rounded-xl border border-border bg-background p-5">
                      <MilestoneChecklist
                        milestones={undefined}
                        unlockedCount={world.stats.milestones_unlocked}
                        totalCount={world.stats.total_milestones}
                      />
                    </div>
                  </div>
                ) : (
                  /* Empty state — no buildings */
                  <div className="mt-2">
                    <EmptyState
                      title={t("world.emptyTitle")}
                      description={t("world.emptyDesc")}
                      actionLabel={t("world.startQuest")}
                      actionHref="/quests"
                    />
                  </div>
                )}
              </div>
            ) : (
              /* ── Tech Tree View ── */
              <div className="rounded-xl border border-border bg-background p-6">
                <TechTreeView />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Quick Stat Pill ──

function StatPill({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm">{icon}</span>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground tabular-nums">{value}</span>
    </div>
  );
}

// ── Stats Card ──

function StatsCard({
  stats,
  regions,
  t,
  locale,
}: {
  stats: WorldStats;
  regions: RegionInfo[];
  t: (key: string, vars?: Record<string, string>) => string;
  locale: string;
}) {
  const regionDisplayName = (r: RegionInfo) =>
    locale === "en" ? r.name.replace(/区$/, " Region") : r.name;

  return (
    <div className="rounded-xl border border-border bg-background p-4 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-lg">📊</span>
        <h3 className="text-sm font-semibold text-foreground">{t("world.stats")}</h3>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-2">
        <StatCell label={t("world.activeBuildings")} value={String(stats.active_buildings)} accent="text-primary" />
        <StatCell label={t("world.compoundBuildings")} value={String(stats.active_compound_buildings)} accent="text-yellow-500" />
        <StatCell label={t("world.averageLevel")} value={stats.average_level.toFixed(1)} accent="text-emerald-500" />
        <StatCell
          label={t("world.highestBuilding")}
          value={stats.highest_level > 0 ? `Lv.${stats.highest_level}` : "—"}
          accent="text-purple-500"
        />
      </div>

      {/* Region unlock status */}
      <div>
        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          {t("world.regions")}
        </h4>
        <div className="space-y-1">
          {regions.map((region) => (
            <div
              key={region.key}
              className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-xs transition-colors ${
                region.unlocked
                  ? "bg-secondary/40"
                  : "bg-muted/15 opacity-50"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full ${
                    region.unlocked ? "bg-green-400 shadow-sm shadow-green-400/50" : "bg-muted-foreground/40"
                  }`}
                />
                {regionDisplayName(region)}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                {region.unlocked
                  ? `Lv.${region.highest_level}`
                  : t("world.locked")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCell({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-lg bg-secondary/30 px-3 py-2 text-center">
      <div className={`text-lg font-bold ${accent} tabular-nums`}>{value}</div>
      <div className="text-[10px] text-muted-foreground leading-tight">{label}</div>
    </div>
  );
}
