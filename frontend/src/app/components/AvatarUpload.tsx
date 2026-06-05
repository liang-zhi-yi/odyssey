"use client";

import { useState, useRef, useCallback } from "react";
import { useLocale } from "@/hooks/useLocale";
import { authService } from "@/services/auth.service";
import { resolveAvatarSrc } from "@/lib/avatar";

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface AvatarUploadProps {
  currentAvatarUrl: string | null;
  onAvatarChange: (url: string | null) => void;
}

/**
 * Avatar upload component with drag-drop, preview, and validation.
 * Communicates directly with the backend avatar endpoint.
 */
export function AvatarUpload({ currentAvatarUrl, onAvatarChange }: AvatarUploadProps) {
  const { t } = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const displayUrl = previewUrl ?? resolveAvatarSrc(currentAvatarUrl);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return t("settings.avatarInvalidType");
    }
    if (file.size > MAX_SIZE) {
      return t("settings.avatarTooLarge");
    }
    return null;
  };

  const handleFile = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setUploading(true);

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    try {
      const result = await authService.uploadAvatar(file);
      onAvatarChange(result.avatar_url);
      setPreviewUrl(null); // Clear local preview, use server URL
    } catch (err: any) {
      setError(err?.message ?? t("common.error"));
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  }, [onAvatarChange, t]);

  const handleDelete = useCallback(async () => {
    setError(null);
    setUploading(true);
    try {
      await authService.deleteAvatar();
      onAvatarChange(null);
      setPreviewUrl(null);
    } catch (err: any) {
      setError(err?.message ?? t("common.error"));
    } finally {
      setUploading(false);
    }
  }, [onAvatarChange, t]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset so the same file can be re-selected
    e.target.value = "";
  }, [handleFile]);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium">
        {t("settings.avatar")}
      </label>

      {/* Avatar preview + upload zone */}
      <div className="flex items-start gap-4">
        {/* Preview circle */}
        <div
          className={`relative flex-shrink-0 h-20 w-20 rounded-full overflow-hidden border-2 transition-colors ${
            dragOver ? "border-primary bg-primary/5" : "border-border bg-muted/30"
          } ${uploading ? "opacity-50" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
          title={t("settings.uploadAvatar")}
        >
          {displayUrl ? (
            <img
              src={displayUrl}
              alt="Avatar"
              className="h-full w-full object-cover"
              onError={(e) => {
                // Fallback on broken image
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl text-muted-foreground">
              🧑‍🎓
            </div>
          )}

          {/* Uploading spinner overlay */}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}
        </div>

        {/* Upload + remove buttons */}
        <div className="flex flex-col gap-2 text-xs">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={onInputChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors disabled:opacity-50"
          >
            {t("settings.uploadAvatar")}
          </button>
          {currentAvatarUrl && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={uploading}
              className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
            >
              {t("settings.removeAvatar")}
            </button>
          )}
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            {t("settings.avatarHint")}
          </p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
