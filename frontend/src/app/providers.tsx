"use client";

import { type ReactNode } from "react";
import { SWRConfig } from "swr";
import { AuthProvider } from "@/hooks/useAuth";
import { LocaleProvider } from "@/hooks/useLocale";
import { AgentProvider } from "@/hooks/useAgent";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        shouldRetryOnError: false,
        dedupingInterval: 2000,
      }}
    >
      <AuthProvider>
        <LocaleProvider>
          <AgentProvider>{children}</AgentProvider>
        </LocaleProvider>
      </AuthProvider>
    </SWRConfig>
  );
}
