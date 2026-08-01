"use client";

import useSWR from "swr";
import { useMemo } from "react";
import { worldService } from "@/services/world.service";
import { LEVEL_LABELS } from "@/types/world";
import type { TechTreeNode, TechTreeData } from "@/types/world";
import { useLocale } from "@/hooks/useLocale";
import { VintageShieldIcon } from "./VintageShieldIcon";
import { QuestScrollIcon, type ScrollIconName } from "./QuestScrollIcon";

interface TechTreeViewProps {
  data?: TechTreeData;
}

/**
 * Tech Tree View — vertical layered tree layout.
 *
 * Layers (top to bottom):
 *   Layer 1: Wonder Buildings (compound nodes Lv.7+)
 *   Layer 2: Compound Buildings (compound nodes Lv.1-6)
 *   Layer 3: Basic Buildings (regular nodes)
 *
 * Each layer uses a responsive CSS grid with auto-wrap.
 * Connector indicators between layers.
 * Cards show: name, level, required skills, unlock progress.
 *
 * Design: NOT horizontal scroll. NOT infinite width.
 * Vertical flow with wrapping grid per layer.
 */
export function TechTreeView({ data: initialData }: TechTreeViewProps) {
  const { locale } = useLocale();

  const { data, isLoading } = useSWR(
    "world-tech-tree",
    () => worldService.getTechTree(),
    { fallbackData: initialData }
  );

  // Classify nodes into three layers
  const layers = useMemo(() => {
    if (!data) return { wonder: [], compound: [], basic: [] };

    const compoundNodes = data.compound_nodes ?? [];
    const regularNodes = data.regular_nodes ?? [];

    return {
      wonder: compoundNodes.filter((n) => n.level >= 7),
      compound: compoundNodes.filter((n) => n.level < 7),
      basic: regularNodes,
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[oklch(0.72_0.12_85)] border-t-transparent" />
      </div>
    );
  }

  if (
    !data ||
    (data.regular_nodes.length === 0 && data.compound_nodes.length === 0)
  ) {
    return (
      <div className="rounded-xl border border-dashed border-[oklch(0.88_0.02_90)] bg-[oklch(0.97_0.003_90)] p-8 text-center">
        <QuestScrollIcon name="world-core" size={40} className="block mx-auto mb-3" />
        <p className="text-sm text-[oklch(0.5_0.02_85)]">
          {locale === "en"
            ? "No tech tree data available yet"
            : "暂无科技树数据"}
        </p>
        <p className="text-xs text-[oklch(0.55_0.02_85)] mt-1">
          {locale === "en"
            ? "Complete quest assessments to unlock buildings"
            : "完成Quest评估以解锁建筑"}
        </p>
      </div>
    );
  }

  const hasWonder = layers.wonder.length > 0;
  const hasCompound = layers.compound.length > 0;
  const hasBasic = layers.basic.length > 0;

  const layerLabel = (key: string): string => {
    switch (key) {
      case "wonder":
        return locale === "en" ? "Wonder Buildings" : "奇观建筑";
      case "compound":
        return locale === "en" ? "Compound Buildings" : "复合建筑";
      case "basic":
        return locale === "en" ? "Basic Buildings" : "基础建筑";
      default:
        return key;
    }
  };

  const layerIcon = (key: string): ScrollIconName => {
    switch (key) {
      case "wonder": return "building";
      case "compound": return "star";
      case "basic": return "building-emblem";
      default: return "scroll";
    }
  };

  return (
    <div className="space-y-10 py-4">
      {/* Header */}
      <div className="text-center space-y-1">
        <h3 className="text-lg font-bold font-civ-serif text-[oklch(0.3_0.02_80)]">
          <QuestScrollIcon name="world-core" size={20} className="inline-block align-middle" /> {locale === "en" ? "Building Tech Tree" : "文明建筑大科技树"}
        </h3>
        <p className="text-xs text-[oklch(0.55_0.02_85)]">
          {locale === "en"
            ? "How buildings connect and unlock"
            : "查看各项建筑解锁的前置条件与演进脉络"}
        </p>
      </div>

      {/* Layer 1: Wonder Buildings */}
      {hasWonder && (
        <TechTreeLayer
          nodes={layers.wonder}
          label={layerLabel("wonder")}
          icon={layerIcon("wonder")}
          locale={locale}
          accentColor="oklch(0.72 0.12 85)"
          isEmpty={false}
        />
      )}

      {/* Connector: Wonder → Compound */}
      {hasWonder && hasCompound && (
        <LayerConnector locale={locale} />
      )}

      {/* Layer 2: Compound Buildings */}
      {hasCompound && (
        <TechTreeLayer
          nodes={layers.compound}
          label={layerLabel("compound")}
          icon={layerIcon("compound")}
          locale={locale}
          accentColor="oklch(0.65 0.05 145)"
          isEmpty={false}
        />
      )}

      {/* Connector: Compound → Basic */}
      {(hasWonder || hasCompound) && hasBasic && (
        <LayerConnector locale={locale} />
      )}

      {/* Layer 3: Basic Buildings */}
      {hasBasic && (
        <TechTreeLayer
          nodes={layers.basic}
          label={layerLabel("basic")}
          icon={layerIcon("basic")}
          locale={locale}
          accentColor="oklch(0.55 0.08 160)"
          isEmpty={false}
        />
      )}
    </div>
  );
}

// ── Layer Connector ──

function LayerConnector({ locale }: { locale: string }) {
  return (
    <div className="flex items-center justify-center gap-4 py-2">
      <div className="flex-1 max-w-[150px] h-[3px] bg-gradient-to-r from-transparent via-[oklch(0.7_0.12_85_/_0.35)] to-[oklch(0.7_0.12_85_/_0.5)] border-t border-b border-[oklch(0.7_0.12_85_/_0.2)] animate-route-flow" />
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[oklch(0.95_0.005_90)] border border-[oklch(0.7_0.12_85_/_0.3)] shadow-sm text-xs font-bold text-[oklch(0.4_0.03_80)] font-civ-serif">
        <span>{locale === "en" ? "requires" : "必须前提"}</span>
        <QuestScrollIcon name="arrow-right" size={14} className="animate-gentle-float inline-block" />
        <span>{locale === "en" ? "unlocks" : "方可开拓"}</span>
      </div>
      <div className="flex-1 max-w-[150px] h-[3px] bg-gradient-to-r from-[oklch(0.7_0.12_85_/_0.5)] via-[oklch(0.7_0.12_85_/_0.35)] to-transparent border-t border-b border-[oklch(0.7_0.12_85_/_0.2)] animate-route-flow" />
    </div>
  );
}

// ── Tech Tree Layer ──

function TechTreeLayer({
  nodes,
  label,
  icon,
  locale,
  accentColor,
}: {
  nodes: TechTreeNode[];
  label: string;
  icon: ScrollIconName;
  locale: string;
  accentColor: string;
  isEmpty: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* Layer header */}
      <div className="flex items-center justify-center gap-2">
        <QuestScrollIcon name={icon} size={18} />
        <h4
          className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full font-civ-serif"
          style={{
            background: `${accentColor} / 0.1`,
            color: accentColor,
            border: `1px solid ${accentColor} / 0.25`,
          }}
        >
          {label}
        </h4>
      </div>

      {/* Building cards grid — auto-wrap, never overflow */}
      <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
        {nodes.map((node) => (
          <TechTreeNodeCard
            key={node.id}
            node={node}
            locale={locale}
            accentColor={accentColor}
          />
        ))}
      </div>
    </div>
  );
}

