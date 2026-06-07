"use client";

import { useLocale } from "@/hooks/useLocale";

export interface GrowthChainNode {
  label: string;
  icon?: string;
  /** Whether this node represents a building (different visual treatment) */
  isBuilding?: boolean;
  /** 0–100 progress within this node */
  progress?: number;
}

interface GrowthChainProps {
  nodes: GrowthChainNode[];
  className?: string;
}

/**
 * Visual growth chain — connected milestones showing the learning
 * progression from starting skill to target building.
 *
 * Renders nodes connected by lines, with the final node
 * (building) highlighted differently.
 */
export function GrowthChain({ nodes, className = "" }: GrowthChainProps) {
  const { locale } = useLocale();

  if (nodes.length === 0) return null;

  return (
    <div className={`${className}`}>
      <h4 className="text-xs font-semibold text-muted-foreground mb-3">
        {locale === "zh" ? "🛤️ 成长链路" : "🛤️ Growth Chain"}
      </h4>

      <div className="flex items-center flex-wrap gap-0">
        {nodes.map((node, i) => {
          const isLast = i === nodes.length - 1;
          const isBuilding = node.isBuilding ?? false;

          return (
            <div key={i} className="flex items-center">
              {/* Node circle + label */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`relative flex items-center justify-center rounded-full transition-all ${
                    isBuilding
                      ? "h-10 w-10 bg-[#C4A77D]/15 border-2 border-[#C4A77D]/40"
                      : "h-8 w-8 bg-[#8B9D83]/10 border border-[#8B9D83]/30"
                  }`}
                >
                  {isBuilding ? (
                    <span className="text-base">{node.icon || "🏛️"}</span>
                  ) : (
                    <span className="text-[10px] font-bold text-[#8B9D83] tabular-nums">
                      {i + 1}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] max-w-[4.5rem] text-center leading-tight truncate ${
                    isBuilding
                      ? "font-semibold text-[#C4A77D]"
                      : "text-muted-foreground"
                  }`}
                  title={node.label}
                >
                  {node.label}
                </span>
              </div>

              {/* Connecting line */}
              {!isLast && (
                <div className="flex items-center px-1 -mt-4">
                  <div className="h-0.5 w-6 sm:w-10 bg-[#8B9D83]/30 rounded-full relative">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rotate-45 border-t border-r border-[#8B9D83]/40" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
