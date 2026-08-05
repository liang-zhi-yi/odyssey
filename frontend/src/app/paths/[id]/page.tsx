"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import useSWR, { mutate } from "swr";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { skillDisplayName } from "@/lib/skillNames";
import { learningPathService } from "@/services/learningPath.service";
import { PathRoadmap } from "@/app/components/PathRoadmap";
import { Loading } from "@/app/components/Loading";
import { ErrorState } from "@/app/components/ErrorState";
import { EmptyState } from "@/app/components/EmptyState";
import { QuestScrollIcon, type ScrollIconName } from "@/app/components/QuestScrollIcon";
import {
  PATH_STATUS_LABELS,
  PATH_STATUS_LABELS_ZH,
  type LearningPathDetail,
  type MentorSuggestion,
  type MilestoneNode,
} from "@/types/learningPath";

/** Civilization type → display info */
const CIV_INFO: Record<string, { zh: string; en: string; icon: ScrollIconName }> = {
  AI: { zh: "AI文明", en: "AI Civilization", icon: "sparkle" },
  ENGINEERING: { zh: "工程文明", en: "Engineering", icon: "application" },
  KNOWLEDGE: { zh: "知识文明", en: "Knowledge", icon: "knowledge" },
  BUSINESS: { zh: "商业文明", en: "Business", icon: "mission" },
  DESIGN: { zh: "设计文明", en: "Design", icon: "creation" },
  SOCIAL: { zh: "社会文明", en: "Social", icon: "shield" },
  SCIENCE: { zh: "科学文明", en: "Science", icon: "reasoning" },
  LANGUAGE: { zh: "语言文明", en: "Language", icon: "sparkle" },
  HEALTH: { zh: "健康文明", en: "Health", icon: "shield" },
  FINANCE: { zh: "金融文明", en: "Finance", icon: "seal" },
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
  const [generatingAI, setGeneratingAI] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const autoGenTriggered = useRef(false);

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

  // ── Auto-generate AI path if empty ────────────────────────────
  useEffect(() => {
    if (
      path &&
      !autoGenTriggered.current &&
      path.path_type === "AI_GENERATED" &&
      (!path.milestones || path.milestones.length === 0) &&
      !generatingAI
    ) {
      autoGenTriggered.current = true;
      setGeneratingAI(true);
      setGenerationError(null);
      learningPathService
        .generatePath(pathId)
        .then(() => {
          mutate(`learning-path-${pathId}`);
          mutate("user-learning-paths");
          setGeneratingAI(false);
        })
        .catch((err: any) => {
          setGenerationError(err?.message || "Generation failed");
          setGeneratingAI(false);
          // Still revalidate in case partial generation succeeded
          mutate(`learning-path-${pathId}`);
        });
    }
  }, [path, pathId, generatingAI, mutate]);

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

  // ── AI generation loading overlay ────────────────────────────
  if (generatingAI) {
    return (
      <div className="mx-auto max-w-6xl space-y-5 px-4 py-6">
        <button
          onClick={() => router.push("/paths")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {locale === "zh" ? "返回路径列表" : "Back to Paths"}
        </button>
        <div className="rounded-2xl border border-border bg-card p-12 text-center space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-[#C4A77D]/20 border-t-[#C4A77D] animate-spin" />
              <span className="absolute inset-0 flex items-center justify-center"><QuestScrollIcon name="sparkle" size={28} /></span>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold">
              {locale === "zh" ? "AI 正在生成学习路径..." : "AI is generating your learning path..."}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              {locale === "zh"
                ? "正在分析你的目标，设计里程碑、检查点和任务。这可能需要 30-120 秒，请耐心等待。"
                : "Analyzing your goal, designing milestones, checkpoints, and quests. This may take 30-120 seconds."}
            </p>
          </div>
          <div className="space-y-2 max-w-sm mx-auto">
            {[
              { icon: "reasoning" as const, text: locale === "zh" ? "分析目标领域..." : "Analyzing goal domain..." },
              { icon: "world-core" as const, text: locale === "zh" ? "设计文明发展路线..." : "Designing civilization route..." },
              { icon: "building" as const, text: locale === "zh" ? "规划里程碑与检查点..." : "Planning milestones & checkpoints..." },
              { icon: "checklist" as const, text: locale === "zh" ? "生成学习任务..." : "Generating quests..." },
            ].map((step, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg bg-secondary/30 px-4 py-2.5 text-sm animate-pulse"
                style={{ animationDelay: `${i * 0.3}s` }}
              >
                <QuestScrollIcon name={step.icon} size={18} />
                <span className="text-muted-foreground">{step.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Generation error banner ──────────────────────────────────
  if (generationError && path && (!path.milestones || path.milestones.length === 0)) {
    return (
      <div className="mx-auto max-w-6xl space-y-5 px-4 py-6">
        <button
          onClick={() => router.push("/paths")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {locale === "zh" ? "返回路径列表" : "Back to Paths"}
        </button>
        <div className="rounded-2xl border border-border bg-card p-8 text-center space-y-4">
          <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><path d="M12 9v4M12 17h.01" /></svg>
          <h2 className="text-lg font-semibold">
            {locale === "zh" ? "生成失败" : "Generation Failed"}
          </h2>
          <p className="text-sm text-muted-foreground">{generationError}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setGenerationError(null);
                autoGenTriggered.current = false;
                setGeneratingAI(false);
              }}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              {locale === "zh" ? "重试生成" : "Retry Generation"}
            </button>
            <button
              onClick={() => router.push("/paths")}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary"
            >
              {locale === "zh" ? "返回路径列表" : "Back to Paths"}
            </button>
          </div>
        </div>
      </div>
    );
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

  // Low-key text status marker (◉ ◎ ○) — no colored pill backgrounds.
  const statusMark =
    path.status === "COMPLETED" ? "◎" : path.status === "ABANDONED" ? "○" : "◉";

  // ── Path metrics for the horizontal inscription bar ──────────
  const totalCheckpoints =
    path.milestones?.reduce((sum, m) => sum + (m.checkpoints?.length || 0), 0) || 0;
  const targetedBuildings = path.targeted_buildings ?? [];
  const pathMetrics: { icon: ScrollIconName; label: string; value: string }[] = [
    {
      icon: "mission",
      label: locale === "zh" ? "当前阶段" : "Stage",
      value: currentStage ? `${currentStage.idx + 1}/${currentStage.total}` : "—",
    },
    {
      icon: "scroll",
      label: locale === "zh" ? "总阶段" : "Stages",
      value: String(path.milestone_count || 0),
    },
    {
      icon: "checklist",
      label: locale === "zh" ? "节点" : "Checkpoints",
      value: String(totalCheckpoints),
    },
    {
      icon: "hourglass",
      label: locale === "zh" ? "预计剩余" : "Est. Time",
      value: `${estimatedRemaining}h`,
    },
    {
      icon: "star",
      label: locale === "zh" ? "文明增益" : "Civ Gain",
      value: `+${civIndexGain}`,
    },
  ];

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

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-6">
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
          PATH INSCRIPTION — 路径铭牌
          Unifies the upper info area into the Odyssey archive language:
          no cards, thin warm-gold lines, low-key status, thin growth line.
          ═══════════════════════════════════════════════════════════ */}
      <div className="border-y border-[oklch(0.6_0.10_85_/_0.4)] py-6 space-y-5">
        {/* ── Title row + low-key status ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            {civInfo && (
              <div className="flex items-center gap-2 mb-2 text-[oklch(0.55_0.10_85)]">
                <QuestScrollIcon name={civInfo.icon} size={15} />
                <span className="text-xs tracking-wide">{locale === "en" ? civInfo.en : civInfo.zh}</span>
                {path.path_type === "AI_GENERATED" && (
                  <>
                    <span className="text-[oklch(0.6_0.10_85_/_0.4)]">·</span>
                    <span className="text-[10px] italic text-muted-foreground">AI {locale === "zh" ? "定制" : "Custom"}</span>
                  </>
                )}
              </div>
            )}
            <h1 className="text-2xl font-bold font-civ-serif text-[oklch(0.3_0.02_80)] dark:text-[oklch(0.85_0.04_80)]">
              {path.title}
            </h1>
            {path.description && (
              <p className="mt-1.5 max-w-2xl text-sm italic leading-relaxed text-muted-foreground">
                {path.description}
              </p>
            )}
          </div>
          <span
            className={`shrink-0 text-xs tracking-wide ${
              path.status === "COMPLETED"
                ? "text-[oklch(0.5_0.05_80)]"
                : path.status === "ABANDONED"
                ? "text-muted-foreground"
                : "text-[oklch(0.55_0.10_85)]"
            }`}
          >
            <span className="mr-1.5" aria-hidden>{statusMark}</span>
            {statusLabel}
          </span>
        </div>

        {/* ── Current stage (low-key, no card) ── */}
        {currentStage && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <QuestScrollIcon
              name={currentStage.isComplete ? "star" : "mission"}
              size={14}
              className="text-[oklch(0.6_0.10_85)]"
            />
            <span className="font-medium text-[oklch(0.35_0.02_80)] dark:text-[oklch(0.85_0.04_80)]">
              {currentStage.isComplete
                ? locale === "zh" ? "全部阶段已完成" : "All stages complete"
                : locale === "en" && currentStage.title_en
                ? currentStage.title_en
                : currentStage.title}
            </span>
            {!currentStage.isComplete && (
              <span className="text-[oklch(0.6_0.10_85)]">
                · {currentStage.idx + 1}/{currentStage.total}
              </span>
            )}
            {currentStage.building_target && (
              <span className="inline-flex items-center gap-1 ml-1">
                <span className="text-sm">{currentStage.building_target.icon}</span>
                <span className="text-muted-foreground">
                  {locale === "en" && currentStage.building_target.name_en
                    ? currentStage.building_target.name_en
                    : currentStage.building_target.name}
                </span>
              </span>
            )}
          </div>
        )}

        {/* ── Horizontal metrics bar — thin-line separated, no cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[oklch(0.6_0.10_85_/_0.22)] border-y border-[oklch(0.6_0.10_85_/_0.3)]">
          {pathMetrics.map((m) => (
            <div key={m.label} className="flex items-center gap-2.5 px-3 py-3">
              <QuestScrollIcon name={m.icon} size={15} className="shrink-0 text-[oklch(0.6_0.10_85)]" />
              <div className="min-w-0">
                <div className="text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground/80">
                  {m.label}
                </div>
                <div className="mt-0.5 font-mono text-base font-bold leading-tight text-[oklch(0.35_0.02_80)] dark:text-[oklch(0.85_0.04_80)]">
                  {m.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Thin growth trajectory (replaces the progress bar) ── */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70">
              {locale === "zh" ? "成长进度" : "Growth"}
            </span>
            <span className="font-mono text-[10px] font-bold text-[oklch(0.55_0.10_85)]">
              {path.progress_pct}%
            </span>
          </div>
          <div className="relative h-px w-full bg-[oklch(0.6_0.10_85_/_0.18)]">
            <div
              className="absolute left-0 top-0 h-px bg-gradient-to-r from-[oklch(0.6_0.10_85_/_0.35)] to-[#C9A45C] transition-all duration-700"
              style={{ width: `${path.progress_pct}%` }}
            />
            <span
              className="absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#C9A45C] transition-all duration-700"
              style={{ left: `calc(${path.progress_pct}% - 3px)` }}
            />
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex items-center gap-2 pt-1 border-t border-[oklch(0.6_0.10_85_/_0.2)]">
          <button onClick={handleEdit}
            className="rounded-lg border border-[oklch(0.6_0.10_85_/_0.3)] px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-[#C4A77D]/10 hover:text-[oklch(0.45_0.10_85)] transition-colors">
            {locale === "zh" ? "编辑" : "Edit"}
          </button>
          {path.path_type === "AI_GENERATED" && (
            <button onClick={handleRegenerate} disabled={regenerating}
              className="rounded-lg border border-[oklch(0.6_0.10_85_/_0.3)] px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-[#C4A77D]/10 hover:text-[oklch(0.45_0.10_85)] transition-colors disabled:opacity-50">
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
          MAIN CONTENT: 70/30 SPLIT — Unified Roadmap (milestones merged)
          ═══════════════════════════════════════════════════════════ */}
      <div className="border-b border-[oklch(0.6_0.10_85_/_0.3)] pb-2">
        <h2 className="flex items-center gap-2 text-base font-bold font-civ-serif text-[oklch(0.35_0.02_80)] dark:text-[oklch(0.85_0.04_80)]">
          <QuestScrollIcon name="world-core" size={16} className="text-[oklch(0.6_0.10_85)]" />
          {locale === "zh" ? "文明发展路线图" : "Civilization Roadmap"}
        </h2>
      </div>

      {/* ── 70/30 Roadmap + Mentor Split ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left 70% — Civilization Roadmap Timeline */}
        <div className="lg:col-span-3 min-w-0">
          <div className="border-y border-[oklch(0.6_0.10_85_/_0.3)] py-5">
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

          {/* ── Associated building nodes (aligned with route nodes) ── */}
          {targetedBuildings.length > 0 && (
            <div className="mt-6 border-b border-[oklch(0.6_0.10_85_/_0.3)] pb-5">
              <div className="flex items-center gap-2 mb-3">
                <QuestScrollIcon name="building" size={15} className="text-[oklch(0.6_0.10_85)]" />
                <h3 className="text-sm font-bold font-civ-serif text-[oklch(0.35_0.02_80)] dark:text-[oklch(0.85_0.04_80)]">
                  {locale === "zh" ? "关联建筑" : "Buildings"}
                </h3>
              </div>
              <div className="space-y-1">
                {targetedBuildings.map((tb, idx) => (
                  <div key={tb.building_id} className="relative flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[oklch(0.6_0.10_85_/_0.4)] bg-[#F7EFE0] text-sm dark:bg-[oklch(0.2_0.008_85)]">
                        {tb.building_icon || <QuestScrollIcon name="building" size={15} />}
                      </span>
                      {idx < targetedBuildings.length - 1 && (
                        <div className="w-px flex-1 min-h-[1.25rem] bg-gradient-to-b from-[oklch(0.6_0.10_85_/_0.4)] to-[oklch(0.6_0.10_85_/_0.08)]" />
                      )}
                    </div>
                    <a
                      href={`/world?building=${tb.building_id}`}
                      className="group flex-1 min-w-0 border-l border-[oklch(0.6_0.10_85_/_0.25)] pl-3 pb-5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-[oklch(0.35_0.02_80)] transition-colors group-hover:text-[oklch(0.45_0.10_85)] dark:text-[oklch(0.85_0.04_80)]">
                          {locale === "en" && tb.building_name_en ? tb.building_name_en : tb.building_name}
                        </span>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {tb.remaining_milestones > 0
                            ? `${tb.remaining_milestones} ${locale === "zh" ? "里程碑" : "milestones"}`
                            : locale === "zh" ? "已完成" : "Done"}
                        </span>
                      </div>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 30% — Odyssey Agent Mentor Panel */}
        <div className="lg:col-span-2 min-w-0">
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

  if (isLoading) {
    return (
      <div className="border-y border-[oklch(0.6_0.10_85_/_0.3)] py-5 space-y-4 sticky top-20">
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

  const recommended = suggestion?.recommended_quests?.slice(0, 3) ?? [];

  return (
    <div className="border-y border-[oklch(0.6_0.10_85_/_0.3)] py-5 space-y-5 sticky top-20">
      {/* ── Header ── */}
      <div className="flex items-center gap-2">
        <QuestScrollIcon name="path" size={18} className="text-[oklch(0.6_0.10_85)]" />
        <div>
          <h3 className="text-sm font-bold font-civ-serif text-[oklch(0.35_0.02_80)] dark:text-[oklch(0.85_0.04_80)]">
            {locale === "zh" ? "路径分析记录" : "Path Analysis"}
          </h3>
          <p className="text-[10px] text-muted-foreground">
            {locale === "zh" ? "成长进程与下一步" : "Progress & next steps"}
          </p>
        </div>
      </div>

      {/* ── 当前阶段 ── */}
      <div className="border-l-2 border-[oklch(0.6_0.10_85_/_0.4)] pl-3">
        <p className="mb-1 text-[9px] uppercase tracking-[0.14em] text-muted-foreground/80">
          {locale === "zh" ? "当前阶段" : "Current Stage"}
        </p>
        <p className="text-sm font-medium text-[oklch(0.35_0.02_80)] dark:text-[oklch(0.85_0.04_80)]">
          {currentStage?.isComplete ? (
            <>
              <QuestScrollIcon name="star" size={13} className="mr-1 inline-block align-middle text-[oklch(0.6_0.10_85)]" />
              {locale === "zh" ? "全部完成" : "All complete"}
            </>
          ) : currentStage ? (
            locale === "en" && currentStage.title_en ? currentStage.title_en : currentStage.title
          ) : (
            "—"
          )}
        </p>
        {currentStage && !currentStage.isComplete && (
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {locale === "zh"
              ? `第 ${currentStage.idx + 1} / ${currentStage.total} 阶段`
              : `Stage ${currentStage.idx + 1} of ${currentStage.total}`}
          </p>
        )}
      </div>

      {/* ── 完成预计 (thin-line metrics, no cards) ── */}
      <div className="flex divide-x divide-[oklch(0.6_0.10_85_/_0.22)] border-y border-[oklch(0.6_0.10_85_/_0.3)]">
        <div className="flex-1 px-3 py-2.5">
          <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground/80">
            {locale === "zh" ? "完成预计" : "Progress"}
          </p>
          <p className="mt-0.5 font-mono text-lg font-bold text-[oklch(0.35_0.02_80)] dark:text-[oklch(0.85_0.04_80)]">
            {progressPct}%
          </p>
        </div>
        <div className="flex-1 px-3 py-2.5">
          <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground/80">
            {locale === "zh" ? "预计剩余" : "Remaining"}
          </p>
          <p className="mt-0.5 font-mono text-lg font-bold text-[oklch(0.35_0.02_80)] dark:text-[oklch(0.85_0.04_80)]">
            {estimatedRemaining}h
          </p>
        </div>
        <div className="flex-1 px-3 py-2.5">
          <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground/80">
            {locale === "zh" ? "文明增益" : "Civ Gain"}
          </p>
          <p className="mt-0.5 font-mono text-lg font-bold text-[oklch(0.5_0.07_90)]">
            +{civIndexGain}
          </p>
        </div>
      </div>

      {/* ── 推荐下一步 / 导师建议 ── */}
      {recommended.length > 0 ? (
        <div>
          <p className="mb-2 text-[9px] uppercase tracking-[0.14em] text-muted-foreground/80">
            {locale === "zh" ? "推荐下一步" : "Recommended Next"}
          </p>
          <div className="space-y-1.5">
            {recommended.map((q) => (
              <a
                key={q.quest_id}
                href={`/quests/${q.quest_id}`}
                className="group flex items-center gap-2 border-l border-[oklch(0.6_0.10_85_/_0.4)] py-1.5 pl-3 transition-colors hover:border-[#C4A77D]"
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate text-xs font-medium text-[oklch(0.35_0.02_80)] transition-colors group-hover:text-[oklch(0.45_0.10_85)] dark:text-[oklch(0.85_0.04_80)]">
                    {q.title}
                  </p>
                  {q.skill_name && (
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {skillDisplayName(q.skill_name, undefined, locale)}
                    </p>
                  )}
                </div>
                <QuestScrollIcon
                  name="arrow-right"
                  size={12}
                  className="shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                />
              </a>
            ))}
          </div>
        </div>
      ) : suggestion?.current_suggestion ? (
        <div>
          <p className="mb-1 text-[9px] uppercase tracking-[0.14em] text-muted-foreground/80">
            {locale === "zh" ? "导师建议" : "Mentor Advice"}
          </p>
          <p className="text-xs italic leading-relaxed text-muted-foreground">
            {suggestion.current_suggestion}
          </p>
        </div>
      ) : null}
    </div>
  );
}
