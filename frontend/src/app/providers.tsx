"use client";

import { type ReactNode } from "react";
import { SWRConfig } from "swr";
import { AuthProvider } from "@/hooks/useAuth";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        shouldRetryOnError: false,
        dedupingInterval: 2000,
      }}
    >
      <AuthProvider>{children}</AuthProvider>
    </SWRConfig>
  );
}
