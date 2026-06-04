/** Settings types — matching backend app/settings/schemas.py */

export interface UserSettings {
  llm_provider: string | null;
  llm_api_key_masked: string | null;
  llm_base_url: string | null;
  llm_model: string | null;
}

export interface UpdateSettingsRequest {
  llm_provider?: string;
  llm_api_key?: string;
  llm_base_url?: string;
  llm_model?: string;
}
