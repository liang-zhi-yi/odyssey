"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR, { mutate } from "swr";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { learningPathService } from "@/services/learningPath.service";
import { PathRoadmap } from "@/app/components/PathRoadmap";
import { AIMentorPanel } from "@/app/components/AIMentorPanel";
import { PathMilestoneList } from "@/app/components/PathMilestoneList";
import { Loading } from "@/app/components/Loading";
import { ErrorState } from "@/app/components/ErrorState";
import { EmptyState } from "@/app/components/EmptyState";
import {
  PATH_STATUS_LABELS,
  PATH_STATUS_LABELS_ZH,
  type LearningPathDetail,
  type MentorSuggestion,
  type MilestoneNode,
} from "@/types/learningPath";

/** Civilization type → display info */
const CIV_INFO: Record<string, { zh: string; en: string; icon: string }> = {
  AI: { zh: "AI文明", en: "AI Civilization", icon: "🤖" },
  ENGINEERING: { zh: "工程文明", en: "Engineering", icon: "⚙️" },
  KNOWLEDGE: { zh: "知识文明", en: "Knowledge", icon: "📚" },
  BUSINESS: { zh: "商业文明", en: "Business", icon: "💼" },
  DESIGN: { zh: "设计文明", en: "Design", icon: "🎨" },
  SOCIAL: { zh: "社会文明", en: "Social", icon: "🤝" },
  SCIENCE: { zh: "科学文明", en: "Science", icon: "🔬" },
  LANGUAGE: { zh: "语言文明", en: "Language", icon: "🗣️" },
  HEALTH: { zh: "健康文明", en: "Health", icon: "💪" },
  FINANCE: { zh: "金融文明", en: "Finance", icon: "💰" },
};

