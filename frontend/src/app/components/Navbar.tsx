"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { useAgent } from "@/hooks/useAgent";
import { DarkModeToggle } from "./DarkModeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { NotificationBell } from "./NotificationBell";

const NAV_ITEMS = [
  { href: "/dashboard", labelKey: "nav.dashboard", label: "Dashboard" },
  { href: "/world", labelKey: "nav.myWorld", label: "My World" },
  { href: "/skills", labelKey: "nav.skills", label: "Skills" },
  { href: "/quests", labelKey: "nav.quests", label: "Quests" },
  { href: "/paths", labelKey: "nav.learningPaths", label: "Learning Paths" },
  { href: "/projects", labelKey: "nav.projects", label: "Projects" },
  { href: "/history", labelKey: "nav.history", label: "History" },
  { href: "/personal", labelKey: "nav.personal", label: "Personal" },
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
  const { t } = useLocale();
  const pathname = usePathname();
  const { isDark, toggle } = useDarkMode();
  const { toggle: toggleAgent, hasUnread } = useAgent();

  // Hide navbar on login/register pages
  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-primary transition-colors hover:opacity-80"
          >
            Odyssey
          </Link>
        </div>

        {isAuthenticated && (
          <>
            {/* Nav links */}
            <div className="hidden items-center gap-2 md:flex">
              {NAV_ITEMS.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-xl px-3 py-1.5 text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? "bg-primary/10 text-primary shadow-sm"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    {(() => {
                      const tr = t(item.labelKey);
                      return tr !== item.labelKey ? tr : (item.label || item.labelKey);
                    })()}
                  </Link>
                );
              })}
            </div>

            {/* Right section */}
            <div className="flex items-center gap-2">
              {/* Dark mode toggle */}
              <DarkModeToggle isDark={isDark} onToggle={toggle} />

              {/* Language switcher */}
              <LanguageSwitcher />

              {/* Agent toggle */}
              <button
                onClick={toggleAgent}
                className="relative rounded-lg p-2 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
                title={t("agent.toggleOpen")}
                aria-label={t("agent.toggleOpen")}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
                {hasUnread && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
                )}
              </button>

              {/* Notification bell */}
              <NotificationBell />

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
                          {(() => {
                      const tr = t(item.labelKey);
                      return tr !== item.labelKey ? tr : (item.label || item.labelKey);
                    })()}
                        </Link>
                      );
                    })}
                  </div>
                </details>
              </div>

              {/* User section */}
              {user && (
                <Link
                  href="/settings"
                  className="flex items-center gap-2 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  title={t("nav.settings")}
                  aria-label={t("nav.settings")}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </Link>
              )}
              {user && (
                <span className="hidden text-sm text-muted-foreground lg:inline">
                  {user.username}
                </span>
              )}
              <button
                onClick={logout}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {t("nav.logout")}
              </button>
            </div>
          </>
        )}

        {!isAuthenticated && (
          <div className="flex items-center gap-2">
            <DarkModeToggle isDark={isDark} onToggle={toggle} />
            <LanguageSwitcher />
            <Link
              href="/login"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {t("nav.login")}
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
            >
              {t("nav.register")}
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
