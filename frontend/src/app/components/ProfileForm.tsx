"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { authService } from "@/services/auth.service";
import type { UpdateProfileRequest } from "@/types/user";

export function ProfileForm() {
  const { user } = useAuth();
  const { t } = useLocale();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<UpdateProfileRequest>({
    nickname: user?.nickname ?? "",
    bio: user?.bio ?? "",
    github_username: user?.github_username ?? "",
    avatar_url: user?.avatar_url ?? "",
  });

  if (!user) return null;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await authService.updateProfile(form);
      setMessage(t("settings.saved"));
      // Refresh the page to update auth context
      window.location.reload();
    } catch (err: any) {
      setError(err?.message || t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">{t("settings.nickname")}</label>
        <input
          type="text"
          value={form.nickname ?? ""}
          onChange={(e) => setForm({ ...form, nickname: e.target.value })}
          placeholder={t("settings.nicknamePlaceholder")}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{t("settings.bio")}</label>
        <textarea
          value={form.bio ?? ""}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          placeholder={t("settings.bioPlaceholder")}
          rows={3}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{t("settings.githubUsername")}</label>
        <input
          type="text"
          value={form.github_username ?? ""}
          onChange={(e) => setForm({ ...form, github_username: e.target.value })}
          placeholder={t("settings.githubPlaceholder")}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{t("settings.avatarUrl")}</label>
        <input
          type="text"
          value={form.avatar_url ?? ""}
          onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
          placeholder={t("settings.avatarPlaceholder")}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {message && (
        <p className="text-sm text-success">{message}</p>
      )}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {saving ? t("settings.saving") : t("settings.saveProfile")}
      </button>
    </div>
  );
}
