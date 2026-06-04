"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { useLocale } from "@/hooks/useLocale";
import { settingsService } from "@/services/settings.service";
import type { UpdateSettingsRequest } from "@/types/settings";

const PROVIDERS: { value: string; label: string }[] = [
  { value: "openai", label: "OpenAI" },
  { value: "deepseek", label: "DeepSeek" },
  { value: "bailian", label: "Bailian (Alibaba)" },
  { value: "zhipu", label: "Zhipu AI" },
  { value: "moonshot", label: "Moonshot" },
  { value: "openrouter", label: "OpenRouter" },
  { value: "custom", label: "Custom" },
];

export function ModelConfigForm() {
  const { t } = useLocale();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch current settings
  const { data: settings, isLoading } = useSWR("user-settings", () =>
    settingsService.getSettings()
  );

  const [form, setForm] = useState<UpdateSettingsRequest>({
    llm_provider: "",
    llm_api_key: "",
    llm_base_url: "",
    llm_model: "",
  });

  // Sync form when settings load
  useEffect(() => {
    if (settings) {
      setForm({
        llm_provider: settings.llm_provider ?? "",
        llm_api_key: "",
        llm_base_url: settings.llm_base_url ?? "",
        llm_model: settings.llm_model ?? "",
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      // Build payload — omit empty api_key to avoid clearing it
      const payload: UpdateSettingsRequest = {
        llm_provider: form.llm_provider || undefined,
        llm_base_url: form.llm_base_url || undefined,
        llm_model: form.llm_model || undefined,
      };
      if (form.llm_api_key) {
        payload.llm_api_key = form.llm_api_key;
      }
      await settingsService.updateSettings(payload);
      setMessage(t("settings.saved"));
      // Clear the api_key field since it's not returned
      setForm((prev) => ({ ...prev, llm_api_key: "" }));
    } catch (err: any) {
      setError(err?.message || t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">{t("settings.modelConfigDesc")}</p>
      </div>

      {/* Provider */}
      <div>
        <label className="block text-sm font-medium mb-1">{t("settings.provider")}</label>
        <select
          value={form.llm_provider ?? ""}
          onChange={(e) => setForm({ ...form, llm_provider: e.target.value })}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">{t("settings.selectProvider")}</option>
          {PROVIDERS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* API Key */}
      <div>
        <label className="block text-sm font-medium mb-1">{t("settings.apiKey")}</label>
        {settings?.llm_api_key_masked && !form.llm_api_key ? (
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground py-2">
              {settings.llm_api_key_masked}
            </p>
            <button
              type="button"
              onClick={() => setForm({ ...form, llm_api_key: "" })}
              className="text-xs text-primary hover:underline"
            >
              {t("common.edit")}
            </button>
          </div>
        ) : (
          <input
            type="password"
            value={form.llm_api_key ?? ""}
            onChange={(e) => setForm({ ...form, llm_api_key: e.target.value })}
            placeholder={t("settings.apiKeyPlaceholder")}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        )}
      </div>

      {/* Base URL */}
      <div>
        <label className="block text-sm font-medium mb-1">{t("settings.baseUrl")}</label>
        <input
          type="text"
          value={form.llm_base_url ?? ""}
          onChange={(e) => setForm({ ...form, llm_base_url: e.target.value })}
          placeholder={t("settings.baseUrlPlaceholder")}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Model */}
      <div>
        <label className="block text-sm font-medium mb-1">{t("settings.model")}</label>
        <input
          type="text"
          value={form.llm_model ?? ""}
          onChange={(e) => setForm({ ...form, llm_model: e.target.value })}
          placeholder={t("settings.modelPlaceholder")}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {message && <p className="text-sm text-success">{message}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {saving ? t("settings.saving") : t("settings.saveModelConfig")}
      </button>
    </div>
  );
}
