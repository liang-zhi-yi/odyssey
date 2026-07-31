"use client";

import { useState } from "react";
import { useLocale } from "@/hooks/useLocale";
import { QuestScrollIcon } from "./QuestScrollIcon";

interface SubmissionFormProps {
  questId: string;
  onSubmit: (data: {
    quest_id: string;
    content?: string;
    github_url?: string;
    demo_url?: string;
  }) => Promise<void>;
  isSubmitting: boolean;
  error?: string | null;
  /** Optional quest title for the ceremony header */
  questTitle?: string;
  /** Optional status label shown in the ceremony header */
  statusText?: string;
}

/**
 * SubmissionForm — 成果卷轴区域.
 *
 * Replaces the SaaS form with an RPG scroll-style submission panel:
 *   1. Ceremony header: 任务状态 → 等待成果评议 (with seal icons + progress line)
 *   2. Quest name (if provided)
 *   3. 成果描述 — scroll-input textarea (xuan paper texture)
 *   4. GitHub档案 / 演示记录 — scroll-input with leading SVG icon
 *   5. 提交成果 — text-type seal button (no solid background)
 *
 * No emoji. No green CTA. Uses .scroll-input / .scroll-seal-btn classes.
 */
export function SubmissionForm({
  questId,
  onSubmit,
  isSubmitting,
  error,
  questTitle,
  statusText,
}: SubmissionFormProps) {
  const { locale } = useLocale();
  const [content, setContent] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      quest_id: questId,
      content: content.trim() || undefined,
      github_url: githubUrl.trim() || undefined,
      demo_url: demoUrl.trim() || undefined,
    });
  };

  const canSubmit =
    !isSubmitting && (content.trim() || githubUrl.trim() || demoUrl.trim());

  const isZh = locale === "zh";

  // Ceremony header labels
  const statusLabel = statusText || (isZh ? "已接受" : "Accepted");
  const stageLabel = isZh ? "等待成果评议" : "Awaiting Review";
  const contentLabel = isZh ? "成果描述" : "Description";
  const contentPlaceholder = isZh
    ? "记录你的探索过程、解决方案与关键发现..."
    : "Record your exploration, solution and key findings...";
  const githubLabel = isZh ? "GitHub 档案" : "GitHub Archive";
  const demoLabel = isZh ? "演示记录" : "Demo Record";
  const submitText = isZh ? "献 上 成 果" : "Offer Your Work";
  const submittingText = isZh ? "提 交 中" : "Submitting";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
      {/* ── 仪式头：任务状态 → 等待成果评议 ─────────────── */}
      <div className="space-y-3 pb-2">
        <div className="flex items-center justify-center gap-3 text-[11px] font-civ-serif uppercase tracking-[0.18em]">
          <span className="text-[oklch(0.50_0.04_75)] dark:text-[oklch(0.65_0.045_80)]">
            {isZh ? "任务状态" : "Status"}
          </span>
          <QuestScrollIcon name="seal" size={13} className="text-[oklch(0.55_0.08_75)] dark:text-[oklch(0.70_0.08_80)]" strokeWidth={1.3} />
          <span className="font-bold text-[oklch(0.42_0.06_72)] dark:text-[oklch(0.78_0.07_80)]">
            {statusLabel}
          </span>
        </div>
        {/* Progress line: status → review */}
        <div className="flex items-center justify-center gap-2">
          <div className="h-px w-12 bg-[oklch(0.65_0.08_75_/_0.40)]" />
          <QuestScrollIcon name="arrow-right" size={12} className="text-[oklch(0.55_0.06_75_/_0.60)]" strokeWidth={1.3} />
          <div className="h-px flex-1 max-w-[80px] bg-gradient-to-r from-[oklch(0.65_0.08_75_/_0.40)] to-transparent" />
          <span className="text-[11px] font-civ-serif italic text-[oklch(0.50_0.04_75)] dark:text-[oklch(0.65_0.045_80)]">
            {stageLabel}
          </span>
        </div>
        {questTitle && (
          <p className="text-center font-civ-serif text-[14px] text-[oklch(0.35_0.03_70)] dark:text-[oklch(0.82_0.04_80)] italic mt-1">
            「{questTitle}」
          </p>
        )}
      </div>

      <div className="scroll-divider" />

      {/* ── 成果描述 — 古卷轴记录区域 ─────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <QuestScrollIcon name="scroll" size={14} className="text-[oklch(0.50_0.05_75)] dark:text-[oklch(0.70_0.06_80)]" strokeWidth={1.4} />
          <label htmlFor="submission-content" className="font-civ-serif text-[12px] font-bold text-[oklch(0.32_0.025_70)] dark:text-[oklch(0.85_0.04_80)] tracking-wide">
            {contentLabel}
          </label>
        </div>
        <textarea
          id="submission-content"
          rows={6}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={contentPlaceholder}
          className="scroll-input text-sm leading-[1.8] resize-y"
        />
      </div>

      {/* ── GitHub 档案 — 代码卷轴 ───────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <QuestScrollIcon name="application" size={14} className="text-[oklch(0.50_0.05_75)] dark:text-[oklch(0.70_0.06_80)]" strokeWidth={1.4} />
          <label htmlFor="submission-github" className="font-civ-serif text-[12px] font-bold text-[oklch(0.32_0.025_70)] dark:text-[oklch(0.85_0.04_80)] tracking-wide">
            {githubLabel}
          </label>
        </div>
        <input
          id="submission-github"
          type="url"
          value={githubUrl}
          onChange={(e) => setGithubUrl(e.target.value)}
          placeholder="https://github.com/..."
          className="scroll-input text-sm"
        />
      </div>

      {/* ── 演示记录 — 展示徽章 ───────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <QuestScrollIcon name="creation" size={14} className="text-[oklch(0.50_0.05_75)] dark:text-[oklch(0.70_0.06_80)]" strokeWidth={1.4} />
          <label htmlFor="submission-demo" className="font-civ-serif text-[12px] font-bold text-[oklch(0.32_0.025_70)] dark:text-[oklch(0.85_0.04_80)] tracking-wide">
            {demoLabel}
          </label>
        </div>
        <input
          id="submission-demo"
          type="url"
          value={demoUrl}
          onChange={(e) => setDemoUrl(e.target.value)}
          placeholder="https://..."
          className="scroll-input text-sm"
        />
      </div>

      {/* ── 错误提示 ──────────────────────────────────── */}
      {error && (
        <p className="text-xs text-destructive font-civ-serif italic text-center">{error}</p>
      )}

      {/* ── 提交成果 — 古卷轴印记按钮 ─────────────────── */}
      <div className="flex flex-col items-center pt-2">
        <button
          type="submit"
          disabled={!canSubmit}
          className="scroll-seal-btn text-[22px] sm:text-[24px]"
          aria-label={isZh ? "提交成果" : "Submit"}
        >
          {isSubmitting ? submittingText : submitText}
        </button>
        <p className="mt-5 text-[10px] text-[oklch(0.50_0.035_75)] dark:text-[oklch(0.62_0.04_80)] italic text-center font-civ-serif tracking-wide">
          {isZh
            ? "成果提交后将进入文明评议"
            : "Your work will enter civilization review"}
        </p>
      </div>
    </form>
  );
}
