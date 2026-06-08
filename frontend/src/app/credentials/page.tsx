"use client";

import { useEffect } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { credentialService } from "@/services/credential.service";
import { CredentialBadge } from "@/app/components/CredentialBadge";
import { Loading } from "@/app/components/Loading";
import { ErrorState } from "@/app/components/ErrorState";
import { EmptyState } from "@/app/components/EmptyState";
import type { UserCredential } from "@/types/credential";

export default function CredentialsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, locale } = useLocale();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const {
    data: userCredentials = [],
    isLoading: credsLoading,
    error: credsError,
  } = useSWR(
    isAuthenticated ? "user-credentials-all" : null,
    () => credentialService.listUserCredentials().catch(() => [] as UserCredential[]),
    { revalidateOnFocus: false, dedupingInterval: 120000 }
  );

  if (authLoading || !isAuthenticated) {
    return <Loading text={t("auth.validating")} />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6 py-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">{t("credentials.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("credentials.subtitle")}
        </p>
        {userCredentials.length > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            {userCredentials.length}{" "}
            {locale === "en" ? "credentials earned" : "个证书已获得"}
          </p>
        )}
      </div>

      {/* Credentials list */}
      {credsLoading ? (
        <Loading variant="skeleton-cards" cardCount={3} />
      ) : credsError ? (
        <ErrorState message={t("credentials.loadCredentialsError")} />
      ) : userCredentials.length === 0 ? (
        <EmptyState
          title={t("credentials.noEarned")}
          description={t("credentials.noEarnedDesc")}
        />
      ) : (
        <div className="space-y-3">
          {userCredentials.map((cred) => (
            <CredentialBadge key={cred.id} credential={cred} />
          ))}
        </div>
      )}
    </div>
  );
}
