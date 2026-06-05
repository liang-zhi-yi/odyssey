/** Settings types — matching backend app/settings/schemas.py */

export interface UserSettings {
  llm_provider: string | null;
  llm_api_key_masked: string | null;
  llm_base_url: string | null;
  llm_model: string | null;
  // Path generation LLM fields
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
  // Path generation LLM fields
  path_llm_provider?: string | null;
  path_llm_api_key?: string | null;
  path_llm_base_url?: string | null;
  path_llm_model?: string | null;
}
