"use client";

import { useRouter } from "next/navigation";

interface BackButtonProps {
  /** Custom label (default: "返回") */
  label?: string;
  /** Route to navigate to. If omitted, calls router.back() */
  href?: string;
  /** Additional class names */
  className?: string;
}

/**
 * Reusable back-navigation button.
 * Uses router.back() by default, or navigates to a specific route via `href`.
 */
export function BackButton({ label = "返回", href, className = "" }: BackButtonProps) {
  const router = useRouter();

  function handleClick() {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground ${className}`}
    >
      {/* Chevron-left icon */}
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      {label}
    </button>
  );
}
