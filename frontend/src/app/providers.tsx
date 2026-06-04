"use client";

import { type ReactNode } from "react";
import { SWRConfig } from "swr";
import { AuthProvider } from "@/hooks/useAuth";
import { LocaleProvider } from "@/hooks/useLocale";

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
        <LocaleProvider>{children}</LocaleProvider>
      </AuthProvider>
    </SWRConfig>
  );
}
