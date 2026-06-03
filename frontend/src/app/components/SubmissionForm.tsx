"use client";

import { useState } from "react";

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
          提交内容
        </label>
        <textarea
          id="submission-content"
          rows={6}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="描述你的解决方案、思路和关键代码片段..."
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* GitHub URL */}
      <div>
        <label
          htmlFor="submission-github"
          className="block text-sm font-medium mb-1.5"
        >
          GitHub 仓库地址
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
          在线演示地址 <span className="text-muted-foreground/60">(可选)</span>
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
        {isSubmitting ? "提交中..." : "提交成果"}
      </button>
    </form>
  );
}
