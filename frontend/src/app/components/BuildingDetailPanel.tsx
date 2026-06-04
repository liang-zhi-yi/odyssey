"use client";

import useSWR from "swr";
import { worldService } from "@/services/world.service";
import { useLocale } from "@/hooks/useLocale";
import { LEVEL_LABELS } from "@/types/world";
import { RANK_LABELS } from "@/types/skill";
import type { UserBuilding, UserCompoundBuilding, BuildingTemplate, BuildingDetail, CompoundBuildingDetail } from "@/types/world";

interface BuildingDetailPanelProps {
  building: UserBuilding | UserCompoundBuilding;
  onClose: () => void;
}

export function BuildingDetailPanel({ building, onClose }: BuildingDetailPanelProps) {
  const { t, locale } = useLocale();
  const isCompound = building.building_type === "compound";

  // Fetch regular building detail
  const { data: regularDetail, isLoading: regularLoading } = useSWR(
    !isCompound ? `building-detail-${building.id}` : null,
    () => worldService.getBuilding(building.id)
  );

  // Fetch compound building detail
  const { data: compoundDetail, isLoading: compoundLoading } = useSWR(
    isCompound ? `compound-detail-${building.id}` : null,
    () => worldService.getCompoundBuilding(building.id)
  );

  const detail = isCompound ? compoundDetail : regularDetail;
  const isLoading = isCompound ? compoundLoading : regularLoading;

  const tpl = building.template;
  const displayName =
    locale === "en" && tpl?.name_en ? tpl.name_en : tpl?.name ?? "";
  const levelLabel =
    locale === "en"
      ? LEVEL_LABELS[building.level]?.en ?? `Lv.${building.level}`
      : LEVEL_LABELS[building.level]?.zh ?? `Lv.${building.level}`;
  const isLocked = building.status === "LOCKED";

  return (
    <div className="rounded-xl border border-border bg-background p-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{tpl?.icon ?? "🏛️"}</span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-foreground">
                {displayName}
              </h3>
              {isCompound && (
                <span className="text-xs rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 font-medium">
                  {t("world.compoundBuilding")}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {levelLabel} · {t("world.status." + building.status)}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* Regular building detail */}
      {detail && !isCompound && !isLoading && (
        <RegularDetail
          detail={detail as BuildingDetail}
          tpl={tpl as BuildingTemplate | null}
          isLocked={isLocked}
          t={t}
          locale={locale}
        />
      )}

      {/* Compound building detail */}
      {detail && isCompound && !isLoading && (
        <CompoundDetail
          detail={detail as CompoundBuildingDetail}
          isLocked={isLocked}
          t={t}
          locale={locale}
        />
      )}
    </div>
  );
}

function RegularDetail({
  detail,
  tpl,
  isLocked,
  t,
  locale,
}: {
  detail: BuildingDetail;
  tpl: BuildingTemplate | null;
  isLocked: boolean;
  t: (key: string, vars?: Record<string, string>) => string;
  locale: string;
}) {
  return (
    <div className="space-y-4">
      {!isLocked && detail.skill_scores && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium text-foreground">
              {t("world.upgradePath")}
            </span>
            {detail.next_level_at > 100 ? (
              <span className="text-xs text-success font-medium">
                {t("world.maxLevelReached")}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                {t("world.scoreToNext", {
                  score: String(detail.next_level_at - detail.skill_scores.overall),
                })}
              </span>
            )}
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{
                width: `${Math.min(100, detail.next_level_at > 100 ? 100 : (detail.skill_scores.overall / detail.next_level_at) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {detail.skill_scores && (
        <div className="grid grid-cols-2 gap-2">
          <ScoreBadge label={t("skills.dimensions.knowledge")} value={detail.skill_scores.knowledge} />
          <ScoreBadge label={t("skills.dimensions.reasoning")} value={detail.skill_scores.reasoning} />
          <ScoreBadge label={t("skills.dimensions.application")} value={detail.skill_scores.application} />
          <ScoreBadge label={t("skills.dimensions.creation")} value={detail.skill_scores.creation} />
        </div>
      )}

      {detail.skill_scores && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{detail.skill_scores.overall}</div>
            <div className="text-xs text-muted-foreground">{t("skills.overall")}</div>
          </div>
          <div className="flex-1 text-center">
            <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
              {locale === "en"
                ? detail.skill_scores.rank
                : RANK_LABELS[detail.skill_scores.rank as keyof typeof RANK_LABELS] ?? detail.skill_scores.rank}
            </span>
          </div>
        </div>
      )}

      {/* View skill link — only for regular buildings */}
      {tpl?.skill_id && (
        <a
          href={`/skills/${tpl.skill_id}`}
          className="block w-full rounded-lg bg-primary px-4 py-2 text-center text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          {t("world.viewSkill")}
        </a>
      )}
    </div>
  );
}

function CompoundDetail({
  detail,
  isLocked,
  t,
  locale,
}: {
  detail: CompoundBuildingDetail;
  isLocked: boolean;
  t: (key: string, vars?: Record<string, string>) => string;
  locale: string;
}) {
  return (
    <div className="space-y-4">
      {!isLocked && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium text-foreground">
            {t("world.compoundLevel")}
          </span>
        </div>
      )}

      {/* Source skill scores */}
      {detail.source_skill_scores && detail.source_skill_scores.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {t("world.sourceSkillScores")}
          </h4>
          <div className="space-y-2">
            {detail.source_skill_scores.map((src) => (
              <div
                key={src.skill_name}
                className="rounded-lg bg-secondary/30 p-3 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {src.skill_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t("world.prerequisites")}: Lv.{src.min_level}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  <MiniScore label="K" value={src.knowledge} />
                  <MiniScore label="R" value={src.reasoning} />
                  <MiniScore label="A" value={src.application} />
                  <MiniScore label="C" value={src.creation} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold text-foreground">
                    {src.overall}
                  </div>
                  <span className="text-xs rounded-full bg-primary/10 px-2 py-0.5 text-primary font-medium">
                    {locale === "en"
                      ? src.rank
                      : RANK_LABELS[src.rank as keyof typeof RANK_LABELS] ?? src.rank}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

function MiniScore({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center rounded bg-background px-1 py-0.5">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-xs font-semibold text-foreground">{value}</div>
    </div>
  );
}
