"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";

// ═══════════════════════════════════════════════════════
// ICONS — warm gold / parchment tone
// ═══════════════════════════════════════════════════════
function CompassLogo() {
  return (
    <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="22" stroke="oklch(0.62 0.12 80)" strokeWidth="1.2" opacity="0.65" />
      <circle cx="24" cy="24" r="16" stroke="oklch(0.66 0.14 75)" strokeWidth="0.8" opacity="0.55" strokeDasharray="2 2" />
      <path d="M24 6 L27 24 L24 42 L21 24 Z" fill="oklch(0.62 0.12 80)" opacity="0.85" />
      <path d="M6 24 L24 21 L42 24 L24 27 Z" fill="oklch(0.66 0.14 75)" opacity="0.6" />
      <circle cx="24" cy="24" r="3.5" fill="oklch(0.58 0.14 78)" />
      <circle cx="24" cy="24" r="1.2" fill="oklch(0.97 0.01 95)" />
      <circle cx="24" cy="6" r="1.2" fill="oklch(0.62 0.12 80)" />
      <circle cx="24" cy="42" r="1.2" fill="oklch(0.62 0.12 80)" />
      <circle cx="6" cy="24" r="1.2" fill="oklch(0.66 0.14 75)" />
      <circle cx="42" cy="24" r="1.2" fill="oklch(0.66 0.14 75)" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="6" width="16" height="12" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c0-4.1 3.3-7.5 7.5-7.5s7.5 3.4 7.5 7.5" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4.5" y="11" width="15" height="10" rx="2" />
      <path d="M7.5 11V7.5a4.5 4.5 0 0 1 9 0V11" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function CrownIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <ellipse cx="16" cy="28" rx="10" ry="1.6" fill="oklch(0.64 0.12 78)" opacity="0.45" />
      <path d="M3 22l4-10 5 6 4-9 4 9 5-6 4 10z" fill="oklch(0.72 0.14 75)" opacity="0.55" />
      <path d="M3 22l4-10 5 6 4-9 4 9 5-6 4 10z" stroke="oklch(0.62 0.12 80)" strokeWidth="0.8" fill="none" opacity="0.85" />
      <circle cx="7" cy="12" r="1.2" fill="oklch(0.68 0.14 80)" />
      <circle cx="16" cy="8" r="1.2" fill="oklch(0.72 0.14 75)" />
      <circle cx="25" cy="12" r="1.2" fill="oklch(0.68 0.14 80)" />
      <circle cx="3" cy="22" r="1" fill="oklch(0.62 0.12 80)" opacity="0.8" />
      <circle cx="29" cy="22" r="1" fill="oklch(0.62 0.12 80)" opacity="0.8" />
    </svg>
  );
}

function BookIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="11" stroke="oklch(0.66 0.14 78)" strokeWidth="0.9" fill="oklch(0.98 0.008 85)" opacity="0.6" />
      <path d="M10 11h4v10h-4z" fill="oklch(0.7 0.12 80)" opacity="0.55" />
      <path d="M18 11h4v10h-4z" fill="oklch(0.7 0.12 80)" opacity="0.55" />
      <path d="M14 11v10M18 11v10" stroke="oklch(0.62 0.12 80)" strokeWidth="0.8" opacity="0.85" />
      <path d="M11 13h2M11 15h2M11 17h2M19 13h2M19 15h2M19 17h2" stroke="oklch(0.62 0.12 80)" strokeWidth="0.6" opacity="0.6" />
    </svg>
  );
}

function CompassNode({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="10" stroke="oklch(0.66 0.14 78)" strokeWidth="0.8" opacity="0.6" />
      <path d="M16 7 L18 16 L16 25 L14 16 Z" fill="oklch(0.64 0.13 80)" opacity="0.7" />
      <path d="M7 16 L16 14 L25 16 L16 18 Z" fill="oklch(0.7 0.12 78)" opacity="0.55" />
      <circle cx="16" cy="16" r="1.2" fill="oklch(0.55 0.14 82)" />
    </svg>
  );
}

