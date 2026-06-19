import Link from "next/link";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-[oklch(0.8_0.05_85_/_0.7)] dark:border-[oklch(0.3_0.02_80_/_0.7)] rounded-2xl bg-gradient-to-br from-[oklch(0.99_0.003_95)] to-[oklch(0.975_0.005_92)] dark:from-[oklch(0.22_0.008_85)] dark:to-[oklch(0.2_0.006_85)] px-6 shadow-inner relative overflow-hidden">
      {/* Rhumb line compass watermark in background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none flex items-center justify-center">
        <svg className="w-64 h-64 animate-rhumb-spin" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.5">
          <circle cx="50" cy="50" r="45" />
          <circle cx="50" cy="50" r="40" />
          <path d="M50 5 L50 95 M5 50 L95 50 M18.2 18.2 L81.8 81.8 M18.2 81.8 L81.8 18.2" />
        </svg>
      </div>

      <div className="mb-4 flex items-center justify-center w-14 h-14 rounded-full bg-secondary/80 border border-border/40 text-2xl relative z-10 shadow-sm">
        🗺️
      </div>
      <h3 className="text-base font-bold font-civ-serif text-[oklch(0.3_0.02_80)] dark:text-[oklch(0.85_0.04_80)] relative z-10">{title}</h3>
      <p className="mt-2 text-xs text-muted-foreground italic max-w-xs leading-relaxed relative z-10">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-5 rounded-lg bg-primary/95 text-primary-foreground border border-primary/20 px-5 py-2 text-xs font-bold font-civ-serif tracking-wide hover:bg-primary transition-all relative z-10 shadow-sm"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
