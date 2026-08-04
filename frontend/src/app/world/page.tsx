"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
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
import { QuestScrollIcon, type ScrollIconName } from "@/app/components/QuestScrollIcon";
import {
  CIV_COLORS,
  CopperDivider,
  ParchmentBackground,
  CivArchiveStyles,
} from "@/app/components/CivArchiveTheme";
import type {
  UserBuilding,
  UserCompoundBuilding,
  World,
} from "@/types/world";

type SelectedBuilding = UserBuilding | UserCompoundBuilding;
type ViewMode = "overview" | "map" | "techtree";

/**
 * World page — "我的文明领地" (My Civilization Territory).
 *
 * Refactored to the Odyssey Civilization Archive visual system:
 *   - Parchment background, copper dividers, gold/dark-red palette
 *   - Civilization seal SVG icons instead of generic building icons
 *   - Scoped CSS via civ-archive-* classes (no global pollution)
 *
 * Three-layer tab structure (preserved from prior design):
 *   Tab 1: Civilization Overview
 *   Tab 2: Civilization Map
 *   Tab 3: Building Tech Tree
 */
function WorldPageContent() {
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
      setViewMode("map");
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

  const tabs: { key: ViewMode; icon: ScrollIconName; label: string }[] = [
    { key: "overview", icon: "building", label: t("world.overviewTab") },
    { key: "map", icon: "map", label: t("world.mapTab") },
    { key: "techtree", icon: "tree", label: t("world.techTreeTab") },
  ];

  return (
    <div className="civ-archive-page relative pb-20">
      <CivArchiveStyles />
      <ParchmentBackground opacity={0.35} />

      {/* ── Top HUD Bar (sticky) — 文明档案标题区 ── */}
      <div
        className="sticky top-0 z-40 backdrop-blur-md shadow-sm civ-archive-fade-in"
        style={{
          backgroundColor: CIV_COLORS.bgContent + "EE",
          borderBottom: `2px solid ${CIV_COLORS.gold}66`,
        }}
      >
        <div className="mx-auto max-w-5xl px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Title + tab toggle */}
            <div className="flex items-center gap-4 shrink-0 flex-wrap">
              <div className="flex flex-col">
                <h1
                  className="civ-archive-title text-2xl tracking-wide flex items-center gap-2"
                  style={{ color: CIV_COLORS.textPrimary }}
                >
                  <span
                    className="inline-flex"
                    style={{ color: CIV_COLORS.gold }}
                  >
                    <QuestScrollIcon name="compass" size={20} />
                  </span>
                  {t("world.myWorld")}
                </h1>
                <span
                  className="text-[10px] font-bold uppercase tracking-widest mt-0.5"
                  style={{ color: CIV_COLORS.textSecondary }}
                >
                  {t("world.civilizationLevel")}: Lv.{world?.civilization_level ?? "—"} ·{" "}
                  {world?.era_name ?? "—"}
                </span>
              </div>
              {/* Three-tab toggle */}
              <div
                className="flex rounded-xl p-0.5 shadow-inner"
                style={{
                  border: `1px solid ${CIV_COLORS.border}`,
                  backgroundColor: CIV_COLORS.bgContent,
                }}
              >
                {tabs.map((tab) => {
                  const active = viewMode === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => {
                        setViewMode(tab.key);
                        setSelectedBuilding(null);
                      }}
                      className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-civ-serif italic font-semibold transition-all duration-200"
                      style={{
                        background: active
                          ? `linear-gradient(to bottom, ${CIV_COLORS.bgCard}, ${CIV_COLORS.bgContent})`
                          : "transparent",
                        color: active ? CIV_COLORS.textPrimary : CIV_COLORS.textSecondary,
                        border: active ? `1px solid ${CIV_COLORS.gold}80` : "1px solid transparent",
                        boxShadow: active ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                      }}
                    >
                      <span
                        className="text-sm inline-flex"
                        style={{ color: active ? CIV_COLORS.gold : CIV_COLORS.textSecondary }}
                      >
                        <QuestScrollIcon name={tab.icon} size={14} />
                      </span>
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Quick stats */}
            {world && (
              <div className="hidden lg:flex items-center gap-3 text-xs shrink-0">
                <QuickStat icon="building" label={t("world.activeBuildings")} value={String(world.stats.active_buildings)} />
                <QuickStat icon="star" label={t("world.compoundBuildings")} value={String(world.stats.active_compound_buildings)} />
                <QuickStat icon="chart-up" label={t("world.civilizationLevel")} value={`Lv.${world.civilization_level}`} isLevel />
              </div>
            )}
          </div>
        </div>
        {/* Copper divider under header */}
        <div className="mx-auto max-w-5xl px-4">
          <CopperDivider />
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
      <div className="mx-auto max-w-5xl px-4 py-6 relative z-10">
        {isLoading && (
          <div className="flex items-center justify-center py-32">
            <div
              className="h-10 w-10 animate-spin rounded-full border-[3px] border-t-transparent"
              style={{ borderColor: CIV_COLORS.gold, borderTopColor: "transparent" }}
            />
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
              <div
                className="rounded-lg p-6 shadow-md civ-archive-card"
                style={{ borderColor: CIV_COLORS.border }}
              >
                <TechTreeView />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Quick Stat Pill — civilization archive styled ──

function QuickStat({
  icon,
  label,
  value,
  isLevel = false,
}: {
  icon: ScrollIconName;
  label: string;
  value: string;
  isLevel?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-2 rounded-lg border px-3 py-1 shadow-sm transition-all duration-300"
      style={{
        backgroundColor: isLevel ? CIV_COLORS.gold + "12" : CIV_COLORS.bgCard,
        borderColor: isLevel ? CIV_COLORS.gold + "60" : CIV_COLORS.border,
      }}
    >
      <span
        className="text-sm inline-flex"
        style={{ color: isLevel ? CIV_COLORS.gold : CIV_COLORS.darkRed }}
      >
        <QuestScrollIcon name={icon} size={14} />
      </span>
      <div className="flex items-baseline gap-1.5 leading-tight">
        <span
          className="hidden xl:inline text-[10px] font-medium uppercase tracking-wider"
          style={{ color: CIV_COLORS.textSecondary }}
        >
          {label}:
        </span>
        <span
          className="font-bold tabular-nums text-xs"
          style={{ color: isLevel ? CIV_COLORS.darkRed : CIV_COLORS.textPrimary }}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

// ── Suspense wrapper for useSearchParams ──

export default function WorldPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-32">
        <div
          className="h-10 w-10 animate-spin rounded-full border-[3px] border-t-transparent"
          style={{ borderColor: CIV_COLORS.gold, borderTopColor: "transparent" }}
        />
      </div>
    }>
      <WorldPageContent />
    </Suspense>
  );
}
