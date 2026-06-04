"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { projectService } from "@/services/project.service";
import { skillService } from "@/services/skill.service";
import { Loading } from "@/app/components/Loading";
import { BackButton } from "@/app/components/BackButton";
import { ApiRequestError } from "@/lib/api";

export default function NewProjectPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useLocale();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [relatedSkillId, setRelatedSkillId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available skills for association
  const { data: allSkills = [] } = useSWR(
    isAuthenticated ? "all-skills" : null,
    () => skillService.listSkills()
  );

  if (authLoading || !isAuthenticated) {
    return <Loading text={t("auth.validating")} />;
  }

  const canSubmit = !isSubmitting && title.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const project = await projectService.createProject({
        title: title.trim(),
        description: description.trim() || null,
        github_url: githubUrl.trim() || null,
        demo_url: demoUrl.trim() || null,
        related_skill_id: relatedSkillId || null,
      });

      router.push(`/projects/${project.id}`);
    } catch (err) {
      const message =
        err instanceof ApiRequestError
          ? err.message
          : t("common.error");
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-6">
      {/* Back navigation */}
      <BackButton href="/projects" label={t("projects.backToList")} />

      <div>
        <h1 className="text-2xl font-bold">{t("projects.newProject")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("projects.newProjectSubtitle")}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-border bg-background p-6 space-y-4"
      >
        {/* Title */}
        <div>
          <label
            htmlFor="project-title"
            className="block text-sm font-medium mb-1.5"
          >
            {t("projects.createTitle")} <span className="text-destructive">*</span>
          </label>
          <input
            id="project-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("projects.titlePlaceholder")}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="project-desc"
            className="block text-sm font-medium mb-1.5"
          >
            {t("projects.description")}
          </label>
          <textarea
            id="project-desc"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("projects.descriptionPlaceholder")}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* GitHub URL */}
        <div>
          <label
            htmlFor="project-github"
            className="block text-sm font-medium mb-1.5"
          >
            {t("projects.githubUrlLabel")}
          </label>
          <input
            id="project-github"
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
            htmlFor="project-demo"
            className="block text-sm font-medium mb-1.5"
          >
            {t("projects.demoUrlLabel")} <span className="text-muted-foreground/60">({t("projects.optional")})</span>
          </label>
          <input
            id="project-demo"
            type="url"
            value={demoUrl}
            onChange={(e) => setDemoUrl(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Related Skill */}
        <div>
          <label
            htmlFor="project-skill"
            className="block text-sm font-medium mb-1.5"
          >
            {t("projects.relatedSkill")} <span className="text-muted-foreground/60">({t("projects.optional")})</span>
          </label>
          <select
            id="project-skill"
            value={relatedSkillId}
            onChange={(e) => setRelatedSkillId(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">{t("projects.noAssociation")}</option>
            {allSkills.map((skill) => (
              <option key={skill.id} value={skill.id}>
                {skill.name}
              </option>
            ))}
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? t("projects.creating") : t("projects.create")}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
          >
            {t("common.cancel")}
          </button>
        </div>
      </form>
    </div>
  );
}
