"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { useAgent } from "@/hooks/useAgent";
import { projectService } from "@/services/project.service";
import { skillService } from "@/services/skill.service";
import { Loading } from "@/app/components/Loading";
import { BackButton } from "@/app/components/BackButton";
import { BuildingSealIcon, inferSkillId } from "@/app/components/CivArchiveTheme";
import { QuestScrollIcon } from "@/app/components/QuestScrollIcon";
import { CivilizationProjection } from "@/app/components/CivilizationProjection";
import { skillDisplayName } from "@/lib/skillNames";
import { ApiRequestError } from "@/lib/api";

/** 从 AI 返回文本中提取 JSON 对象 */
function extractJson(raw: string): any {
  if (!raw) return null;
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1] : raw;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}

/** 将 AI 推荐的技能名匹配到后端技能库，返回匹配的技能 id（找不到返回 null） */
function matchRecommendedSkill(
  recommended: string[],
  skills: Array<{ id: string; name: string; name_en?: string | null }>
): string | null {
  for (const targetRaw of recommended) {
    const target = String(targetRaw).toLowerCase();
    const matched = skills.find((s) => {
      const name = (s.name || "").toLowerCase();
      const nameEn = (s.name_en || "").toLowerCase();
      const nameZh = skillDisplayName(s.name, s.name_en, "zh").toLowerCase();
      return (
        name === target ||
        name.includes(target) ||
        target.includes(name) ||
        nameEn === target ||
        nameEn.includes(target) ||
        nameZh === target ||
        nameZh.includes(target) ||
        target.includes(nameZh)
      );
    });
    if (matched) return matched.id;
  }
  return null;
}

