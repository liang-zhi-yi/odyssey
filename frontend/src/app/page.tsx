"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { AgentSparkles } from "@/app/components/AgentSparkles";

// ═══════════════════════════════════════════════════════════════════════
// Dark mode detection — watches the .dark class on <html>
// ═══════════════════════════════════════════════════════════════════════

function useIsDark() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

// ═══════════════════════════════════════════════════════════════════════
// Scroll-triggered fade-in
// ═══════════════════════════════════════════════════════════════════════

function FadeInSection({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Data
// ═══════════════════════════════════════════════════════════════════════

const BUILDINGS = [
  { nameKey: "landing.building.aiResearch", icon: "building", color: "#C89B6D", status: "built" as const },
  { nameKey: "landing.building.agentCenter", icon: "robot", color: "#9B8BB8", status: "built" as const },
  { nameKey: "landing.building.readingTower", icon: "tower", color: "#8B9D83", status: "built" as const },
  { nameKey: "landing.building.automationWorkshop", icon: "factory", color: "#D4956A", status: "building" as const },
  { nameKey: "landing.building.languageAcademy", icon: "speech", color: "#9B8BB8", status: "locked" as const },
  { nameKey: "landing.building.designAcademy", icon: "palette", color: "#D4956A", status: "locked" as const },
] as const;

/** Building positions in viewBox 900×480 coordinates — center diffusion layout */
const BUILDING_POSITIONS = [
  { x: 450, y: 230 },  // 0 AI研究院 (center)
  { x: 600, y: 120 },  // 1 智能体中心 (top-right, ring 1)
  { x: 300, y: 120 },  // 2 阅读之塔 (top-left, ring 1)
  { x: 450, y: 390 },  // 3 自动化工坊 (bottom, ring 1, building)
  { x: 690, y: 390 },  // 4 语言学院 (bottom-right, ring 2, locked)
  { x: 210, y: 390 },  // 5 设计学院 (bottom-left, ring 2, locked)
] as const;

/** Growth path edges: [fromIndex, toIndex, status] */
const BUILDING_EDGES: [number, number, "built" | "building" | "locked"][] = [
  [0, 1, "built"],    // AI → 智能体中心
  [0, 2, "built"],    // AI → 阅读之塔
  [0, 3, "building"], // AI → 自动化工坊 (under construction)
  [3, 4, "locked"],   // 自动化工坊 → 语言学院
  [3, 5, "locked"],   // 自动化工坊 → 设计学院
];

const CIVILIZATIONS = [
  { key: "AI", nameKey: "landing.civ.ai", color: "#C89B6D", icon: "chip" },
  { key: "ENGINEERING", nameKey: "landing.civ.engineering", color: "#9B8BB8", icon: "gear" },
  { key: "SCIENCE", nameKey: "landing.civ.science", color: "#8B9D83", icon: "atom" },
  { key: "KNOWLEDGE", nameKey: "landing.civ.knowledge", color: "#D4956A", icon: "book" },
  { key: "DESIGN", nameKey: "landing.civ.design", color: "#9B8BB8", icon: "pen" },
  { key: "LANGUAGE", nameKey: "landing.civ.language", color: "#8B9D83", icon: "speech" },
  { key: "BUSINESS", nameKey: "landing.civ.business", color: "#C89B6D", icon: "chart" },
  { key: "SOCIETY", nameKey: "landing.civ.society", color: "#D4956A", icon: "people" },
  { key: "FINANCE", nameKey: "landing.civ.finance", color: "#9B8BB8", icon: "coin" },
  { key: "HEALTH", nameKey: "landing.civ.health", color: "#8B9D83", icon: "heart" },
] as const;

/** Connection topology: [fromIndex, toIndex] — defines edges between civilization nodes */
const CIV_EDGES: [number, number][] = [
  [0, 1], // AI → Engineering
  [0, 2], // AI → Science
  [0, 3], // AI → Knowledge
  [0, 4], // AI → Design
  [0, 5], // AI → Language
  [1, 5], // Engineering → Language
  [1, 6], // Engineering → Business
  [1, 7], // Engineering → Society
  [2, 7], // Science → Society
  [2, 8], // Science → Finance
  [3, 8], // Knowledge → Finance
  [3, 9], // Knowledge → Health
  [3, 4], // Knowledge → Design
];

/** Build adjacency set for hover highlighting */
const CIV_ADJACENCY: Record<number, Set<number>> = CIV_EDGES.reduce((acc, [a, b]) => {
  if (!acc[a]) acc[a] = new Set();
  if (!acc[b]) acc[b] = new Set();
  acc[a].add(b);
  acc[b].add(a);
  return acc;
}, {} as Record<number, Set<number>>);

const AGENT_CAPABILITIES = [
  "agentCapability1",
  "agentCapability2",
  "agentCapability3",
  "agentCapability4",
  "agentCapability5",
  "agentCapability6",
  "agentCapability7",
] as const;

// ═══════════════════════════════════════════════════════════════════════
// Hex Grid Background
// ═══════════════════════════════════════════════════════════════════════

function HexGridBackground({ opacity = 1 }: { opacity?: number }) {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity }}
    >
      <defs>
        <pattern
          id="hex-bg"
          width="80"
          height="138"
          patternUnits="userSpaceOnUse"
          patternTransform="scale(0.7)"
        >
          <path
            d="M40 5 L72 22 L72 56 L40 73 L8 56 L8 22 Z"
            fill="none"
            stroke="oklch(0.55 0.08 160 / 0.05)"
            strokeWidth="0.8"
          />
          <circle cx="40" cy="39" r="1.5" fill="oklch(0.7 0.12 85 / 0.1)" />
          <circle cx="40" cy="5" r="0.8" fill="oklch(0.7 0.12 85 / 0.06)" />
          <circle cx="72" cy="22" r="0.8" fill="oklch(0.7 0.12 85 / 0.06)" />
          <circle cx="8" cy="22" r="0.8" fill="oklch(0.7 0.12 85 / 0.06)" />
        </pattern>
        <pattern
          id="hex-lines-bg"
          width="160"
          height="276"
          patternUnits="userSpaceOnUse"
          patternTransform="scale(0.7)"
        >
          <line x1="80" y1="78" x2="120" y2="44" stroke="oklch(0.55 0.08 160 / 0.04)" strokeWidth="0.5" />
          <line x1="80" y1="78" x2="40" y2="110" stroke="oklch(0.55 0.08 160 / 0.04)" strokeWidth="0.5" />
          <line x1="120" y1="44" x2="80" y2="10" stroke="oklch(0.55 0.08 160 / 0.04)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hex-lines-bg)" />
      <rect width="100%" height="100%" fill="url(#hex-bg)" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Agent Chat Bubble — with directional arrow toward the agent
// ═══════════════════════════════════════════════════════════════════════

function AgentChatBubble({
  children,
  arrowSide = "bottom",
  delay = 0,
  color = "sage",
}: {
  children: ReactNode;
  arrowSide?: "bottom" | "top" | "left" | "right";
  delay?: number;
  color?: "sage" | "gold";
}) {
  const bgClass =
    color === "gold"
      ? "bg-accent/[0.08] border-accent/20"
      : "bg-card/95 border-border/60";

  const arrowMap: Record<string, string> = {
    bottom: "absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent",
    top: "absolute -top-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-r-[7px] border-b-[7px] border-l-transparent border-r-transparent border-b-transparent",
    right: "absolute top-1/2 -right-1.5 -translate-y-1/2 w-0 h-0 border-t-[7px] border-b-[7px] border-l-[7px] border-t-transparent border-b-transparent",
    left: "absolute top-1/2 -left-1.5 -translate-y-1/2 w-0 h-0 border-t-[7px] border-b-[7px] border-r-[7px] border-t-transparent border-b-transparent border-r-transparent",
  };

  const arrowColorClass =
    color === "gold"
      ? {
          bottom: "border-t-accent/20",
          top: "border-b-accent/20",
          right: "border-l-accent/20",
          left: "border-r-accent/20",
        }
      : {
          bottom: "border-t-card/95",
          top: "border-b-card/95",
          right: "border-l-card/95",
          left: "border-r-card/95",
        };

  return (
    <div
      className="animate-fade-in-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
    >
      <div
        className={`relative rounded-2xl border ${bgClass} backdrop-blur-sm shadow-md px-3.5 py-2.5 max-w-[200px] sm:max-w-[220px]`}
      >
        {children}
        <div className={`${arrowMap[arrowSide]} ${arrowColorClass[arrowSide]}`} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Mini Metric Card — for content enrichment
// ═══════════════════════════════════════════════════════════════════════

function MetricCard({
  value,
  label,
  delay = 0,
}: {
  value: string;
  label: string;
  delay?: number;
}) {
  return (
    <FadeInSection
      delay={delay}
      className="flex flex-col items-center rounded-2xl border border-[oklch(0.88_0.02_90)] bg-gradient-to-br from-[oklch(0.99_0.003_95)] to-[oklch(0.975_0.005_92)] dark:from-[oklch(0.22_0.008_85)] dark:to-[oklch(0.2_0.006_85)] px-6 py-4 text-center shadow-sm"
    >
      <span className="text-2.5xl sm:text-3xl font-bold text-accent font-mono tracking-tight">
        {value}
      </span>
      <span className="mt-1 text-xs sm:text-sm font-bold font-civ-serif text-muted-foreground">
        {label}
      </span>
    </FadeInSection>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════════════════════

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { t, locale } = useLocale();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="-mx-6 -mt-8">
      {/* ═══════════════════════════════════════════════════════════
          SCREEN 1 — HERO
          ═══════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[calc(100vh-57px)] flex items-center bg-secondary/20 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/[0.015] to-transparent" />
        <HexGridBackground opacity={0.7} />

        {/* Ambient glows */}
        <div className="absolute top-1/4 right-[15%] w-[550px] h-[550px] rounded-full bg-accent/[0.05] blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-[10%] w-[400px] h-[400px] rounded-full bg-primary/[0.04] blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-accent/[0.03] blur-3xl pointer-events-none" />

        {/* Sparkle particles */}
        <div className="absolute pointer-events-none" aria-hidden="true">
          {[
            { l: "15%", t: "25%", d: 0, s: "md" },
            { l: "78%", t: "10%", d: 600, s: "sm" },
            { l: "65%", t: "75%", d: 1200, s: "sm" },
            { l: "20%", t: "65%", d: 400, s: "md" },
            { l: "88%", t: "45%", d: 1800, s: "sm" },
            { l: "35%", t: "85%", d: 2200, s: "sm" },
          ].map((p, i) => (
            <div
              key={i}
              className={`absolute ${
                p.s === "md" ? "w-2 h-2" : "w-1.5 h-1.5"
              } rounded-full pointer-events-none`}
              style={{
                left: p.l,
                top: p.t,
                background: "oklch(0.7 0.12 85 / 0.4)",
                boxShadow:
                  p.s === "md"
                    ? "0 0 6px 2px oklch(0.7 0.12 85 / 0.3)"
                    : "0 0 4px 1px oklch(0.7 0.12 85 / 0.2)",
                animation: `float-up 3.5s ease-out ${p.d}ms infinite`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 w-full mx-auto max-w-6xl px-6 py-12 lg:py-16">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-14 xl:gap-16">
            {/* ── LEFT: Brand Identity ──────────────────────────── */}
            <div className="lg:w-[50%] text-center lg:text-left">
              {/* Logo + Name row — logo prominent, name beside it */}
              <div className="animate-fade-in-up flex items-center gap-6 mb-6 justify-center lg:justify-start">
                {/* Logo — prominent, glowing gold compass seal */}
                <div className="relative flex-shrink-0 animate-gentle-float">
                  {/* Rotating decorative SVG gear behind logo */}
                  <div className="absolute inset-[-12px] opacity-25 dark:opacity-45 text-[#C4A77D] pointer-events-none">
                    <svg className="w-full h-full animate-rhumb-spin" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <circle cx="50" cy="50" r="45" strokeDasharray="3 3" />
                      <circle cx="50" cy="50" r="38" />
                      <path d="M50 0 L50 100 M0 50 L100 50 M15 15 L85 85 M15 85 L85 15" strokeWidth="0.6" />
                    </svg>
                  </div>
                  <div className="relative rounded-full border-4 border-double border-[#C4A77D]/70 bg-gradient-to-br from-[oklch(0.99_0.003_95)] to-[oklch(0.975_0.005_92)] dark:from-[oklch(0.22_0.008_85)] dark:to-[oklch(0.2_0.006_85)] p-2.5 shadow-md flex items-center justify-center">
                    <Image
                      src="/Odyssey_logo.png"
                      alt="Odyssey"
                      width={80}
                      height={80}
                      className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-md dark:invert dark:drop-shadow-[0_0_8px_rgba(196,167,125,0.4)]"
                      priority
                    />
                  </div>
                </div>
                {/* Name beside logo */}
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold font-civ-serif tracking-wider text-[oklch(0.35_0.12_85)] dark:text-[oklch(0.85_0.04_80)] drop-shadow-sm">
                  Odyssey
                </h1>
              </div>

              {/* Subtitle */}
              <p
                className="animate-fade-in-up text-lg sm:text-xl lg:text-2xl font-bold font-civ-serif text-primary leading-relaxed"
                style={{ animationDelay: "100ms" }}
              >
                {t("landing.subtitle")}
              </p>

              {/* Brand tags */}
              <div
                className="animate-fade-in-up mt-5 space-y-1.5"
                style={{ animationDelay: "200ms" }}
              >
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed italic">
                  {t("landing.heroTagline")}
                </p>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed italic">
                  {t("landing.heroTagline2")}
                </p>
              </div>

              {/* CTAs */}
              <div
                className="animate-fade-in-up mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3"
                style={{ animationDelay: "350ms" }}
              >
                <Link
                  href={isAuthenticated ? "/dashboard" : "/auth"}
                  className="group inline-flex items-center gap-2.5 rounded-xl bg-primary px-7 py-3 text-sm font-bold font-civ-serif text-primary-foreground transition-all duration-300 hover:opacity-90 btn-press shadow-lg shadow-primary/20 border border-primary/20"
                >
                  {isAuthenticated ? t("landing.enterDashboard") : t("landing.cta")}
                  <svg
                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                {!isAuthenticated && (
                  <Link
                    href="/auth"
                    className="inline-flex items-center gap-2.5 rounded-xl border border-border bg-card px-7 py-3 text-sm font-bold font-civ-serif text-foreground transition-all duration-300 hover:border-primary/30 hover:bg-secondary/50 btn-press"
                  >
                    {t("landing.secondaryCta")}
                  </Link>
                )}
              </div>
            </div>

            {/* ── RIGHT: Agent with Chat Bubbles AROUND ──── */}
            <div className="lg:w-[50%] flex justify-center">
              <div className="relative w-full" style={{ maxWidth: "460px", height: "480px" }}>
                {/* ── Agent center ── */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                  <div className="relative w-40 h-40 sm:w-48 sm:h-48">
                    {/* Radial glows */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-accent/[0.08] blur-2xl animate-glow-pulse" />
                    </div>
                    <div className="absolute inset-4 flex items-center justify-center pointer-events-none">
                      <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary/[0.06] to-accent/[0.06] blur-xl" />
                    </div>
                    {/* Sparkles */}
                    <AgentSparkles scale={1} />
                    <img
                      src="/agent-mentor.apng"
                      alt="AI Mentor"
                      width={192}
                      height={192}
                      className="relative z-10 w-full h-full object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
                    />
                  </div>
                  {/* Pedestal */}
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[120%] h-20 pointer-events-none">
                    <svg viewBox="0 0 300 60" className="w-full h-full" preserveAspectRatio="none">
                      <ellipse cx="150" cy="50" rx="130" ry="10" fill="none" stroke="oklch(0.7 0.12 85 / 0.2)" strokeWidth="1" />
                      <polygon points="150,30 180,37 180,48 150,54 120,48 120,37" fill="oklch(0.7 0.12 85 / 0.06)" stroke="oklch(0.7 0.12 85 / 0.22)" strokeWidth="1" />
                      <circle cx="150" cy="30" r="1.5" fill="oklch(0.7 0.12 85 / 0.3)" />
                    </svg>
                  </div>
                </div>

                {/* ── Bubble 1: Top-Left — Round 1 AI Mentor Greeting ── */}
                <div className="absolute top-4 left-[-15px] z-10" style={{ maxWidth: "195px" }}>
                  <AgentChatBubble arrowSide="right" delay={200} color="sage">
                    <p className="text-[9px] font-bold text-[#C4A77D] uppercase tracking-wider mb-0.5">
                      {t("landing.bubble1Title")}
                    </p>
                    <p className="text-[11px] leading-relaxed text-foreground">
                      {t("landing.bubble1Text")}
                    </p>
                  </AgentChatBubble>
                </div>

                {/* ── Bubble 2: Top-Right — Round 2 User Goal ── */}
                <div className="absolute top-4 right-[-15px] z-10" style={{ maxWidth: "195px" }}>
                  <AgentChatBubble arrowSide="left" delay={500} color="gold">
                    <p className="text-[9px] font-bold text-[#8B9D83] uppercase tracking-wider mb-0.5">
                      {t("landing.bubble2Title")}
                    </p>
                    <p className="text-[11px] leading-relaxed text-foreground">
                      {t("landing.bubble2Text")}
                    </p>
                  </AgentChatBubble>
                </div>

                {/* ── Bubble 3: Middle-Left — Round 3 Path Planned ── */}
                <div className="absolute top-[44%] left-[-25px] z-10" style={{ maxWidth: "190px" }}>
                  <AgentChatBubble arrowSide="right" delay={800} color="sage">
                    <p className="text-[9px] font-bold text-[#C4A77D] uppercase tracking-wider mb-0.5">
                      {t("landing.bubble3Title")}
                    </p>
                    <p className="text-[11px] leading-relaxed text-foreground">
                      {t("landing.bubble3Text")}
                    </p>
                  </AgentChatBubble>
                </div>

                {/* ── Bubble 4: Middle-Right — Round 4 Quest Complete ── */}
                <div className="absolute top-[44%] right-[-25px] z-10" style={{ maxWidth: "190px" }}>
                  <AgentChatBubble arrowSide="left" delay={1100} color="sage">
                    <p className="text-[9px] font-bold text-[#8B9D83] uppercase tracking-wider mb-0.5">
                      {t("landing.bubble4Title")}
                    </p>
                    <p className="text-[11px] leading-relaxed text-foreground">
                      {t("landing.bubble4Text")}
                    </p>
                  </AgentChatBubble>
                </div>

                {/* ── Bubble 5: Bottom-Center — Round 5 Next target ── */}
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-10" style={{ maxWidth: "210px" }}>
                  <AgentChatBubble arrowSide="top" delay={1400} color="gold">
                    <p className="text-[9px] font-bold text-[#C4A77D] uppercase tracking-wider mb-0.5 text-center">
                      {t("landing.bubble5Title")}
                    </p>
                    <p className="text-[11px] leading-relaxed text-foreground text-center">
                      {t("landing.bubble5Text")}
                    </p>
                  </AgentChatBubble>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
          <div
            className="animate-fade-in-up flex flex-col items-center gap-2 text-muted-foreground/50"
            style={{ animationDelay: "900ms" }}
          >
            <span className="text-[10px] sm:text-xs tracking-widest uppercase font-bold font-civ-serif">
              {t("landing.scrollExplore")}
            </span>
            <svg
              className="h-4 w-4 animate-bounce"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          STATS STRIP — Key metrics to reduce whitespace
          ═══════════════════════════════════════════════════════════ */}
      <section className="relative border-t border-border bg-secondary/20">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <MetricCard value="12" label={t("landing.metric.civTypes")} delay={0} />
            <MetricCard value="6" label={t("landing.metric.buildings")} delay={100} />
            <MetricCard value="9" label={t("landing.metric.eras")} delay={200} />
            <MetricCard value="20+" label={t("landing.metric.milestones")} delay={300} />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SCREEN 2 — CIVILIZATION EVOLUTION TIMELINE
          ═══════════════════════════════════════════════════════════ */}
      <section className="relative border-t border-border bg-secondary/20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/[0.01] to-transparent pointer-events-none" />
        <HexGridBackground opacity={0.3} />

        <div className="relative z-10 mx-auto max-w-6xl px-6 py-20 sm:py-24">
          <FadeInSection className="text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground font-civ-serif">
              {t("landing.growthTitle")}
            </h2>
          </FadeInSection>

          {/* Desktop: Horizontal Timeline */}
          <FadeInSection className="mt-14 hidden sm:block" delay={100}>
            <div className="relative">
              {/* Central line */}
              <div className="absolute top-20 left-[8%] right-[8%] h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

              <div className="flex justify-between items-start relative">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex flex-col items-center text-center w-[18%]">
                    {/* Hex icon frame */}
                    <div className="relative flex items-center justify-center w-16 h-16 mb-4">
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 64 64" fill="none">
                        <path
                          d="M32 4 L56 17 L56 47 L32 60 L8 47 L8 17 Z"
                          fill="oklch(0.995 0.003 95)"
                          stroke="#C4A77D"
                          strokeWidth="1.2"
                        />
                      </svg>
                      <span className="relative text-2xl z-10">
                        {["💡", "🏛️", "🌍", "🚀", "✨"][i]}
                      </span>
                    </div>

                    {/* Vertical connector */}
                    <div className="w-px h-4 bg-accent/15 mb-2" />

                    {/* Timeline node */}
                    <div
                      className="w-3 h-3 rounded-full bg-accent/25 border-2 border-accent/15 mb-3 animate-node-pulse"
                      style={{ animationDelay: `${i * 400}ms` }}
                    />

                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#C4A77D] mb-1 font-mono">
                      {t(`landing.timelineNode${i + 1}` as any)}
                    </span>
                    <span className="text-xs text-muted-foreground/65 leading-tight font-medium">
                      {t(`landing.timelineDesc${i + 1}` as any)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Branch arcs */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ top: 0 }} viewBox="0 0 100 200" preserveAspectRatio="none">
                <path
                  d="M 17 130 Q 24 112 27 130"
                  fill="none" stroke="oklch(0.55 0.08 160 / 0.12)" strokeWidth="0.5" strokeDasharray="3 3"
                  vectorEffect="non-scaling-stroke"
                />
                <path
                  d="M 39 130 Q 46 108 49 130"
                  fill="none" stroke="oklch(0.55 0.08 160 / 0.12)" strokeWidth="0.5" strokeDasharray="3 3"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>
          </FadeInSection>

          {/* Mobile: Vertical timeline */}
          <FadeInSection className="mt-12 sm:hidden" delay={100}>
            <div className="relative pl-10">
              <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-accent/30 via-accent/15 to-transparent" />
              <div className="space-y-10">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="relative flex items-start gap-4">
                    <div className="absolute left-5 top-2 -translate-x-1/2 w-3 h-3 rounded-full bg-accent/25 border-2 border-accent/15 z-10" />
                    <div className="flex items-center justify-center w-10 h-10 shrink-0 rounded-xl bg-accent/[0.05] border border-accent/12">
                      <span className="text-lg">{["💡", "🏛️", "🌍", "🚀", "✨"][i]}</span>
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t(`landing.timelineNode${i + 1}` as any)}
                      </span>
                      <p className="text-sm text-muted-foreground/65 mt-0.5">
                        {t(`landing.timelineDesc${i + 1}` as any)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SCREEN 3 — CIVILIZATION WORLD (Building Map)
          ═══════════════════════════════════════════════════════════ */}
      <section className="relative border-t border-border bg-secondary/20 overflow-hidden">
        {/* Low-opacity large grid + radial gradient center focus */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(oklch(0.5 0.02 85 / 0.035) 1px, transparent 1px), linear-gradient(90deg, oklch(0.5 0.02 85 / 0.035) 1px, transparent 1px)",
            backgroundSize: "70px 70px",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 550px 350px at 50% 48%, oklch(0.7 0.08 85 / 0.05), transparent 70%)",
          }}
        />

        {/* Ambient floating particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          {[
            { left: "10%", top: "20%", fx: "30px", fy: "-50px", dur: "9s", delay: "0s", size: 3 },
            { left: "85%", top: "30%", fx: "-25px", fy: "-40px", dur: "11s", delay: "2s", size: 2 },
            { left: "20%", top: "70%", fx: "20px", fy: "-60px", dur: "10s", delay: "1s", size: 3 },
            { left: "75%", top: "75%", fx: "-15px", fy: "-45px", dur: "12s", delay: "3s", size: 2 },
            { left: "50%", top: "15%", fx: "-20px", fy: "-30px", dur: "8s", delay: "1.5s", size: 2 },
            { left: "40%", top: "85%", fx: "25px", fy: "-55px", dur: "10.5s", delay: "0.5s", size: 3 },
          ].map((p, i) => (
            <div
              key={`particle-${i}`}
              className="absolute rounded-full bg-[#C89B6D] animate-ambient-float"
              style={
                {
                  left: p.left,
                  top: p.top,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  "--float-x": p.fx,
                  "--float-y": p.fy,
                  "--float-dur": p.dur,
                  animationDelay: p.delay,
                  boxShadow: "0 0 6px oklch(0.82 0.12 85 / 0.3)",
                } as React.CSSProperties
              }
            />
          ))}
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-6 py-20 sm:py-24">
          {/* Title with English subtitle */}
          <FadeInSection className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#C89B6D]/70 mb-3">
              {t("landing.mapSubtitleEn")}
            </p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground font-civ-serif">
              {t("landing.mapTitle")}
            </h2>
            <p className="mt-4 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed font-light tracking-wide">
              {t("landing.mapDescription")}
            </p>
          </FadeInSection>

          {/* Desktop: Center-diffusion building map */}
          <FadeInSection className="mt-14 hidden sm:block" delay={100}>
            <div className="relative mx-auto w-full max-w-[900px]" style={{ height: "500px" }}>
              {/* SVG connection layer */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 900 480" preserveAspectRatio="xMidYMid meet">
                {/* Growth path bezier curves */}
                {BUILDING_EDGES.map(([a, b, status], i) => {
                  const pa = BUILDING_POSITIONS[a];
                  const pb = BUILDING_POSITIONS[b];
                  const path = bezierPath(pa.x, pa.y, pb.x, pb.y);
                  if (status === "built") {
                    return (
                      <path
                        key={`edge-${i}`}
                        d={path}
                        fill="none"
                        stroke="#C89B6D"
                        strokeWidth="1.5"
                        opacity="0.25"
                      />
                    );
                  }
                  if (status === "building") {
                    return (
                      <path
                        key={`edge-${i}`}
                        d={path}
                        fill="none"
                        stroke="#C89B6D"
                        strokeWidth="2"
                        strokeDasharray="6 4"
                        opacity="0.6"
                        className="animate-growth-flow"
                      />
                    );
                  }
                  // locked
                  return (
                    <path
                      key={`edge-${i}`}
                      d={path}
                      fill="none"
                      stroke="oklch(0.6 0.02 85)"
                      strokeWidth="1"
                      strokeDasharray="3 5"
                      opacity="0.15"
                    />
                  );
                })}

                {/* Center halo */}
                <circle cx="450" cy="230" r="70" fill="#C89B6D" opacity="0.06" />
                <circle cx="450" cy="230" r="50" fill="#C89B6D" opacity="0.04" />
              </svg>

              {/* Energy ring around center building */}
              <div
                className="absolute pointer-events-none"
                style={{
                  left: `${(450 / 900) * 100}%`,
                  top: `${(230 / 480) * 100}%`,
                  transform: "translate(-50%, -50%)",
                  width: "140px",
                  height: "140px",
                }}
              >
                <svg className="w-full h-full animate-energy-ring" viewBox="0 0 140 140" fill="none">
                  <circle cx="70" cy="70" r="64" stroke="#C89B6D" strokeWidth="1" strokeDasharray="3 8" opacity="0.3" />
                  <circle cx="70" cy="70" r="58" stroke="#C89B6D" strokeWidth="0.5" strokeDasharray="2 12" opacity="0.2" />
                </svg>
              </div>

              {/* Building nodes */}
              {BUILDING_POSITIONS.map((pos, i) => {
                const building = BUILDINGS[i];
                const isCenter = i === 0;
                return (
                  <div
                    key={building.nameKey}
                    className="absolute animate-civ-enter"
                    style={{
                      left: `${(pos.x / 900) * 100}%`,
                      top: `${(pos.y / 480) * 100}%`,
                      transform: "translate(-50%, -50%)",
                      animationDelay: `${i * 100}ms`,
                      zIndex: isCenter ? 20 : 10,
                    }}
                  >
                    <BuildingNode building={building} isCenter={isCenter} />
                  </div>
                );
              })}
            </div>
          </FadeInSection>

          {/* Mobile grid */}
          <FadeInSection className="mt-12 sm:hidden" delay={100}>
            <div className="grid grid-cols-2 gap-4">
              {BUILDINGS.map((b, i) => (
                <BuildingNode key={b.nameKey} building={b} isCenter={i === 0} delay={i * 80} />
              ))}
            </div>
          </FadeInSection>

          {/* Civilization HUD Panel */}
          <FadeInSection className="mt-10" delay={400}>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-[#C89B6D]/20 bg-[#C89B6D]/[0.04] backdrop-blur-md px-5 py-2.5 shadow-sm">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">{t("landing.hud.civLevel")}</span>
                <span className="text-sm font-bold font-civ-serif text-[#C89B6D]">Lv.3</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-[#C89B6D]/20 bg-[#C89B6D]/[0.04] backdrop-blur-md px-5 py-2.5 shadow-sm">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">{t("landing.hud.buildings")}</span>
                <span className="text-sm font-bold font-civ-serif text-foreground">3<span className="text-muted-foreground/50">/6</span></span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-[#C89B6D]/20 bg-[#C89B6D]/[0.04] backdrop-blur-md px-5 py-2.5 shadow-sm">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">{t("landing.hud.building")}</span>
                <span className="text-sm font-bold font-civ-serif text-[#D4956A]">{t("landing.building.automationWorkshop")}</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-[#C89B6D]/20 bg-[#C89B6D]/[0.04] backdrop-blur-md px-5 py-2.5 shadow-sm">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">{t("landing.hud.progress")}</span>
                <span className="text-sm font-bold font-civ-serif text-[#8B9D83]">50%</span>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SCREEN 4 — AI MENTOR
          ═══════════════════════════════════════════════════════════ */}
      <section className="relative border-t border-border bg-secondary/20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/[0.01] to-transparent pointer-events-none" />
        <HexGridBackground opacity={0.3} />

        <div className="relative z-10 mx-auto max-w-6xl px-6 py-20 sm:py-24">
          <FadeInSection className="text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground font-civ-serif">
              {t("landing.agentTitle")}
            </h2>
            <p className="mt-4 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
              {t("landing.agentSubtitle")}
            </p>
          </FadeInSection>

          <div className="mt-14 flex flex-col lg:flex-row items-center gap-10 lg:gap-14">
            {/* Left: Agent */}
            <FadeInSection className="lg:w-2/5 flex-shrink-0" delay={100}>
              <div className="relative mx-auto w-52 h-52 sm:w-60 sm:h-60 lg:w-68 lg:h-68">
                <div className="absolute inset-0 rounded-full bg-accent/[0.05] blur-2xl animate-glow-pulse" />
                <div className="absolute inset-6 rounded-full bg-gradient-to-br from-primary/[0.05] to-accent/[0.05] blur-xl" />
                {/* Sparkles */}
                <AgentSparkles scale={1.3} />
                <img
                  src="/agent-mentor.apng"
                  alt="AI Mentor"
                  width={272}
                  height={272}
                  className="relative z-10 w-full h-full object-contain drop-shadow-[0_6px_20px_rgba(0,0,0,0.06)]"
                />
                {/* Mini pedestal */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[120%] h-16 pointer-events-none">
                  <svg viewBox="0 0 300 50" className="w-full h-full" preserveAspectRatio="none">
                    <ellipse cx="150" cy="42" rx="130" ry="12" fill="none" stroke="oklch(0.7 0.12 85 / 0.12)" strokeWidth="0.8" />
                    <polygon points="150,24 184,32 184,42 150,48 116,42 116,32" fill="oklch(0.7 0.12 85 / 0.04)" stroke="oklch(0.7 0.12 85 / 0.18)" strokeWidth="1" />
                  </svg>
                </div>
              </div>
            </FadeInSection>

            {/* Right: Chat + Capabilities */}
            <FadeInSection className="lg:w-3/5 space-y-5" delay={200}>
              {/* Chat demo */}
              <div className="space-y-3">
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary/8 border border-primary/12 px-4 py-3">
                    <p className="text-sm text-foreground">{t("landing.agentChatUser")}</p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-card border border-border shadow-sm px-4 py-3.5 space-y-2">
                    <p className="text-sm text-foreground font-semibold">{t("landing.agentChatThinking")}</p>
                    <p className="text-sm text-muted-foreground">{t("landing.agentChatRecommend")}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {[t("landing.building.aiResearch"), t("landing.building.agentCenter"), t("landing.chatTag.agentArch"), t("landing.chatTag.langGraph")].map((item) => (
                        <span key={item} className="inline-flex rounded-lg bg-accent/8 border border-accent/12 px-2.5 py-1 text-xs font-medium text-accent">
                          {item}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground pt-1">
                      {t("landing.agentChatLevel")}{" "}
                      <span className="font-bold text-accent font-mono text-base">Lv.5</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Capabilities */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {AGENT_CAPABILITIES.map((key) => (
                  <div
                    key={key}
                    className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-muted-foreground bg-card/50 border border-border/40 transition-all hover:border-accent/12 hover:bg-card"
                  >
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-success/8">
                      <svg className="h-3 w-3 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    {t(`landing.${key}`)}
                  </div>
                ))}
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SCREEN 5 — CIVILIZATION CONSTELLATION
          ═══════════════════════════════════════════════════════════ */}
      <section className="relative border-t border-border bg-secondary/20 overflow-hidden">
        {/* Low-opacity large grid + radial gradient center focus */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(oklch(0.5 0.02 85 / 0.04) 1px, transparent 1px), linear-gradient(90deg, oklch(0.5 0.02 85 / 0.04) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 600px 400px at 50% 50%, oklch(0.7 0.08 85 / 0.06), transparent 70%)",
          }}
        />

        <div className="relative z-10 mx-auto max-w-6xl px-6 py-20 sm:py-28">
          {/* Title with English subtitle */}
          <FadeInSection className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#C89B6D]/70 mb-3">
              {t("landing.civSubtitleEn")}
            </p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground font-civ-serif">
              {t("landing.civTitle")}
            </h2>
            <p className="mt-4 text-sm sm:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed font-light tracking-wide">
              {t("landing.civSubtitle")}
            </p>
          </FadeInSection>

          {/* Desktop: Glassmorphism Constellation Map */}
          <FadeInSection className="mt-14 hidden sm:block" delay={100}>
            <CivConstellation />
          </FadeInSection>

          {/* Mobile grid */}
          <FadeInSection className="mt-12 sm:hidden" delay={100}>
            <div className="grid grid-cols-2 gap-3">
              {CIVILIZATIONS.map((civ, i) => (
                <CivDot key={civ.key} civ={civ} delay={i * 60} />
              ))}
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════════════════════ */}
      <footer className="border-t border-border bg-secondary/10">
        <div className="mx-auto max-w-6xl px-6 py-8 text-center text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Odyssey</span>{" "}
          · {t("landing.footerTagline")}
        </div>
      </footer>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Building SVG Icons — unified stroke style for civilization buildings
// ═══════════════════════════════════════════════════════════════════════

function BuildingIcon({ name, size = 24, color = "currentColor" }: { name: string; size?: number; color?: string }) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "building":
      return (
        <svg {...props}>
          <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" />
          <path d="M9 9v.01M9 12v.01M9 15v.01M9 18v.01" />
        </svg>
      );
    case "robot":
      return (
        <svg {...props}>
          <rect x="4" y="8" width="16" height="12" rx="2" />
          <path d="M12 8V4M8 4h8" />
          <circle cx="9" cy="13" r="1" fill={color} />
          <circle cx="15" cy="13" r="1" fill={color} />
          <path d="M9 17h6M2 14h2M20 14h2" />
        </svg>
      );
    case "tower":
      return (
        <svg {...props}>
          <path d="M7 21V8l5-4 5 4v13" />
          <path d="M7 21h10M9 12h6M9 16h6M12 4V2" />
        </svg>
      );
    case "factory":
      return (
        <svg {...props}>
          <path d="M3 21h18M4 21V10l5 3V10l5 3V8l5 3v10" />
          <path d="M9 21v-4h3v4M14 21v-3h3v3" />
        </svg>
      );
    case "speech":
      return (
        <svg {...props}>
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      );
    case "palette":
      return (
        <svg {...props}>
          <circle cx="13.5" cy="6.5" r="1" fill={color} />
          <circle cx="17.5" cy="10.5" r="1" fill={color} />
          <circle cx="8.5" cy="7.5" r="1" fill={color} />
          <circle cx="6.5" cy="12.5" r="1" fill={color} />
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
        </svg>
      );
    default:
      return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// BuildingNode — glassmorphism building card with status system
// ═══════════════════════════════════════════════════════════════════════

function BuildingNode({
  building,
  isCenter = false,
  delay = 0,
}: {
  building: { nameKey: string; icon: string; color: string; status: "built" | "building" | "locked" };
  isCenter?: boolean;
  delay?: number;
}) {
  const { t } = useLocale();
  const isDark = useIsDark();
  const isLocked = building.status === "locked";
  const isBuilding = building.status === "building";
  const cardSize = isCenter ? 110 : 96;
  const iconSize = isCenter ? 40 : 34;

  return (
    <div
      className="flex flex-col items-center group cursor-default animate-fade-in-up"
      style={{
        animationDelay: `${delay}ms`,
        opacity: isLocked ? 0.4 : 1,
        filter: isLocked ? "blur(0.5px)" : "none",
        transition: "opacity 0.3s, filter 0.3s",
      }}
    >
      <div className="relative" style={{ width: cardSize, height: cardSize }}>
        {/* Glassmorphism building card */}
        <div
          className={`relative flex items-center justify-center rounded-[24px] backdrop-blur-xl transition-all duration-500 group-hover:-translate-y-1 ${
            isBuilding ? "animate-building-pulse" : ""
          }`}
          style={{
            width: cardSize,
            height: cardSize,
            background: isLocked
              ? isDark
                ? "linear-gradient(135deg, oklch(0.2 0.01 85 / 0.5), oklch(0.18 0.008 85 / 0.3))"
                : "linear-gradient(135deg, oklch(0.95 0.003 90 / 0.4), oklch(0.9 0.005 88 / 0.3))"
              : isDark
                ? `linear-gradient(135deg, ${building.color}30, ${building.color}10)`
                : `linear-gradient(135deg, ${building.color}18, ${building.color}06)`,
            border: `1px solid ${isLocked ? (isDark ? "oklch(0.35 0.01 85 / 0.3)" : "oklch(0.8 0.01 85 / 0.25)") : building.color + (isDark ? "60" : "40")}`,
            boxShadow: isCenter
              ? isDark
                ? `0 0 32px ${building.color}40, 0 4px 16px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.08)`
                : `0 0 28px ${building.color}25, 0 4px 16px rgba(0,0,0,0.05), inset 0 1px 1px rgba(255,255,255,0.5)`
              : isLocked
                ? "none"
                : isDark
                  ? `0 0 16px ${building.color}15, 0 2px 8px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.04)`
                  : `0 2px 12px rgba(0,0,0,0.04), inset 0 1px 1px rgba(255,255,255,0.4)`,
          }}
        >
          {/* Hover glow */}
          {!isLocked && (
            <div
              className="absolute inset-0 rounded-[24px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ boxShadow: `0 0 24px ${building.color}${isDark ? "50" : "30"}` }}
            />
          )}
          <BuildingIcon name={building.icon} size={iconSize} color={isLocked ? (isDark ? "oklch(0.55 0.02 85)" : "oklch(0.6 0.02 85)") : building.color} />
        </div>

        {/* Status indicator */}
        {building.status === "built" && (
          <div
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
            style={{ background: building.color, boxShadow: `0 0 8px ${building.color}80` }}
          />
        )}
        {isBuilding && (
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#D4956A] animate-ping" />
        )}
      </div>

      {/* Label */}
      <span
        className="mt-2.5 text-xs sm:text-sm font-semibold font-civ-serif text-center leading-tight max-w-[100px] transition-colors"
        style={{
          color: isLocked
            ? isDark ? "oklch(0.55 0.02 85)" : "oklch(0.55 0.02 85)"
            : isCenter
              ? building.color
              : isDark ? "oklch(0.78 0.02 85)" : "oklch(0.3 0.02 85)",
        }}
      >
        {t(building.nameKey)}
      </span>

      {/* Status text */}
      <span className="mt-0.5 text-[9px] uppercase tracking-wider" style={{ color: isLocked ? (isDark ? "oklch(0.5 0.02 85 / 0.6)" : "oklch(0.6 0.02 85 / 0.5)") : building.color + "90" }}>
        {building.status === "built" ? t("landing.buildingStatus.built") : isBuilding ? t("landing.buildingStatus.building") : t("landing.buildingStatus.locked")}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Civilization SVG Icons — unified stroke style
// ═══════════════════════════════════════════════════════════════════════

function CivIcon({ name, size = 24, color = "currentColor" }: { name: string; size?: number; color?: string }) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "chip":
      return (
        <svg {...props}>
          <rect x="6" y="6" width="12" height="12" rx="2" />
          <path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2" />
          <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
        </svg>
      );
    case "gear":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M2 12h3M19 12h3M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" />
        </svg>
      );
    case "atom":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="1.5" fill={color} />
          <ellipse cx="12" cy="12" rx="10" ry="4" />
          <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
          <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
        </svg>
      );
    case "book":
      return (
        <svg {...props}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case "pen":
      return (
        <svg {...props}>
          <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
        </svg>
      );
    case "speech":
      return (
        <svg {...props}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    case "chart":
      return (
        <svg {...props}>
          <path d="M3 3v18h18" />
          <rect x="7" y="10" width="3" height="8" rx="0.5" />
          <rect x="12" y="6" width="3" height="12" rx="0.5" />
          <rect x="17" y="13" width="3" height="5" rx="0.5" />
        </svg>
      );
    case "people":
      return (
        <svg {...props}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "coin":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 7v10M9.5 10h3a1.5 1.5 0 0 1 0 3H9.5h3a1.5 1.5 0 0 1 0 3H9.5" />
        </svg>
      );
    case "heart":
      return (
        <svg {...props}>
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      );
    default:
      return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Civilization Constellation — desktop interactive radial map
// ═══════════════════════════════════════════════════════════════════════

/** Node positions in viewBox 900×560 coordinates — expanded spacing */
const CIV_POSITIONS = [
  { x: 450, y: 280 },  // 0 AI (center)
  { x: 600, y: 280 },  // 1 Engineering (inner right)
  { x: 450, y: 430 },  // 2 Science (inner bottom)
  { x: 300, y: 280 },  // 3 Knowledge (inner left)
  { x: 220, y: 120 },  // 4 Design (outer top-left)
  { x: 680, y: 120 },  // 5 Language (outer top-right)
  { x: 760, y: 280 },  // 6 Business (outer right)
  { x: 680, y: 440 },  // 7 Society (outer bottom-right)
  { x: 220, y: 440 },  // 8 Finance (outer bottom-left)
  { x: 140, y: 280 },  // 9 Health (outer left)
] as const;

/** Generate a quadratic bezier path between two points with a gentle curve */
function bezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const offset = Math.min(dist * 0.12, 25);
  const nx = (-dy / dist) * offset;
  const ny = (dx / dist) * offset;
  return `M ${x1} ${y1} Q ${mx + nx} ${my + ny} ${x2} ${y2}`;
}

function CivConstellation() {
  const { t } = useLocale();
  const isDark = useIsDark();
  const [hovered, setHovered] = useState<number | null>(null);

  const isHighlighted = (idx: number) => {
    if (hovered === null) return true;
    if (hovered === idx) return true;
    return CIV_ADJACENCY[hovered]?.has(idx) ?? false;
  };

  const isEdgeHighlighted = (a: number, b: number) => {
    if (hovered === null) return false;
    return hovered === a || hovered === b;
  };

  return (
    <div className="relative mx-auto w-full max-w-[900px]" style={{ height: "560px" }}>
      {/* SVG connection layer */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 900 560" preserveAspectRatio="xMidYMid meet">
        {/* Bezier curve connections */}
        {CIV_EDGES.map(([a, b], i) => {
          const pa = CIV_POSITIONS[a];
          const pb = CIV_POSITIONS[b];
          const highlighted = isEdgeHighlighted(a, b);
          return (
            <path
              key={`edge-${i}`}
              d={bezierPath(pa.x, pa.y, pb.x, pb.y)}
              fill="none"
              stroke={highlighted ? "#C89B6D" : "oklch(0.6 0.05 85 / 0.15)"}
              strokeWidth={highlighted ? 2 : 1.2}
              strokeDasharray="5 4"
              className="animate-civ-flow"
              style={{
                opacity: hovered === null ? 0.5 : highlighted ? 0.9 : 0.12,
                transition: "opacity 0.3s, stroke 0.3s, stroke-width 0.3s",
              }}
            />
          );
        })}

        {/* Center halo glow */}
        <circle cx="450" cy="280" r="60" fill="#C89B6D" opacity="0.08" />
        <circle cx="450" cy="280" r="40" fill="#C89B6D" opacity="0.06" />
      </svg>

      {/* Civilization nodes */}
      {CIV_POSITIONS.map((pos, i) => {
        const civ = CIVILIZATIONS[i];
        const isCenter = i === 0;
        const highlighted = isHighlighted(i);
        const dimmed = hovered !== null && !highlighted;
        return (
          <div
            key={civ.key}
            className="absolute animate-civ-enter"
            style={{
              left: `${(pos.x / 900) * 100}%`,
              top: `${(pos.y / 560) * 100}%`,
              transform: "translate(-50%, -50%)",
              animationDelay: `${i * 80}ms`,
              opacity: dimmed ? 0.35 : 1,
              transition: "opacity 0.3s",
              zIndex: isCenter ? 20 : 10,
            }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <div
              className="flex flex-col items-center cursor-pointer group"
              style={{
                transform: hovered === i ? "scale(1.12) translateY(-4px)" : "scale(1)",
                transition: "transform 0.3s ease",
              }}
            >
              {/* Glassmorphism node card */}
              <div
                className="relative flex items-center justify-center rounded-[22px] backdrop-blur-xl transition-all duration-300"
                style={{
                  width: isCenter ? 104 : 80,
                  height: isCenter ? 104 : 80,
                  background: isCenter
                    ? `linear-gradient(135deg, ${civ.color}22, ${civ.color}08)`
                    : isDark
                      ? `linear-gradient(135deg, oklch(0.2 0.01 85 / 0.6), oklch(0.18 0.008 85 / 0.4))`
                      : `linear-gradient(135deg, oklch(0.99 0.003 95 / 0.7), oklch(0.97 0.005 92 / 0.5))`,
                  border: `1px solid ${isCenter ? civ.color + "60" : isDark ? "oklch(0.4 0.02 85 / 0.4)" : "oklch(0.85 0.02 90 / 0.4)"}`,
                  boxShadow: isCenter
                    ? isDark
                      ? `0 0 36px ${civ.color}45, 0 4px 16px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.08)`
                      : `0 0 30px ${civ.color}30, 0 4px 16px rgba(0,0,0,0.06), inset 0 1px 1px rgba(255,255,255,0.5)`
                    : isDark
                      ? `0 0 16px ${civ.color}20, 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.04)`
                      : `0 2px 12px rgba(0,0,0,0.04), inset 0 1px 1px rgba(255,255,255,0.4)`,
                }}
              >
                {/* Hover glow */}
                <div
                  className="absolute inset-0 rounded-[22px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ boxShadow: `0 0 24px ${civ.color}${isDark ? "50" : "40"}` }}
                />
                <CivIcon name={civ.icon} size={isCenter ? 36 : 28} color={civ.color} />
              </div>
              {/* Label */}
              <span
                className="mt-2 text-[10px] sm:text-xs font-semibold font-civ-serif text-center transition-colors duration-300"
                style={{
                  color: hovered === i ? civ.color : isDark ? "oklch(0.78 0.02 85)" : "oklch(0.35 0.02 85)",
                  letterSpacing: "0.02em",
                }}
              >
                {t(civ.nameKey)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// CivDot — mobile grid card (glassmorphism)
// ═══════════════════════════════════════════════════════════════════════

function CivDot({
  civ,
  delay,
}: {
  civ: { key: string; nameKey: string; color: string; icon: string };
  delay: number;
}) {
  const { t } = useLocale();
  const isDark = useIsDark();
  return (
    <div
      className="flex flex-col items-center group cursor-default animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className="relative flex items-center justify-center w-14 h-14 rounded-[20px] backdrop-blur-xl transition-all duration-500 group-hover:-translate-y-1"
        style={{
          background: isDark
            ? `linear-gradient(135deg, oklch(0.2 0.01 85 / 0.6), oklch(0.18 0.008 85 / 0.4))`
            : `linear-gradient(135deg, oklch(0.99 0.003 95 / 0.7), oklch(0.97 0.005 92 / 0.5))`,
          border: `1px solid ${isDark ? "oklch(0.4 0.02 85 / 0.4)" : "oklch(0.85 0.02 90 / 0.4)"}`,
          boxShadow: isDark
            ? `0 0 16px ${civ.color}20, 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.04)`
            : `0 2px 12px rgba(0,0,0,0.04), inset 0 1px 1px rgba(255,255,255,0.4)`,
        }}
      >
        <div
          className="absolute inset-0 rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ boxShadow: `0 0 20px ${civ.color}${isDark ? "40" : "30"}` }}
        />
        <CivIcon name={civ.icon} size={26} color={civ.color} />
      </div>
      <span className="mt-1.5 text-[10px] sm:text-xs font-semibold font-civ-serif text-foreground text-center group-hover:text-primary transition-colors">
        {t(civ.nameKey)}
      </span>
    </div>
  );
}
