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
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 animate-fade-in-up">
      {/* Title + View Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t("world.myWorld")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("world.subtitle")}
          </p>
        </div>
        {/* Map / Tech Tree toggle */}
        <div className="flex rounded-lg border border-border bg-muted/30 p-0.5">
          <button
            onClick={() => setViewMode("map")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === "map"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("world.mapView")}
          </button>
          <button
            onClick={() => setViewMode("techtree")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === "techtree"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("world.techTreeView")}
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
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
            <div className="grid gap-6 lg:grid-cols-3">
              {/* World Map — 2 columns on desktop */}
              <div className="lg:col-span-2 rounded-xl border border-border bg-background p-4">
                <h2 className="text-sm font-medium text-muted-foreground mb-2 px-2">
                  {world.name}
                </h2>
                <WorldMap
                  buildings={world.buildings}
                  compoundBuildings={world.compound_buildings}
                  selectedBuildingId={selectedBuilding?.id}
                  onSelectBuilding={setSelectedBuilding}
                />
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                {/* Civilization Tier */}
                <CivilizationTier
                  tier={world.tier}
                  tierScore={world.tier_score}
                  nextTierAt={world.next_tier_at}
                />

                {/* Stats */}
                <StatsSidebar
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
                  <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      {t("world.selectBuilding")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Tech Tree View */
            <div className="rounded-xl border border-border bg-background p-6">
              <TechTreeView />
            </div>
          )}

          {/* Events + Milestones (below the map/techtree) */}
          {world.stats.active_buildings > 0 && viewMode === "map" && (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-background p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  {t("world.recentEvents")}
                </h3>
                <WorldEventTimeline events={world.recent_events} />
              </div>
              <div className="rounded-xl border border-border bg-background p-4">
                <MilestoneChecklist
                  milestones={undefined}
                  unlockedCount={world.stats.milestones_unlocked}
                  totalCount={world.stats.total_milestones}
                />
              </div>
            </div>
          )}

          {/* Empty state — no buildings activated */}
          {world.stats.active_buildings === 0 && (
            <div className="mt-6">
              <EmptyState
                title={t("world.emptyTitle")}
                description={t("world.emptyDesc")}
                actionLabel={t("world.startQuest")}
                actionHref="/quests"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Stats + Regions sidebar */
function StatsSidebar({
  stats,
  regions,
  t,
  locale,
}: {
  stats: WorldStats;
  regions: RegionInfo[];
  t: (key: string) => string;
  locale: string;
}) {
  const regionDisplayName = (r: RegionInfo) =>
    locale === "en" ? r.name.replace(/区$/, " Region") : r.name;

  return (
    <div className="rounded-xl border border-border bg-background p-4 space-y-4">
      <h3 className="text-sm font-semibold text-foreground">{t("world.stats")}</h3>

      {/* Stat items */}
      <div className="space-y-2">
        <StatRow label={t("world.activeBuildings")} value={String(stats.active_buildings)} />
        <StatRow label={t("world.compoundBuildings")} value={String(stats.active_compound_buildings)} />
        <StatRow label={t("world.averageLevel")} value={stats.average_level.toFixed(1)} />
        <StatRow
          label={t("world.highestBuilding")}
          value={stats.highest_level > 0 ? `Lv.${stats.highest_level}` : "—"}
        />
        <StatRow
          label={t("world.milestones")}
          value={`${stats.milestones_unlocked}/${stats.total_milestones}`}
        />
      </div>

      {/* Regions */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          {t("world.regions")}
        </h4>
        <div className="space-y-1.5">
          {regions.map((region) => (
            <div
              key={region.key}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                region.unlocked
                  ? "bg-secondary/50"
                  : "bg-muted/20 opacity-60"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    region.unlocked ? "bg-success" : "bg-muted-foreground"
                  }`}
                />
                {regionDisplayName(region)}
              </span>
              <span className="text-xs text-muted-foreground">
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

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}
