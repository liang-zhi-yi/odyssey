"use client";

import { type HTMLAttributes } from "react";

type Mood = "neutral" | "thinking" | "happy";
type Size = "sm" | "md" | "lg";

interface AgentAvatarProps extends HTMLAttributes<HTMLDivElement> {
  mood?: Mood;
  size?: Size;
}

const SIZE_MAP: Record<Size, number> = { sm: 28, md: 40, lg: 60 };

const MOOD_COLORS: Record<Mood, { face: string; glow: string }> = {
  neutral: {
    face: "var(--primary)",
    glow: "oklch(from var(--primary) l c h / 0.15)",
  },
  thinking: {
    face: "var(--warning)",
    glow: "oklch(from var(--warning) l c h / 0.2)",
  },
  happy: {
    face: "var(--success)",
    glow: "oklch(from var(--success) l c h / 0.15)",
  },
};

/**
 * SVG-based animated agent avatar.
 *
 * Simple geometric owl-like design with mood expression changes.
 * No external image dependency — works offline and in dark mode.
 */
export function AgentAvatar({
  mood = "neutral",
  size = "md",
  className = "",
  ...props
}: AgentAvatarProps) {
  const px = SIZE_MAP[size];
  const colors = MOOD_COLORS[mood];
  const isThinking = mood === "thinking";

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className} ${isThinking ? "animate-pulse" : ""}`}
      style={{ width: px, height: px }}
      aria-label={`Odyssey Agent — ${mood}`}
      role="img"
      {...props}
    >
      <svg
        width={px}
        height={px}
        viewBox="0 0 60 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Glow */}
        <circle
          cx="30"
          cy="30"
          r="28"
          fill={colors.glow}
          className={isThinking ? "animate-pulse" : ""}
        />

        {/* Body */}
        <circle
          cx="30"
          cy="32"
          r="22"
          fill={colors.face}
          opacity="0.2"
        />

        {/* Left eye */}
        <circle cx="22" cy="26" r="7" fill={colors.face} opacity="0.9" />
        <circle cx="22" cy="26" r="4" fill="var(--background)" />
        <circle cx="22" cy="26" r="2" fill={colors.face} />

        {/* Right eye */}
        <circle cx="38" cy="26" r="7" fill={colors.face} opacity="0.9" />
        <circle cx="38" cy="26" r="4" fill="var(--background)" />
        <circle cx="38" cy="26" r="2" fill={colors.face} />

        {/* Beak */}
        <polygon
          points="30,30 26,36 30,38 34,36"
          fill={colors.face}
          opacity="0.8"
        />

        {/* Smile (happy) or neutral line */}
        {mood === "happy" ? (
          <path
            d="M24 42 Q30 48 36 42"
            stroke={colors.face}
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            opacity="0.8"
          />
        ) : mood === "thinking" ? (
          <>
            <circle cx="18" cy="44" r="2" fill={colors.face} opacity="0.5" />
            <circle cx="24" cy="45" r="2" fill={colors.face} opacity="0.4" />
            <circle cx="30" cy="45" r="2" fill={colors.face} opacity="0.3" />
          </>
        ) : (
          <line
            x1="26"
            y1="42"
            x2="34"
            y2="42"
            stroke={colors.face}
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.6"
          />
        )}

        {/* Ear tufts */}
        <polygon
          points="15,12 12,3 20,10"
          fill={colors.face}
          opacity="0.5"
        />
        <polygon
          points="45,12 48,3 40,10"
          fill={colors.face}
          opacity="0.5"
        />
      </svg>
    </div>
  );
}
