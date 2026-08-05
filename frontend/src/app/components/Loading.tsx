"use client";

import { useLocale } from "@/hooks/useLocale";

interface LoadingProps {
  text?: string;
  variant?: "spinner" | "skeleton-cards" | "skeleton-list";
  cardCount?: number;
}

export function Loading({
  text,
  variant = "spinner",
  cardCount = 3,
}: LoadingProps) {
  const { t } = useLocale();
  const displayText = text || t("common.loading");
  if (variant === "skeleton-list") {
    return (
      <div className="space-y-6">
        {Array.from({ length: cardCount }, (_, i) => (
          <div key={i} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="h-9 w-9 rounded-full border border-border bg-muted/60 skeleton-shimmer" />
              <div className="w-px flex-1 min-h-[2.5rem] bg-muted/50" />
            </div>
            <div className="flex-1 border-l border-border/60 pl-4 min-w-0">
              <div className="h-4 w-2/5 rounded-md bg-muted/70 skeleton-shimmer" />
              <div className="mt-2 h-3 w-3/4 rounded-md bg-muted/60 skeleton-shimmer" />
              <div className="mt-4 h-px w-full bg-muted/40" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (variant === "skeleton-cards") {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cardCount }, (_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-background p-4 skeleton-shimmer"
            style={{ height: "140px" }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="text-sm text-muted-foreground">{displayText}</p>
    </div>
  );
}
