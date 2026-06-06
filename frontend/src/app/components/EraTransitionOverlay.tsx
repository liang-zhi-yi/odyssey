"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/hooks/useLocale";
import { ERA_LABELS, type CivilizationEra } from "@/types/world";

interface EraTransitionOverlayProps {
  /** Previous era (may be undefined if first transition) */
  fromEra?: string;
  /** New era key */
  toEra: string;
  /** New era display name */
  toEraName: string;
  /** New era icon */
  toEraIcon: string;
  /** Called when the overlay animation completes */
  onComplete: () => void;
}

const STAGES = ["reveal", "celebrate", "fade"] as const;
type Stage = (typeof STAGES)[number];

/**
 * Full-screen overlay shown when the user's civilization advances to a new era.
 *
 * Three-stage animation:
 * 1. Reveal — old era fades out, new era icon scales in
 * 2. Celebrate — sparkle burst + warm gold glow
 * 3. Fade — overlay dissolves, revealing the upgraded world
 */
export function EraTransitionOverlay({
  fromEra,
  toEra,
  toEraName,
  toEraIcon,
  onComplete,
}: EraTransitionOverlayProps) {
  const { locale } = useLocale();
  const [stage, setStage] = useState<Stage>("reveal");

  const fromLabel = fromEra
    ? ERA_LABELS[fromEra as CivilizationEra]?.[locale === "en" ? "en" : "zh"] ?? fromEra
    : null;

  const toLabel =
    ERA_LABELS[toEra as CivilizationEra]?.[locale === "en" ? "en" : "zh"] ?? toEraName;

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Stage 1→2: reveal completes, start celebration
    timers.push(
      setTimeout(() => setStage("celebrate"), 1200)
    );

    // Stage 2→3: celebration completes, start fade
    timers.push(
      setTimeout(() => setStage("fade"), 2800)
    );

    // Stage 3→done: overlay removed
    timers.push(
      setTimeout(() => onComplete(), 3800)
    );

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-700 ${
        stage === "fade" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{
        background: "radial-gradient(ellipse at center, oklch(0.15 0.02 85) 0%, oklch(0.08 0.01 80) 100%)",
      }}
    >
      {/* Background particle field */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-[oklch(0.72_0.12_85_/_0.3)]"
            style={{
              width: `${4 + Math.random() * 8}px`,
              height: `${4 + Math.random() * 8}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `gentle-float ${3 + Math.random() * 4}s ease-in-out ${Math.random() * 2}s infinite`,
              opacity: stage === "celebrate" ? 0.8 : 0.3,
              transition: "opacity 1s ease",
            }}
          />
        ))}
      </div>

      {/* Central content */}
      <div className="relative z-10 flex flex-col items-center gap-6 text-center px-6">
        {/* Old era → New era transition */}
        {fromLabel && (
          <div
            className={`text-lg font-medium text-[oklch(0.6_0.02_85)] transition-all duration-700 ${
              stage === "reveal"
                ? "opacity-80 translate-y-0"
                : "opacity-0 -translate-y-4"
            }`}
          >
            {fromLabel}
          </div>
        )}

        {/* Arrow bridge */}
        {fromLabel && (
          <div
            className={`text-3xl text-[oklch(0.72_0.12_85)] transition-all duration-500 ${
              stage === "reveal" ? "opacity-60" : "opacity-0 scale-150"
            }`}
          >
            ↓
          </div>
        )}

        {/* New era icon — scales in heroically */}
        <div
          className={`transition-all duration-1000 ease-out ${
            stage === "reveal"
              ? "scale-0 opacity-0"
              : stage === "celebrate"
              ? "scale-100 opacity-100"
              : "scale-110 opacity-0"
          }`}
        >
          <span className="text-8xl drop-shadow-[0_0_40px_oklch(0.72_0.12_85_/_0.5)]">
            {toEraIcon || "🌟"}
          </span>
        </div>

        {/* Era name */}
        <div
          className={`transition-all duration-700 delay-300 ${
            stage === "reveal"
              ? "opacity-0 translate-y-4"
              : stage === "celebrate"
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-4"
          }`}
        >
          <h2 className="text-3xl font-bold text-[oklch(0.9_0.02_95)] tracking-wide">
            {toLabel}
          </h2>
          <p className="mt-2 text-sm text-[oklch(0.65_0.03_90)]">
            {locale === "en" ? "Civilization Era Advanced!" : "文明时代进阶！"}
          </p>
        </div>

        {/* Celebration burst rings */}
        {stage === "celebrate" && (
          <>
            <div
              className="absolute w-64 h-64 rounded-full border border-[oklch(0.72_0.12_85_/_0.3)] pointer-events-none"
              style={{
                animation: "celebration-burst 1.2s ease-out forwards",
              }}
            />
            <div
              className="absolute w-48 h-48 rounded-full border border-[oklch(0.65_0.05_145_/_0.2)] pointer-events-none"
              style={{
                animation: "celebration-burst 1.2s ease-out 0.2s forwards",
              }}
            />
            <div
              className="absolute w-32 h-32 rounded-full border border-[oklch(0.72_0.12_85_/_0.2)] pointer-events-none"
              style={{
                animation: "celebration-burst 1.2s ease-out 0.4s forwards",
              }}
            />
          </>
        )}

        {/* Sparkle burst particles */}
        {stage === "celebrate" &&
          Array.from({ length: 12 }).map((_, i) => {
            const angle = (i / 12) * 360;
            const rad = (angle * Math.PI) / 180;
            const dist = 80 + Math.random() * 40;
            return (
              <div
                key={`sparkle-${i}`}
                className="absolute w-1.5 h-1.5 rounded-full bg-[oklch(0.85_0.1_90)] pointer-events-none"
                style={{
                  left: `calc(50% + ${Math.cos(rad) * dist}px)`,
                  top: `calc(50% + ${Math.sin(rad) * dist}px)`,
                  animation: `celebration-burst 0.8s ease-out ${Math.random() * 0.4}s forwards`,
                }}
              />
            );
          })}

        {/* Skip hint */}
        {stage === "celebrate" && (
          <button
            onClick={onComplete}
            className="mt-8 text-xs text-[oklch(0.55_0.02_85)] hover:text-[oklch(0.7_0.03_90)] transition-colors animate-fade-in"
          >
            {locale === "en" ? "Click to continue" : "点击继续"} →
          </button>
        )}
      </div>
    </div>
  );
}
