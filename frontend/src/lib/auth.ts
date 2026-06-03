/** JWT token storage & retrieval utilities */

const TOKEN_KEY = "odyssey_token";
const USER_ID_KEY = "odyssey_user_id";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function getStoredUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USER_ID_KEY);
}

export function setStoredUserId(userId: string): void {
  localStorage.setItem(USER_ID_KEY, userId);
}

export function removeStoredUserId(): void {
  localStorage.removeItem(USER_ID_KEY);
}

/** Clear all auth data from localStorage */
export function clearAuth(): void {
  removeToken();
  removeStoredUserId();
}
