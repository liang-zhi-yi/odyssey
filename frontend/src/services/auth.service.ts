/** Auth API calls — /api/v1/auth/* */

import { api } from "@/lib/api";
import type { LoginRequest, RegisterRequest, TokenResponse } from "@/types/auth";
import type { User, UpdateProfileRequest, ChangePasswordRequest } from "@/types/user";

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

  updateProfile(data: UpdateProfileRequest): Promise<User> {
    return api.put<User>("/auth/me", data);
  },

  changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    return api.put<{ message: string }>("/auth/password", data);
  },
};
