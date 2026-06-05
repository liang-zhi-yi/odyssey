"use client";

interface StarRatingProps {
  /** Difficulty level (1-4) */
  level: number;
  maxLevel?: number;
  size?: "sm" | "md";
}

/**
 * Star rating display for quest difficulty.
 * Filled stars for the difficulty level, outline for remaining.
 */
export function StarRating({ level, maxLevel = 4, size = "sm" }: StarRatingProps) {
  const px = size === "md" ? 16 : 12;

  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Difficulty: ${level}/${maxLevel}`}>
      {Array.from({ length: maxLevel }, (_, i) => (
        <svg
          key={i}
          width={px}
          height={px}
          viewBox="0 0 20 20"
          fill={i < level ? "oklch(0.7 0.12 85)" : "none"}
          stroke={i < level ? "oklch(0.7 0.12 85)" : "oklch(0.85 0.005 90)"}
          strokeWidth={1.5}
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

/** Map difficulty string ("LEVEL_1" → "LEVEL_4") to numeric level. */
export function difficultyToLevel(difficulty?: string): number {
  if (!difficulty) return 1;
  const match = difficulty.match(/LEVEL_(\d)/);
  return match ? parseInt(match[1], 10) : 1;
}
