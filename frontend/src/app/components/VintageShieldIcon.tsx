"use client";

import React from "react";

interface VintageShieldIconProps {
  icon: string;
  size?: "sm" | "md" | "lg";
  tier?: "gold" | "silver" | "bronze" | "sage";
  className?: string;
}

export function VintageShieldIcon({
  icon,
  size = "md",
  tier = "gold",
  className = "",
}: VintageShieldIconProps) {
  const sizeClasses = {
    sm: "w-10 h-10 text-lg rounded-lg border",
    md: "w-14 h-14 text-2xl rounded-xl border-2",
    lg: "w-18 h-18 text-4xl rounded-2xl border-2",
  };

  const tierClasses = {
    gold: "border-double border-[oklch(0.7_0.12_85)] bg-gradient-to-br from-[oklch(0.99_0.003_95)] to-[oklch(0.72_0.12_82_/_0.2)] shadow-md animate-pedestal-glow text-[oklch(0.35_0.12_85)] dark:from-[oklch(0.22_0.008_85)] dark:to-[oklch(0.72_0.12_82_/_0.2)]",
    silver: "border-double border-[oklch(0.55_0.08_160)] bg-gradient-to-br from-[oklch(0.99_0.003_95)] to-[oklch(0.55_0.08_160_/_0.15)] shadow-sm text-[oklch(0.35_0.08_160)] dark:from-[oklch(0.22_0.008_85)] dark:to-[oklch(0.55_0.08_160_/_0.15)]",
    bronze: "border-[oklch(0.65_0.12_45_/_0.6)] bg-gradient-to-br from-[oklch(0.99_0.003_95)] to-[oklch(0.65_0.12_45_/_0.12)] shadow-sm text-[oklch(0.45_0.12_45)] dark:from-[oklch(0.22_0.008_85)] dark:to-[oklch(0.65_0.12_45_/_0.1)]",
    sage: "border-[oklch(0.55_0.08_160_/_0.4)] bg-gradient-to-br from-[oklch(0.99_0.003_95)] to-[oklch(0.55_0.08_160_/_0.06)] shadow-sm text-[oklch(0.4_0.08_160)] dark:from-[oklch(0.22_0.008_85)] dark:to-[oklch(0.55_0.08_160_/_0.05)]",
  };

  return (
    <div
      className={`flex items-center justify-center shrink-0 relative overflow-hidden transition-all duration-300 hover:scale-105 ${sizeClasses[size]} ${tierClasses[tier]} ${className}`}
    >
      {/* Decorative shield lines in SVG */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.12] dark:opacity-[0.18] pointer-events-none select-none"
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
      >
        <path
          d="M 10,10 L 90,10 L 90,45 C 90,75 50,92 50,92 C 50,92 10,75 10,45 Z"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <line x1="50" y1="5" x2="50" y2="92" strokeWidth="2" strokeDasharray="3 3" />
        <line x1="10" y1="40" x2="90" y2="40" strokeWidth="1.5" strokeDasharray="4 4" />
      </svg>
      <span className="relative z-10 animate-gentle-float leading-none flex items-center justify-center select-none">
        {icon}
      </span>
    </div>
  );
}
