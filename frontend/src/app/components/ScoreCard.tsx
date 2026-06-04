"use client";

import { DIMENSION_LABELS, DIMENSION_WEIGHTS, type DimensionScores } from "@/types/assessment";
import { useLocale } from "@/hooks/useLocale";
import { RadarChart } from "./RadarChart";

interface ScoreCardProps {
  title: string;
  overall: number;
  scores: DimensionScores;
  rank?: string;
  size?: number;
}

const DIMENSIONS: (keyof DimensionScores)[] = [
  "knowledge",
  "reasoning",
  "application",
  "creation",
];

/**
 * Compact score card showing overall score, radar chart, and dimension breakdown.
 */
export function ScoreCard({ title, overall, scores, rank, size = 160 }: ScoreCardProps) {
  const { t } = useLocale();

  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-sm truncate">{title}</h4>
        {rank && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {t(`skills.rank.${rank}`) || rank}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Radar */}
        <div className="shrink-0">
          <RadarChart scores={scores} size={size} showLabels={false} />
        </div>

        {/* Dimension bars */}
        <div className="flex-1 space-y-1.5 min-w-0">
          {DIMENSIONS.map((dim) => (
            <div key={dim} className="flex items-center gap-1.5 text-xs">
              <span
                className="w-[4.5rem] shrink-0 text-muted-foreground truncate"
                title={t(`skills.dimensions.${dim}`) || DIMENSION_LABELS[dim]}
              >
                {t(`skills.dimensions.${dim}`) || DIMENSION_LABELS[dim]}
              </span>
              <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${scores[dim]}%` }}
                />
              </div>
              <span className="w-7 text-right font-mono text-muted-foreground tabular-nums">
                {scores[dim]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Overall */}
      <div className="mt-3 flex items-center justify-between border-t border-border pt-2">
        <span className="text-xs text-muted-foreground">{t("assessment.overall")}</span>
        <span className="text-lg font-bold text-primary tabular-nums">{overall}</span>
      </div>
    </div>
  );
}
