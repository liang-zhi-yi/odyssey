/** Settings API calls — /api/v1/settings */

import { api } from "@/lib/api";
import type { UserSettings, UpdateSettingsRequest } from "@/types/settings";

export const settingsService = {
  getSettings(): Promise<UserSettings> {
    return api.get<UserSettings>("/settings");
  },
  updateSettings(data: UpdateSettingsRequest): Promise<UserSettings> {
    return api.put<UserSettings>("/settings", data);
  },
};
