"use client";

import { useLocale } from "@/hooks/useLocale";

interface LoadingProps {
  text?: string;
  variant?: "spinner" | "skeleton-cards";
  cardCount?: number;
}

export function Loading({
  text,
  variant = "spinner",
  cardCount = 3,
}: LoadingProps) {
  const { t } = useLocale();
  const displayText = text || t("common.loading");
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
