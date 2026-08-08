"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/hooks/useLocale";
import { useAgent } from "@/hooks/useAgent";

const MOBILE_NAV_ITEMS = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: "🏛", label: "Dashboard" },
  { href: "/world", labelKey: "nav.myWorld", icon: "🗺", label: "My World" },
  { href: "/quests", labelKey: "nav.quests", icon: "📜", label: "Quests" },
  { href: "/paths", labelKey: "nav.learningPaths", icon: "🛤", label: "Paths" },
  { href: "/personal", labelKey: "nav.personal", icon: "👤", label: "Profile" },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { t } = useLocale();
  const { toggle: toggleAgent } = useAgent();

  // Hide on auth pages and intro video
  const hidePaths = ["/", "/auth", "/login", "/register", "/intro-video"];
  if (hidePaths.includes(pathname)) {
    return null;
  }

  return (
    <nav className="mobile-bottom-nav safe-bottom" role="navigation" aria-label="Mobile navigation">
      {MOBILE_NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href ||
          pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`mobile-bottom-nav-item ${isActive ? "active" : ""}`}
          >
            <span className="mobile-bottom-nav-icon">{item.icon}</span>
            <span className="mobile-bottom-nav-label">
              {(() => {
                const tr = t(item.labelKey);
                return tr !== item.labelKey ? tr : item.label;
              })()}
            </span>
          </Link>
        );
      })}
      {/* Agent button in bottom nav */}
      <button
        onClick={toggleAgent}
        className="mobile-bottom-nav-item"
        aria-label={t("agent.title")}
      >
        <span className="mobile-bottom-nav-icon">✨</span>
        <span className="mobile-bottom-nav-label">
          {t("agent.title")}
        </span>
      </button>
    </nav>
  );
}
