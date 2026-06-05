"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { authService } from "@/services/auth.service";
import { AvatarUpload } from "./AvatarUpload";
import type { UpdateProfileRequest, SocialLink } from "@/types/user";

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
    title: user?.title ?? "",
    location: user?.location ?? "",
    website: user?.website ?? "",
    social_links: user?.social_links ?? [],
  });

  const [newPlatform, setNewPlatform] = useState("");
  const [newUrl, setNewUrl] = useState("");

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

  const handleAvatarChange = (url: string | null) => {
    setForm({ ...form, avatar_url: url ?? undefined });
  };

  const socialLinks = (form.social_links ?? []) as SocialLink[];

  const addSocialLink = () => {
    const platform = newPlatform.trim();
    const url = newUrl.trim();
    if (!platform || !url) return;
    setForm({
      ...form,
      social_links: [...socialLinks, { platform, url }],
    });
    setNewPlatform("");
    setNewUrl("");
  };

  const removeSocialLink = (index: number) => {
    setForm({
      ...form,
      social_links: socialLinks.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-4">
      {/* Avatar upload */}
      <AvatarUpload
        currentAvatarUrl={form.avatar_url ?? null}
        onAvatarChange={handleAvatarChange}
      />

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
        <label className="block text-sm font-medium mb-1">{t("settings.title")}</label>
        <input
          type="text"
          value={form.title ?? ""}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder={t("settings.titlePlaceholder")}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{t("settings.location")}</label>
        <input
          type="text"
          value={form.location ?? ""}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          placeholder={t("settings.locationPlaceholder")}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{t("settings.website")}</label>
        <input
          type="text"
          value={form.website ?? ""}
          onChange={(e) => setForm({ ...form, website: e.target.value })}
          placeholder={t("settings.websitePlaceholder")}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Social links editor */}
      <div>
        <label className="block text-sm font-medium mb-2">{t("settings.socialLinks")}</label>
        {socialLinks.length > 0 && (
          <div className="space-y-2 mb-3">
            {socialLinks.map((link, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2"
              >
                <span className="text-sm font-medium text-foreground min-w-0 flex-1">
                  {link.platform}
                </span>
                <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                  {link.url}
                </span>
                <button
                  type="button"
                  onClick={() => removeSocialLink(i)}
                  className="flex-shrink-0 text-xs text-destructive hover:underline"
                >
                  {t("settings.remove")}
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={newPlatform}
            onChange={(e) => setNewPlatform(e.target.value)}
            placeholder={t("settings.platform")}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <input
            type="text"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder={t("settings.url")}
            className="flex-[2] rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="button"
            onClick={addSocialLink}
            className="rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            {t("settings.addLink")}
          </button>
        </div>
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
