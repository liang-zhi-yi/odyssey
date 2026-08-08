"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const FULLSCREEN_PATHS = ["/", "/auth", "/login", "/register", "/intro-video"];

export function MainWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Full-screen pages: no max-width, no padding
  if (FULLSCREEN_PATHS.includes(pathname)) {
    return <main className="page-enter">{children}</main>;
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-3 py-4 pb-20 sm:px-4 sm:py-6 md:pb-16 page-enter">
      {children}
    </main>
  );
}
