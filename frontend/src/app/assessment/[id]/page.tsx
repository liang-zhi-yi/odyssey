"use client";

import { useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { usePolling } from "@/hooks/usePolling";
import { assessmentService } from "@/services/assessment.service";
import { AssessmentPolling } from "@/app/components/AssessmentPolling";
import { Loading } from "@/app/components/Loading";
import { BackButton } from "@/app/components/BackButton";
import type { AssessmentResult, AssessmentCompleted } from "@/types/assessment";

/* 背景漂浮粒子（确定性，避免 SSR 水合不一致） */
const BG_PARTICLES: { left: string; top: string; size: number; delay: string; dur: string }[] = [
  { left: "12%", top: "18%", size: 3, delay: "0s", dur: "9s" },
  { left: "22%", top: "70%", size: 4, delay: "1.2s", dur: "11s" },
  { left: "34%", top: "36%", size: 3, delay: "0.6s", dur: "8s" },
  { left: "50%", top: "12%", size: 2, delay: "2s", dur: "12s" },
  { left: "62%", top: "78%", size: 4, delay: "1.6s", dur: "10s" },
  { left: "72%", top: "28%", size: 3, delay: "0.3s", dur: "9.5s" },
  { left: "86%", top: "58%", size: 2, delay: "2.4s", dur: "13s" },
  { left: "40%", top: "86%", size: 3, delay: "0.9s", dur: "8.5s" },
];

/* 背景古文明符号（低透明浮现） */
const BG_SYMBOLS: { left: string; top: string; glyph: string }[] = [
  { left: "8%", top: "28%", glyph: "◈" },
  { left: "91%", top: "20%", glyph: "❖" },
  { left: "86%", top: "72%", glyph: "✦" },
  { left: "5%", top: "74%", glyph: "✒" },
];

export default function AssessmentPage() {
  const { id: assessmentId } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, locale } = useLocale();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const fetcher = useCallback(
    () => assessmentService.getAssessment(assessmentId),
    [assessmentId]
  );

  const { data, isLoading, error, isPolling, elapsed, refetch } =
    usePolling<AssessmentResult>(fetcher, {
      interval: 3000,
      stopWhen: (result) =>
        result.status === "COMPLETED" || result.status === "FAILED",
      timeout: 180000,
      onTimeout: () => {
        // Timeout — keep last data so user can see partial
      },
    });

  if (authLoading || !isAuthenticated) {
    return <Loading text={t("auth.validating")} />;
  }

  // Extract completed result if available
  const completedResult: AssessmentCompleted | null =
    data?.status === "COMPLETED" ? (data as AssessmentCompleted) : null;

  // Extract before_scores for comparison (Phase 5+)
  const beforeScores = completedResult?.before_scores ?? null;

  // Extract optional backend phase from PROCESSING status response
  // (without modifying type definitions — treated as future-extensible extra field)
  const backendPhase: number | null =
    data?.status === "PROCESSING"
      ? ((data as unknown as { phase?: unknown }).phase as number) ?? null
      : null;

  // Extract error from failed result
  const resultError =
    data?.status === "FAILED"
      ? (data as { error?: string | null }).error || t("assessment.failed")
      : error;

  const isCompleted = completedResult != null;

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* ── 文明档案空间背景层 ─────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        {/* 极浅暖灰档案基底 */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, oklch(0.985 0.002 92) 0%, oklch(0.965 0.006 88) 45%, oklch(0.945 0.01 84) 100%)",
          }}
        />
        {/* 水墨晕染纹理 */}
        <div
          className="absolute -left-24 -top-24 h-[28rem] w-[28rem] rounded-full opacity-70 blur-3xl"
          style={{ background: "radial-gradient(circle, oklch(0.88 0.03 75 / 0.35), transparent 70%)" }}
        />
        <div
          className="absolute -right-28 top-1/3 h-[30rem] w-[30rem] rounded-full opacity-60 blur-3xl"
          style={{ background: "radial-gradient(circle, oklch(0.86 0.025 90 / 0.3), transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 left-1/3 h-[24rem] w-[24rem] rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(circle, oklch(0.7 0.08 80 / 0.14), transparent 70%)" }}
        />
        {/* 古文明地图线 */}
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "linear-gradient(to right, oklch(0.55 0.03 80 / 0.08) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.55 0.03 80 / 0.08) 1px, transparent 1px)",
            backgroundSize: "88px 88px",
          }}
        />
        {/* 微弱星轨 */}
        <div className="absolute -right-24 -top-24 h-80 w-80 animate-slow-rotate">
          <div className="absolute inset-0 rounded-full border border-[oklch(0.6 0.05 80 / 0.12)]" />
          <div className="absolute inset-6 rounded-full border border-dashed border-[oklch(0.6 0.05 80 / 0.10)]" />
          {[
            { top: "-3px", left: "50%" },
            { top: "50%", left: "99%" },
            { bottom: "-3px", left: "50%" },
            { top: "50%", left: "-3px" },
          ].map((p, i) => (
            <span
              key={i}
              className="absolute h-1.5 w-1.5 rounded-full animate-twinkle"
              style={{ ...p, background: "oklch(0.62 0.07 80 / 0.6)", animationDelay: `${i * 0.6}s` }}
            />
          ))}
        </div>
        {/* 漂浮粒子 */}
        {BG_PARTICLES.map((p, i) => (
          <span
            key={i}
            className="absolute rounded-full animate-ambient-float"
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              background: "oklch(0.62 0.07 80 / 0.5)",
              animationDelay: p.delay,
              animationDuration: p.dur,
              boxShadow: "0 0 6px oklch(0.66 0.08 80 / 0.4)",
            }}
          />
        ))}
        {/* 文明符号低透明浮现 */}
        {BG_SYMBOLS.map((s, i) => (
          <span
            key={i}
            className="absolute select-none font-civ-serif"
            style={{
              left: s.left,
              top: s.top,
              color: "oklch(0.62 0.06 80 / 0.12)",
              fontSize: "34px",
              animation: `ink-symbol-float ${8 + i * 2}s ease-in-out infinite`,
              animationDelay: `${i * 1.2}s`,
            }}
          >
            {s.glyph}
          </span>
        ))}
      </div>

      <div className="relative mx-auto max-w-[820px] space-y-8 px-4 py-6 sm:px-6">
        {/* Back navigation */}
        <BackButton label={t("submission.backOneLevel")} />

        {/* ═══ 仪式化标题 ═════════════════════════════ */}
        <header className="relative text-center">
          <div className="flex items-center justify-center gap-3 text-[10px] font-civ-serif tracking-[0.35em] text-muted-foreground">
            <span className="h-px w-10" style={{ background: "linear-gradient(90deg, transparent, oklch(0.62 0.08 80 / 0.6))" }} />
            <span>{isCompleted ? (locale === "zh" ? "解析归档" : "ARCHIVE") : (locale === "zh" ? "文明核心解析仪式" : "RITUAL OF ANALYSIS")}</span>
            <span className="h-px w-10" style={{ background: "linear-gradient(90deg, oklch(0.62 0.08 80 / 0.6), transparent)" }} />
          </div>
          <h1 className="mt-3 font-civ-serif text-3xl font-bold tracking-wide" style={{ color: "oklch(0.35 0.04 75)" }}>
            {isCompleted
              ? t("assessment.completed") || "文明核心解析报告"
              : t("assessment.title") || "文明核心解析"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isCompleted
              ? t("assessment.completedSubtitle") || "你的文明印记已归档"
              : t("assessment.processingSubtitle") || "正在读取你的文明成长轨迹"}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2" aria-hidden>
            <span className="h-px w-20" style={{ background: "linear-gradient(90deg, transparent, oklch(0.68 0.10 80 / 0.8))" }} />
            <span style={{ color: "oklch(0.68 0.10 80)" }}>◈</span>
            <span className="h-px w-20" style={{ background: "linear-gradient(90deg, oklch(0.68 0.10 80 / 0.8), transparent)" }} />
          </div>
        </header>

        <AssessmentPolling
          isPolling={isPolling && !completedResult}
          elapsed={elapsed}
          result={completedResult}
          error={resultError}
          beforeScores={beforeScores}
          backendPhase={backendPhase}
        />
      </div>
    </div>
  );
}
