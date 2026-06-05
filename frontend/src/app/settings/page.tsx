"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { ProfileForm } from "@/app/components/ProfileForm";
import { PasswordChangeForm } from "@/app/components/PasswordChangeForm";
import { ModelConfigForm } from "@/app/components/ModelConfigForm";
import { Loading } from "@/app/components/Loading";
import { learningPathService } from "@/services/learningPath.service";
import type { UserMemoryEntry } from "@/types/learningPath";

type TabId = "profile" | "password" | "preferences" | "memory" | "data";

function DataExportPanel() {
  const { t } = useLocale();
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (endpoint: string, filename: string) => {
    setExporting(endpoint);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/v1${endpoint}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Silently fail
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-background p-6">
      <h2 className="text-lg font-semibold mb-4">{t("settings.data")}</h2>
      <p className="text-sm text-muted-foreground mb-4">{t("export.title")}</p>
      <div className="flex flex-col gap-3">
        <button
          onClick={() => handleExport("/export/passport", "odyssey-passport.json")}
          disabled={exporting !== null}
          className="rounded-lg border border-border bg-secondary/50 px-4 py-2 text-sm font-medium hover:bg-secondary disabled:opacity-50"
        >
          {exporting === "/export/passport"
            ? t("export.exporting")
            : t("export.exportPassport")}
        </button>
        <button
          onClick={() => handleExport("/export/data", "odyssey-data.json")}
          disabled={exporting !== null}
          className="rounded-lg border border-border bg-secondary/50 px-4 py-2 text-sm font-medium hover:bg-secondary disabled:opacity-50"
        >
          {exporting === "/export/data"
            ? t("export.exporting")
            : t("export.exportAllData")}
        </button>
      </div>
    </div>
  );
}

function MemoryBankPanel() {
  const { t, locale } = useLocale();
  const [entries, setEntries] = useState<UserMemoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const fetchMemory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await learningPathService.listMemory();
      setEntries(data);
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

  const truncate = (val: unknown, maxLen = 60): string => {
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
        <p className="text-4xl">🧠</p>
        <p className="text-sm text-muted-foreground max-w-sm">
          {t("memory.noMemoryDesc")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedGroups.map((type) => {
        const groupEntries = grouped[type];
        const i18nKey = MEMORY_TYPE_I18N_KEYS[type];
        const label = i18nKey ? t(i18nKey) : type;
        return (
          <div key={type}>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
              {label}
              <span className="ml-1.5 text-xs font-normal normal-case">
                ({groupEntries.length})
              </span>
            </h4>
            <div className="space-y-2">
              {groupEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-border bg-secondary/30 px-4 py-3"
                >
                  <p className="text-sm font-medium">{entry.key}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {truncate(entry.value)}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {new Date(entry.updated_at).toLocaleDateString(
                      locale === "zh" ? "zh-CN" : "en-US",
                      { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Clear All Memory */}
      <div className="pt-4 border-t border-border">
        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            disabled={clearing}
            className="text-sm text-destructive hover:underline disabled:opacity-50"
          >
            {t("memory.clearMemory")}
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">
              {t("memory.clearConfirm")}
            </p>
            <button
              onClick={handleClear}
              disabled={clearing}
              className="rounded-md bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:opacity-90 disabled:opacity-50"
            >
              {clearing
                ? t("common.loading")
                : t("common.confirm")}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              disabled={clearing}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary disabled:opacity-50"
            >
              {t("common.cancel")}
            </button>
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
    <div className="mx-auto max-w-2xl space-y-8 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold">{t("settings.title")}</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-border bg-secondary p-1 w-fit flex-wrap">
        {([
          ["profile", "\u{1F464}", t("settings.profile")],
          ["password", "\u{1F512}", t("settings.password")],
          ["preferences", "⚙️", t("settings.preferences")],
          ["memory", "\u{1F9E0}", t("settings.tabs.memory")],
          ["data", "\u{1F4BE}", t("settings.data")],
        ] as [TabId, string, string][]).map(([id, emoji, label]) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
              activeTab === id
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="mr-1.5">{emoji}</span>
            {label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {activeTab === "profile" && (
        <div className="rounded-xl border border-border bg-background p-6">
          <h2 className="text-lg font-semibold mb-4">{t("settings.profile")}</h2>
          <ProfileForm />
        </div>
      )}

      {/* Password tab */}
      {activeTab === "password" && (
        <div className="rounded-xl border border-border bg-background p-6">
          <PasswordChangeForm />
        </div>
      )}

      {/* Preferences tab */}
      {activeTab === "preferences" && (
        <div className="rounded-xl border border-border bg-background p-6">
          <h2 className="text-lg font-semibold mb-4">{t("settings.modelConfig")}</h2>
          <ModelConfigForm />
        </div>
      )}

      {/* Memory tab */}
      {activeTab === "memory" && (
        <div className="rounded-xl border border-border bg-background p-6">
          <h2 className="text-lg font-semibold mb-1">
            {t("memory.title")}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {t("memory.subtitle")}
          </p>
          <MemoryBankPanel />
        </div>
      )}

      {/* Data tab */}
      {activeTab === "data" && <DataExportPanel />}
    </div>
  );
}
