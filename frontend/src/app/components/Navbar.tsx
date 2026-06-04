"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { DarkModeToggle } from "./DarkModeToggle";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/skills", label: "Skills" },
  { href: "/quests", label: "Quests" },
  { href: "/projects", label: "Projects" },
  { href: "/paths", label: "Paths" },
  { href: "/credentials", label: "Credentials" },
  { href: "/passport", label: "Passport" },
];

function useDarkMode() {
  const [isDark, setIsDark] = useState(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark") {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    } else if (stored === "light") {
      setIsDark(false);
      document.documentElement.classList.remove("dark");
    } else {
      // Check system preference
      const prefers = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDark(prefers);
      if (prefers) document.documentElement.classList.add("dark");
    }
  }, []);

  const toggle = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
      return next;
    });
  }, []);

  return { isDark, toggle };
}

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const pathname = usePathname();
  const { isDark, toggle } = useDarkMode();

  // Hide navbar on login/register pages
  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-primary transition-colors hover:opacity-80"
          >
            Odyssey
          </Link>
        </div>

        {isAuthenticated && (
          <>
            {/* Nav links */}
            <div className="hidden items-center gap-1 md:flex">
              {NAV_ITEMS.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Right section */}
            <div className="flex items-center gap-2">
              {/* Dark mode toggle */}
              <DarkModeToggle isDark={isDark} onToggle={toggle} />

              {/* Mobile nav — dropdown trigger */}
              <div className="md:hidden">
                {/* Simple mobile toggle via details/summary */}
                <details className="relative">
                  <summary className="list-none cursor-pointer rounded-lg p-2 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                      />
                    </svg>
                  </summary>
                  <div className="absolute right-0 top-full mt-1 w-40 rounded-xl border border-border bg-background p-1 shadow-lg">
                    {NAV_ITEMS.map((item) => {
                      const isActive =
                        pathname === item.href ||
                        pathname.startsWith(item.href + "/");
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                          }`}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </details>
              </div>

              {/* User section */}
              {user && (
                <span className="hidden text-sm text-muted-foreground lg:inline">
                  {user.username}
                </span>
              )}
              <button
                onClick={logout}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                Logout
              </button>
            </div>
          </>
        )}

        {!isAuthenticated && (
          <div className="flex items-center gap-2">
            <DarkModeToggle isDark={isDark} onToggle={toggle} />
            <Link
              href="/login"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
            >
              Get Started
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
