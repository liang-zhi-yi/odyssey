"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function PageGlassWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Skip glass wrapper on the landing page and auth pages (full-screen layouts)
  if (pathname === "/" || pathname === "/auth" || pathname === "/login" || pathname === "/register") {
    return <>{children}</>;
  }

  return <div className="page-glass p-6">{children}</div>;
}