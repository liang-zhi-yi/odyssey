"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { useLocale } from "@/hooks/useLocale";
import { settingsService } from "@/services/settings.service";
import type { UpdateSettingsRequest, UserSettings, TestLlmResponse } from "@/types/settings";

const PROVIDERS: { value: string; label: string }[] = [
  { value: "openai", label: "OpenAI" },
  { value: "deepseek", label: "DeepSeek" },
  { value: "bailian", label: "Bailian (Alibaba)" },
  { value: "zhipu", label: "Zhipu AI" },
  { value: "moonshot", label: "Moonshot" },
  { value: "openrouter", label: "OpenRouter" },
  { value: "custom", label: "Custom" },
];

const inputClass = "w-full rounded-lg border border-[oklch(0.8_0.05_85)] dark:border-[oklch(0.3_0.02_80)] bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4A77D]/35 focus:border-[#C4A77D] transition-all";
const labelClass = "block text-xs font-bold font-civ-serif mb-1 text-[oklch(0.35_0.12_85)] dark:text-[oklch(0.85_0.04_80)]";

/**
 * Render a provider dropdown for LLM config fields.
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
      className={inputClass}
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
 *
 * Uses an explicit `isEditing` flag instead of inferring from `formValue`,
 * because formValue is initialized as "" (empty) — so the previous logic
 * `maskedValue && !formValue` was always true and clicking "edit" (which
 * set formValue to "") never toggled into the input state.
 */