function StarNode() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="14" fill="oklch(0.65 0.13 80)" opacity="0.12" />
      <path d="M20 8 L21.8 15 L29 15.5 L23.2 20 L25 27 L20 23 L15 27 L16.8 20 L11 15.5 L18.2 15 Z" fill="oklch(0.7 0.12 78)" opacity="0.65" />
      <path d="M20 8 L21.8 15 L29 15.5 L23.2 20 L25 27 L20 23 L15 27 L16.8 20 L11 15.5 L18.2 15 Z" stroke="oklch(0.6 0.14 82)" strokeWidth="0.6" opacity="0.9" />
      <circle cx="20" cy="20" r="1.5" fill="oklch(0.95 0.02 90)" />
    </svg>
  );
}

// Social icons
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.9 1.5l2.6-2.5C16.9 3.3 14.7 2.5 12 2.5 6.8 2.5 2.5 6.8 2.5 12S6.8 21.5 12 21.5c6.9 0 11.5-4.9 11.5-11.7 0-.8-.1-1.4-.2-2L12 10.2z" />
    </svg>
  );
}
function WeChatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path fill="#22C65C" d="M8.7 2C4.5 2 1 4.9 1 8.5c0 2 1.1 3.8 2.9 5l-.7 2.2 2.5-1.3c.9.2 1.9.4 3 .4h.5c-.1-.4-.2-.9-.2-1.3 0-3 3.1-5.5 6.9-5.5h.6c-.4-2.7-3.5-5-7.5-5zm-2.8 4.5c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1zm5.6 0c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1z" />
      <path fill="#22C65C" d="M23 14.5c0-2.8-2.9-5-6.4-5s-6.4 2.2-6.4 5 2.9 5 6.4 5c.7 0 1.4-.1 2.1-.3l1.9 1-.5-1.8c1.8-1 2.9-2.5 2.9-3.9zm-8.5-1c.4 0 .8.3.8.8s-.4.8-.8.8-.8-.3-.8-.8.4-.8.8-.8zm4.2 0c.4 0 .8.3.8.8s-.4.8-.8.8-.8-.3-.8-.8.4-.8.8-.8z" />
    </svg>
  );
}
function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path fill="#222" d="M16.4 12.5c0-2.7 2.2-4 2.3-4.1-1.3-1.9-3.2-2.1-3.9-2.2-1.7-.2-3.2 1-4.1 1-.9 0-2.2-1-3.6-.9-1.9 0-3.6 1.1-4.6 2.7-1.9 3.4-.5 8.3 1.3 11.1.9 1.3 1.9 2.8 3.3 2.7 1.3-.1 1.8-.9 3.4-.8s2 .8 3.4.8 2.1-1.3 2.9-2.6c.9-1.4 1.3-2.8 1.3-2.9-.1 0-2.8-1.1-2.7-4.8zm-1.9-7.4c.7-.9 1.2-2.1 1.1-3.3-1 .1-2.3.7-3 1.6-.7.7-1.3 2-1.1 3.2 1.1.1 2.3-.6 3-1.5z" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════
// DECORATIVE GOLDEN NODES WITH CONNECTING LINES
// ═══════════════════════════════════════════════════════
function GoldenNodes() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      preserveAspectRatio="none"
      viewBox="0 0 1000 900"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="oklch(0.78 0.12 75)" stopOpacity="0.5" />
          <stop offset="60%" stopColor="oklch(0.7 0.12 80)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="oklch(0.65 0.12 78)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Golden connection lines — flowing dashed pathways */}
      <g stroke="oklch(0.62 0.12 78)" strokeWidth="0.6" fill="none" opacity="0.55">
        <path d="M180 720 Q220 680 260 640 Q300 600 360 560 Q420 520 470 470 Q520 430 560 390 Q600 355 620 325" strokeDasharray="3 5" />
        <path d="M180 720 Q150 780 170 830 Q190 860 230 870" strokeDasharray="3 5" />
        <path d="M620 325 Q640 280 660 230 Q670 200 655 160" strokeDasharray="3 5" />
      </g>
      <g stroke="oklch(0.62 0.12 78)" strokeWidth="0.35" fill="none" opacity="0.4">
        <path d="M180 720 L260 640 M260 640 L360 560 M360 560 L470 470 M470 470 L560 390 M560 390 L620 325 M620 325 L655 160" />
      </g>

      {/* Glow halos at nodes */}
      <circle cx="180" cy="720" r="28" fill="url(#nodeGlow)" />
      <circle cx="360" cy="560" r="24" fill="url(#nodeGlow)" />
      <circle cx="560" cy="390" r="22" fill="url(#nodeGlow)" />
      <circle cx="655" cy="160" r="26" fill="url(#nodeGlow)" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════
