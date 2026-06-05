/**
 * Resolve an avatar URL from the backend.
 *
 * The backend saves avatar URLs as /static/avatars/{filename} (see
 * backend/app/auth/service.py). The /static mount is at ROOT level
 * (see backend/app/main.py:78), NOT under /api/v1.
 *
 * So we must NOT prepend /api/v1 — the URL is already correct.
 * Only external HTTP URLs are returned as-is.
 */
export function resolveAvatarSrc(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  // Static files are mounted at root: app.mount("/static", ...)
  return url;
}
