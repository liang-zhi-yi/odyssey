"use client";

import type { BadgeDefinition, UserBadge } from "@/types/badge";
import { useLocale } from "@/hooks/useLocale";

interface BadgeCardProps {
  badge: BadgeDefinition;
  userBadge?: UserBadge;
}

export function BadgeCard({ badge, userBadge }: BadgeCardProps) {
  const { t, locale } = useLocale();
  const earned = userBadge?.earned ?? false;
  const name = locale === "en" && badge.name_en ? badge.name_en : badge.name;
  const description =
    locale === "en" && badge.description_en
      ? badge.description_en
      : badge.description;

  return (
    <div
      className={`rounded-2xl border p-5 shadow-card transition-all duration-300 ${
        earned
          ? "border-success/30 bg-success/5"
          : "border-border bg-background opacity-60"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl flex-shrink-0" aria-hidden="true">
          {badge.icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm truncate">{name}</h3>
            {earned && (
              <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success flex-shrink-0">
                {t("badges.earned")}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {description}
            </p>
          )}

          {/* Progress bar for unearned badges with progress data */}
          {!earned &&
            userBadge?.progress_current != null &&
            userBadge?.progress_target != null && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>{t("badges.progress")}</span>
                  <span className="tabular-nums">
                    {userBadge.progress_current} / {userBadge.progress_target}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        (userBadge.progress_current / userBadge.progress_target) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}

          {/* Earned date */}
          {earned && userBadge?.earned_at && (
            <p className="text-xs text-muted-foreground mt-2">
              {new Date(userBadge.earned_at).toLocaleDateString(
                locale === "zh" ? "zh-CN" : "en-US"
              )}
            </p>
          )}
        </div>
      </div>

      {/* Category tag */}
      <div className="mt-3 flex items-center gap-2">
        <span className="rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
          {t(`badges.categories.${badge.category}` as any)}
        </span>
        {!earned && (
          <span className="text-xs text-muted-foreground">
            {t("badges.locked")}
          </span>
        )}
      </div>
    </div>
  );
}