// ── Individual Tech Tree Node Card ──

function TechTreeNodeCard({
  node,
  locale,
  accentColor,
}: {
  node: TechTreeNode;
  locale: string;
  accentColor: string;
}) {
  const name =
    locale === "en" && node.name_en ? node.name_en : node.name;
  const levelLabel =
    locale === "en"
      ? LEVEL_LABELS[node.level]?.en ?? `Lv.${node.level}`
      : LEVEL_LABELS[node.level]?.zh ?? `Lv.${node.level}`;
  const isLocked = node.status === "LOCKED";

  // Prerequisite progress
  const prereqs = node.prereq_progress ?? [];
  const metCount = prereqs.filter((p) => p.met).length;
  const totalCount = prereqs.length;

  const cardBorderClass = () => {
    if (isLocked) {
      return "border-dashed border-2 border-[oklch(0.85_0.02_90)] bg-[oklch(0.97_0.003_90)]/40 opacity-50";
    }
    if (node.level >= 7) {
      // Wonder / Golden double border
      return "vintage-parchment-card border-2 border-double border-[oklch(0.7_0.12_85)] animate-pedestal-glow shadow-md hover:shadow-lg hover:-translate-y-0.5";
    }
    if (node.node_type === "compound") {
      // Compound / Silver-Sage border
      return "vintage-parchment-card border-2 border-[oklch(0.55_0.08_160_/_0.7)] shadow-sm hover:shadow-md hover:-translate-y-0.5";
    }
    // Basic / Bronze-Copper border
    return "vintage-parchment-card border border-[oklch(0.65_0.12_45_/_0.4)] shadow-sm hover:shadow-md hover:-translate-y-0.5";
  };

  return (
    <div
      className={`
        flex flex-col gap-2 p-4 rounded-xl transition-all duration-300 relative overflow-hidden
        ${cardBorderClass()}
      `}
    >
      {/* Icon + Name */}
      <div className="flex items-center gap-3">
        <VintageShieldIcon
          icon={node.icon}
          size="sm"
          tier={isLocked ? "sage" : node.level >= 7 ? "gold" : node.node_type === "compound" ? "silver" : "bronze"}
          className={isLocked ? "grayscale opacity-50" : ""}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold font-civ-serif text-[oklch(0.3_0.02_80)] truncate">
            {name}
          </p>
          <p
            className="text-[10px] font-mono font-bold"
            style={!isLocked ? { color: accentColor } : undefined}
          >
            {levelLabel}
          </p>
        </div>
        {!isLocked && node.node_type === "compound" && (
          <QuestScrollIcon name="star" size={14} className="shrink-0 text-yellow-500" />
        )}
      </div>

      {/* Required skills / prerequisites */}
      {prereqs.length > 0 && (
        <div className="space-y-1 pt-2 border-t border-[oklch(0.88_0.02_90)]">
          <p className="text-[10px] text-[oklch(0.5_0.02_85)] font-bold">
            {locale === "en" ? "Prerequisites:" : "开拓所需技术:"}
          </p>
          {prereqs.map((p) => (
            <div
              key={p.skill_name}
              className="flex items-center justify-between text-[10px]"
            >
              <span
                className={
                  p.met
                    ? "text-[oklch(0.55_0.08_160)] font-medium"
                    : "text-[oklch(0.5_0.02_85)]"
                }
              >
                {p.met ? <svg className="w-2.5 h-2.5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> : "○"} {p.skill_name}
              </span>
              <span
                className={`font-mono tabular-nums ${
                  p.met
                    ? "text-[oklch(0.55_0.08_160)] font-bold"
                    : "text-[oklch(0.5_0.02_85)]"
                }`}
              >
                {p.current_level}/{p.required_level}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Overall status */}
      {totalCount > 0 && (
        <div className="text-[10px] font-bold pt-1.5 border-t border-[oklch(0.88_0.02_90)]">
          {node.all_prereqs_met ? (
            <span className="text-[oklch(0.55_0.08_160)]">
              <svg className="w-2.5 h-2.5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>{" "}
              {locale === "en"
                ? "All prerequisites met"
                : "技术前提已就绪"}
            </span>
          ) : (
            <span className="text-[oklch(0.5_0.02_85)]">
              <QuestScrollIcon name="application" size={10} className="inline-block align-middle" /> {metCount}/{totalCount}{" "}
              {locale === "en" ? "prerequisites" : "项前提已满足"}
            </span>
          )}
        </div>
      )}

      {/* Region tag */}
      {node.region && (
        <div className="text-[9px] font-medium text-[oklch(0.5_0.02_85)] pt-1 border-t border-[oklch(0.88_0.02_90)]/50">
          <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="inline-block align-middle"><path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z" /><circle cx="12" cy="9" r="2.5" /></svg> {locale === "en" && node.region_en ? node.region_en : node.region}
        </div>
      )}
    </div>
  );
}