export default function NewProjectPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, locale } = useLocale();
  const { sendMessageRaw } = useAgent();

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

  // AI 辅助
  const [aiInput, setAiInput] = useState("");
  const [aiThinking, setAiThinking] = useState(false);
  const [aiField, setAiField] = useState<string | null>(null);
  const [aiApplied, setAiApplied] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // 投影面板动态推演
  const [projectionAnalyzing, setProjectionAnalyzing] = useState(false);
  const [projectionError, setProjectionError] = useState<string | null>(null);
  const analyzingRef = useRef(false);
  const analyzeFnRef = useRef<() => void>(() => {});

  // Fetch available skills for association
  const { data: allSkills = [] } = useSWR(
    isAuthenticated ? "all-skills" : null,
    () => skillService.listSkills()
  );

  const canSubmit = !isSubmitting && title.trim().length > 0;

  const handleGenerate = async () => {
    if (!aiInput.trim() || aiThinking) return;
    setAiThinking(true);
    setAiError(null);
    setAiApplied(false);

    const instruction =
      locale === "zh"
        ? `请根据以下关于一次创造探索的用户描述，生成 JSON 结构化结果（不要输出多余文字，只输出 JSON）：
描述：${aiInput.trim()}

请返回如下格式：
{
  "exploration_log": "优化后的探索日志（2-3句话，描述创造目标、解决的问题与探索过程）",
  "field": "简洁的探索领域标签（如：智能交互）",
  "skills": ["推荐的能力领域名称，1-3个，需与技能库命名风格一致"]
}`
        : `Based on the following description of a creative exploration, generate a JSON result (output only JSON, no extra text):
Description: ${aiInput.trim()}

Return:
{
  "exploration_log": "refined exploration log (2-3 sentences describing goals, problem solved, and process)",
  "field": "a concise exploration field label (e.g. Intelligent Interaction)",
  "skills": ["recommended ability domain names, 1-3, matching the skill library naming style"]
}`;

    try {
      const raw = await sendMessageRaw(instruction, locale);
      const parsed = extractJson(raw);
      if (!parsed) {
        setAiError(t("projects.aiHelperError"));
        return;
      }
      // 应用结果
      if (typeof parsed.exploration_log === "string" && parsed.exploration_log) {
        setDescription(parsed.exploration_log);
      }
      if (typeof parsed.field === "string" && parsed.field) {
        setAiField(parsed.field);
      }
      // 推荐技能 — 匹配后端技能库，禁止硬编码
      if (Array.isArray(parsed.skills) && parsed.skills.length > 0) {
        const matchedId = matchRecommendedSkill(parsed.skills, allSkills);
        if (matchedId) setRelatedSkillId(matchedId);
      }
      setAiApplied(true);
    } catch {
      setAiError(t("projects.aiHelperError"));
    } finally {
      setAiThinking(false);
    }
  };

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

  // 动态推演 — 根据当前填写内容分析探索领域并推荐能力印记
  const analyzeProjection = async () => {
    const inputTitle = title.trim();
    const inputDesc = description.trim();
    if ((!inputTitle && !inputDesc) || analyzingRef.current) return;
    analyzingRef.current = true;
    setProjectionAnalyzing(true);
    setProjectionError(null);
    try {
      const prompt =
        locale === "zh"
          ? `请根据以下用户正在书写的文明探索档案，动态分析其探索领域并推荐能力印记。只输出 JSON，不要多余文字。
项目名称：${inputTitle || "（未填写）"}
探索日志：${inputDesc || "（未填写）"}

返回格式：
{
  "field": "简洁的探索领域标签（如：智能交互）",
  "skills": ["推荐的能力领域名称，1-3个，需与技能库命名风格一致"]
}`
          : `Based on the following civilization exploration archive being written by the user, dynamically analyze the exploration field and recommend ability seals. Output only JSON, no extra text.
Project name: ${inputTitle || "(empty)"}
Exploration log: ${inputDesc || "(empty)"}

Return:
{
  "field": "a concise exploration field label (e.g. Intelligent Interaction)",
  "skills": ["recommended ability domain names, 1-3, matching the skill library naming style"]
}`;
      const raw = await sendMessageRaw(prompt, locale);
      const parsed = extractJson(raw);
      if (!parsed) return;
      if (typeof parsed.field === "string" && parsed.field) {
        setAiField(parsed.field);
      }
      if (Array.isArray(parsed.skills) && parsed.skills.length > 0) {
        const matchedId = matchRecommendedSkill(parsed.skills, allSkills);
        if (matchedId) setRelatedSkillId(matchedId);
      }
    } catch {
      setProjectionError(t("projects.projectionAnalyzeError"));
    } finally {
      analyzingRef.current = false;
      setProjectionAnalyzing(false);
    }
  };

  // 让 analyzeFnRef 始终指向最新闭包
  useEffect(() => {
    analyzeFnRef.current = analyzeProjection;
  });

  // 防抖：用户暂停书写后自动触发动态推演
  useEffect(() => {
    const tid = setTimeout(() => {
      analyzeFnRef.current();
    }, 1200);
    return () => clearTimeout(tid);
  }, [title, description]);

  if (authLoading || !isAuthenticated) {
    return <Loading text={t("auth.validating")} />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      {/* Back navigation */}
      <BackButton href="/projects" label={t("projects.backToList")} />

      <div className="grid grid-cols-12 gap-6">
        {/* 左侧 — 文明档案录入区域 (约70%) */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
      {/* 顶部标题 */}
      <div className="relative">
        <div className="absolute -top-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[oklch(0.7_0.12_85_/_0.5)] to-transparent" />
        <div className="pt-4 flex items-start gap-3">
          <span className="flex-shrink-0 w-10 h-10 rounded-full border border-[oklch(0.7_0.12_85_/_0.4)] bg-[oklch(0.7_0.12_85_/_0.08)] dark:bg-[oklch(0.7_0.12_85_/_0.12)] flex items-center justify-center text-[oklch(0.55_0.10_85)] dark:text-[oklch(0.72_0.12_82)]">
            <QuestScrollIcon name="seal" size={20} strokeWidth={1.4} />
          </span>
          <div>
            <h1 className="text-2xl font-bold font-civ-serif text-[oklch(0.3_0.02_80)]">{t("projects.createArchive")}</h1>
            <p className="mt-1 text-sm font-civ-serif text-[oklch(0.5_0.02_85)]">
              {t("projects.newProjectSubtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* AI 辅助完善档案 */}
      <div className="relative rounded-lg border border-[oklch(0.7_0.12_85_/_0.3)] bg-gradient-to-br from-[oklch(0.99_0.003_95_/_0.6)] to-[oklch(0.975_0.005_92_/_0.4)] dark:from-[oklch(0.22_0.008_85_/_0.5)] dark:to-[oklch(0.2_0.006_85_/_0.5)] p-5 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[oklch(0.7_0.12_85_/_0.5)] to-transparent" />
        <div className="flex items-center gap-2 mb-2">
          <div className="relative w-6 h-6 flex items-center justify-center">
            {/* 微弱光晕 */}
            <span className="absolute inset-0 rounded-full bg-[oklch(0.7_0.12_85_/_0.2)] animate-pulse" />
            <span className="relative text-[oklch(0.55_0.10_85)] dark:text-[oklch(0.72_0.12_82)]">
              <QuestScrollIcon name="sparkle" size={16} strokeWidth={1.4} />
            </span>
          </div>
          <h2 className="text-sm font-bold font-civ-serif italic text-[oklch(0.4_0.08_85)] dark:text-[oklch(0.75_0.04_85)]">
            {t("projects.aiHelperTitle")}
          </h2>
        </div>
        <p className="text-xs text-[oklch(0.5_0.03_75)] dark:text-[oklch(0.62_0.02_80)] mb-3">
          {t("projects.aiHelperDesc")}
        </p>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            placeholder={t("projects.aiHelperPlaceholder")}
            className="flex-1 rounded-lg border border-[oklch(0.72_0.06_80_/_0.25)] bg-[oklch(0.99_0.003_95_/_0.6)] dark:bg-[oklch(0.18_0.008_85_/_0.6)] px-3 py-2 text-sm font-civ-serif text-[oklch(0.35_0.02_70)] dark:text-[oklch(0.85_0.04_80)] placeholder:text-[oklch(0.5_0.03_75_/_0.5)] focus:outline-none focus:border-[oklch(0.7_0.12_85)] focus:ring-2 focus:ring-[oklch(0.7_0.12_85_/_0.15)]"
          />
          <button
            type="button"
            onClick={handleGenerate}
            disabled={aiThinking || !aiInput.trim()}
            className="group relative inline-flex items-center gap-1.5 rounded-lg border border-[oklch(0.7_0.12_85_/_0.5)] bg-[oklch(0.99_0.003_95_/_0.5)] dark:bg-[oklch(0.22_0.008_85_/_0.5)] px-3.5 py-2 text-sm font-bold font-civ-serif text-[oklch(0.45_0.10_85)] dark:text-[oklch(0.72_0.12_82)] transition-all duration-300 hover:border-[oklch(0.65_0.12_85)] hover:shadow-[0_0_16px_rgba(201,164,92,0.25)] disabled:opacity-50 disabled:hover:shadow-none"
          >
            <span className="flex-shrink-0 w-4 h-4 rounded-full border border-[oklch(0.7_0.12_85_/_0.5)] bg-[oklch(0.7_0.12_85_/_0.1)] flex items-center justify-center">
              <QuestScrollIcon name="sparkle" size={10} strokeWidth={1.5} />
            </span>
            {aiThinking ? t("projects.aiHelperThinking") : t("projects.aiHelperSubmit")}
          </button>
        </div>

        {aiField && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[oklch(0.5_0.03_75)]">{t("projects.aiHelperField")}:</span>
            <span className="inline-flex items-center rounded-full border border-[oklch(0.6_0.08_145_/_0.3)] bg-[oklch(0.6_0.08_145_/_0.1)] px-2 py-0.5 text-[11px] font-medium text-[oklch(0.4_0.08_145)] dark:text-[oklch(0.72_0.09_145)]">
              {aiField}
            </span>
          </div>
        )}

        {aiApplied && (
          <p className="mt-2 text-[11px] text-[oklch(0.55_0.08_145)] dark:text-[oklch(0.7_0.09_145)]">
            {t("projects.aiHelperApplied")}
          </p>
        )}
        {aiError && (
          <p className="mt-2 text-[11px] text-destructive">{aiError}</p>
        )}
      </div>

      {/* 文明记录碑文表单 */}
      <form
        onSubmit={handleSubmit}
        className="relative rounded-lg border border-[oklch(0.72_0.06_80_/_0.18)] bg-gradient-to-br from-[oklch(0.99_0.003_95_/_0.6)] to-[oklch(0.975_0.005_92_/_0.4)] dark:from-[oklch(0.22_0.008_85_/_0.5)] dark:to-[oklch(0.2_0.006_85_/_0.5)] p-6 space-y-5 overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[oklch(0.7_0.12_85_/_0.5)] to-transparent" />

        {/* 创造名称 */}
        <div>
          <label htmlFor="project-title" className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-[oklch(0.5_0.03_75)] font-civ-serif">
            {t("projects.createTitle")} <span className="text-destructive">*</span>
          </label>
          <input
            id="project-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("projects.titlePlaceholder")}
            className="w-full bg-transparent border-b border-[oklch(0.72_0.06_80_/_0.35)] px-0 py-2 text-sm font-civ-serif text-[oklch(0.3_0.02_70)] dark:text-[oklch(0.85_0.04_80)] placeholder:text-[oklch(0.5_0.03_75_/_0.5)] focus:outline-none focus:border-[oklch(0.7_0.12_85)] transition-colors"
          />
          <p className="mt-1 text-[10px] text-[oklch(0.5_0.03_75_/_0.7)]">{t("projects.titleHint")}</p>
        </div>

        {/* 探索日志 */}
        <div>
          <label htmlFor="project-desc" className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-[oklch(0.5_0.03_75)] font-civ-serif">
            {t("projects.description")}
          </label>
          <textarea
            id="project-desc"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("projects.descriptionPlaceholder")}
            className="w-full bg-transparent rounded-sm bg-[repeating-linear-gradient(to_bottom,transparent_0px,transparent_27px,oklch(0.72_0.06_80_/_0.25)_27px,oklch(0.72_0.06_80_/_0.25)_28px)] px-0 py-1 text-sm font-civ-serif text-[oklch(0.3_0.02_70)] dark:text-[oklch(0.85_0.04_80)] placeholder:text-[oklch(0.5_0.03_75_/_0.5)] focus:outline-none leading-[28px]"
          />
          <p className="mt-1 text-[10px] text-[oklch(0.5_0.03_75_/_0.7)]">{t("projects.descriptionHint")}</p>
        </div>

        {/* 代码遗迹 */}
        <div>
          <label htmlFor="project-github" className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-[oklch(0.5_0.03_75)] font-civ-serif">
            {t("projects.githubUrlLabel")}
          </label>
          <input
            id="project-github"
            type="url"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            placeholder="https://github.com/..."
            className="w-full bg-transparent border-b border-[oklch(0.72_0.06_80_/_0.35)] px-0 py-2 text-sm font-civ-serif text-[oklch(0.3_0.02_70)] dark:text-[oklch(0.85_0.04_80)] placeholder:text-[oklch(0.5_0.03_75_/_0.5)] focus:outline-none focus:border-[oklch(0.7_0.12_85)] transition-colors"
          />
          <p className="mt-1 text-[10px] text-[oklch(0.5_0.03_75_/_0.7)]">{t("projects.githubUrlHint")}</p>
        </div>

        {/* 展示入口 */}
        <div>
          <label htmlFor="project-demo" className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-[oklch(0.5_0.03_75)] font-civ-serif">
            {t("projects.demoUrlLabel")} <span className="text-[oklch(0.5_0.03_75_/_0.6)]">({t("projects.optional")})</span>
          </label>
          <input
            id="project-demo"
            type="url"
            value={demoUrl}
            onChange={(e) => setDemoUrl(e.target.value)}
            placeholder="https://..."
            className="w-full bg-transparent border-b border-[oklch(0.72_0.06_80_/_0.35)] px-0 py-2 text-sm font-civ-serif text-[oklch(0.3_0.02_70)] dark:text-[oklch(0.85_0.04_80)] placeholder:text-[oklch(0.5_0.03_75_/_0.5)] focus:outline-none focus:border-[oklch(0.7_0.12_85)] transition-colors"
          />
          <p className="mt-1 text-[10px] text-[oklch(0.5_0.03_75_/_0.7)]">{t("projects.demoUrlHint")}</p>
        </div>

        {/* 能力印记 — 技能符文节点 */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider mb-2 text-[oklch(0.5_0.03_75)] font-civ-serif">
            {t("projects.createRelatedSkill")} <span className="text-[oklch(0.5_0.03_75_/_0.6)]">({t("projects.optional")})</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {allSkills.map((skill) => {
              const active = relatedSkillId === skill.id;
              return (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => setRelatedSkillId(active ? "" : skill.id)}
                  className={`group relative inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium font-civ-serif transition-all duration-300 ${
                    active
                      ? "border border-[oklch(0.7_0.12_85_/_0.6)] bg-[oklch(0.7_0.12_85_/_0.12)] text-[oklch(0.4_0.10_85)] dark:text-[oklch(0.75_0.04_85)] shadow-[0_0_12px_rgba(201,164,92,0.2)]"
                      : "border border-[oklch(0.72_0.06_80_/_0.25)] bg-[oklch(0.99_0.003_95_/_0.4)] dark:bg-[oklch(0.18_0.008_85_/_0.4)] text-[oklch(0.5_0.03_75)] dark:text-[oklch(0.6_0.02_80)] hover:border-[oklch(0.7_0.12_85_/_0.4)] hover:bg-[oklch(0.7_0.12_85_/_0.06)]"
                  }`}
                >
                  <BuildingSealIcon type={inferSkillId(skill.name, skill.id)} size={22} />
                  <span>{skillDisplayName(skill.name, skill.name_en, locale)}</span>
                  {/* 激活标记 */}
                  {active && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[oklch(0.7_0.12_85)] text-white flex items-center justify-center">
                      <svg width={8} height={8} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="mt-1 text-[10px] text-[oklch(0.5_0.03_75_/_0.7)]">{t("projects.createRelatedSkillHint")}</p>
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
            className="group relative flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-[oklch(0.7_0.12_85_/_0.5)] bg-[oklch(0.99_0.003_95_/_0.5)] dark:bg-[oklch(0.22_0.008_85_/_0.5)] px-4 py-2.5 text-sm font-bold font-civ-serif text-[oklch(0.45_0.10_85)] dark:text-[oklch(0.72_0.12_82)] transition-all duration-300 hover:border-[oklch(0.65_0.12_85)] hover:shadow-[0_0_20px_rgba(201,164,92,0.25)] hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
          >
            <span className="flex-shrink-0 w-6 h-6 rounded-full border border-[oklch(0.7_0.12_85_/_0.5)] bg-[oklch(0.7_0.12_85_/_0.1)] flex items-center justify-center">
              <QuestScrollIcon name="seal" size={14} strokeWidth={1.5} />
            </span>
            {isSubmitting ? t("projects.creating") : t("projects.create")}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-[oklch(0.72_0.06_80_/_0.25)] px-4 py-2.5 text-sm font-medium text-[oklch(0.5_0.03_75)] dark:text-[oklch(0.6_0.02_80)] transition-all hover:bg-[oklch(0.92_0.02_80_/_0.4)] dark:hover:bg-[oklch(0.22_0.012_78_/_0.35)]"
          >
            {t("common.cancel")}
          </button>
        </div>
      </form>
        </div>

        {/* 右侧 — 文明档案投影 (约30%) */}
        <div className="col-span-12 lg:col-span-4">
          <CivilizationProjection
            title={title}
            field={aiField}
            skillId={relatedSkillId}
            description={description}
            allSkills={allSkills}
            isAnalyzing={projectionAnalyzing}
            analyzeError={projectionError}
            onAnalyze={analyzeProjection}
          />
        </div>
      </div>
    </div>
  );
}