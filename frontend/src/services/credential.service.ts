/** Credential API calls — /api/v1/credentials, /api/v1/user-credentials */

import { api } from "@/lib/api";
import type { Credential, UserCredential } from "@/types/credential";

export const credentialService = {
  /** Get all credential definitions */
  listCredentials(): Promise<Credential[]> {
    return api.get<Credential[]>("/credentials");
  },

  /** Get credentials awarded to the current user */
  listUserCredentials(): Promise<UserCredential[]> {
    return api.get<UserCredential[]>("/user-credentials");
  },
};
