"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { projectService } from "@/services/project.service";
import { worldService } from "@/services/world.service";
import { ProjectGrowthGraph } from "@/app/components/ProjectGrowthGraph";
import { Loading } from "@/app/components/Loading";
import { ErrorState } from "@/app/components/ErrorState";
import { BackButton } from "@/app/components/BackButton";
import {
  QuestScrollIcon,
  resolveScrollIconName,
  type ScrollIconName,
} from "@/app/components/QuestScrollIcon";
import { CivIcon } from "@/app/components/CivIcon";
import {
  BuildingSealIcon,
  inferSkillId,
  ParchmentBackground,
  SealRing,
} from "@/app/components/CivArchiveTheme";
import { skillDisplayName } from "@/lib/skillNames";
import type { Project } from "@/types/project";
import type { World } from "@/types/world";

/** 格式化日期 → 2026.08.08 */
function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

/** 档案分区标题 — 印章 + 衬线标题 + 金色延伸线 */
function SectionTitle({ icon, title }: { icon: ScrollIconName; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="w-9 h-9 rounded-full border border-[#C89B45]/45 bg-[#C89B45]/10 flex items-center justify-center text-[#C89B45]">
        <QuestScrollIcon name={icon} size={16} strokeWidth={1.4} />
      </span>
      <h2 className="font-civ-serif text-lg font-bold text-[#34291F] dark:text-[oklch(0.91_0.018_85)]">
        {title}
      </h2>
      <div className="flex-1 h-px bg-gradient-to-r from-[#C89B45]/45 to-transparent" />
    </div>
  );
}

/** 探索入口 — 线性档案入口（非按钮） */
function ExploreEntry({
  icon,
  name,
  value,
  href,
}: {
  icon: ScrollIconName;
  name: string;
  value: string;
  href?: string | null;
}) {
  const has = Boolean(href);
  const row = (
    <div
      className={`group flex items-center gap-4 border-b border-[#D8C29A]/50 dark:border-[oklch(0.26_0.012_75)] px-2 py-4 transition-colors ${
        has ? "cursor-pointer hover:bg-[#C89B45]/5 dark:hover:bg-[oklch(0.7_0.12_85_/_0.06)]" : ""
      }`}
    >
      {/* 左侧印记 */}
      <span className="w-10 h-10 flex-shrink-0 rounded-full border border-[#C89B45]/40 bg-[#F8F3E8] dark:bg-[oklch(0.22_0.012_75)] flex items-center justify-center text-[#C89B45]">
        <QuestScrollIcon name={icon} size={18} strokeWidth={1.4} />
      </span>
      {/* 中间名称 */}
      <span className="font-civ-serif text-sm font-semibold text-[#34291F] dark:text-[oklch(0.91_0.018_85)]">
        {name}
      </span>
      {/* 右侧状态 */}
      <span className="flex-1" />
      <span
        className={`text-xs break-all text-right ${
          has ? "max-w-[46%] text-[#8C7650]" : "italic text-[#A89F90]"
        }`}
      >
        {value}
      </span>
      {has && (
        <span className="text-[#C89B45] opacity-0 group-hover:opacity-100 transition-opacity">
          <QuestScrollIcon name="arrow-right" size={16} strokeWidth={1.6} />
        </span>
      )}
    </div>
  );

  return has ? (
    <a href={href!} target="_blank" rel="noopener noreferrer" className="block">
      {row}
    </a>
  ) : (
    row
  );
}

