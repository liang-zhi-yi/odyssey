"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { authService } from "@/services/auth.service";
import { setToken, removeToken, getToken, setStoredUserId, clearAuth } from "@/lib/auth";
import type { User } from "@/types/user";
import type { LoginRequest, RegisterRequest } from "@/types/auth";
import { ApiRequestError } from "@/lib/api";

/** Dev-only mock user for previewing without a running backend */
const DEV_USER: User = {
  id: "dev-user-001",
  username: "dev-preview",
  email: "dev@odyssey.local",
  avatar_url: null,
  bio: "Dev preview mode — backend not connected",
};

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  /** Whether dev auth bypass is active */
  isDevMode: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SKIP_AUTH =
  typeof process !== "undefined" &&
  process.env.NEXT_PUBLIC_SKIP_AUTH === "true";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: SKIP_AUTH ? DEV_USER : null,
    isLoading: !SKIP_AUTH,
    isAuthenticated: SKIP_AUTH,
    error: null,
  });

  // On mount, check if we have a valid token and fetch user
  useEffect(() => {
    if (SKIP_AUTH) return; // dev bypass — already set in initial state

    const token = getToken();
    if (!token) {
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }

    authService
      .me()
      .then((user) => {
        setState({ user, isLoading: false, isAuthenticated: true, error: null });
      })
      .catch(() => {
        clearAuth();
        setState({ user: null, isLoading: false, isAuthenticated: false, error: null });
      });
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    setState((s) => ({ ...s, error: null, isLoading: true }));
    try {
      const res = await authService.login(data);
      setToken(res.token);
      if (res.user_id) setStoredUserId(res.user_id);

      const user = await authService.me();
      setState({ user, isLoading: false, isAuthenticated: true, error: null });
    } catch (err) {
      const message =
        err instanceof ApiRequestError
          ? err.message
          : "Login failed. Please try again.";
      setState((s) => ({ ...s, isLoading: false, error: message }));
      throw err;
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    setState((s) => ({ ...s, error: null, isLoading: true }));
    try {
      const res = await authService.register(data);
      setToken(res.token);
      if (res.user_id) setStoredUserId(res.user_id);

      const user = await authService.me();
      setState({ user, isLoading: false, isAuthenticated: true, error: null });
    } catch (err) {
      const message =
        err instanceof ApiRequestError
          ? err.message
          : "Registration failed. Please try again.";
      setState((s) => ({ ...s, isLoading: false, error: message }));
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    if (SKIP_AUTH) {
      // In dev mode, just reset to dev user
      setState({ user: DEV_USER, isLoading: false, isAuthenticated: true, error: null });
    } else {
      setState({ user: null, isLoading: false, isAuthenticated: false, error: null });
    }
  }, []);

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }));
  }, []);

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, logout, clearError, isDevMode: SKIP_AUTH }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/** Hook to access auth context. Must be used within AuthProvider. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