function ApiKeyField({
  maskedValue,
  formValue,
  isEditing,
  onChange,
  onEditClick,
  placeholder,
  editLabel,
}: {
  maskedValue: string | null | undefined;
  formValue: string;
  isEditing: boolean;
  onChange: (v: string) => void;
  onEditClick: () => void;
  placeholder: string;
  editLabel: string;
}) {
  // Show masked display + edit button only when NOT editing and a key exists
  if (!isEditing && maskedValue) {
    return (
      <div className="flex items-center gap-2">
        <p className="text-xs text-muted-foreground py-2 font-mono">{maskedValue}</p>
        <button
          type="button"
          onClick={onEditClick}
          className="text-xs font-bold font-civ-serif text-primary hover:underline"
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
      className={inputClass}
      autoFocus
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
      className={inputClass}
    />
  );
}

/**
 * Display the result of an LLM connection test — success or error with suggestions.
 */
function TestResultBanner({ result }: { result: TestLlmResponse | null }) {
  if (!result) return null;

  if (result.success) {
    return (
      <div className="rounded-lg border border-green-300/50 bg-green-50/50 dark:bg-green-950/20 dark:border-green-700/40 p-3 space-y-1">
        <p className="text-xs font-bold text-green-700 dark:text-green-400 flex items-center gap-1.5">
          <span>✓</span>
          {result.message}
          {result.latency_ms != null && (
            <span className="text-[10px] font-mono text-green-600/60 dark:text-green-500/60 ml-1">
              ({result.latency_ms}ms)
            </span>
          )}
        </p>
      </div>
    );
  }

  // Error result
  const errorTypeLabels: Record<string, string> = {
    auth: "🔑 认证错误",
    not_found: "🔍 未找到",
    connection: "📡 连接失败",
    timeout: "⏱️ 超时",
    rate_limit: "🚦 频率限制",
    config: "⚙️ 配置错误",
    unknown: "❓ 未知错误",
  };
  const label = result.error_type ? (errorTypeLabels[result.error_type] || "❓ 错误") : "❓ 错误";

  return (
    <div className="rounded-lg border border-red-300/50 bg-red-50/50 dark:bg-red-950/20 dark:border-red-700/40 p-3 space-y-2">
      <p className="text-xs font-bold text-red-700 dark:text-red-400 flex items-center gap-1.5">
        <span>✗</span>
        {label}
        {result.latency_ms != null && (
          <span className="text-[10px] font-mono text-red-600/60 dark:text-red-500/60 ml-1">
            ({result.latency_ms}ms)
          </span>
        )}
      </p>
      <p className="text-xs text-red-600 dark:text-red-400/80 leading-relaxed">
        {result.message}
      </p>
      {result.suggestions.length > 0 && (
        <ul className="text-[11px] text-muted-foreground space-y-1 pl-4">
          {result.suggestions.map((s, i) => (
            <li key={i} className="list-disc leading-relaxed">{s}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ModelConfigForm() {
  const { t, locale } = useLocale();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Explicit edit flags for API key fields — fixes the issue where clicking
  // "edit" had no effect because formValue was already "" (empty).
  const [isEditingLlmKey, setIsEditingLlmKey] = useState(false);
  const [isEditingPathLlmKey, setIsEditingPathLlmKey] = useState(false);

  // LLM connection test state
  const [testingAssessment, setTestingAssessment] = useState(false);
  const [testAssessmentResult, setTestAssessmentResult] = useState<TestLlmResponse | null>(null);
  const [testingMentor, setTestingMentor] = useState(false);
  const [testMentorResult, setTestMentorResult] = useState<TestLlmResponse | null>(null);

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
      // Exit edit mode after a successful save
      setIsEditingLlmKey(false);
      setIsEditingPathLlmKey(false);
    } catch (err: any) {
      setError(err?.message || t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (configType: "assessment" | "mentor") => {
    const isAssessment = configType === "assessment";
    const setTesting = isAssessment ? setTestingAssessment : setTestingMentor;
    const setResult = isAssessment ? setTestAssessmentResult : setTestMentorResult;

    setTesting(true);
    setResult(null);
    try {
      const result = await settingsService.testLlmConfig({
        config_type: configType,
        // Send api_key only if the user has entered a new one in edit mode;
        // otherwise send empty so the backend uses the stored key.
        provider: isAssessment ? form.llm_provider : form.path_llm_provider,
        api_key: isAssessment
          ? (isEditingLlmKey ? form.llm_api_key : "")
          : (isEditingPathLlmKey ? form.path_llm_api_key : ""),
        base_url: isAssessment ? form.llm_base_url : form.path_llm_base_url,
        model: isAssessment ? form.llm_model : form.path_llm_model,
      });
      setResult(result);
    } catch (err: any) {
      setResult({
        success: false,
        message: err?.message || "请求失败，请检查网络连接",
        error_type: "unknown",
        suggestions: [],
        latency_ms: null,
      });
    } finally {
      setTesting(false);
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
          <h3 className="text-sm font-bold font-civ-serif text-[oklch(0.3_0.02_80)] dark:text-[oklch(0.85_0.04_80)] mb-1 flex items-center gap-1.5">
            <span>🛡️</span>
            {isZh ? "评估模型" : "Assessment Model"}
          </h3>
          <p className="text-xs text-muted-foreground italic">
            {t("settings.modelConfigDesc")}
          </p>
        </div>

        {/* Provider */}
        <div>
          <label className={labelClass}>
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
          <label className={labelClass}>
            {t("settings.apiKey")}
          </label>
          <ApiKeyField
            maskedValue={settings?.llm_api_key_masked}
            formValue={form.llm_api_key ?? ""}
            isEditing={isEditingLlmKey}
            onChange={(v) => setForm({ ...form, llm_api_key: v })}
            onEditClick={() => setIsEditingLlmKey(true)}
            placeholder={t("settings.apiKeyPlaceholder")}
            editLabel={t("common.edit")}
          />
        </div>

        {/* Base URL */}
        <div>
          <label className={labelClass}>
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
          <label className={labelClass}>
            {t("settings.model")}
          </label>
          <TextInputField
            value={form.llm_model ?? ""}
            onChange={(v) => setForm({ ...form, llm_model: v })}
            placeholder={t("settings.modelPlaceholder")}
          />
        </div>

        {/* Test connection button + result */}
        <div className="space-y-2">
          <button
            onClick={() => handleTestConnection("assessment")}
            disabled={testingAssessment}
            className="rounded-lg border border-[#C4A77D]/40 bg-[#C4A77D]/5 px-4 py-2 text-xs font-bold font-civ-serif text-[#C4A77D] hover:bg-[#C4A77D]/15 hover:border-[#C4A77D]/60 transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            <span>{testingAssessment ? "⏳" : "🔌"}</span>
            {testingAssessment
              ? (isZh ? "测试中..." : "Testing...")
              : (isZh ? "测试连接" : "Test Connection")}
          </button>
          {!isEditingLlmKey && settings?.llm_api_key_masked && (
            <p className="text-[10px] text-muted-foreground italic">
              {isZh
                ? "测试将使用已保存的 API Key。如需测试新密钥，请先点击「编辑」输入。"
                : "Test uses the saved API key. Click Edit to test a new key."}
            </p>
          )}
          <TestResultBanner result={testAssessmentResult} />
        </div>
      </div>

      {/* ======== Divider ======== */}
      <hr className="border-border/60" />

      {/* ======== Odyssey Mentor Model Section ======== */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-bold font-civ-serif text-[oklch(0.3_0.02_80)] dark:text-[oklch(0.85_0.04_80)] mb-1 flex items-center gap-1.5">
            <span>🗺️</span>
            {isZh ? "Odyssey 导师模型" : "Odyssey Mentor Model"}
          </h3>
          <p className="text-xs text-muted-foreground italic">
            {isZh
              ? "配置用于智能体对话与学习路径生成的 LLM 模型。留空则使用评估模型配置。"
              : "Configure the LLM used for agent chat and learning path generation. Leave empty to use the assessment model configuration."}
          </p>
        </div>

        {/* Provider */}
        <div>
          <label className={labelClass}>
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
          <label className={labelClass}>
            {t("settings.apiKey")}
          </label>
          <ApiKeyField
            maskedValue={settings?.path_llm_api_key_masked}
            formValue={form.path_llm_api_key ?? ""}
            isEditing={isEditingPathLlmKey}
            onChange={(v) => setForm({ ...form, path_llm_api_key: v })}
            onEditClick={() => setIsEditingPathLlmKey(true)}
            placeholder={t("settings.apiKeyPlaceholder")}
            editLabel={t("common.edit")}
          />
        </div>

        {/* Base URL */}
        <div>
          <label className={labelClass}>
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
          <label className={labelClass}>
            {t("settings.model")}
          </label>
          <TextInputField
            value={form.path_llm_model ?? ""}
            onChange={(v) => setForm({ ...form, path_llm_model: v })}
            placeholder={t("settings.modelPlaceholder")}
          />
        </div>

        {/* Test connection button + result */}
        <div className="space-y-2">
          <button
            onClick={() => handleTestConnection("mentor")}
            disabled={testingMentor}
            className="rounded-lg border border-[#C4A77D]/40 bg-[#C4A77D]/5 px-4 py-2 text-xs font-bold font-civ-serif text-[#C4A77D] hover:bg-[#C4A77D]/15 hover:border-[#C4A77D]/60 transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            <span>{testingMentor ? "⏳" : "🔌"}</span>
            {testingMentor
              ? (isZh ? "测试中..." : "Testing...")
              : (isZh ? "测试连接" : "Test Connection")}
          </button>
          {!isEditingPathLlmKey && settings?.path_llm_api_key_masked && (
            <p className="text-[10px] text-muted-foreground italic">
              {isZh
                ? "测试将使用已保存的 API Key。如需测试新密钥，请先点击「编辑」输入。"
                : "Test uses the saved API key. Click Edit to test a new key."}
            </p>
          )}
          {!isEditingPathLlmKey && !settings?.path_llm_api_key_masked && settings?.llm_api_key_masked && (
            <p className="text-[10px] text-muted-foreground italic">
              {isZh
                ? "导师模型未单独配置 API Key，将回退使用评估模型的配置进行测试。"
                : "Mentor model has no separate API key — will fall back to assessment model config."}
            </p>
          )}
          <TestResultBanner result={testMentorResult} />
        </div>
      </div>

      {message && <p className="text-xs font-bold text-success mt-2">✓ {message}</p>}
      {error && <p className="text-xs font-bold text-destructive mt-2">✗ {error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-lg bg-[#C4A77D] text-white px-5 py-2.5 text-xs font-bold font-civ-serif hover:bg-[#A38A5E] hover:opacity-100 transition-colors shadow-sm disabled:opacity-50 border border-[#A38A5E]/20"
      >
        {saving ? t("settings.saving") : t("settings.saveModelConfig")}
      </button>
    </div>
  );
}
