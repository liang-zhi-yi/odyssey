"use client";

import { useState, useEffect } from "react";
import useSWR, { mutate } from "swr";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { learningPathService } from "@/services/learningPath.service";
import { PathRoadmap } from "@/app/components/PathRoadmap";
import { AIMentorPanel } from "@/app/components/AIMentorPanel";
import { PathRewardsPreview } from "@/app/components/PathRewardsPreview";
import { PathMilestoneList } from "@/app/components/PathMilestoneList";
import { Loading } from "@/app/components/Loading";
import { ErrorState } from "@/app/components/ErrorState";
import { EmptyState } from "@/app/components/EmptyState";
import {
  PATH_STATUS_LABELS,
  PATH_STATUS_LABELS_ZH,
  type LearningPathDetail,
  type MentorSuggestion,
} from "@/types/learningPath";

export default function PathDetailPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { locale } = useLocale();
  const router = useRouter();
  const params = useParams();
  const pathId = params.id as string;

  const [showEdit, setShowEdit] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [viewMode, setViewMode] = useState<"roadmap" | "milestones">("roadmap");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch path detail
  const {
    data: path,
    isLoading,
    error,
  } = useSWR(
    isAuthenticated && pathId ? `learning-path-${pathId}` : null,
    () => learningPathService.getPath(pathId),
    { revalidateOnFocus: true }
  );

  // Fetch mentor suggestions
  const {
    data: mentorSuggestion,
    isLoading: mentorLoading,
  } = useSWR<MentorSuggestion | null>(
    isAuthenticated && pathId ? `mentor-suggestions-${pathId}` : null,
    () => learningPathService.getMentorSuggestions(pathId).catch(() => null),
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  if (authLoading || !isAuthenticated) {
    return <Loading text="Validating..." />;
  }

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <ErrorState
        message="Failed to load learning path"
        detail={
          typeof error === "object" && (error as any)?.message
            ? (error as any).message
            : undefined
        }
      />
    );
  }

  if (!path) {
    return (
      <EmptyState
        title={locale === "zh" ? "路径不存在" : "Path Not Found"}
        description={
          locale === "zh"
            ? "该学习路径不存在或已被删除"
            : "This learning path does not exist or has been deleted"
        }
        actionLabel={locale === "zh" ? "返回路径列表" : "Back to Paths"}
        actionHref="/paths"
      />
    );
  }

  const statusLabel =
    locale === "zh"
      ? PATH_STATUS_LABELS_ZH[path.status] ?? path.status
      : PATH_STATUS_LABELS[path.status] ?? path.status;

  const progressColor =
    path.status === "COMPLETED"
      ? "bg-green-500"
      : path.status === "ABANDONED"
      ? "bg-gray-400"
      : "bg-blue-500";

  // ── Handlers ────────────────────────────────────────────────
  const handleEdit = () => {
    setEditTitle(path.title);
    setEditDescription(path.description || "");
    setShowEdit(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;
    setSaving(true);
    try {
      await learningPathService.updatePath(pathId, {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
      });
      setShowEdit(false);
      mutate(`learning-path-${pathId}`);
    } catch {
      // error handled by SWR
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await learningPathService.deletePath(pathId);
      router.replace("/paths");
    } catch {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      await learningPathService.regeneratePath(pathId);
      mutate(`learning-path-${pathId}`);
    } catch {
      // error handled by SWR
    } finally {
      setRegenerating(false);
    }
  };

  const handleToggleMilestone = async (milestoneId: string) => {
    try {
      await learningPathService.toggleMilestone(pathId, milestoneId);
      mutate(`learning-path-${pathId}`);
    } catch {
      // error handled by SWR
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      {/* Back button */}
      <button
        onClick={() => router.push("/paths")}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        {locale === "zh" ? "返回路径列表" : "Back to Paths"}
      </button>

      {/* Edit modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-xl border border-border p-6 w-full max-w-md mx-4 space-y-4">
            <h3 className="text-lg font-semibold">
              {locale === "zh" ? "编辑路径" : "Edit Path"}
            </h3>
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {locale === "zh" ? "标题" : "Title"}
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {locale === "zh" ? "描述" : "Description"}
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEdit(false)}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-secondary"
                >
                  {locale === "zh" ? "取消" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={saving || !editTitle.trim()}
                  className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
                >
                  {saving
                    ? locale === "zh"
                      ? "保存中..."
                      : "Saving..."
                    : locale === "zh"
                    ? "保存"
                    : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-xl border border-border p-6 w-full max-w-sm mx-4 space-y-4">
            <h3 className="text-lg font-semibold">
              {locale === "zh" ? "确认删除" : "Confirm Delete"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {locale === "zh"
                ? "此操作不可撤销。确定要删除此学习路径吗？"
                : "This action cannot be undone. Are you sure you want to delete this learning path?"}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-secondary"
              >
                {locale === "zh" ? "取消" : "Cancel"}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-destructive px-4 py-1.5 text-sm font-semibold text-destructive-foreground hover:opacity-90 disabled:opacity-50"
              >
                {deleting
                  ? locale === "zh"
                    ? "删除中..."
                    : "Deleting..."
                  : locale === "zh"
                  ? "删除"
                  : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Path header ────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-background p-6 space-y-4">
        {/* Title row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">{path.title}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {path.category && (
                <span className="text-xs text-muted-foreground rounded-md bg-secondary px-2 py-0.5">
                  {path.category}
                </span>
              )}
              {path.target_date && (
                <span className="text-xs text-muted-foreground">
                  {new Date(path.target_date).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Status badge */}
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              path.status === "COMPLETED"
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : path.status === "ABANDONED"
                ? "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
            }`}
          >
            {statusLabel}
          </span>
        </div>

        {/* Description */}
        {path.description && (
          <p className="text-sm text-muted-foreground">{path.description}</p>
        )}

        {/* Path metadata summary */}
        {path.path_metadata?.path_summary && (
          <div className="rounded-lg bg-secondary/20 border border-border p-3">
            <p className="text-sm">{path.path_metadata.path_summary}</p>
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-4 text-sm flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">
              {locale === "zh" ? "难度" : "Difficulty"}:
            </span>
            <span className="font-medium">
              {"★".repeat(path.difficulty)}
              {"☆".repeat(5 - path.difficulty)}
            </span>
          </div>
          {path.path_type === "AI_GENERATED" && (
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              AI Customized
            </span>
          )}
          {path.path_type === "PRESET" && path.is_official && (
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {locale === "zh" ? "官方" : "Official"}
            </span>
          )}
          {path.path_metadata?.estimated_weeks != null && (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">
                {locale === "zh" ? "预计周数" : "Est. Weeks"}:
              </span>
              <span className="font-medium">
                {path.path_metadata.estimated_weeks}
              </span>
            </div>
          )}
          {path.milestone_count != null && (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">
                {locale === "zh" ? "里程碑" : "Milestones"}:
              </span>
              <span className="font-medium">{path.milestone_count}</span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {locale === "zh" ? "总体进度" : "Overall Progress"}
            </span>
            <span className="text-sm font-bold tabular-nums">
              {path.progress_pct}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${progressColor}`}
              style={{ width: `${path.progress_pct}%` }}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <button
            onClick={handleEdit}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            {locale === "zh" ? "编辑" : "Edit"}
          </button>
          {path.path_type === "AI_GENERATED" && (
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors disabled:opacity-50"
            >
              {regenerating
                ? locale === "zh"
                  ? "重新生成中..."
                  : "Regenerating..."
                : locale === "zh"
                ? "重新生成"
                : "Regenerate"}
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/5 transition-colors"
          >
            {locale === "zh" ? "删除" : "Delete"}
          </button>
        </div>
      </div>

      {/* ── World Impact — Targeted Buildings ────────────────── */}
      {path.targeted_buildings && path.targeted_buildings.length > 0 && (
        <section className="rounded-xl border border-[oklch(0.88_0.02_90)] bg-gradient-to-br from-[oklch(0.98_0.005_90)] to-[oklch(0.96_0.01_92)] p-5 space-y-3 animate-fade-in-up">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌍</span>
            <h2 className="text-sm font-semibold text-[oklch(0.35_0.02_80)]">
              {locale === "zh" ? "世界影响" : "World Impact"}
            </h2>
            <span className="text-[10px] text-[oklch(0.55_0.02_85)] bg-[oklch(0.96_0.008_90)] rounded-full px-2 py-0.5">
              {path.targeted_buildings.length}{" "}
              {locale === "zh" ? "栋建筑" : "buildings"}
            </span>
          </div>
          <p className="text-xs text-[oklch(0.55_0.02_85)]">
            {locale === "zh"
              ? "完成此路径的里程碑将提升以下建筑等级"
              : "Completing milestones in this path will upgrade these buildings"}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {path.targeted_buildings.map((tb) => {
              const buildingName =
                locale === "en" && tb.building_name_en
                  ? tb.building_name_en
                  : tb.building_name;
              const regionName =
                locale === "en" && tb.region_en ? tb.region_en : tb.region;
              return (
                <a
                  key={tb.building_id}
                  href={`/world?building=${tb.building_id}`}
                  className="flex items-center gap-3 rounded-lg border border-[oklch(0.88_0.02_90)] bg-[oklch(0.97_0.005_92)] px-3 py-2.5 transition-all hover:shadow-card hover:border-[oklch(0.72_0.12_85_/_0.25)] group"
                >
                  <span className="text-2xl transition-transform group-hover:scale-110">
                    {tb.building_icon || "🏛️"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[oklch(0.3_0.02_80)] truncate">
                      {buildingName}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {regionName && (
                        <span className="text-[10px] text-[oklch(0.55_0.02_85)]">
                          {regionName}
                        </span>
                      )}
                      {tb.remaining_milestones > 0 && (
                        <span className="text-[10px] font-medium text-[oklch(0.65_0.05_145)]">
                          +{tb.remaining_milestones}{" "}
                          {locale === "zh" ? "里程碑" : "milestones"}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-mono text-[oklch(0.55_0.02_85)]">
                    Lv.{tb.max_level}
                  </span>
                  <svg
                    className="w-3 h-3 text-[oklch(0.5_0.02_85)] shrink-0 transition-transform group-hover:translate-x-0.5"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </a>
              );
            })}
          </div>
        </section>
      )}
      {/* ── View Toggle & Content ────────────────────────────── */}
      <section className="space-y-4">
        {/* View toggle */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {locale === "zh" ? "发展路线图" : "Development Roadmap"}
          </h2>
          <div className="flex gap-1 rounded-lg bg-secondary p-0.5">
            <button
              onClick={() => setViewMode("roadmap")}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                viewMode === "roadmap"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {locale === "zh" ? "路线图" : "Roadmap"}
            </button>
            <button
              onClick={() => setViewMode("milestones")}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                viewMode === "milestones"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {locale === "zh" ? "里程碑列表" : "List"}
            </button>
          </div>
        </div>

        {viewMode === "roadmap" ? (
          /* ── Roadmap View ────────────────────────────────── */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main roadmap column */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                {path.roadmap_nodes && path.roadmap_nodes.length > 0 ? (
                  <PathRoadmap nodes={path.roadmap_nodes} pathId={pathId} />
                ) : path.milestones.length > 0 ? (
                  /* Fallback: build basic roadmap nodes from milestones */
                  <PathRoadmap
                    nodes={path.milestones.map((m, idx) => ({
                      id: m.id,
                      title: m.title,
                      title_en: m.title_en,
                      order_sequence: m.order_sequence,
                      estimated_hours: 4,
                      status: m.is_completed
                        ? "COMPLETED"
                        : idx === path.milestones.filter((x) => x.is_completed).length
                        ? "ACTIVE"
                        : "LOCKED",
                      skill_name: m.skill_name,
                      associated_building: path.targeted_buildings?.[0]
                        ? {
                            id: path.targeted_buildings[0].building_id,
                            name: path.targeted_buildings[0].building_name,
                            name_en: path.targeted_buildings[0].building_name_en,
                            icon: path.targeted_buildings[0].building_icon,
                            region: path.targeted_buildings[0].region,
                            region_en: path.targeted_buildings[0].region_en,
                            max_level: path.targeted_buildings[0].max_level,
                          }
                        : null,
                      progress_pct: m.is_completed ? 100 : 0,
                      checkpoints: m.checkpoints,
                    } as any))}
                    pathId={pathId}
                  />
                ) : (
                  <EmptyState
                    title={
                      locale === "zh" ? "暂无里程碑" : "No Milestones Yet"
                    }
                    description={
                      locale === "zh"
                        ? "AI 生成或预设路径将自动创建里程碑和路线图"
                        : "Milestones and roadmap will be created automatically by AI generation or preset paths"
                    }
                  />
                )}
              </div>
            </div>

            {/* Side panel: AI Mentor */}
            <div className="lg:col-span-1">
              <AIMentorPanel
                suggestion={mentorSuggestion ?? null}
                isLoading={mentorLoading}
                pathId={pathId}
              />
            </div>
          </div>
        ) : (
          /* ── Classic Milestone List View ────────────────── */
          <>
            {path.milestones.length === 0 ? (
              <EmptyState
                title={
                  locale === "zh" ? "暂无里程碑" : "No Milestones Yet"
                }
                description={
                  locale === "zh"
                    ? "AI 生成或预设路径将自动创建里程碑"
                    : "Milestones will be created automatically by AI generation or preset paths"
                }
              />
            ) : (
              <PathMilestoneList
                pathId={pathId}
                milestones={path.milestones}
                onToggle={handleToggleMilestone}
                targetedBuildings={path.targeted_buildings ?? null}
              />
            )}
          </>
        )}

        {/* Path Rewards Preview (shown in both views) */}
        <PathRewardsPreview
          rewards={path.rewards_preview ?? null}
          isLoading={false}
        />
      </section>
    </div>
  );
}
