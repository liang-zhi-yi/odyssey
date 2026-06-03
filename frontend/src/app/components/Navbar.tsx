"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/skills", label: "Skills" },
  { href: "/quests", label: "Quests" },
  { href: "/passport", label: "Passport" },
];

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const pathname = usePathname();

  // Hide navbar on login/register pages
  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-primary transition-colors hover:opacity-80"
        >
          Odyssey
        </Link>

        {isAuthenticated && (
          <>
            {/* Nav links */}
            <div className="hidden items-center gap-1 sm:flex">
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

            {/* User section */}
            <div className="flex items-center gap-3">
              {user && (
                <span className="hidden text-sm text-muted-foreground sm:inline">
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