// BACKGROUND LAYER — uses the reference fantasy city image
// ═══════════════════════════════════════════════════════
function AuthBackground() {
  return (
    <div aria-hidden="true" className="fixed inset-0 overflow-hidden">
      {/* Layer 1: The actual reference image — fantasy city with golden constellations */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/bg/odyssey-auth-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Layer 2: Warm golden tint overlay — unifies the image tone with the UI palette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.78 0.08 80 / 0.18) 0%, oklch(0.7 0.07 78 / 0.10) 50%, oklch(0.65 0.06 75 / 0.15) 100%)",
        }}
      />

      {/* Layer 3: Soft radial haze — center warm highlight from the sun */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 65% 35%, oklch(0.85 0.08 80 / 0.22) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 15% 80%, oklch(0.6 0.05 75 / 0.18) 0%, transparent 65%)",
        }}
      />

      {/* Layer 4: Vignette — edges gently darkened to focus attention on content */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 45%, oklch(0.25 0.02 60 / 0.35) 100%)",
        }}
      />

      {/* Layer 5: Golden node decorative overlay (the signature constellation glow) */}
      <GoldenNodes />
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// AUTH INPUT — pill-shaped with icon and underline focus
// ═══════════════════════════════════════════════════════
function AuthInput({
  id,
  type,
  label,
  value,
  onChange,
  placeholder,
  required,
  minLength,
  autoComplete,
  icon,
}: {
  id: string;
  type: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
  icon: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-[12px] font-medium tracking-wide text-[oklch(0.48 0.04 75)]"
      >
        {label}
      </label>
      <div className="group relative">
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[oklch(0.55 0.05 75)] transition-colors duration-200 group-focus-within:text-[oklch(0.68 0.09 82)]">
          {icon}
        </div>
        <input
          id={id}
          type={type}
          required={required}
          minLength={minLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="h-[48px] w-full rounded-[24px] border border-[oklch(0.82 0.03 82)] bg-[oklch(0.98 0.008 90 / 0.6)] pl-11 pr-4 text-[14px] text-[oklch(0.25 0.025 70)] outline-none transition-all duration-200 placeholder:text-[oklch(0.6 0.02 78)] focus:border-[oklch(0.68 0.09 82)] focus:bg-white/80 focus:shadow-[0_0_0_4px_oklch(0.68_0.09_82_/_0.12)]"
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// AUTH CARD — glassmorphism, pill-tabs, golden gradient button
// ═══════════════════════════════════════════════════════
function AuthCard({
  mode,
  setMode,
  login,
  register,
  isLoading,
  router,
  error,
  clearError,
  t,
}: {
  mode: "login" | "register";
  setMode: (m: "login" | "register") => void;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: {
    email: string;
    username: string;
    password: string;
  }) => Promise<void>;
  isLoading: boolean;
  router: ReturnType<typeof useRouter>;
  error: string | null;
  clearError: () => void;
  t: (k: string) => string;
}) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const isLogin = mode === "login";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);
    if (!isLogin) {
      if (password !== confirmPassword) {
        setLocalError(t("auth.passwordMismatchError"));
        return;
      }
      if (password.length < 6) {
        setLocalError(t("auth.passwordMinLength"));
        return;
      }
    }
    try {
      if (isLogin) {
        await login({ email, password });
      } else {
        await register({ email, username, password });
      }
      router.push("/dashboard");
    } catch {
      // Error handled in AuthContext
    }
  }

  const displayError = localError || error;

  return (
    <div className="w-full max-w-[440px] animate-auth-fade-in">
      {/* Glassmorphism card — stronger opacity + warm tint for readability on top of photo */}
      <div
        className="overflow-hidden rounded-[28px] border border-[oklch(0.78 0.06 80 / 0.5)] shadow-[0_25px_70px_oklch(0.25_0.04_60_/_0.45),0_1px_2px_oklch(1_0_1_/_0.1)] backdrop-blur-2xl"
        style={{
          background:
            "linear-gradient(160deg, oklch(0.98 0.015 88 / 0.92) 0%, oklch(0.96 0.02 85 / 0.88) 50%, oklch(0.94 0.025 82 / 0.92) 100%)",
        }}
      >
        {/* Top subtle gradient strip */}
        <div
          className="h-1.5 w-full"
          style={{
            background:
              "linear-gradient(90deg, oklch(0.72 0.08 82) 0%, oklch(0.78 0.10 78) 50%, oklch(0.72 0.08 82) 100%)",
          }}
        />

        <div className="px-8 py-7">
          {/* Welcome heading */}
          <div className="mb-6 text-center">
            <h1 className="font-civ-serif text-[24px] font-semibold tracking-[0.12em] text-[oklch(0.28 0.03 72)]">
              {t("auth.brandTitle")}
            </h1>
            <p className="mt-1 text-[13px] text-[oklch(0.52 0.02 78)]">
              {isLogin ? t("auth.loginSub") : t("auth.registerSub")}
            </p>
          </div>

          {/* Pill-style tab switch — elevated pill on warm background */}
          <div className="mb-6 flex items-center rounded-full border border-[oklch(0.78 0.06 80 / 0.45)] bg-[oklch(0.97 0.015 88 / 0.9)] p-1.5 shadow-[0_1px_3px_oklch(0.3_0.04_70_/_0.08)]">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setLocalError(null);
                clearError();
              }}
              className={`relative flex-1 rounded-full py-2 text-[13px] font-medium tracking-wide transition-all duration-200 ${
                isLogin
                  ? "bg-gradient-to-b from-[oklch(0.76 0.09 80)] to-[oklch(0.7 0.08 78)] text-white shadow-[0_2px_8px_oklch(0.65_0.08_82_/_0.25)]"
                  : "text-[oklch(0.52 0.02 78)] hover:text-[oklch(0.35 0.03 75)]"
              }`}
            >
              {t("auth.tabLogin")}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setLocalError(null);
                clearError();
              }}
              className={`relative flex-1 rounded-full py-2 text-[13px] font-medium tracking-wide transition-all duration-200 ${
                !isLogin
                  ? "bg-gradient-to-b from-[oklch(0.76 0.09 80)] to-[oklch(0.7 0.08 78)] text-white shadow-[0_2px_8px_oklch(0.65_0.08_82_/_0.25)]"
                  : "text-[oklch(0.52 0.02 78)] hover:text-[oklch(0.35 0.03 75)]"
              }`}
            >
              {t("auth.tabRegister")}
            </button>
          </div>

          {/* Error banner */}
          {displayError && (
            <div className="animate-auth-fade-in mb-5 rounded-xl border border-[oklch(0.6 0.1 25 / 0.18)] bg-[oklch(0.6 0.1 25 / 0.04)] px-4 py-3 text-[13px] text-[oklch(0.45 0.1 30)]">
              <div className="flex items-center justify-between gap-3">
                <span>{displayError}</span>
                <button
                  onClick={() => {
                    setLocalError(null);
                    clearError();
                  }}
                  className="text-[oklch(0.52 0.02 78)] hover:text-[oklch(0.4 0.02 76)]"
                  aria-label={t("auth.dismiss")}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  >
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Form — fixed min-height prevents layout jump when switching tabs */}
          <form onSubmit={handleSubmit} className="min-h-[280px] space-y-4">
            <AuthInput
              id="email"
              type="email"
              label={t("auth.email")}
              value={email}
              onChange={setEmail}
              placeholder={t("auth.emailPlaceholder")}
              required
              autoComplete="email"
              icon={<MailIcon />}
            />

            {!isLogin && (
              <AuthInput
                id="username"
                type="text"
                label={t("auth.username")}
                value={username}
                onChange={setUsername}
                placeholder={t("auth.usernamePlaceholder")}
                required
                minLength={2}
                autoComplete="username"
                icon={<UserIcon />}
              />
            )}

            <AuthInput
              id="password"
              type="password"
              label={t("auth.password")}
              value={password}
              onChange={setPassword}
              placeholder={t("auth.passwordPlaceholder")}
              required
              minLength={6}
              autoComplete={isLogin ? "current-password" : "new-password"}
              icon={<LockIcon />}
            />

            {!isLogin && (
              <AuthInput
                id="confirmPassword"
                type="password"
                label={t("auth.confirmPassword")}
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder={t("auth.confirmPlaceholder")}
                required
                autoComplete="new-password"
                icon={<LockIcon />}
              />
            )}

            {/* Forgot password link (login only) */}
            {isLogin && (
              <div className="-mt-1 text-right">
                <span className="text-[12px] text-[oklch(0.52 0.02 78)]">
                  {t("auth.forgotPassword")}
                </span>
              </div>
            )}

            {/* Golden gradient button with right-arrow icon */}
            <button
              type="submit"
              disabled={isLoading}
              className="group relative mt-2 h-[52px] w-full overflow-hidden rounded-[26px] text-[14px] font-semibold tracking-wide text-white transition-all duration-200 hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.8 0.1 75) 0%, oklch(0.74 0.09 80) 45%, oklch(0.7 0.08 78) 100%)",
                boxShadow:
                  "0 4px 14px oklch(0.65 0.08 82 / 0.28), 0 2px 4px oklch(0.5 0.07 80 / 0.15)",
              }}
            >
              {/* Top highlight */}
              <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/40" />
              {/* Bottom shadow line */}
              <span
                className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
                style={{ background: "oklch(0.45 0.06 78 / 0.5)" }}
              />
              <span className="flex items-center justify-center gap-2">
                <span>
                  {isLoading
                    ? isLogin
                      ? t("auth.loggingIn")
                      : t("auth.creatingAccount")
                    : isLogin
                      ? t("auth.loginButton")
                      : t("auth.registerButton")}
                </span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-transform duration-200 group-hover:translate-x-1"
                >
                  <path d="M5 12h14" />
                  <path d="M13 6l6 6-6 6" />
                </svg>
              </span>
            </button>
          </form>

          {/* Bottom hint */}
          <p className="mt-6 text-center text-[13px] text-[oklch(0.52 0.02 78)]">
            {isLogin ? t("auth.noAccount") : t("auth.hasAccount")}{" "}
            <button
              onClick={() => {
                setMode(isLogin ? "register" : "login");
                setLocalError(null);
                clearError();
              }}
              className="font-semibold text-[oklch(0.65 0.07 82)] underline-offset-2 hover:underline"
            >
              {isLogin ? t("auth.tabRegister") : t("auth.tabLogin")}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN AUTH PAGE — two-column (brand + auth card)
