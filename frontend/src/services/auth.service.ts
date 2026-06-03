/** Auth API calls — /api/v1/auth/* */

import { api } from "@/lib/api";
import type { LoginRequest, RegisterRequest, TokenResponse } from "@/types/auth";
import type { User } from "@/types/user";

export const authService = {
  register(data: RegisterRequest): Promise<TokenResponse> {
    return api.post<TokenResponse>("/auth/register", data);
  },

  login(data: LoginRequest): Promise<TokenResponse> {
    return api.post<TokenResponse>("/auth/login", data);
  },

  me(): Promise<User> {
    return api.get<User>("/auth/me");
  },
};
