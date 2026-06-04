"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

const CORE_LOOP = [
  { step: "01", label: "Choose Path", desc: "选择成长路径", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" },
  { step: "02", label: "Accept Quest", desc: "接受能力挑战", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
  { step: "03", label: "Submit Work", desc: "提交实践成果", icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" },
  { step: "04", label: "AI Assessment", desc: "多维度AI评估", icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" },
  { step: "05", label: "Capability Growth", desc: "能力值成长更新", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
  { step: "06", label: "Earn Credential", desc: "解锁能力凭证", icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" },
];

const PRINCIPLES = [
  { title: "能力优先", sub: "Capability First", desc: "每项功能必须服务于真实能力成长" },
  { title: "先证明，再奖励", sub: "Prove Before Reward", desc: "通过AI评估验证后才能解锁成就" },
  { title: "成长靠挑战", sub: "Growth Must Be Earned", desc: "无被动积累。成长只来自完成真实挑战" },
  { title: "世界反映能力", sub: "World Reflects Reality", desc: "每个建筑升级对应真实世界的能力变化" },
];

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show nothing during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <main className="min-h-[calc(100vh-57px)]">
      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />

        <div className="relative mx-auto max-w-4xl px-6 py-24 sm:py-32 lg:py-40">
          <div className="text-center animate-fade-in-up">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              MVP Phase 1 — Capability Tracker
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              <span className="block text-foreground">Odyssey</span>
              <span className="mt-3 block bg-gradient-to-r from-primary to-accent bg-clip-text text-2xl font-semibold text-transparent sm:text-3xl lg:text-4xl">
                AI-Powered Capability Civilization Builder
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg leading-relaxed">
              不是课程平台，不是题库平台，不是打卡平台。
              <br />
              这是一个<strong className="text-foreground">能力成长工具</strong>——
              记录你的成长轨迹，证明你的真实能力，建设属于你的能力文明。
            </p>

            {/* CTA */}
            <div className="mt-10 flex items-center justify-center gap-4">
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 btn-press"
                >
                  进入 Dashboard
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 btn-press"
                  >
                    开始你的 Odyssey
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-6 py-3 text-sm font-medium text-foreground transition-all hover:bg-secondary"
                  >
                    登录
                  </Link>
                </>
              )}
            </div>

            {/* Core metric badges */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-sm font-semibold text-foreground">4</span> Skills
              </div>
              <span className="text-border">|</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-sm font-semibold text-foreground">8</span> Quests
              </div>
              <span className="text-border">|</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-sm font-semibold text-foreground">5</span> Credentials
              </div>
              <span className="text-border">|</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-sm font-semibold text-foreground">4</span> Dimensions Scoring
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Core Loop ────────────────────────────────────── */}
      <section className="border-b border-border bg-secondary/50">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <div className="text-center mb-14">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              核心循环 <span className="text-muted-foreground font-normal">Core Loop</span>
            </h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-lg mx-auto">
              Odyssey 不是被动学习的平台，而是一个主动成长的能力引擎
            </p>
          </div>

          {/* Loop visualization */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {CORE_LOOP.map((item, i) => (
              <div key={item.step} className="group relative">
                {/* Connector line */}
                {i < CORE_LOOP.length - 1 && (
                  <div className="absolute right-0 top-1/2 hidden h-px w-4 -translate-y-1/2 bg-border lg:block" />
                )}

                <div className="flex flex-col items-center rounded-xl border border-border bg-background p-5 text-center transition-all hover:border-primary/30 hover:shadow-md">
                  {/* Step number */}
                  <span className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-widest text-primary/60">
                    {item.step}
                  </span>
                  {/* Icon */}
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                    </svg>
                  </div>
                  {/* Label */}
                  <h3 className="text-sm font-semibold">{item.label}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Loop flow arrow on mobile */}
          <div className="mt-8 flex items-center justify-center gap-1 text-muted-foreground lg:hidden">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <span className="text-xs">Scroll</span>
          </div>
        </div>
      </section>

      {/* ─── Principles ───────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <div className="text-center mb-14">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            设计原则 <span className="text-muted-foreground font-normal">Principles</span>
          </h2>
          <p className="mt-3 text-sm text-muted-foreground max-w-lg mx-auto">
            Odyssey 绝不是课程平台、题库平台、打卡平台或 RPG 升级游戏
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PRINCIPLES.map((p) => (
            <div
              key={p.title}
              className="rounded-xl border border-border bg-background p-6 transition-all hover:border-primary/20 hover:shadow-sm"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-primary">{p.sub}</p>
              <h3 className="mt-2 text-lg font-bold">{p.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────── */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-8 text-center text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Odyssey</span> · AI-Powered Capability Civilization Builder · MVP Phase 1
        </div>
      </footer>
    </main>
  );
}
