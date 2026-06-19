"use client";

import { useState } from "react";
import { useLocale } from "@/hooks/useLocale";
import { authService } from "@/services/auth.service";

export function PasswordChangeForm() {
  const { t } = useLocale();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async () => {
    setError(null);
    setMessage(null);

    if (newPassword.length < 8) {
      setError(t("settings.passwordMinLength"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("settings.passwordMismatch"));
      return;
    }

    setSaving(true);
    try {
      await authService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setMessage(t("settings.passwordChanged"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err?.message || t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full rounded-lg border border-[oklch(0.8_0.05_85)] dark:border-[oklch(0.3_0.02_80)] bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4A77D]/35 focus:border-[#C4A77D] transition-all";
  const labelClass = "block text-xs font-bold font-civ-serif mb-1 text-[oklch(0.35_0.12_85)] dark:text-[oklch(0.85_0.04_80)]";

  return (
    <div className="space-y-4">
      <h3 className="text-base font-bold font-civ-serif text-[oklch(0.3_0.02_80)] dark:text-[oklch(0.85_0.04_80)] border-b border-border/60 pb-2 flex items-center gap-1.5">
        <span>🔑</span> {t("settings.changePassword")}
      </h3>
      <div>
        <label className={labelClass}>{t("settings.currentPassword")}</label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>{t("settings.newPassword")}</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>{t("settings.confirmNewPassword")}</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={inputClass}
        />
      </div>

      {message && <p className="text-xs font-bold text-success mt-2">✓ {message}</p>}
      {error && <p className="text-xs font-bold text-destructive mt-2">✗ {error}</p>}

      <button
        onClick={handleChange}
        disabled={saving}
        className="rounded-lg bg-[#C4A77D] text-white px-5 py-2.5 text-xs font-bold font-civ-serif hover:bg-[#A38A5E] hover:opacity-100 transition-colors shadow-sm disabled:opacity-50 border border-[#A38A5E]/20"
      >
        {saving ? t("settings.saving") : t("settings.changePassword")}
      </button>
    </div>
  );
}
