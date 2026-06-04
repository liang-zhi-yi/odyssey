"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { ProfileForm } from "@/app/components/ProfileForm";
import { PasswordChangeForm } from "@/app/components/PasswordChangeForm";
import { ModelConfigForm } from "@/app/components/ModelConfigForm";
import { Loading } from "@/app/components/Loading";

type TabId = "profile" | "advanced";

export default function SettingsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !isAuthenticated) {
    return <Loading text={t("auth.validating")} />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-secondary p-1 w-fit">
        {([
          ["profile", t("settings.profile")],
          ["advanced", t("settings.advanced")],
        ] as [TabId, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
              activeTab === id
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          {/* Profile form card */}
          <div className="rounded-xl border border-border bg-background p-6">
            <h2 className="text-lg font-semibold mb-4">{t("settings.profile")}</h2>
            <ProfileForm />
          </div>

          {/* Password change card */}
          <div className="rounded-xl border border-border bg-background p-6">
            <PasswordChangeForm />
          </div>
        </div>
      )}

      {/* Advanced tab */}
      {activeTab === "advanced" && (
        <div className="rounded-xl border border-border bg-background p-6">
          <h2 className="text-lg font-semibold mb-4">{t("settings.modelConfig")}</h2>
          <ModelConfigForm />
        </div>
      )}
    </div>
  );
}
