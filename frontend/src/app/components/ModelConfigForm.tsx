"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { useLocale } from "@/hooks/useLocale";
import { settingsService } from "@/services/settings.service";
import type { UpdateSettingsRequest, UserSettings } from "@/types/settings";

const PROVIDERS: { value: string; label: string }[] = [
  { value: "openai", label: "OpenAI" },
  { value: "deepseek", label: "DeepSeek" },
  { value: "bailian", label: "Bailian (Alibaba)" },
  { value: "zhipu", label: "Zhipu AI" },
  { value: "moonshot", label: "Moonshot" },
  { value: "openrouter", label: "OpenRouter" },
  { value: "custom", label: "Custom" },
];

/**
 * Render a provider dropdown for LLM config fields.
 * Field keys for standard LLM use "llm_*"; for path LLM use "path_llm_*".
 */
function ProviderSelect({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
    >
      <option value="">{placeholder}</option>
      {PROVIDERS.map((p) => (
        <option key={p.value} value={p.value}>
          {p.label}
        </option>
      ))}
    </select>
  );
}

/**
 * Render an API key field — either masked display or password input.
 */
function ApiKeyField({
  maskedValue,
  formValue,
  onChange,
  onEditClick,
  placeholder,
  editLabel,
}: {
  maskedValue: string | null | undefined;
  formValue: string;
  onChange: (v: string) => void;
  onEditClick: () => void;
  placeholder: string;
  editLabel: string;
}) {
  if (maskedValue && !formValue) {
    return (
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground py-2">{maskedValue}</p>
        <button
          type="button"
          onClick={onEditClick}
          className="text-xs text-primary hover:underline"
        >
          {editLabel}
        </button>
      </div>
    );
  }
  return (
    <input
      type="password"
      value={formValue}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
    />
  );
}

/**
 * Render a text input field.
 */
function TextInputField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
    />
  );
}

export function ModelConfigForm() {
  const { t, locale } = useLocale();
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
    path_llm_provider: "",
    path_llm_api_key: "",
    path_llm_base_url: "",
    path_llm_model: "",
  });

  // Sync form when settings load
  useEffect(() => {
    if (settings) {
      setForm({
        llm_provider: settings.llm_provider ?? "",
        llm_api_key: "",
        llm_base_url: settings.llm_base_url ?? "",
        llm_model: settings.llm_model ?? "",
        path_llm_provider: settings.path_llm_provider ?? "",
        path_llm_api_key: "",
        path_llm_base_url: settings.path_llm_base_url ?? "",
        path_llm_model: settings.path_llm_model ?? "",
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      // Build payload — omit empty api_key fields to avoid clearing them
      const payload: UpdateSettingsRequest = {
        llm_provider: form.llm_provider || undefined,
        llm_base_url: form.llm_base_url || undefined,
        llm_model: form.llm_model || undefined,
        path_llm_provider: form.path_llm_provider || undefined,
        path_llm_base_url: form.path_llm_base_url || undefined,
        path_llm_model: form.path_llm_model || undefined,
      };
      if (form.llm_api_key) {
        payload.llm_api_key = form.llm_api_key;
      }
      if (form.path_llm_api_key) {
        payload.path_llm_api_key = form.path_llm_api_key;
      }
      await settingsService.updateSettings(payload);
      setMessage(t("settings.saved"));
      // Clear the api_key fields since they're not returned
      setForm((prev) => ({ ...prev, llm_api_key: "", path_llm_api_key: "" }));
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

  const isZh = locale === "zh";

  return (
    <div className="space-y-6">
      {/* ======== Assessment Model Section ======== */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold">
            {isZh ? "评估模型" : "Assessment Model"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t("settings.modelConfigDesc")}
          </p>
        </div>

        {/* Provider */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("settings.provider")}
          </label>
          <ProviderSelect
            value={form.llm_provider ?? ""}
            onChange={(v) => setForm({ ...form, llm_provider: v })}
            placeholder={t("settings.selectProvider")}
          />
        </div>

        {/* API Key */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("settings.apiKey")}
          </label>
          <ApiKeyField
            maskedValue={settings?.llm_api_key_masked}
            formValue={form.llm_api_key ?? ""}
            onChange={(v) => setForm({ ...form, llm_api_key: v })}
            onEditClick={() => setForm({ ...form, llm_api_key: "" })}
            placeholder={t("settings.apiKeyPlaceholder")}
            editLabel={t("common.edit")}
          />
        </div>

        {/* Base URL */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("settings.baseUrl")}
          </label>
          <TextInputField
            value={form.llm_base_url ?? ""}
            onChange={(v) => setForm({ ...form, llm_base_url: v })}
            placeholder={t("settings.baseUrlPlaceholder")}
          />
        </div>

        {/* Model */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("settings.model")}
          </label>
          <TextInputField
            value={form.llm_model ?? ""}
            onChange={(v) => setForm({ ...form, llm_model: v })}
            placeholder={t("settings.modelPlaceholder")}
          />
        </div>
      </div>

      {/* ======== Divider ======== */}
      <hr className="border-border" />

      {/* ======== Path Generation Model Section ======== */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold">
            {isZh ? "路径生成模型" : "Path Generation Model"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isZh
              ? "配置用于学习路径生成和内容创建的 LLM 模型。留空则使用评估模型配置。"
              : "Configure the LLM used for learning path generation and content creation. Leave empty to use the assessment model configuration."}
          </p>
        </div>

        {/* Provider */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("settings.provider")}
          </label>
          <ProviderSelect
            value={form.path_llm_provider ?? ""}
            onChange={(v) => setForm({ ...form, path_llm_provider: v })}
            placeholder={t("settings.selectProvider")}
          />
        </div>

        {/* API Key */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("settings.apiKey")}
          </label>
          <ApiKeyField
            maskedValue={settings?.path_llm_api_key_masked}
            formValue={form.path_llm_api_key ?? ""}
            onChange={(v) => setForm({ ...form, path_llm_api_key: v })}
            onEditClick={() => setForm({ ...form, path_llm_api_key: "" })}
            placeholder={t("settings.apiKeyPlaceholder")}
            editLabel={t("common.edit")}
          />
        </div>

        {/* Base URL */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("settings.baseUrl")}
          </label>
          <TextInputField
            value={form.path_llm_base_url ?? ""}
            onChange={(v) => setForm({ ...form, path_llm_base_url: v })}
            placeholder={t("settings.baseUrlPlaceholder")}
          />
        </div>

        {/* Model */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("settings.model")}
          </label>
          <TextInputField
            value={form.path_llm_model ?? ""}
            onChange={(v) => setForm({ ...form, path_llm_model: v })}
            placeholder={t("settings.modelPlaceholder")}
          />
        </div>
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
