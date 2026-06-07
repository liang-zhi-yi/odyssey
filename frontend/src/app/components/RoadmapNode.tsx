"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/hooks/useLocale";
import type { MilestoneNode } from "@/types/learningPath";

interface RoadmapNodeProps {
  node: MilestoneNode;
  isLast: boolean;
  pathId: string;
}

/**
 * A single node in the civilization development roadmap.
 * Shows node name, estimated time, completion status, associated building.
 * Click to expand milestone details (checkpoints).
 */
export function RoadmapNode({ node, isLast, pathId }: RoadmapNodeProps) {
  const { locale } = useLocale();
  const [expanded, setExpanded] = useState(node.status === "ACTIVE");

  const displayTitle =
    locale === "en" && node.title_en ? node.title_en : node.title;

  const buildingName =
    locale === "en" && node.associated_building?.name_en
      ? node.associated_building.name_en
      : node.associated_building?.name;

  // Status-based colors
  const statusStyles = {
    COMPLETED: {
      ring: "border-[#C4A77D] bg-[#C4A77D]/10",
      dot: "bg-[#C4A77D]",
      text: "text-[#8B7355]",
      badge: "bg-[#C4A77D]/15 text-[#8B7355]",
    },
    ACTIVE: {
      ring: "border-[#8B9D83] bg-[#8B9D83]/10",
      dot: "bg-[#8B9D83] animate-warm-pulse",
      text: "text-[#5C7A5C]",
      badge: "bg-[#8B9D83]/15 text-[#5C7A5C]",
    },
    LOCKED: {
      ring: "border-[#D4C9BE] bg-[#FAF7F2]/50",
      dot: "bg-[#D4C9BE]",
      text: "text-muted-foreground",
      badge: "bg-muted text-muted-foreground",
    },
  };

  const s = statusStyles[node.status];

  return (
    <div className="relative flex gap-4">
      {/* Timeline column */}
      <div className="flex flex-col items-center">
        {/* Node circle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 ${s.ring} transition-all duration-300 hover:scale-110`}
        >
          <span className={`h-3 w-3 rounded-full ${s.dot}`} />
        </button>
        {/* Connector line */}
        {!isLast && (
          <div
            className={`w-0.5 flex-1 min-h-[2rem] ${
              node.status === "COMPLETED" ? "bg-[#C4A77D]/40" : "bg-[#D4C9BE]/40"
            }`}
          />
        )}
      </div>

      {/* Content column */}
      <div className={`flex-1 pb-6 ${!isLast ? "" : ""}`}>
        <div
          className={`rounded-2xl border border-border bg-card p-4 shadow-card transition-all duration-300 ${
            node.status === "ACTIVE" ? "ring-1 ring-[#8B9D83]/20" : ""
          }`}
        >
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4
                className={`font-semibold text-sm truncate cursor-pointer hover:underline ${s.text}`}
                onClick={() => setExpanded(!expanded)}
              >
                {displayTitle}
              </h4>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {/* Status badge */}
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${s.badge}`}>
                  {node.status === "COMPLETED"
                    ? locale === "zh" ? "已完成" : "Done"
                    : node.status === "ACTIVE"
                    ? locale === "zh" ? "进行中" : "Active"
                    : locale === "zh" ? "锁定" : "Locked"}
                </span>
                {/* Est. time */}
                <span className="text-[10px] text-muted-foreground">
                  ~{node.estimated_hours}h
                </span>
                {/* Building */}
                {buildingName && (
                  <Link
                    href={`/world?building=${node.associated_building?.id}`}
                    className="inline-flex items-center gap-1 rounded bg-secondary/60 px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span>{node.associated_building?.icon || "🏛️"}</span>
                    <span className="truncate max-w-[6rem]">{buildingName}</span>
                  </Link>
                )}
              </div>
            </div>
            {/* Progress */}
            <span className={`text-sm font-bold tabular-nums ${s.text}`}>
              {node.progress_pct}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                node.status === "COMPLETED" ? "bg-[#C4A77D]" : "bg-[#8B9D83]"
              }`}
              style={{ width: `${node.progress_pct}%` }}
            />
          </div>

          {/* Expanded: Checkpoints */}
          {expanded && node.checkpoints && node.checkpoints.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border space-y-2 animate-fade-in-up">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                {locale === "zh" ? "检查点" : "Checkpoints"}
              </p>
              {node.checkpoints.map((cp) => (
                <div
                  key={cp.id}
                  className="flex items-center gap-2 rounded-lg bg-secondary/30 px-3 py-2"
                >
                  {cp.is_completed ? (
                    <span className="flex-shrink-0 w-4 h-4 rounded-full bg-[#8B9D83] flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  ) : (
                    <span className="flex-shrink-0 w-4 h-4 rounded-full border-2 border-[#D4C9BE]" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      {locale === "en" && cp.title_en ? cp.title_en : cp.title}
                    </p>
                    {cp.description && (
                      <p className="text-[10px] text-muted-foreground line-clamp-1">
                        {locale === "en" && cp.description_en
                          ? cp.description_en
                          : cp.description}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    ≥{cp.required_score}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Expanded: No checkpoints */}
          {expanded && (!node.checkpoints || node.checkpoints.length === 0) && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground italic">
                {locale === "zh" ? "暂无检查点" : "No checkpoints yet"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
