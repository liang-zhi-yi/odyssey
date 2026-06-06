"use client";

import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { worldService } from "@/services/world.service";
import { CivilizationOverviewTab } from "@/app/components/CivilizationOverviewTab";
import { RegionMapView } from "@/app/components/RegionMapView";
import { BuildingDetailPanel } from "@/app/components/BuildingDetailPanel";
import { TechTreeView } from "@/app/components/TechTreeView";
import { EraTransitionOverlay } from "@/app/components/EraTransitionOverlay";
import { Loading } from "@/app/components/Loading";
import { ErrorState } from "@/app/components/ErrorState";
import type {
  UserBuilding,
  UserCompoundBuilding,
  World,
} from "@/types/world";

type SelectedBuilding = UserBuilding | UserCompoundBuilding;
type ViewMode = "overview" | "map" | "techtree";

/**
 * World page — redesigned per "My World.md" design document.
 *
 * Three-layer tab structure:
 *   Tab 1 (default): Civilization Overview — hero stats, core building, next goal, growth timeline
 *   Tab 2: Civilization Map — regional board with central hub, fog of war
 *   Tab 3: Building Tech Tree — vertical layered tree (compound → basic)
 *
 * Warm theme: 奶油白/鼠尾草绿/暖灰/羊皮纸色
 * Design references: Civilization, Humankind, Monument Valley, Notion
 */
export default function WorldPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedBuilding, setSelectedBuilding] = useState<SelectedBuilding | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  const [prevEra, setPrevEra] = useState<string | null>(null);
  const [showEraOverlay, setShowEraOverlay] = useState(false);

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

  // Fetch civilization direction
  const { data: civDirection, isLoading: civDirectionLoading } = useSWR(
    isAuthenticated ? "world-civ-direction" : null,
    () => worldService.getCivilizationDirection().catch(() => null),
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  // Cross-module: pre-select building from query param
  const preSelectFromQuery = useCallback(() => {
    const buildingId = searchParams.get("building");
    if (!buildingId || !world) return;
    const allBuildings: SelectedBuilding[] = [
      ...(world.buildings ?? []),
      ...(world.compound_buildings ?? []),
    ];
    const found = allBuildings.find((b) => b.id === buildingId);
    if (found) {
      setSelectedBuilding(found);
      setViewMode("map"); // switch to map to show the building
      setTimeout(() => {
        document.getElementById("world-map-area")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, [searchParams, world]);

  useEffect(() => {
    if (world && !selectedBuilding) {
      preSelectFromQuery();
    }
  }, [world, selectedBuilding, preSelectFromQuery]);

  // Era transition detection
  useEffect(() => {
    if (!world) return;
    const currentEra = world.era;
    if (prevEra && prevEra !== currentEra && prevEra !== "__init__") {
      setShowEraOverlay(true);
    }
    if (prevEra !== currentEra) {
      setPrevEra(currentEra);
    }
    if (prevEra === null) {
      setPrevEra("__init__");
    }
  }, [world?.era]);

  if (authLoading || !isAuthenticated) {
    return <Loading text={t("auth.validating")} />;
  }

  const tabs: { key: ViewMode; icon: string; label: string }[] = [
    { key: "overview", icon: "🏛️", label: t("world.overviewTab") },
    { key: "map", icon: "🗺️", label: t("world.mapTab") },
    { key: "techtree", icon: "🌳", label: t("world.techTreeTab") },
  ];

  return (
    <div className="min-h-screen bg-[oklch(0.985_0.003_95)]">
      {/* ── Top HUD Bar (sticky) ── */}
      <div className="sticky top-0 z-40 border-b border-[oklch(0.88_0.02_90)] bg-[oklch(0.985_0.003_95)]/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Title + tab toggle */}
            <div className="flex items-center gap-4 shrink-0">
              <h1 className="text-xl font-bold text-[oklch(0.3_0.02_80)]">
                🌍 {t("world.myWorld")}
              </h1>
              {/* Three-tab toggle */}
              <div className="flex rounded-lg border border-[oklch(0.88_0.02_90)] bg-[oklch(0.97_0.003_90)] p-0.5">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setViewMode(tab.key);
                      setSelectedBuilding(null);
                    }}
                    className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                      viewMode === tab.key
                        ? "bg-[oklch(0.99_0.002_95)] text-[oklch(0.3_0.02_80)] shadow-sm border border-[oklch(0.88_0.02_90)]"
                        : "text-[oklch(0.55_0.02_85)] hover:text-[oklch(0.35_0.02_80)]"
                    }`}
                  >
                    <span className="text-sm">{tab.icon}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Quick stats */}
            {world && (
              <div className="hidden lg:flex items-center gap-3 text-xs shrink-0">
                <QuickStat icon="🏛️" label={t("world.activeBuildings")} value={String(world.stats.active_buildings)} />
                <QuickStat icon="⭐" label={t("world.compoundBuildings")} value={String(world.stats.active_compound_buildings)} />
                <QuickStat icon="📊" label={t("world.civilizationLevel")} value={`Lv.${world.civilization_level}`} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Era Transition Overlay ── */}
      {showEraOverlay && world && (
        <EraTransitionOverlay
          fromEra={prevEra && prevEra !== "__init__" ? prevEra : undefined}
          toEra={world.era}
          toEraName={world.era_name}
          toEraIcon={world.era_icon}
          onComplete={() => setShowEraOverlay(false)}
        />
      )}

      {/* ── Main Content ── */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        {isLoading && (
          <div className="flex items-center justify-center py-32">
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-[oklch(0.72_0.12_85)] border-t-transparent" />
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
            {/* Tab 1: Civilization Overview (default) */}
            {viewMode === "overview" && (
              <CivilizationOverviewTab
                world={world}
                direction={civDirection ?? null}
                directionLoading={civDirectionLoading}
              />
            )}

            {/* Tab 2: Civilization Map */}
            {viewMode === "map" && (
              <div id="world-map-area" className="space-y-4">
                <RegionMapView
                  world={world}
                  selectedBuildingId={selectedBuilding?.id}
                  onSelectBuilding={setSelectedBuilding}
                />
                {selectedBuilding && (
                  <div className="max-w-lg">
                    <BuildingDetailPanel
                      building={selectedBuilding}
                      onClose={() => setSelectedBuilding(null)}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Building Tech Tree */}
            {viewMode === "techtree" && (
              <div className="rounded-2xl border border-[oklch(0.88_0.02_90)] bg-gradient-to-br from-[oklch(0.98_0.005_90)] to-[oklch(0.96_0.01_92)] p-6 shadow-card">
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

function QuickStat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[oklch(0.5_0.02_85)]">
      <span className="text-sm">{icon}</span>
      <span className="hidden xl:inline">{label}</span>
      <span className="font-semibold text-[oklch(0.3_0.02_80)] tabular-nums">{value}</span>
    </div>
  );
}
