"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const FULLSCREEN_PATHS = ["/", "/auth", "/login", "/register"];

export function MainWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Full-screen pages: no max-width, no padding
  if (FULLSCREEN_PATHS.includes(pathname)) {
    return <main className="page-enter">{children}</main>;
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 pb-16 page-enter">
      {children}
    </main>
  );
}
