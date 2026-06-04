"use client";

import { useState } from "react";
import { useLocale } from "@/hooks/useLocale";

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
}

/**
 * Form for submitting work against an accepted quest.
 * Supports text content, GitHub URL, and demo URL.
 */
export function SubmissionForm({
  questId,
  onSubmit,
  isSubmitting,
  error,
}: SubmissionFormProps) {
  const { t } = useLocale();
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Content */}
      <div>
        <label
          htmlFor="submission-content"
          className="block text-sm font-medium mb-1.5"
        >
          {t("quests.content")}
        </label>
        <textarea
          id="submission-content"
          rows={6}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("quests.contentPlaceholder")}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* GitHub URL */}
      <div>
        <label
          htmlFor="submission-github"
          className="block text-sm font-medium mb-1.5"
        >
          {t("quests.githubUrl")}
        </label>
        <input
          id="submission-github"
          type="url"
          value={githubUrl}
          onChange={(e) => setGithubUrl(e.target.value)}
          placeholder="https://github.com/..."
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Demo URL */}
      <div>
        <label
          htmlFor="submission-demo"
          className="block text-sm font-medium mb-1.5"
        >
          {t("quests.demoUrl")}
        </label>
        <input
          id="submission-demo"
          type="url"
          value={demoUrl}
          onChange={(e) => setDemoUrl(e.target.value)}
          placeholder="https://..."
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
      >
        {isSubmitting ? t("quests.submitting") : t("quests.submitButton")}
      </button>
    </form>
  );
}
