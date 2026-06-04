"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { worldService } from "@/services/world.service";
import { WorldMap } from "@/app/components/WorldMap";
import { BuildingDetailPanel } from "@/app/components/BuildingDetailPanel";
import { Loading } from "@/app/components/Loading";
import { ErrorState } from "@/app/components/ErrorState";
import { EmptyState } from "@/app/components/EmptyState";
import type { UserBuilding, RegionInfo, WorldStats } from "@/types/world";

export default function WorldPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, locale } = useLocale();
  const router = useRouter();
  const [selectedBuilding, setSelectedBuilding] = useState<UserBuilding | null>(null);

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
    mutate,
  } = useSWR(isAuthenticated ? "world" : null, () =>
    worldService.getWorld().catch(() => null)
  );

  if (authLoading || !isAuthenticated) {
    return <Loading text={t("auth.validating")} />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 animate-fade-in-up">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {t("world.myWorld")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("world.subtitle")}
        </p>
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
        <div className="grid gap-6 lg:grid-cols-3">
          {/* World Map — 2 columns on desktop */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-background p-4">
            <h2 className="text-sm font-medium text-muted-foreground mb-2 px-2">
              {world.name}
            </h2>
            <WorldMap
              buildings={world.buildings}
              selectedBuildingId={selectedBuilding?.id}
              onSelectBuilding={setSelectedBuilding}
            />
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-4">
            <StatsSidebar stats={world.stats} regions={world.regions} t={t} locale={locale} />

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
      )}

      {/* Empty state — no buildings activated */}
      {world && world.stats.active_buildings === 0 && !isLoading && (
        <div className="mt-6">
          <EmptyState
            title={t("world.emptyTitle")}
            description={t("world.emptyDesc")}
            actionLabel={t("world.startQuest")}
            actionHref="/quests"
          />
        </div>
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

      {/* Civilization Level */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
        <span className="text-sm text-muted-foreground">{t("world.civilizationLevel")}</span>
        <span className="text-xl font-bold text-primary">Lv.{stats.civilization_level}</span>
      </div>

      {/* Stat items */}
      <div className="space-y-2">
        <StatRow label={t("world.activeBuildings")} value={String(stats.active_buildings)} />
        <StatRow label={t("world.averageLevel")} value={stats.average_level.toFixed(1)} />
        <StatRow
          label={t("world.highestBuilding")}
          value={stats.highest_level > 0 ? `Lv.${stats.highest_level}` : "—"}
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
