"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { credentialService } from "@/services/credential.service";
import { CredentialBadge } from "@/app/components/CredentialBadge";
import { Loading } from "@/app/components/Loading";
import { ErrorState } from "@/app/components/ErrorState";
import { EmptyState } from "@/app/components/EmptyState";
import type { Credential } from "@/types/credential";

export default function CredentialsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
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
    return <Loading text="验证中..." />;
  }

  const earnedIds = new Set(userCredentials.map((c) => c.id));

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold">凭证中心</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          你的技能凭证与成就
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
          我的凭证
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
          全部凭证
        </button>
      </div>

      {/* Content */}
      {activeTab === "mine" ? (
        userLoading ? (
          <Loading variant="skeleton-cards" cardCount={4} />
        ) : userError ? (
          <ErrorState message="加载凭证失败" />
        ) : userCredentials.length === 0 ? (
          <EmptyState
            title="暂无凭证"
            description="完成Quest并通过评估后，你将获得技能凭证"
            actionLabel="浏览 Quests"
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
        <ErrorState message="加载凭证目录失败" />
      ) : allCredentials.length === 0 ? (
        <EmptyState title="暂无凭证定义" description="敬请期待更多凭证" />
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
                      要求分数: {credential.required_score}
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