// ═══════════════════════════════════════════════════════
export default function AuthPage() {
  const { login, register, isLoading, error, clearError } = useAuth();
  const { t } = useLocale();
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <div className="relative flex min-h-[calc(100vh-56px)] w-full overflow-hidden">
      <AuthBackground />

      {/* LEFT — Brand / Story panel (~55-60% width) — warm gradient overlay for text contrast on photo */}
      <div className="relative hidden flex-[3] flex-col justify-between px-12 py-10 md:flex lg:px-16 xl:px-20">
        {/* Soft gradient panel — warm parchment tone to ensure text contrast on top of the city image */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(100deg, oklch(0.96 0.02 85 / 0.78) 0%, oklch(0.94 0.025 82 / 0.65) 40%, oklch(0.92 0.03 80 / 0.45) 70%, oklch(0.9 0.03 78 / 0.2) 90%, transparent 100%)",
          }}
        />
        {/* Top — Logo + tagline */}
        <div className="animate-auth-fade-in flex items-center gap-3" style={{ animationDelay: "0s" }}>
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.82 0.1 72) 0%, oklch(0.74 0.09 80) 60%, oklch(0.7 0.08 78) 100%)",
              boxShadow:
                "0 6px 16px oklch(0.65 0.08 82 / 0.28), inset 0 1px 0 oklch(1 0 1 / 0.35)",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="3" />
              <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
            </svg>
          </div>
          <div>
            <p className="font-civ-serif text-[20px] font-semibold tracking-[0.22em] text-[oklch(0.18 0.025 60)]" style={{ textShadow: "0 1px 2px oklch(1 0.02 90 / 0.5)" }}>
              {t("auth.brandTitle")}
            </p>
            <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-[oklch(0.42 0.06 78)]" style={{ textShadow: "0 1px 2px oklch(1 0.02 90 / 0.4)" }}>
              {t("auth.brandTagline")}
            </p>
          </div>
        </div>

        {/* Middle — Main headline */}
        <div
          className="animate-auth-fade-in max-w-[520px]"
          style={{ animationDelay: "100ms" }}
        >
          <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.3em] text-[oklch(0.55 0.12 82)]" style={{ textShadow: "0 1px 2px oklch(1 0.02 90 / 0.6)" }}>
            {t("auth.heroEyebrow")}
          </p>
          <h2 className="font-civ-serif text-[44px] font-semibold leading-[1.15] tracking-tight text-[oklch(0.18 0.025 60)]" style={{ textShadow: "0 2px 8px oklch(1 0.02 90 / 0.4), 0 1px 2px oklch(0.9 0.02 85 / 0.5)" }}>
            {t("auth.heroTitle")}
          </h2>
          <p className="mt-5 text-[15px] leading-[1.7] text-[oklch(0.3 0.02 65)]" style={{ textShadow: "0 1px 3px oklch(1 0.02 90 / 0.4)" }}>
            {t("auth.heroDesc")}
          </p>

          {/* Feature chips */}
          <div className="mt-8 flex flex-wrap gap-3">
            {[
              { icon: "book", text: t("auth.featureJournals") },
              { icon: "crown", text: t("auth.featureMilestones") },
              { icon: "compass", text: t("auth.featureMaps") },
            ].map((f) => (
              <div
                key={f.icon}
                className="flex items-center gap-2 rounded-full border border-[oklch(0.78 0.06 80 / 0.55)] bg-[oklch(0.98 0.015 88 / 0.88)] px-4 py-2 backdrop-blur-md shadow-[0_1px_2px_oklch(0.3_0.04_70_/_0.08)]"
              >
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.78 0.09 78) 0%, oklch(0.7 0.08 78) 100%)",
                  }}
                >
                  <span className="text-[13px] text-white">
                    {f.icon === "book" ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14z" />
                        <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
                      </svg>
                    ) : f.icon === "crown" ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 11l4-4 5 5 5-5 4 4v7H3v-7z" />
                        <circle cx="3" cy="11" r="1" />
                        <circle cx="12" cy="12" r="1" />
                        <circle cx="21" cy="11" r="1" />
                        <path d="M7 21h10" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 2a7 7 0 0 1 0 14M2 12h20" />
                      </svg>
                    )}
                  </span>
                </span>
                <span className="text-[12.5px] font-medium text-[oklch(0.35 0.03 75)]">
                  {f.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom — subtle quote / footer */}
        <div
          className="animate-auth-fade-in flex items-center gap-4"
          style={{ animationDelay: "200ms" }}
        >
          <div
            className="h-8 w-px"
            style={{ background: "oklch(0.7 0.05 80)" }}
          />
          <p className="max-w-[480px] font-civ-serif text-[14px] italic leading-relaxed text-[oklch(0.3 0.03 65)]" style={{ textShadow: "0 1px 2px oklch(1 0.02 90 / 0.4)" }}>
            {t("auth.heroQuote")}
          </p>
        </div>
      </div>

      {/* RIGHT — Auth card (~40-45% width) */}
      <div className="relative flex flex-[2] items-center justify-center px-5 py-10 md:px-10 md:py-16">
        {/* Mobile brand — condensed */}
        <div className="mb-6 block text-center md:hidden">
          <h1 className="font-civ-serif text-[22px] font-semibold tracking-[0.2em] text-[oklch(0.28 0.03 72)]">
            {t("auth.brandTitle")}
          </h1>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.28em] text-[oklch(0.55 0.04 78)]">
            {t("auth.brandTagline")}
          </p>
        </div>
        <AuthCard
          mode={mode}
          setMode={setMode}
          login={login}
          register={register}
          isLoading={isLoading}
          router={router}
          error={error}
          clearError={clearError}
          t={t}
        />
      </div>
    </div>
  );
}
