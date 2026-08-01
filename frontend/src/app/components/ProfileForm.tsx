"use client";

import { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { authService } from "@/services/auth.service";
import { AvatarUpload } from "./AvatarUpload";
import { QuestScrollIcon } from "./QuestScrollIcon";
import { resolveAvatarSrc } from "@/lib/avatar";
import type { UpdateProfileRequest, SocialLink } from "@/types/user";

export function ProfileForm() {
  const { user } = useAuth();
  const { t, locale } = useLocale();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

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
      setIsEditing(false);
      // Refresh the page to update auth context
      window.location.reload();
    } catch (err: any) {
      setError(err?.message || t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Discard changes, restore from user data
    setForm({
      nickname: user?.nickname ?? "",
      bio: user?.bio ?? "",
      github_username: user?.github_username ?? "",
      avatar_url: user?.avatar_url ?? "",
      title: user?.title ?? "",
      location: user?.location ?? "",
      website: user?.website ?? "",
      social_links: user?.social_links ?? [],
    });
    setError(null);
    setMessage(null);
    setIsEditing(false);
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

  const inputClass = "w-full rounded-lg border border-[oklch(0.8_0.05_85)] dark:border-[oklch(0.3_0.02_80)] bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4A77D]/35 focus:border-[#C4A77D] transition-all";
  const labelClass = "block text-xs font-bold font-civ-serif mb-1 text-[oklch(0.35_0.12_85)] dark:text-[oklch(0.85_0.04_80)]";
  const displayValueClass = "text-sm text-foreground py-2";

  // Display values with sensible defaults for empty fields
  const displayNickname = user.nickname || user.username || "—";
  const displayTitle = user.title || "—";
  const displayBio = user.bio || "这里还什么都没有~";
  const displayGithub = user.github_username || "—";
  const displayLocation = user.location || "—";
  const displayWebsite = user.website || "—";
  const userSocialLinks = (user.social_links ?? []) as SocialLink[];

  return (
    <div className="space-y-4">
      {/* Avatar upload — only editable in edit mode */}
      {isEditing ? (
        <AvatarUpload
          currentAvatarUrl={form.avatar_url ?? null}
          onAvatarChange={handleAvatarChange}
        />
      ) : null}

      {isEditing ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="inline-block align-text-bottom"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><circle cx="7" cy="7" r="1" fill="currentColor" stroke="none" /></svg> {t("settings.nickname")}</label>
              <input
                type="text"
                value={form.nickname ?? ""}
                onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                placeholder={t("settings.nicknamePlaceholder")}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}><QuestScrollIcon name="shield" size={14} className="inline-block align-text-bottom" /> {t("settings.title")}</label>
              <input
                type="text"
                value={form.title ?? ""}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={t("settings.titlePlaceholder")}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}><QuestScrollIcon name="scroll" size={14} className="inline-block align-text-bottom" /> {t("settings.bio")}</label>
            <textarea
              value={form.bio ?? ""}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder={t("settings.bioPlaceholder")}
              rows={3}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="inline-block align-text-bottom"><circle cx="12" cy="12" r="10" /><path d="M12 6L14 12L12 18L10 12z" fill="currentColor" stroke="none" /></svg> {t("settings.githubUsername")}</label>
              <input
                type="text"
                value={form.github_username ?? ""}
                onChange={(e) => setForm({ ...form, github_username: e.target.value })}
                placeholder={t("settings.githubPlaceholder")}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="inline-block align-text-bottom"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg> {t("settings.location")}</label>
              <input
                type="text"
                value={form.location ?? ""}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder={t("settings.locationPlaceholder")}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}><QuestScrollIcon name="civilization" size={14} className="inline-block align-text-bottom" /> {t("settings.website")}</label>
              <input
                type="text"
                value={form.website ?? ""}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder={t("settings.websitePlaceholder")}
                className={inputClass}
              />
            </div>
          </div>

          {/* Social links editor */}
          <div className="pt-2">
            <label className={labelClass}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="inline-block align-text-bottom"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg> {t("settings.socialLinks")}</label>
            {socialLinks.length > 0 && (
              <div className="space-y-2 mb-3 max-w-xl">
                {socialLinks.map((link, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-lg border border-border/80 bg-background/40 px-3 py-1.5"
                  >
                    <span className="text-xs font-bold text-foreground min-w-0 flex-1">
                      {link.platform}
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate max-w-[200px] font-mono">
                      {link.url}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSocialLink(i)}
                      className="flex-shrink-0 text-[10px] font-bold font-civ-serif text-destructive hover:underline"
                    >
                      {t("settings.remove")}
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2 max-w-xl">
              <input
                type="text"
                value={newPlatform}
                onChange={(e) => setNewPlatform(e.target.value)}
                placeholder={t("settings.platform")}
                className="flex-1 rounded-lg border border-[oklch(0.8_0.05_85)] dark:border-[oklch(0.3_0.02_80)] bg-background/50 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#C4A77D]/35 focus:border-[#C4A77D]"
              />
              <input
                type="text"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder={t("settings.url")}
                className="flex-[2] rounded-lg border border-[oklch(0.8_0.05_85)] dark:border-[oklch(0.3_0.02_80)] bg-background/50 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#C4A77D]/35 focus:border-[#C4A77D]"
              />
              <button
                type="button"
                onClick={addSocialLink}
                className="rounded-lg border border-border bg-secondary/70 px-4 py-1.5 text-xs font-bold font-civ-serif text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                {t("settings.addLink")}
              </button>
            </div>
          </div>
        </>
      ) : (
        /* ── Read-only display view ── */
        <div className="space-y-4">
          {/* Avatar display (read-only) */}
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0 h-20 w-20 rounded-full overflow-hidden border-2 border-border bg-muted/30">
              {resolveAvatarSrc(user.avatar_url) ? (
                <Image
                  src={resolveAvatarSrc(user.avatar_url)!}
                  alt="Avatar"
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <QuestScrollIcon name="knowledge" size={32} />
                </div>
              )}
            </div>
            <div>
              <label className={labelClass}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="inline-block align-text-bottom"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg> {t("settings.avatar")}</label>
              <p className="text-xs text-muted-foreground italic">
                {user.avatar_url ? t("settings.avatarHint") : (locale === "en" ? "No avatar set" : "未设置头像")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="inline-block align-text-bottom"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><circle cx="7" cy="7" r="1" fill="currentColor" stroke="none" /></svg> {t("settings.nickname")}</label>
              <p className={`${displayValueClass} ${!user.nickname ? "text-muted-foreground italic" : ""}`}>
                {displayNickname}
              </p>
            </div>
            <div>
              <label className={labelClass}><QuestScrollIcon name="shield" size={14} className="inline-block align-text-bottom" /> {t("settings.title")}</label>
              <p className={`${displayValueClass} ${!user.title ? "text-muted-foreground italic" : ""}`}>
                {displayTitle}
              </p>
            </div>
          </div>

          <div>
            <label className={labelClass}><QuestScrollIcon name="scroll" size={14} className="inline-block align-text-bottom" /> {t("settings.bio")}</label>
            <p className={`${displayValueClass} leading-relaxed ${!user.bio ? "text-muted-foreground italic" : ""}`}>
              {displayBio}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="inline-block align-text-bottom"><circle cx="12" cy="12" r="10" /><path d="M12 6L14 12L12 18L10 12z" fill="currentColor" stroke="none" /></svg> {t("settings.githubUsername")}</label>
              <p className={`${displayValueClass} ${!user.github_username ? "text-muted-foreground italic" : ""}`}>
                {displayGithub}
              </p>
            </div>
            <div>
              <label className={labelClass}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="inline-block align-text-bottom"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg> {t("settings.location")}</label>
              <p className={`${displayValueClass} ${!user.location ? "text-muted-foreground italic" : ""}`}>
                {displayLocation}
              </p>
            </div>
            <div>
              <label className={labelClass}><QuestScrollIcon name="civilization" size={14} className="inline-block align-text-bottom" /> {t("settings.website")}</label>
              <p className={`${displayValueClass} ${!user.website ? "text-muted-foreground italic" : ""} truncate`}>
                {displayWebsite}
              </p>
            </div>
          </div>

          {/* Social links display */}
          <div className="pt-2">
            <label className={labelClass}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="inline-block align-text-bottom"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg> {t("settings.socialLinks")}</label>
            {userSocialLinks.length > 0 ? (
              <div className="space-y-2 max-w-xl">
                {userSocialLinks.map((link, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-lg border border-border/80 bg-background/40 px-3 py-1.5"
                  >
                    <span className="text-xs font-bold text-foreground min-w-0 flex-1">
                      {link.platform}
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate max-w-[200px] font-mono">
                      {link.url}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic py-2">—</p>
            )}
          </div>
        </div>
      )}

      {message && (
        <p className="text-xs font-bold text-success mt-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block align-text-bottom"><path d="M20 6L9 17l-5-5" /></svg> {message}</p>
      )}
      {error && (
        <p className="text-xs font-bold text-destructive mt-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block align-text-bottom"><path d="M18 6L6 18M6 6l12 12" /></svg> {error}</p>
      )}

      {/* Action buttons — Edit and Save are peer buttons */}
      <div className="flex items-center gap-2 pt-2">
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="rounded-lg border border-[#C4A77D]/40 bg-[#C4A77D]/5 text-[#8B7355] px-5 py-2.5 text-xs font-bold font-civ-serif hover:bg-[#C4A77D]/15 transition-colors shadow-sm"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="inline-block align-text-bottom"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg> {t("common.edit")}
          </button>
        ) : (
          <>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-[#C4A77D] text-white px-5 py-2.5 text-xs font-bold font-civ-serif hover:bg-[#A38A5E] hover:opacity-100 transition-colors shadow-sm disabled:opacity-50 border border-[#A38A5E]/20"
            >
              {saving ? t("settings.saving") : t("settings.saveProfile")}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="rounded-lg border border-border bg-secondary/70 px-5 py-2.5 text-xs font-bold font-civ-serif text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors disabled:opacity-50"
            >
              {t("common.cancel")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
