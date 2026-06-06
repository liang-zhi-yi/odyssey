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

  // Only auto-redirect on 401 if we sent a token (token-expired case).
  // For login/register, a 401 means bad credentials — let the error handler below process it.
  if (res.status === 401 && token) {
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
    let body: Record<string, unknown> = {};
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      try {
        body = await res.json();
      } catch {
        // JSON parse failure — ignore, fall through to status-based message
      }
    }

    // Extract error info from body — backend uses two formats:
    //   1. AppException:  { error: { code, message } }
    //   2. FastAPI 422:   { detail: "..." } or { detail: [...] }
    const errInfo: { code?: string; message?: string; detail?: unknown } =
      (body.error as Record<string, unknown> | undefined) ?? {};

    // Build a helpful message, especially for proxy/connectivity errors
    let message: string;
    if (errInfo.message) {
      message = errInfo.message;
    } else if (typeof body.detail === "string") {
      // FastAPI 422 or other detail-as-string errors
      message = body.detail;
    } else if (Array.isArray(body.detail) && body.detail.length > 0) {
      // FastAPI 422 validation errors (list of { loc, msg, type })
      const first = body.detail[0] as Record<string, unknown> | undefined;
      const loc = first?.loc as string[] | undefined;
      const msg = first?.msg as string | undefined;
      message = loc
        ? `${loc.join(".")}: ${msg ?? "invalid value"}`
        : (msg ?? "Validation failed");
    } else if (res.status === 500 && !contentType.includes("application/json")) {
      // Next.js proxy returned HTML (likely backend is down)
      message = "Backend server is unreachable. Please ensure the server is running on port 8000.";
    } else if (res.status === 502 || res.status === 503) {
      message = "Server is temporarily unavailable. Please try again in a moment.";
    } else {
      message = `Request failed with status ${res.status}`;
    }

    throw new ApiRequestError({
      status: res.status,
      code: errInfo.code ?? (body.code as string | undefined) ?? "UNKNOWN",
      message,
      detail: errInfo.detail ?? body.detail,
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
      // Only auto-redirect on 401 if we sent a token (token-expired case).
      if (res.status === 401 && token) {
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
        let body: Record<string, unknown> = {};
        const contentType = res.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
          try {
            body = await res.json();
          } catch {
            // JSON parse failure — ignore
          }
        }

        const errInfo: { code?: string; message?: string; detail?: unknown } =
          (body.error as Record<string, unknown> | undefined) ?? {};

        let message: string;
        if (errInfo.message) {
          message = errInfo.message;
        } else if (typeof body.detail === "string") {
          message = body.detail;
        } else if (Array.isArray(body.detail) && body.detail.length > 0) {
          const first = body.detail[0] as Record<string, unknown> | undefined;
          const loc = first?.loc as string[] | undefined;
          const msg = first?.msg as string | undefined;
          message = loc
            ? `${loc.join(".")}: ${msg ?? "invalid value"}`
            : (msg ?? "Upload validation failed");
        } else if (res.status === 500 && !contentType.includes("application/json")) {
          message = "Backend server is unreachable. Please ensure the server is running on port 8000.";
        } else if (res.status === 502 || res.status === 503) {
          message = "Server is temporarily unavailable. Please try again in a moment.";
        } else {
          message = `Upload failed with status ${res.status}`;
        }

        throw new ApiRequestError({
          status: res.status,
          code: errInfo.code ?? (body.code as string | undefined) ?? "UNKNOWN",
          message,
          detail: errInfo.detail ?? body.detail,
        });
      }

      if (res.status === 204) {
        return undefined as T;
      }

      return res.json();
    });
  },
};
