"use client";

import { useState, useEffect, useCallback } from "react";
import useSWR, { mutate } from "swr";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { pathService } from "@/services/path.service";
import { Loading } from "@/app/components/Loading";
import { ErrorState } from "@/app/components/ErrorState";
import { EmptyState } from "@/app/components/EmptyState";
import { ApiRequestError } from "@/lib/api";
import type { GrowthPath, UserPath } from "@/types/path";

export default function PathsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, locale } = useLocale();
  const router = useRouter();
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [selectError, setSelectError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch current active path
  const {
    data: currentPath,
    isLoading: currentLoading,
    error: currentError,
  } = useSWR(isAuthenticated ? "current-path" : null, () =>
    pathService.getCurrentPath().catch(() => null)
  );

  // Fetch all available paths
  const {
    data: paths = [],
    isLoading: pathsLoading,
    error: pathsError,
  } = useSWR(isAuthenticated ? "paths" : null, () =>
    pathService.listPaths()
  );

  const handleSelect = useCallback(
    async (pathId: string) => {
      setSelectingId(pathId);
      setSelectError(null);
      try {
        await pathService.selectPath({ path_id: pathId });
        await mutate("current-path");
      } catch (err) {
        const message =
          err instanceof ApiRequestError
            ? err.message
            : t("paths.selectError");
        setSelectError(message);
      } finally {
        setSelectingId(null);
      }
    },
    [t]
  );

  if (authLoading || !isAuthenticated) {
    return <Loading text={t("auth.validating")} />;
  }

  const difficultyLabel = (level: number) => {
    if (level <= 2) return { text: t("paths.difficultyLevels.beginner"), color: "bg-success/10 text-success" };
    if (level <= 4) return { text: t("paths.difficultyLevels.intermediate"), color: "bg-warning/10 text-warning" };
    return { text: t("paths.difficultyLevels.advanced"), color: "bg-destructive/10 text-destructive" };
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold">{t("paths.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("paths.subtitle")}
        </p>
      </div>

      {/* Current active path */}
      <section>
        <h2 className="text-lg font-semibold mb-3">{t("paths.currentPath")}</h2>
        {currentLoading ? (
          <div className="rounded-xl border border-border bg-background p-6 skeleton-shimmer" style={{ height: "100px" }} />
        ) : currentError ? (
          <ErrorState message={t("paths.loadPathStatusError")} />
        ) : currentPath ? (
          <CurrentPathCard path={currentPath} />
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-secondary/30 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t("paths.noPathSelectedDesc")}
            </p>
          </div>
        )}
      </section>

      {/* Available paths */}
      <section>
        <h2 className="text-lg font-semibold mb-3">{t("paths.availablePaths")}</h2>
        {selectError && (
          <div className="mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {selectError}
          </div>
        )}
        {pathsLoading ? (
          <Loading variant="skeleton-cards" cardCount={4} />
        ) : pathsError ? (
          <ErrorState message={t("paths.loadPathListError")} />
        ) : paths.length === 0 ? (
          <EmptyState title={t("paths.noAvailablePaths")} description={t("paths.comingSoonPaths")} />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 animate-stagger">
            {paths.map((p: GrowthPath) => {
              const isActive = currentPath?.path_id === p.id;
              const diff = difficultyLabel(p.difficulty);
              return (
                <div
                  key={p.id}
                  className={`rounded-xl border p-5 transition-all card-hover ${
                    isActive
                      ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                      : "border-border bg-background"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="font-semibold text-sm">
                      {locale === "en" && p.name_en ? p.name_en : p.name}
                    </h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {p.is_official && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          {t("paths.official")}
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${diff.color}`}
                      >
                        {diff.text}
                      </span>
                    </div>
                  </div>

                  {p.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                      {locale === "en" && p.description_en
                        ? p.description_en
                        : p.description}
                    </p>
                  )}

                  {isActive ? (
                    <div className="rounded-lg bg-success/10 px-3 py-2 text-xs font-medium text-success text-center">
                      ✅ {t("paths.currentPath")}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSelect(p.id)}
                      disabled={selectingId === p.id}
                      className="w-full rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
                    >
                      {selectingId === p.id ? t("paths.selecting") : t("paths.select")}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

/** Card displaying the currently active path with progress bar */
function CurrentPathCard({ path }: { path: UserPath }) {
  const { t, locale } = useLocale();
  const displayName =
    locale === "en" && path.name_en ? path.name_en : path.name;
  const progressPct = Math.min(100, Math.max(0, Math.round(path.progress * 100)));
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{displayName}</h3>
        <span className="text-sm font-bold text-primary tabular-nums">
          {progressPct}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  );
}
