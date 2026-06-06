"use client";

import useSWR from "swr";
import { useMemo } from "react";
import { worldService } from "@/services/world.service";
import { LEVEL_LABELS } from "@/types/world";
import type { TechTreeNode, TechTreeData } from "@/types/world";
import { useLocale } from "@/hooks/useLocale";

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
        <span className="text-4xl block mb-3">🌳</span>
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

  const layerIcon = (key: string): string => {
    switch (key) {
      case "wonder": return "🏛️";
      case "compound": return "⭐";
      case "basic": return "🏗️";
      default: return "📦";
    }
  };

  return (
    <div className="space-y-10 py-4">
      {/* Header */}
      <div className="text-center space-y-1">
        <h3 className="text-lg font-bold text-[oklch(0.3_0.02_80)]">
          🌳 {locale === "en" ? "Building Tech Tree" : "建筑科技树"}
        </h3>
        <p className="text-xs text-[oklch(0.55_0.02_85)]">
          {locale === "en"
            ? "How buildings connect and unlock"
            : "建筑的解锁关系与连接"}
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
    <div className="flex items-center justify-center gap-3">
      <div className="flex-1 max-w-[120px] border-t border-dashed border-[oklch(0.75_0.02_90)]" />
      <span className="text-sm text-[oklch(0.55_0.02_85)]">
        {locale === "en" ? "requires" : "需要"}
      </span>
      <span className="text-lg">↓</span>
      <span className="text-sm text-[oklch(0.55_0.02_85)]">
        {locale === "en" ? "unlocks" : "解锁"}
      </span>
      <div className="flex-1 max-w-[120px] border-t border-dashed border-[oklch(0.75_0.02_90)]" />
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
  icon: string;
  locale: string;
  accentColor: string;
  isEmpty: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* Layer header */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-lg">{icon}</span>
        <h4
          className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full"
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

  return (
    <div
      className={`
        flex flex-col gap-2 p-4 rounded-xl border-2 transition-all
        ${isLocked
          ? "border-dashed border-[oklch(0.85_0.02_90)] bg-[oklch(0.97_0.003_90)]/50 opacity-60"
          : "bg-[oklch(0.98_0.005_90)] shadow-card hover:shadow-md"
        }
      `}
      style={
        !isLocked
          ? { borderColor: `${accentColor} / 0.35` }
          : undefined
      }
    >
      {/* Icon + Name */}
      <div className="flex items-center gap-3">
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${
            isLocked ? "grayscale opacity-50" : ""
          }`}
          style={{ background: `${accentColor} / 0.12` }}
        >
          <span className="text-xl">{node.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[oklch(0.3_0.02_80)] truncate">
            {name}
          </p>
          <p
            className="text-[10px] font-medium"
            style={{ color: accentColor }}
          >
            {levelLabel}
          </p>
        </div>
        {!isLocked && node.node_type === "compound" && (
          <span className="text-yellow-500 text-sm shrink-0">⭐</span>
        )}
      </div>

      {/* Required skills / prerequisites */}
      {prereqs.length > 0 && (
        <div className="space-y-1 pt-2 border-t border-[oklch(0.88_0.02_90)]">
          <p className="text-[10px] text-[oklch(0.5_0.02_85)] font-medium">
            {locale === "en" ? "Requires:" : "需要技能:"}
          </p>
          {prereqs.map((p) => (
            <div
              key={p.skill_name}
              className="flex items-center justify-between text-[10px]"
            >
              <span
                className={
                  p.met
                    ? "text-[oklch(0.55_0.08_160)]"
                    : "text-[oklch(0.5_0.02_85)]"
                }
              >
                {p.met ? "✓" : "○"} {p.skill_name}
              </span>
              <span
                className={`font-mono tabular-nums ${
                  p.met
                    ? "text-[oklch(0.55_0.08_160)]"
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
        <div className="text-[10px] font-medium pt-1 border-t border-[oklch(0.88_0.02_90)]">
          {node.all_prereqs_met ? (
            <span className="text-[oklch(0.55_0.08_160)]">
              ✓{" "}
              {locale === "en"
                ? "All prerequisites met"
                : "全部前提已满足"}
            </span>
          ) : (
            <span className="text-[oklch(0.5_0.02_85)]">
              {metCount}/{totalCount}{" "}
              {locale === "en" ? "prerequisites" : "前提已就绪"}
            </span>
          )}
        </div>
      )}

      {/* Region tag */}
      {node.region && (
        <div className="text-[10px] text-[oklch(0.5_0.02_85)] pt-1 border-t border-[oklch(0.88_0.02_90)]">
          {locale === "en" && node.region_en ? node.region_en : node.region}
        </div>
      )}
    </div>
  );
}
