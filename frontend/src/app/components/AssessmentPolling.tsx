"use client";

import type { AssessmentCompleted, DimensionScores } from "@/types/assessment";
import { AssessmentResult } from "./AssessmentResult";
import { AICore } from "./AICore";
import { useLocale } from "@/hooks/useLocale";

interface AssessmentPollingProps {
  isPolling: boolean;
  elapsed: number;
  result: AssessmentCompleted | null;
  error?: string | null;
  /** Optional: pre-assessment scores for before/after comparison */
  beforeScores?: DimensionScores | null;
  /**
   * Optional: backend-driven current phase (1..5).
   * · If the backend PROCESSING status in the future exposes `phase: 1..5`,
   *   pass it here and AICore will prioritize real backend progress
   *   over the elapsed-time simulation.
   * · If omitted/null/out-of-range → fallback to elapsed-time simulation (backward compatible).
   */
  backendPhase?: number | null;
}

/**
 * AI 文明鉴定 —— 等待/错误/完成三态容器
 *
 * - 等待态：渲染 AI CORE 扫描动画 + 4 阶段分析指示器（替代普通 spinner）
 * - 错误态：以文明档案样式呈现失败信息
 * - 完成态：委派给 AssessmentResult 渲染鉴定报告
 */
export function AssessmentPolling({
  isPolling,
  elapsed,
  result,
  error,
  beforeScores,
  backendPhase,
}: AssessmentPollingProps) {
  const { t, locale } = useLocale();

  // 错误态（且尚无结果）—— 悬浮仪式提示，无卡片
  if (error && !result) {
    return (
      <div
        className="mx-auto max-w-md text-center"
        role="alert"
      >
        <div className="inline-flex items-center justify-center gap-2 font-civ-serif text-sm font-semibold text-destructive/85">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3L2 21h20L12 3z" />
            <path d="M12 10v5" strokeWidth="1.8" />
            <circle cx="12" cy="18" r="0.5" fill="currentColor" stroke="none" />
          </svg>
          {locale === "zh" ? "鉴定中断" : "Appraisal Interrupted"}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {error}
        </p>
        <p className="mt-3 text-xs text-muted-foreground/70">
          {t("assessment.retryPrompt")}
        </p>
      </div>
    );
  }

  // 等待态 —— 文明核心苏醒解析
  if (isPolling || (!result && !error)) {
    return (
      <div className="relative">
        <AICore elapsed={elapsed} backendPhase={backendPhase} />
      </div>
    );
  }

  // 完成态 → 委派给鉴定报告
  if (result) {
    return <AssessmentResult result={result} beforeScores={beforeScores} />;
  }

  return null;
}
