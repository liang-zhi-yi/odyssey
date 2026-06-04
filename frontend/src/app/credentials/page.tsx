"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { credentialService } from "@/services/credential.service";
import { CredentialBadge } from "@/app/components/CredentialBadge";
import { Loading } from "@/app/components/Loading";
import { ErrorState } from "@/app/components/ErrorState";
import { EmptyState } from "@/app/components/EmptyState";
import type { Credential } from "@/types/credential";

export default function CredentialsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"mine" | "all">("mine");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch user's earned credentials
  const {
    data: userCredentials = [],
    isLoading: userLoading,
    error: userError,
  } = useSWR(isAuthenticated ? "user-credentials" : null, () =>
    credentialService.listUserCredentials()
  );

  // Fetch all credential definitions
  const {
    data: allCredentials = [],
    isLoading: allLoading,
    error: allError,
  } = useSWR(isAuthenticated ? "credentials" : null, () =>
    credentialService.listCredentials()
  );

  if (authLoading || !isAuthenticated) {
    return <Loading text={t("auth.validating")} />;
  }

  const earnedIds = new Set(userCredentials.map((c) => c.id));

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold">{t("credentials.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("credentials.subtitle")}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-secondary p-1 w-fit">
        <button
          onClick={() => setActiveTab("mine")}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
            activeTab === "mine"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("credentials.myCredentials")}
          {userCredentials.length > 0 && (
            <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
              {userCredentials.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
            activeTab === "all"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("credentials.allCredentials")}
        </button>
      </div>

      {/* Content */}
      {activeTab === "mine" ? (
        userLoading ? (
          <Loading variant="skeleton-cards" cardCount={4} />
        ) : userError ? (
          <ErrorState message={t("credentials.loadCredentialsError")} />
        ) : userCredentials.length === 0 ? (
          <EmptyState
            title={t("credentials.noEarned")}
            description={t("credentials.noEarnedDesc")}
            actionLabel={t("credentials.browseQuests")}
            actionHref="/quests"
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 animate-stagger">
            {userCredentials.map((credential) => (
              <CredentialBadge key={credential.id} credential={credential} />
            ))}
          </div>
        )
      ) : allLoading ? (
        <Loading variant="skeleton-cards" cardCount={6} />
      ) : allError ? (
        <ErrorState message={t("credentials.loadCredentialsCatalogError")} />
      ) : allCredentials.length === 0 ? (
        <EmptyState title={t("credentials.noCredentialsDefined")} description={t("credentials.comingSoonCredentials")} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 animate-stagger">
          {allCredentials.map((credential: Credential) => {
            const earned = earnedIds.has(credential.id);
            return (
              <div
                key={credential.id}
                className={`rounded-xl border p-4 transition-all card-hover ${
                  earned
                    ? "border-primary/30 bg-primary/5"
                    : "border-border bg-background opacity-60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${
                      earned ? "bg-primary/10" : "bg-secondary"
                    }`}
                  >
                    {earned ? "🏅" : "🔒"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {credential.name}
                    </p>
                    {credential.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {credential.description}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {t("credentials.requiredScore")}: {credential.required_score}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
