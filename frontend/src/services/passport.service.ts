/** Passport API calls — /api/v1/passport */

import { api } from "@/lib/api";
import type { Passport } from "@/types/passport";

export const passportService = {
  /** Generate the user's capability passport (dynamically aggregated) */
  getPassport(): Promise<Passport> {
    return api.get<Passport>("/passport");
  },
};
