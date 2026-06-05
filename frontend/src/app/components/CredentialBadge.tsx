"use client";

import type { UserCredential } from "@/types/credential";

interface CredentialBadgeProps {
  credential: UserCredential;
}

/**
 * Badge/card showing a single credential.
 */
export function CredentialBadge({ credential }: CredentialBadgeProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg">
        🏅
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{credential.name}</p>
        <p className="text-xs text-muted-foreground">
          {credential.issued_at
            ? new Date(credential.issued_at).toLocaleDateString("zh-CN", {
                year: "numeric",
                month: "short",
              })
            : ""}
        </p>
      </div>
    </div>
  );
}
