/** Settings types — matching backend app/settings/schemas.py */

export interface UserSettings {
  llm_provider: string | null;
  llm_api_key_masked: string | null;
  llm_base_url: string | null;
  llm_model: string | null;
  // Path generation — only used when use_path_llm_override=true
  use_path_llm_override: boolean;
  path_llm_provider: string | null;
  path_llm_api_key_masked: string | null;
  path_llm_base_url: string | null;
  path_llm_model: string | null;
}

export interface UpdateSettingsRequest {
  llm_provider?: string | null;
  llm_api_key?: string | null;
  llm_base_url?: string | null;
  llm_model?: string | null;
  // Path generation override toggle
  use_path_llm_override?: boolean;
  // Path generation LLM (only used when use_path_llm_override=true)
  path_llm_provider?: string | null;
  path_llm_api_key?: string | null;
  path_llm_base_url?: string | null;
  path_llm_model?: string | null;
}

/** Provider options for settings UI */
export const LLM_PROVIDER_OPTIONS: { value: string; label: string; description: string }[] = [
  { value: "openai", label: "OpenAI", description: "GPT-4o, GPT-4.1 — full structured output" },
  { value: "deepseek", label: "DeepSeek", description: "DeepSeek V3/R1 — cost-effective" },
  { value: "bailian", label: "阿里百炼 (Bailian)", description: "Qwen series — Alibaba Cloud" },
  { value: "zhipu", label: "智谱AI (Zhipu)", description: "GLM series" },
  { value: "moonshot", label: "月之暗面 (Moonshot)", description: "Kimi" },
  { value: "openrouter", label: "OpenRouter", description: "Multi-provider proxy — Claude, Gemini, etc." },
  { value: "ollama", label: "Ollama (本地模型)", description: "Local LLM — qwen2.5, llama3.1, etc." },
  { value: "custom", label: "Custom", description: "Any OpenAI-compatible endpoint" },
];