export default function ProjectDetailPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, locale } = useLocale();

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch single project with enriched relations
  const {
    data: project,
    isLoading,
    error,
  } = useSWR<Project | null>(
    isAuthenticated && projectId ? `project-${projectId}` : null,
    () => projectService.getProject(projectId).catch(() => null)
  );

  // Fetch world for building context
  const { data: world } = useSWR<World | null>(
    isAuthenticated ? "world" : null,
    () => worldService.getWorld().catch(() => null),
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  const handleDelete = async () => {
    if (!projectId) return;
    setDeleting(true);
    try {
      await projectService.deleteProject(projectId);
      mutate("projects");
      mutate(`project-${projectId}`, null);
      router.replace("/projects");
    } catch {
      setDeleting(false);
      alert(t("projects.deleteError"));
    }
  };

  if (authLoading || !isAuthenticated) {
    return <Loading text={t("auth.validating")} />;
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <Loading text={t("common.loading")} />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <ErrorState
          message={t("common.error")}
          detail={error instanceof Error ? error.message : "Project not found"}
        />
      </div>
    );
  }

  // 卷首核心印记类型 — 从关联技能或项目名称推导
  const coreSealType = inferSkillId(
    project.related_skill?.name ?? project.title,
    project.related_skill?.id
  );

  // 文明贡献 — 仅展示已有数据，无则隐藏整个分区
  const showContribution = Boolean(project.related_skill || project.related_building);

  return (
    <div className="relative mx-auto max-w-4xl px-4 sm:px-6 py-8 overflow-hidden">
      {/* 背景装饰印章水印 */}
      <div className="pointer-events-none absolute -top-10 -right-16 opacity-[0.05] select-none dark:opacity-[0.04]">
        <SealRing size={260} />
      </div>
      <div className="pointer-events-none absolute bottom-24 -left-20 opacity-[0.04] select-none dark:opacity-[0.03]">
        <SealRing size={220} />
      </div>

      {/* 返回文明档案馆 */}
      <div className="civ-archive-rise" style={{ animationDelay: "0ms" }}>
        <BackButton href="/projects" label={t("projects.backToList")} />
      </div>

      {/* ═══ 卷首标题区域 ═══ */}
      <header
        className="civ-archive-rise relative mt-2 pt-12 pb-8 text-center"
        style={{ animationDelay: "120ms" }}
      >
        {/* 档案卷首装饰线 */}
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-[#C89B45]/60 to-transparent" />

        {/* 删除入口 — 右上角 */}
        <div className="absolute top-0 right-0">
          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#C89B45]/30 bg-[#C89B45]/5 px-3 py-1.5 text-xs text-[#A6653A] transition-colors hover:border-[#C89B45]/55 hover:bg-[#C89B45]/10"
            >
              <QuestScrollIcon name="shield" size={13} strokeWidth={1.6} />
              {t("projects.delete")}
            </button>
          ) : (
            <div className="w-64 rounded-lg border border-[#C89B45]/35 bg-[#FCF5E7] dark:bg-[oklch(0.20_0.012_70)] p-3 text-left shadow-sm">
              <p className="text-sm font-medium text-[#A6653A]">
                {t("projects.deleteConfirm")}
              </p>
              <p className="mt-1 text-xs text-[#8C7650]">
                {t("projects.deleteConfirmDesc")}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-md border border-[#A6653A]/50 bg-[#A6653A] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {deleting ? t("projects.deleting") : t("projects.deleteConfirmBtn")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="rounded-md border border-[#D8C29A] px-3 py-1.5 text-xs text-[#8C7650] transition-colors hover:bg-[#C89B45]/8 disabled:opacity-50"
                >
                  {t("projects.deleteCancel")}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 卷首核心印记 — 缓慢呼吸 */}
        <div className="civ-archive-breathe relative mx-auto w-24 h-24">
          <SealRing size={104} className="absolute inset-0" />
          <span className="absolute inset-0 m-auto flex h-[72px] w-[72px] items-center justify-center rounded-full border border-[#C89B45]/45 bg-[#F8F3E8] dark:bg-[oklch(0.22_0.012_75)] text-[#C89B45] shadow-[0_0_24px_rgba(200,155,69,0.18)]">
            <BuildingSealIcon type={coreSealType} size={52} />
          </span>
        </div>

        {/* 项目名称 */}
        <h1 className="mt-6 font-civ-serif text-3xl font-bold leading-tight text-[#34291F] dark:text-[oklch(0.91_0.018_85)] sm:text-4xl">
          {project.title}
        </h1>

        {/* 副标题 */}
        <div className="mt-5 flex items-center justify-center gap-3 text-[#C89B45]">
          <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#C89B45]/70" />
          <span className="font-civ-serif text-sm tracking-[0.3em] uppercase">
            {t("projects.detailSubtitle")}
          </span>
          <span className="h-px w-10 bg-gradient-to-l from-transparent to-[#C89B45]/70" />
        </div>

        {/* 辅助文字 */}
        <p className="mt-4 font-civ-serif text-sm text-[#8C7650] dark:text-[oklch(0.60_0.012_80)]">
          {t("projects.newProjectSubtitle")}
        </p>

        {/* 建立时间 */}
        {project.created_at && (
          <p className="mt-4 text-[11px] tracking-wider text-[#A89F90]">
            {t("projects.archive_established")} · {formatDate(project.created_at)}
          </p>
        )}
      </header>

      {/* ═══ 文明起源 ═══ */}
      <section className="civ-archive-rise mt-8" style={{ animationDelay: "260ms" }}>
        <SectionTitle icon="seal" title={t("projects.originTitle")} />
        <div className="relative overflow-hidden rounded-md border border-[#D8C29A] dark:border-[oklch(0.26_0.012_75)] bg-[#FCF5E7] dark:bg-[oklch(0.20_0.012_70)] p-6 shadow-sm sm:p-8">
          {/* 羊皮纸纹理 */}
          <ParchmentBackground opacity={0.5} />
          {/* 顶部金色线 */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C89B45]/55 to-transparent" />

          <div className="relative grid sm:grid-cols-2 gap-7">
            {/* 左侧：项目名称 */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#A89F90]">
                {t("projects.originNameLabel")}
              </p>
              <p className="mt-2 font-civ-serif text-xl font-semibold text-[#34291F] dark:text-[oklch(0.91_0.018_85)]">
                {project.title}
              </p>
            </div>

            {/* 右侧：创建描述 */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#A89F90]">
                {t("projects.originDescLabel")}
              </p>
              {project.description ? (
                <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-[#5A4A35] dark:text-[oklch(0.78_0.02_80)]">
                  {project.description}
                </p>
              ) : (
                <p className="mt-2 text-sm italic text-[#A89F90]">
                  {t("projects.originNoDesc")}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 文明演化路径 ═══ */}
      <section className="civ-archive-rise mt-9" style={{ animationDelay: "400ms" }}>
        <SectionTitle icon="tree" title={t("projects.evolutionTitle")} />
        <ProjectGrowthGraph project={project} worldBuildings={world?.buildings ?? []} />
      </section>

      {/* ═══ 探索入口 ═══ */}
      <section className="civ-archive-rise mt-9" style={{ animationDelay: "540ms" }}>
        <SectionTitle icon="compass" title={t("projects.entryTitle")} />
        <div className="rounded-md border border-[#D8C29A]/70 dark:border-[oklch(0.26_0.012_75)] bg-[#FCF5E7]/70 dark:bg-[oklch(0.20_0.012_70)/0.6] px-3">
          <ExploreEntry
            icon="rocket"
            name={t("projects.entryGithub")}
            value={project.github_url || t("projects.entryGithubEmpty")}
            href={project.github_url}
          />
          <ExploreEntry
            icon="monitor"
            name={t("projects.entryDemo")}
            value={project.demo_url || t("projects.entryDemoEmpty")}
            href={project.demo_url}
          />
        </div>
      </section>

      {/* ═══ 文明贡献 ═══ */}
      {showContribution && (
        <section className="civ-archive-rise mt-9" style={{ animationDelay: "680ms" }}>
          <SectionTitle icon="world-core" title={t("projects.contributionTitle")} />

          <div className="flex flex-wrap items-start gap-8">
            {/* 文明类型印章 — 来自关联技能 */}
            {project.related_skill && (
              <div className="flex items-center gap-5">
                <div className="relative flex h-24 w-24 flex-shrink-0 items-center justify-center">
                  <SealRing size={104} className="absolute inset-0" />
                  <span className="absolute inset-0 m-auto flex h-[68px] w-[68px] items-center justify-center rounded-full border border-[#C89B45]/45 bg-[#F8F3E8] dark:bg-[oklch(0.22_0.012_75)] text-[#C89B45]">
                    <CivIcon
                      type="type"
                      name={project.related_skill.category?.toLowerCase()}
                      size={44}
                      alt={project.related_skill.category}
                      fallback={
                        <BuildingSealIcon
                          type={inferSkillId(project.related_skill.name, project.related_skill.id)}
                          size={44}
                        />
                      }
                    />
                  </span>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#A89F90]">
                    {t("projects.contributionTypeLabel")}
                  </p>
                  <p className="mt-1 font-civ-serif text-base font-bold text-[#B07A2E]">
                    {project.related_skill.category}
                  </p>
                  <p className="mt-1 text-xs text-[#8C7650]">
                    {t("projects.contributionSkillLabel")} ·{" "}
                    {skillDisplayName(project.related_skill.name, undefined, locale)}
                  </p>
                </div>
              </div>
            )}

            {/* 关联建筑印章 */}
            {project.related_building && (
              <div className="flex items-center gap-5">
                <div className="relative flex h-24 w-24 flex-shrink-0 items-center justify-center">
                  <SealRing size={104} className="absolute inset-0" />
                  <span className="absolute inset-0 m-auto flex h-[68px] w-[68px] items-center justify-center rounded-full border border-[#C89B45]/45 bg-[#F8F3E8] dark:bg-[oklch(0.22_0.012_75)] text-[#C89B45]">
                    <CivIcon
                      type="building"
                      name={project.related_building.name}
                      size={44}
                      alt={project.related_building.name}
                      fallback={
                        <QuestScrollIcon
                          name={resolveScrollIconName(project.related_building.icon)}
                          size={44}
                          strokeWidth={1.3}
                        />
                      }
                    />
                  </span>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#A89F90]">
                    {t("projects.contributionBuildingLabel")}
                  </p>
                  <p className="mt-1 font-civ-serif text-base font-bold text-[#34291F] dark:text-[oklch(0.91_0.018_85)]">
                    {project.related_building.name}
                  </p>
                  <p className="mt-1 text-xs text-[#8C7650]">
                    Lv.{project.related_building.level}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}