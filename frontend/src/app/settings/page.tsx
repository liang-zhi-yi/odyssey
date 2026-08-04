"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { ProfileForm } from "@/app/components/ProfileForm";
import { PasswordChangeForm } from "@/app/components/PasswordChangeForm";
import { ModelConfigForm } from "@/app/components/ModelConfigForm";
import { QuestScrollIcon } from "@/app/components/QuestScrollIcon";
import { Loading } from "@/app/components/Loading";
import { learningPathService } from "@/services/learningPath.service";
import type { UserMemoryEntry } from "@/types/learningPath";

type TabId = "profile" | "preferences" | "memory";

function MemoryBankPanel() {
  const { t, locale } = useLocale();
  const [entries, setEntries] = useState<UserMemoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const PAGE_SIZE = 8;

  const fetchMemory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await learningPathService.listMemory();
      setEntries(data);
      setCurrentPage(0);
    } catch (err: any) {
      setError(err?.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchMemory();
  }, [fetchMemory]);

  const handleClear = async () => {
    setClearing(true);
    try {
      await learningPathService.clearMemory();
      setEntries([]);
      setCurrentPage(0);
      setShowConfirm(false);
    } catch (err: any) {
      setError(err?.message || t("memory.clearError"));
    } finally {
      setClearing(false);
    }
  };

  // Group entries by memory_type
  const grouped = entries.reduce<Record<string, UserMemoryEntry[]>>((acc, entry) => {
    const type = entry.memory_type || "OTHER";
    if (!acc[type]) acc[type] = [];
    acc[type].push(entry);
    return acc;
  }, {});

  const groupOrder = ["PREFERENCE", "HABIT", "LEARNING_STYLE", "INTERACTION", "FEEDBACK"];

  // Map API memory_type values to i18n keys (API uses UPPER_SNAKE, i18n uses camelCase)
  const MEMORY_TYPE_I18N_KEYS: Record<string, string> = {
    PREFERENCE: "memory.preferences",
    HABIT: "memory.habits",
    LEARNING_STYLE: "memory.learningStyle",
    INTERACTION: "memory.interactions",
    FEEDBACK: "memory.feedback",
  };

  // Sort groups by our defined order, then put unknown types at the end
  const sortedGroups = Object.keys(grouped).sort((a, b) => {
    const ai = groupOrder.indexOf(a);
    const bi = groupOrder.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  const truncate = (val: unknown, maxLen = 160): string => {
    const s = typeof val === "string" ? val : JSON.stringify(val);
    if (s.length <= maxLen) return s;
    return s.slice(0, maxLen) + "...";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-muted-foreground">
          {t("common.loading")}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <p className="text-sm text-destructive">{error}</p>
        <button
          onClick={fetchMemory}
          className="text-sm text-primary hover:underline"
        >
          {t("common.tryAgain")}
        </button>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
        <div className="animate-pulse"><QuestScrollIcon name="reasoning" size={36} /></div>
        <p className="text-xs text-muted-foreground max-w-sm italic">
          {t("memory.noMemoryDesc")}
        </p>
      </div>
    );
  }

  // Pagination: flatten all entries across groups, then paginate
  const totalPages = Math.ceil(entries.length / PAGE_SIZE);
  const paginatedEntries = entries.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  );

  // Re-group the paginated entries
  const paginatedGrouped = paginatedEntries.reduce<Record<string, UserMemoryEntry[]>>((acc, entry) => {
    const type = entry.memory_type || "OTHER";
    if (!acc[type]) acc[type] = [];
    acc[type].push(entry);
    return acc;
  }, {});

  const paginatedSortedGroups = Object.keys(paginatedGrouped).sort((a, b) => {
    const ai = groupOrder.indexOf(a);
    const bi = groupOrder.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return (
    <div className="space-y-6">
      {paginatedSortedGroups.map((type) => {
        const groupEntries = paginatedGrouped[type];
        const i18nKey = MEMORY_TYPE_I18N_KEYS[type];
        const label = i18nKey ? t(i18nKey) : type;
        const totalCount = grouped[type]?.length ?? 0;
        return (
          <div key={type} className="space-y-3">
            <h4 className="text-xs font-bold text-[#C4A77D] uppercase tracking-wider border-b border-border/40 pb-1 flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="inline-block align-text-bottom"><path d="M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" /></svg>
              {label}
              <span className="font-mono text-[10px] opacity-75">
                ({groupEntries.length}{totalCount > groupEntries.length ? `/${totalCount}` : ""})
              </span>
            </h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {groupEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-[oklch(0.88_0.02_90)] bg-background/60 p-4 shadow-sm relative overflow-hidden border-l-4 border-l-[#C4A77D]"
                >
                  <p className="text-xs font-bold font-civ-serif text-[oklch(0.3_0.02_80)] dark:text-[oklch(0.85_0.04_80)]">{entry.key}</p>
                  <p className="text-[11px] text-muted-foreground mt-1.5 bg-secondary/35 p-2 rounded border border-border/40 font-mono select-all overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {truncate(entry.value)}
                  </p>
                  <div className="flex justify-between items-center mt-2.5 text-[9px] text-muted-foreground/60 font-mono">
                    <span>ID: {entry.id.slice(0, 8).toUpperCase()}</span>
                    <span>
                      {new Date(entry.updated_at).toLocaleDateString(
                        locale === "zh" ? "zh-CN" : "en-US",
                        { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold font-civ-serif disabled:opacity-40 hover:bg-secondary/40 transition-all"
          >
            {locale === "zh" ? "上一页" : "Prev"}
          </button>
          <span className="text-xs font-mono text-muted-foreground tabular-nums px-2">
            {currentPage + 1} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold font-civ-serif disabled:opacity-40 hover:bg-secondary/40 transition-all"
          >
            {locale === "zh" ? "下一页" : "Next"}
          </button>
        </div>
      )}

      {/* Clear All Memory */}
      <div className="pt-4 border-t border-border/60">
        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            disabled={clearing}
            className="text-xs font-bold font-civ-serif text-destructive hover:underline disabled:opacity-50 flex items-center gap-1"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="inline-block align-text-bottom"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" /></svg> {t("memory.clearMemory")}
          </button>
        ) : (
          <div className="flex items-center gap-3 bg-destructive/5 border border-destructive/20 rounded-lg p-3">
            <p className="text-xs text-muted-foreground italic flex-1">
              {t("memory.clearConfirm")}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleClear}
                disabled={clearing}
                className="rounded bg-destructive px-3 py-1.5 text-xs font-bold text-destructive-foreground hover:opacity-90 disabled:opacity-50"
              >
                {clearing ? t("common.loading") : t("common.confirm")}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={clearing}
                className="rounded border border-border bg-background px-3 py-1.5 text-xs font-bold hover:bg-secondary disabled:opacity-50"
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !isAuthenticated) {
    return <Loading text={t("auth.validating")} />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-8">
      <div>
        <h1 className="text-2xl font-bold font-civ-serif text-[oklch(0.35_0.12_85)] dark:text-[oklch(0.85_0.04_80)] flex items-center gap-2">
          <QuestScrollIcon name="application" size={20} className="inline-block align-text-bottom" /> {t("settings.title")}
        </h1>
      </div>

      <div className="flex flex-col md:grid md:grid-cols-4 md:gap-8 items-start">
        {/* Navigation Sidebar (Ledger Tabs) */}
        <div className="w-full md:col-span-1 mb-6 md:mb-0 flex md:flex-col gap-2 flex-wrap md:flex-nowrap border-b md:border-b-0 md:border-r border-[oklch(0.8_0.05_85)] dark:border-[oklch(0.3_0.02_80)] pb-4 md:pb-0 md:pr-4">
          {([
            ["profile", (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>), t("settings.profile")],
            ["preferences", (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="7" /><path d="M8 17l-1 4h10l-1-4" /><path d="M9 7c1-1 3-1 4 0" strokeWidth="1" opacity="0.6" /></svg>), t("settings.modelConfig")],
            ["memory", (<QuestScrollIcon name="building" size={16} />), t("settings.tabs.memory")],
          ] as [TabId, React.ReactNode, string][]).map(([id, icon, label]) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-bold font-civ-serif transition-all duration-300 w-full text-left border ${
                  isActive
                    ? "bg-gradient-to-r from-[oklch(0.99_0.003_95)] to-[oklch(0.975_0.005_92)] dark:from-[oklch(0.22_0.008_85)] dark:to-[oklch(0.2_0.006_85)] text-[oklch(0.35_0.12_85)] border-[oklch(0.7_0.12_85_/_0.55)] shadow-sm"
                    : "text-muted-foreground hover:text-foreground border-transparent hover:bg-secondary/40"
                }`}
              >
                <span className="flex items-center">{icon}</span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Pane */}
        <div className="w-full md:col-span-3 space-y-6">
          {/* Profile tab — includes password change */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div className="rounded-xl border border-[oklch(0.88_0.02_90)] bg-gradient-to-br from-[oklch(0.99_0.003_95)] to-[oklch(0.975_0.005_92)] dark:from-[oklch(0.22_0.008_85)] dark:to-[oklch(0.2_0.006_85)] p-6 shadow-sm relative overflow-hidden">
                <div className="absolute -bottom-1 -right-1 text-[8px] font-mono opacity-[0.06] pointer-events-none select-none text-[oklch(0.3_0.02_80)]">
                  [PROFILE_SEC_01]
                </div>
                <h2 className="text-base font-bold font-civ-serif mb-4 text-[oklch(0.3_0.02_80)] dark:text-[oklch(0.85_0.04_80)] border-b border-border/60 pb-2 flex items-center gap-1.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg> {t("settings.profile")}
                </h2>
                <ProfileForm />
              </div>
              <div className="rounded-xl border border-[oklch(0.88_0.02_90)] bg-gradient-to-br from-[oklch(0.99_0.003_95)] to-[oklch(0.975_0.005_92)] dark:from-[oklch(0.22_0.008_85)] dark:to-[oklch(0.2_0.006_85)] p-6 shadow-sm relative overflow-hidden">
                <div className="absolute -bottom-1 -right-1 text-[8px] font-mono opacity-[0.06] pointer-events-none select-none text-[oklch(0.3_0.02_80)]">
                  [PASSWD_SEC_02]
                </div>
                <PasswordChangeForm />
              </div>
            </div>
          )}

          {/* Preferences tab */}
          {activeTab === "preferences" && (
            <div className="rounded-xl border border-[oklch(0.88_0.02_90)] bg-gradient-to-br from-[oklch(0.99_0.003_95)] to-[oklch(0.975_0.005_92)] dark:from-[oklch(0.22_0.008_85)] dark:to-[oklch(0.2_0.006_85)] p-6 shadow-sm relative overflow-hidden">
              <div className="absolute -bottom-1 -right-1 text-[8px] font-mono opacity-[0.06] pointer-events-none select-none text-[oklch(0.3_0.02_80)]">
                [ORACLE_SEC_03]
              </div>
              <h2 className="text-base font-bold font-civ-serif mb-4 text-[oklch(0.3_0.02_80)] dark:text-[oklch(0.85_0.04_80)] border-b border-border/60 pb-2 flex items-center gap-1.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="7" /><path d="M8 17l-1 4h10l-1-4" /><path d="M9 7c1-1 3-1 4 0" strokeWidth="1" opacity="0.6" /></svg> {t("settings.modelConfig")}
              </h2>
              <ModelConfigForm />
            </div>
          )}

          {/* Memory tab */}
          {activeTab === "memory" && (
            <div className="rounded-xl border border-[oklch(0.88_0.02_90)] bg-gradient-to-br from-[oklch(0.99_0.003_95)] to-[oklch(0.975_0.005_92)] dark:from-[oklch(0.22_0.008_85)] dark:to-[oklch(0.2_0.006_85)] p-6 shadow-sm relative overflow-hidden">
              <div className="absolute -bottom-1 -right-1 text-[8px] font-mono opacity-[0.06] pointer-events-none select-none text-[oklch(0.3_0.02_80)]">
                [MEM_BANK_SEC_04]
              </div>
              <h2 className="text-base font-bold font-civ-serif mb-1 text-[oklch(0.3_0.02_80)] dark:text-[oklch(0.85_0.04_80)] flex items-center gap-1.5">
                <QuestScrollIcon name="building" size={16} className="inline-block align-text-bottom" /> {t("memory.title")}
              </h2>
              <p className="text-xs text-muted-foreground italic mb-4">
                {t("memory.subtitle")}
              </p>
              <div className="border-t border-border/60 pt-4">
                <MemoryBankPanel />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
