/** Typed API client for Odyssey backend (/api/v1) */

import { getToken, clearAuth } from "./auth";

const BASE_URL = "/api/v1";

/** Error format returned by backend */
export interface ApiError {
  status: number;
  code: string;
  message: string;
  detail?: unknown;
}

export class ApiRequestError extends Error {
  status: number;
  code: string;
  detail?: unknown;

  constructor(err: ApiError) {
    super(err.message);
    this.name = "ApiRequestError";
    this.status = err.status;
    this.code = err.code;
    this.detail = err.detail;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    clearAuth();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new ApiRequestError({
      status: 401,
      code: "UNAUTHORIZED",
      message: "Session expired. Please log in again.",
    });
  }

  if (!res.ok) {
    let body: Partial<ApiError> = {};
    try {
      body = await res.json();
    } catch {
      // Not JSON
    }
    throw new ApiRequestError({
      status: res.status,
      code: body.code ?? "UNKNOWN",
      message: body.message ?? `Request failed with status ${res.status}`,
      detail: body.detail,
    });
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

/** HTTP method helpers */
export const api = {
  get<T>(path: string): Promise<T> {
    return request<T>(path, { method: "GET" });
  },

  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  put<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(path: string): Promise<T> {
    return request<T>(path, { method: "DELETE" });
  },

  /** Upload a file using multipart/form-data (no Content-Type header — browser sets boundary). */
  upload<T>(path: string, formData: FormData): Promise<T> {
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers,
      body: formData,
    }).then(async (res) => {
      if (res.status === 401) {
        clearAuth();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        throw new ApiRequestError({
          status: 401,
          code: "UNAUTHORIZED",
          message: "Session expired. Please log in again.",
        });
      }

      if (!res.ok) {
        let body: Partial<ApiError> = {};
        try {
          body = await res.json();
        } catch {
          // Not JSON
        }
        throw new ApiRequestError({
          status: res.status,
          code: body.code ?? "UNKNOWN",
          message: body.message ?? `Upload failed with status ${res.status}`,
          detail: body.detail,
        });
      }

      if (res.status === 204) {
        return undefined as T;
      }

      return res.json();
    });
  },
};
