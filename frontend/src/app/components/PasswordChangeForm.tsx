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

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t("settings.changePassword")}</h3>
      <div>
        <label className="block text-sm font-medium mb-1">{t("settings.currentPassword")}</label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{t("settings.newPassword")}</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{t("settings.confirmNewPassword")}</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {message && <p className="text-sm text-success">{message}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        onClick={handleChange}
        disabled={saving}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {saving ? t("settings.saving") : t("settings.changePassword")}
      </button>
    </div>
  );
}