export default function PathDetailPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { locale, t } = useLocale();
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

  const {
    data: path,
    isLoading,
    error,
  } = useSWR(
    isAuthenticated && pathId ? `learning-path-${pathId}` : null,
    () => learningPathService.getPath(pathId),
    { revalidateOnFocus: true }
  );

  const { data: mentorSuggestion, isLoading: mentorLoading } =
    useSWR<MentorSuggestion | null>(
      isAuthenticated && pathId ? `mentor-suggestions-${pathId}` : null,
      () => learningPathService.getMentorSuggestions(pathId).catch(() => null),
      { revalidateOnFocus: false, dedupingInterval: 60000 }
    );

  // ── Derived data ─────────────────────────────────────────────
  const civInfo = useMemo(() => {
    if (!path) return null;
    const civType = path.civilization_type || "";
    return CIV_INFO[civType] || null;
  }, [path]);

  const currentStage = useMemo(() => {
    if (!path?.milestones) return null;
    const activeMs = path.milestones.find((m) => !m.is_completed);
    if (!activeMs) {
      // All complete
      const last = path.milestones[path.milestones.length - 1];
      return last
        ? {
            title: last.title,
            title_en: last.title_en,
            idx: last.order_sequence,
            total: path.milestones.length,
            isComplete: true,
          }
        : null;
    }
    return {
      title: activeMs.title,
      title_en: activeMs.title_en,
      idx: activeMs.order_sequence,
      total: path.milestones.length,
      isComplete: false,
      building_target: activeMs.building_target,
    };
  }, [path]);

  const estimatedRemaining = useMemo(() => {
    if (!path?.milestones) return 0;
    let total = 0;
    for (const ms of path.milestones) {
      if (ms.is_completed) continue;
      for (const cp of ms.checkpoints || []) {
        if (!cp.is_completed) {
          total += cp.estimated_hours || 2;
        }
      }
    }
    return total;
  }, [path]);

  const civIndexGain = useMemo(() => {
    if (!path?.milestones) return 0;
    let total = 0;
    for (const ms of path.milestones) {
      if (ms.is_completed) continue;
      total += (ms.checkpoints?.length || 0) * 15;
    }
    return total;
  }, [path]);

  // Roadmap nodes built from milestones
  const roadmapNodes: MilestoneNode[] = useMemo(() => {
    if (!path?.milestones) return [];
    const completedCount = path.milestones.filter((m) => m.is_completed).length;
    return path.milestones.map((m, idx) => {
      let status: MilestoneNode["status"] = "LOCKED";
      if (m.is_completed) status = "COMPLETED";
      else if (idx === completedCount) status = "ACTIVE";

      const cpHours =
        m.checkpoints?.reduce((sum, cp) => sum + (cp.estimated_hours || 2), 0) || 0;

      return {
        id: m.id,
        title: m.title,
        title_en: m.title_en,
        order_sequence: m.order_sequence,
        estimated_hours: cpHours,
        status,
        skill_name: m.skill_name,
        associated_building: m.building_target
          ? {
              id: m.building_target.id,
              name: m.building_target.name,
              name_en: m.building_target.name_en,
              icon: m.building_target.icon,
              region: m.building_target.region,
              region_en: m.building_target.region_en,
              max_level: 10,
            }
          : path.targeted_buildings?.[0]
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
        progress_pct: m.is_completed ? 100 : idx === completedCount ? 0 : 0,
        checkpoints: m.checkpoints,
      };
    });
  }, [path]);

  // ── Auth guard ──────────────────────────────────────────────
  if (authLoading || !isAuthenticated) {
    return <Loading text="Validating..." />;
  }
  if (isLoading) return <Loading />;
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
          locale === "zh" ? "该学习路径不存在或已被删除" : "This learning path does not exist or has been deleted"
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
    } catch { /* SWR handles */ } finally {
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
    } catch { /* SWR handles */ } finally {
      setRegenerating(false);
    }
  };

  const handleToggleMilestone = async (milestoneId: string) => {
    try {
      await learningPathService.toggleMilestone(pathId, milestoneId);
      mutate(`learning-path-${pathId}`);
    } catch { /* SWR handles */ }
  };

  // ── Styles ──────────────────────────────────────────────────
  const warmStyles = {
    sage: "#8B9D83",
    cream: "#C4A77D",
    progressBg: "bg-[#8B9D83]",
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-6">
      {/* Back button */}
      <button
        onClick={() => router.push("/paths")}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        {locale === "zh" ? "返回路径列表" : "Back to Paths"}
      </button>

      {/* ═══ Edit Modal ═══ */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-xl border border-border p-6 w-full max-w-md mx-4 space-y-4">
            <h3 className="text-lg font-semibold">{locale === "zh" ? "编辑路径" : "Edit Path"}</h3>
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">{locale === "zh" ? "标题" : "Title"}</label>
                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B9D83]/50" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{locale === "zh" ? "描述" : "Description"}</label>
                <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B9D83]/50" />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowEdit(false)}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-secondary">
                  {locale === "zh" ? "取消" : "Cancel"}
                </button>
                <button type="submit" disabled={saving || !editTitle.trim()}
                  className="rounded-lg bg-[#8B9D83] px-4 py-1.5 text-sm font-semibold text-white transition-all hover:bg-[#7A8C72] disabled:opacity-50">
                  {saving ? (locale === "zh" ? "保存中..." : "Saving...") : (locale === "zh" ? "保存" : "Save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ Delete Confirmation ═══ */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-xl border border-border p-6 w-full max-w-sm mx-4 space-y-4">
            <h3 className="text-lg font-semibold">{locale === "zh" ? "确认删除" : "Confirm Delete"}</h3>
            <p className="text-sm text-muted-foreground">
              {locale === "zh" ? "此操作不可撤销。确定要删除此学习路径吗？" : "This action cannot be undone."}
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-secondary">
                {locale === "zh" ? "取消" : "Cancel"}
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="rounded-lg bg-destructive px-4 py-1.5 text-sm font-semibold text-destructive-foreground hover:opacity-90 disabled:opacity-50">
                {deleting ? (locale === "zh" ? "删除中..." : "Deleting...") : (locale === "zh" ? "删除" : "Delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          CIVILIZATION ROUTE HEADER
          ═══════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-[oklch(0.98_0.005_90)] to-[oklch(0.96_0.01_92)] p-6 shadow-card space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            {/* Civilization badge */}
            {civInfo && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{civInfo.icon}</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#C4A77D]/15 text-[#8B7355] border border-[#C4A77D]/25">
                  {locale === "en" ? civInfo.en : civInfo.zh}
                </span>
                {path.path_type === "AI_GENERATED" && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#8B9D83]/10 text-[#8B9D83] border border-[#8B9D83]/20">
                    AI {locale === "zh" ? "定制" : "Custom"}
                  </span>
                )}
              </div>
            )}
            <h1 className="text-2xl font-bold text-[oklch(0.3_0.02_80)]">{path.title}</h1>
            {path.description && (
              <p className="text-sm text-muted-foreground mt-1">{path.description}</p>
            )}
          </div>
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
            path.status === "COMPLETED"
              ? "bg-[#8B9D83]/15 text-[#8B9D83] border border-[#8B9D83]/25"
              : path.status === "ABANDONED"
              ? "bg-muted/50 text-muted-foreground border border-border"
              : "bg-[#C4A77D]/15 text-[#8B7355] border border-[#C4A77D]/25"
          }`}>
            {statusLabel}
          </span>
        </div>

        {/* Current stage banner */}
        {currentStage && (
          <div className="rounded-xl border border-[#C4A77D]/20 bg-[#C4A77D]/5 p-4 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{currentStage.isComplete ? "🎉" : "📍"}</span>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {locale === "zh" ? "当前阶段" : "Current Stage"}
                </p>
                <p className="text-sm font-semibold">
                  {currentStage.isComplete
                    ? locale === "zh"
                      ? "全部完成"
                      : "All Complete"
                    : locale === "en" && currentStage.title_en
                    ? currentStage.title_en
                    : currentStage.title}
                  <span className="text-xs text-muted-foreground ml-1">
                    ({currentStage.idx + 1}/{currentStage.total})
                  </span>
                </p>
              </div>
            </div>
            {currentStage.building_target && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs text-muted-foreground">
                  {locale === "zh" ? "目标建筑" : "Target Building"}:
                </span>
                <span className="text-lg">{currentStage.building_target.icon}</span>
                <span className="text-sm font-medium">
                  {locale === "en" && currentStage.building_target.name_en
                    ? currentStage.building_target.name_en
                    : currentStage.building_target.name}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl bg-background/60 border border-border/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">{locale === "zh" ? "总阶段" : "Stages"}</p>
            <p className="text-lg font-bold">{path.milestone_count || 0}</p>
          </div>
          <div className="rounded-xl bg-background/60 border border-border/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">{locale === "zh" ? "总节点" : "Checkpoints"}</p>
            <p className="text-lg font-bold">
              {path.milestones?.reduce((sum, m) => sum + (m.checkpoints?.length || 0), 0) || 0}
            </p>
          </div>
          <div className="rounded-xl bg-background/60 border border-border/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">{locale === "zh" ? "预计剩余" : "Est. Remaining"}</p>
            <p className="text-lg font-bold">{estimatedRemaining}h</p>
          </div>
          <div className="rounded-xl bg-background/60 border border-border/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">{locale === "zh" ? "文明指数" : "Civ Index"}</p>
            <p className="text-lg font-bold text-[#8B9D83]">+{civIndexGain}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{locale === "zh" ? "完成率" : "Completion"}</span>
            <span className="text-sm font-bold">{path.progress_pct}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-[oklch(0.92_0.01_90)] overflow-hidden border border-border/30">
            <div
              className={`h-full rounded-full transition-all duration-700 ${warmStyles.progressBg}`}
              style={{ width: `${path.progress_pct}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
          <button onClick={handleEdit}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
            {locale === "zh" ? "编辑" : "Edit"}
          </button>
          {path.path_type === "AI_GENERATED" && (
            <button onClick={handleRegenerate} disabled={regenerating}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors disabled:opacity-50">
              {regenerating ? (locale === "zh" ? "重新生成中..." : "Regenerating...") : (locale === "zh" ? "重新生成" : "Regenerate")}
            </button>
          )}
          <div className="flex-1" />
          <button onClick={() => setShowDeleteConfirm(true)}
            className="rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/5 transition-colors">
            {locale === "zh" ? "删除" : "Delete"}
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          MAIN CONTENT: 70/30 SPLIT
          ═══════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {locale === "zh" ? "文明发展路线图" : "Civilization Development Roadmap"}
        </h2>
        <div className="flex gap-1 rounded-lg bg-secondary p-0.5">
          <button onClick={() => setViewMode("roadmap")}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
              viewMode === "roadmap" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}>
            {locale === "zh" ? "路线图" : "Roadmap"}
          </button>
          <button onClick={() => setViewMode("milestones")}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
              viewMode === "milestones" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}>
            {locale === "zh" ? "里程碑列表" : "List"}
          </button>
        </div>
      </div>

      {viewMode === "roadmap" ? (
        /* ── 70/30 Roadmap + Mentor Split ── */
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left 70% — Civilization Roadmap Timeline */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              {roadmapNodes.length > 0 ? (
                <PathRoadmap nodes={roadmapNodes} pathId={pathId} />
              ) : (
                <EmptyState
                  title={locale === "zh" ? "暂无里程碑" : "No Milestones Yet"}
                  description={locale === "zh"
                    ? "AI 生成或预设路径将自动创建里程碑和路线图"
                    : "Milestones and roadmap will be created automatically"}
                />
              )}
            </div>

            {/* Building targets summary */}
            {path.targeted_buildings && path.targeted_buildings.length > 0 && (
              <div className="mt-4 rounded-2xl border border-[oklch(0.88_0.02_90)] bg-gradient-to-br from-[oklch(0.98_0.005_90)] to-[oklch(0.96_0.01_92)] p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏗️</span>
                  <h3 className="text-sm font-semibold">
                    {locale === "zh" ? "可解锁/升级建筑" : "Unlockable Buildings"}
                  </h3>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {path.targeted_buildings.map((tb) => (
                    <a key={tb.building_id} href={`/world?building=${tb.building_id}`}
                      className="flex items-center gap-3 rounded-xl border border-[oklch(0.88_0.02_90)] bg-[oklch(0.97_0.005_92)] px-4 py-3 transition-all hover:shadow-card hover:border-[#C4A77D]/30 group">
                      <span className="text-2xl group-hover:scale-110 transition-transform">{tb.building_icon || "🏛️"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {locale === "en" && tb.building_name_en ? tb.building_name_en : tb.building_name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {tb.remaining_milestones > 0
                            ? `${tb.remaining_milestones} ${locale === "zh" ? "个里程碑可推动升级" : "milestones to upgrade"}`
                            : locale === "zh" ? "已完成所有里程碑" : "All milestones completed"}
                        </p>
                      </div>
                      <svg className="w-3 h-3 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right 30% — Odyssey Agent Mentor Panel */}
          <div className="lg:col-span-2">
            <EnhancedMentorPanel
              suggestion={mentorSuggestion ?? null}
              isLoading={mentorLoading}
              pathId={pathId}
              currentStage={currentStage}
              estimatedRemaining={estimatedRemaining}
              civIndexGain={civIndexGain}
              progressPct={path.progress_pct}
              milestones={path.milestones}
            />
          </div>
        </div>
      ) : (
        /* ── Classic Milestone List View ── */
        <>
          {path.milestones.length === 0 ? (
            <EmptyState
              title={locale === "zh" ? "暂无里程碑" : "No Milestones Yet"}
              description={locale === "zh"
                ? "AI 生成或预设路径将自动创建里程碑"
                : "Milestones will be created automatically"}
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
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Enhanced Mentor Panel — inlined for co-location with the new layout
// ═══════════════════════════════════════════════════════════════════

function EnhancedMentorPanel({
  suggestion,
  isLoading,
  pathId,
  currentStage,
  estimatedRemaining,
  civIndexGain,
  progressPct,
  milestones,
}: {
  suggestion: MentorSuggestion | null;
  isLoading: boolean;
  pathId: string;
  currentStage: { title: string; title_en: string | null; idx: number; total: number; isComplete: boolean; building_target?: any } | null;
  estimatedRemaining: number;
  civIndexGain: number;
  progressPct: number;
  milestones: any[];
}) {
  const { locale } = useLocale();

  // Collect building targets from all milestones
  const buildingTargets = useMemo(() => {
    if (!milestones) return [];
    const seen = new Set<string>();
    const result: any[] = [];
    for (const ms of milestones) {
      if (ms.building_target && !seen.has(ms.building_target.id)) {
        seen.add(ms.building_target.id);
        result.push(ms.building_target);
      }
    }
    return result;
  }, [milestones]);

  // Count total quests generated
  const totalQuests = useMemo(() => {
    if (!milestones) return 0;
    return milestones.reduce(
      (sum: number, ms: any) =>
        sum + (ms.checkpoints?.reduce(
          (cSum: number, cp: any) => cSum + (cp.generated_quests?.length || 0), 0
        ) || 0),
      0
    );
  }, [milestones]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-card sticky top-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-muted skeleton-shimmer" />
          <div className="h-4 w-24 rounded-md bg-muted skeleton-shimmer" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 rounded-lg bg-muted skeleton-shimmer" />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden sticky top-20">
      {/* Mentor header */}
      <div className="bg-gradient-to-r from-[#8B9D83]/10 to-[#C4A77D]/10 px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🧠</span>
          <div>
            <h3 className="text-sm font-semibold text-[oklch(0.35_0.02_80)]">
              {locale === "zh" ? "奥德赛导师" : "Odyssey Mentor"}
            </h3>
            <p className="text-[10px] text-muted-foreground">
              {locale === "zh" ? "专属AI成长伙伴" : "AI Growth Companion"}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* ── Current Stage ── */}
        {currentStage && (
          <div className="rounded-xl bg-[#8B9D83]/5 border border-[#8B9D83]/10 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              {locale === "zh" ? "📍 当前阶段" : "📍 Current Stage"}
            </p>
            <p className="text-sm font-semibold">
              {currentStage.isComplete
                ? locale === "zh" ? "🎉 全部完成！" : "🎉 All Complete!"
                : locale === "en" && currentStage.title_en
                ? currentStage.title_en
                : currentStage.title}
            </p>
            {!currentStage.isComplete && (
              <p className="text-xs text-muted-foreground mt-1">
                {locale === "zh"
                  ? `第 ${currentStage.idx + 1} 阶段 / 共 ${currentStage.total} 阶段`
                  : `Stage ${currentStage.idx + 1} of ${currentStage.total}`}
              </p>
            )}
          </div>
        )}

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-[#C4A77D]/5 border border-[#C4A77D]/10 p-2.5 text-center">
            <p className="text-[10px] text-muted-foreground">{locale === "zh" ? "完成率" : "Progress"}</p>
            <p className="text-lg font-bold text-[oklch(0.35_0.02_80)]">{progressPct}%</p>
          </div>
          <div className="rounded-lg bg-[#C4A77D]/5 border border-[#C4A77D]/10 p-2.5 text-center">
            <p className="text-[10px] text-muted-foreground">{locale === "zh" ? "预计剩余" : "Est. Remaining"}</p>
            <p className="text-lg font-bold text-[oklch(0.35_0.02_80)]">{estimatedRemaining}h</p>
          </div>
        </div>

        {/* ── Civilization Index Gain ── */}
        <div className="rounded-xl bg-gradient-to-br from-[#8B9D83]/8 to-[#8B9D83]/3 border border-[#8B9D83]/15 p-3">
          <p className="text-[10px] uppercase tracking-wider text-[#8B9D83] mb-1 font-medium">
            {locale === "zh" ? "📈 可获得文明指数" : "📈 Civilization Index"}
          </p>
          <p className="text-xl font-bold text-[#6B8D73]">+{civIndexGain}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {locale === "zh" ? "完成剩余任务后获得" : "Upon completing remaining quests"}
          </p>
        </div>

        {/* ── Unlockable Buildings ── */}
        {buildingTargets.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium">
              {locale === "zh" ? "🏗️ 可解锁/升级建筑" : "🏗️ Unlockable Buildings"}
            </p>
            <div className="space-y-1.5">
              {buildingTargets.map((b: any) => (
                <div key={b.id} className="flex items-center gap-2 rounded-lg bg-secondary/30 px-3 py-2">
                  <span className="text-lg">{b.icon || "🏛️"}</span>
                  <span className="text-xs font-medium">
                    {locale === "en" && b.name_en ? b.name_en : b.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Quest Count ── */}
        <div className="flex items-center gap-3 rounded-lg bg-secondary/20 px-3 py-2.5">
          <span className="text-lg">📋</span>
          <div>
            <p className="text-xs font-medium">{totalQuests} {locale === "zh" ? "个任务" : "quests"}</p>
            <p className="text-[10px] text-muted-foreground">
              {locale === "zh" ? "已完成路径自动生成" : "Auto-generated from path"}
            </p>
          </div>
        </div>

        {/* ── Mentor suggestion ── */}
        {suggestion?.current_suggestion && (
          <div className="rounded-xl bg-[#8B9D83]/5 border border-[#8B9D83]/10 p-3">
            <p className="text-[10px] text-muted-foreground mb-1">
              {locale === "zh" ? "💡 导师建议" : "💡 Mentor Advice"}
            </p>
            <p className="text-xs leading-relaxed">{suggestion.current_suggestion}</p>
          </div>
        )}

        {/* ── Recommended quests ── */}
        {suggestion?.recommended_quests && suggestion.recommended_quests.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium">
              {locale === "zh" ? "🎯 推荐下一步" : "🎯 Recommended Next"}
            </p>
            <div className="space-y-2">
              {suggestion.recommended_quests.slice(0, 3).map((q) => (
                <a
                  key={q.quest_id}
                  href={`/quests/${q.quest_id}`}
                  className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5 transition-all hover:border-[#8B9D83]/30 hover:bg-[#8B9D83]/5 group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate group-hover:text-[oklch(0.35_0.02_80)]">{q.title}</p>
                    {q.skill_name && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">{q.skill_name}</p>
                    )}
                  </div>
                  <svg className="w-3 h-3 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ── Quick Actions ── */}
        <div className="pt-2 border-t border-border">
          <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wider">
            {locale === "zh" ? "⚡ 快捷操作" : "⚡ Quick Actions"}
          </p>
          <div className="flex flex-wrap gap-1.5">
            <a href="/quests"
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-[#8B9D83]/30 hover:bg-[#8B9D83]/5 transition-all">
              📋 {locale === "zh" ? "查看任务" : "View Quests"}
            </a>
            <a href="/world"
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-[#C4A77D]/30 hover:bg-[#C4A77D]/5 transition-all">
              🌍 {locale === "zh" ? "我的世界" : "My World"}
            </a>
            <button
              className="inline-flex items-center gap-1 rounded-lg border border-[#8B9D83]/20 bg-[#8B9D83]/5 px-3 py-1.5 text-xs font-medium text-[#8B9D83] hover:bg-[#8B9D83]/10 transition-all"
            >
              💬 {locale === "zh" ? "询问导师" : "Ask Mentor"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
