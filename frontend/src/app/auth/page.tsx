"use client";

import { useState, useEffect, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";

// ═══════════════════════════════════════════════════════
// ICONS — warm gold / parchment tone
// ═══════════════════════════════════════════════════════
function CompassLogo() {
  return (
    <svg width="34" height="34" viewBox="0 0 48 48" fill="none">
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

function CompassNode({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="10" stroke="oklch(0.66 0.14 78)" strokeWidth="0.8" opacity="0.6" />
      <path d="M16 7 L18 16 L16 25 L14 16 Z" fill="oklch(0.64 0.13 80)" opacity="0.7" />
      <path d="M7 16 L16 14 L25 16 L16 18 Z" fill="oklch(0.7 0.12 78)" opacity="0.55" />
      <circle cx="16" cy="16" r="1.2" fill="oklch(0.55 0.14 82)" />
    </svg>
  );
}

function FeatureGlyph({ glyph }: { glyph: "book" | "crown" | "compass" }) {
  const common = {
    width: 13,
    height: 13,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (glyph === "book")
    return (
      <svg {...common}>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14z" />
        <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
      </svg>
    );
  if (glyph === "crown")
    return (
      <svg {...common}>
        <path d="M3 11l4-4 5 5 5-5 4 4v7H3v-7z" />
        <path d="M7 21h10" />
      </svg>
    );
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a7 7 0 0 1 0 14M2 12h20" />
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

      <g stroke="oklch(0.62 0.12 78)" strokeWidth="0.6" fill="none" opacity="0.55">
        <path d="M180 720 Q220 680 260 640 Q300 600 360 560 Q420 520 470 470 Q520 430 560 390 Q600 355 620 325" strokeDasharray="3 5" />
        <path d="M180 720 Q150 780 170 830 Q190 860 230 870" strokeDasharray="3 5" />
        <path d="M620 325 Q640 280 660 230 Q670 200 655 160" strokeDasharray="3 5" />
      </g>
      <g stroke="oklch(0.62 0.12 78)" strokeWidth="0.35" fill="none" opacity="0.4">
        <path d="M180 720 L260 640 M260 640 L360 560 M360 560 L470 470 M470 470 L560 390 M560 390 L620 325 M620 325 L655 160" />
      </g>

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

      {/* Layer 6: Ambient golden scan line — very faint, slow cycle for lingering life */}
      <div
        className="civil-scanline pointer-events-none absolute inset-x-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, oklch(0.78 0.12 80 / 0.55), transparent)",
        }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// SPACED CIDD LANDS — "O D Y S S E Y" 字符逐个唤醒
// ═══════════════════════════════════════════════════════
function SpacedLetters({
  text,
  className = "",
  delayBase = 0,
  step = 0.08,
}: {
  text: string;
  className?: string;
  delayBase?: number;
  step?: number;
}) {
  return (
    <span className="inline-flex items-center gap-[0.22em]">
      {text.split("").map((ch, i) => (
        <span
          key={i}
          className={`civil-letter inline-block ${className}`}
          style={{ animationDelay: `${delayBase + i * step}s` }}
        >
          {ch}
        </span>
      ))}
    </span>
  );
}

// ═══════════════════════════════════════════════════════
// CIVILIZATION MOTTO — 底部文明箴言 淡入淡出轮换
// ═══════════════════════════════════════════════════════
function CivilMotto({ t }: { t: (k: string) => string }) {
  const mottos = [t("auth.motto1"), t("auth.motto2"), t("auth.motto3")];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % mottos.length), 10000);
    return () => clearInterval(id);
  }, [mottos.length]);

  return (
    <p
      key={idx}
      className="civil-motto max-w-[480px] font-civ-serif text-[14px] italic leading-relaxed text-[oklch(0.3 0.03 65)]"
      style={{ textShadow: "0 1px 2px oklch(1 0.02 90 / 0.4)" }}
    >
      {mottos[idx]}
    </p>
  );
}

// ═══════════════════════════════════════════════════════
// AUTH INPUT — 下划线形式 · 极细金色线条 · 无填充背景
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
  showToggle = false,
  connectedText,
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
  showToggle?: boolean;
  connectedText?: string;
}) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputType = showToggle ? (show ? "text" : "password") : type;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={id}
          className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[oklch(0.45 0.05 70)]"
        >
          {label}
        </label>
        {value.length > 0 && (
          <span className="flex items-center gap-1.5 text-[10px] normal-case tracking-normal text-[oklch(0.55 0.1 80)]">
            <span className="inline-block h-1 w-1 rounded-full bg-[oklch(0.62 0.12 80)]" />
            {connectedText}
          </span>
        )}
      </div>

      <div className="group relative">
        {/* symbol assist */}
        <div className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-[oklch(0.55 0.05 70)] transition-colors duration-300 group-focus-within:text-[oklch(0.68 0.1 80)]">
          {icon}
        </div>

        <input
          id={id}
          type={inputType}
          required={required}
          minLength={minLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="h-[44px] w-full border-0 border-b bg-transparent pl-7 pr-9 text-[14px] text-[oklch(0.25 0.03 70)] outline-none transition-colors duration-300 placeholder:text-[oklch(0.55 0.02 75)]"
          style={{ borderBottomColor: "transparent" }}
        />

        {/* base thin line */}
        <span className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-[oklch(0.6 0.04 80 / 0.35)]" />
        {/* active gold line */}
        <span
          className={`pointer-events-none absolute bottom-0 left-0 h-px bg-[#C9A45C] transition-all duration-500 ${
            focused ? "w-full" : "w-0"
          }`}
        />
        {/* moving light */}
        <span
          className={`civil-flow pointer-events-none absolute bottom-0 left-0 h-px w-1/3 bg-gradient-to-r from-transparent via-[oklch(0.95 0.05 90)] to-transparent transition-opacity duration-300 ${
            focused ? "opacity-70" : "opacity-0"
          }`}
        />

        {showToggle && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-[oklch(0.55 0.05 75)] hover:text-[oklch(0.35 0.08 80)] transition-colors"
            aria-label={show ? "隐藏密码" : "显示密码"}
            tabIndex={-1}
          >
            {show ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                <line x1="2" y1="2" x2="22" y2="22" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// AUTH CARD — 文明认证终端 · 半透明 · 金色细线 · 微弱光晕
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
  login: (payload: { email: string; password: string }) => Promise<string>;
  register: (payload: {
    email: string;
    username: string;
    password: string;
  }) => Promise<string>;
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
  const [switching, setSwitching] = useState(false);
  const [activating, setActivating] = useState(false);
  const isLogin = mode === "login";

  // 文明档案翻页 — 先淡出，再切换并侧边滑入
  function switchMode(next: "login" | "register") {
    if (next === mode) return;
    setLocalError(null);
    clearError();
    setSwitching(true);
    setTimeout(() => {
      setMode(next);
      setSwitching(false);
    }, 200);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);
    if (isLoading) return;
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
    // 短暂启动反馈：金色光线扩散
    setActivating(true);
    setTimeout(() => setActivating(false), 650);
    try {
      const redirectTo = isLogin
        ? await login({ email, password })
        : await register({ email, username, password });
      router.push(redirectTo);
    } catch {
      // Error handled in AuthContext
    }
  }

  const displayError = localError || error;

  return (
    <div className="w-full max-w-[440px] civil-terminal-in">
      {/* 文明认证终端 — translucent, frosted, thin gold line, faint glow */}
      <div
        className="relative overflow-hidden rounded-[6px] border border-[#C9A45C]/45"
        style={{
          background:
            "linear-gradient(165deg, oklch(0.98 0.02 86 / 0.3) 0%, oklch(0.96 0.02 84 / 0.22) 50%, oklch(0.94 0.03 82 / 0.26) 100%)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          boxShadow:
            "0 20px 50px oklch(0.3 0.04 70 / 0.22), 0 0 0 1px oklch(0.4 0.03 70 / 0.06), 0 0 44px oklch(0.7 0.12 80 / 0.07)",
        }}
      >
        {/* edge gold scan — 认证终端启动时扫描一次 */}
        <span
          className="civil-terminal-scan pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "linear-gradient(90deg, transparent, oklch(0.78 0.12 80 / 0.45), transparent) 0% 0% / 200% 100%",
            backgroundRepeat: "no-repeat",
          }}
        />

        <div className="relative px-8 py-8">
          {/* 档案翻页内容：标题 + 表单 */}
          <div key={mode} className={switching ? "civil-page-out" : "civil-page-in"}>
            {/* Title */}
            <div className="mb-6 text-center">
              <div className="flex items-center justify-center gap-3 text-[oklch(0.6 0.1 80)]">
                <span className="h-px w-8 bg-[oklch(0.6 0.08 80 / 0.4)]" />
                <CompassNode size={18} />
                <span className="h-px w-8 bg-[oklch(0.6 0.08 80 / 0.4)]" />
              </div>
              <h1 className="mt-3 font-civ-serif text-[22px] font-semibold tracking-[0.14em] text-[oklch(0.28 0.03 72)]">
                {isLogin ? t("auth.explorerTitle") : t("auth.establishTitle")}
              </h1>
              <p className="mt-1.5 text-[12px] tracking-wide text-[oklch(0.5 0.03 75)]">
                {isLogin ? t("auth.loginSub") : t("auth.registerSub")}
              </p>
            </div>

            {/* Error banner */}
            {displayError && (
              <div className="mb-5 rounded-[4px] border border-[oklch(0.6 0.1 25 / 0.2)] bg-[oklch(0.6 0.1 25 / 0.06)] px-4 py-3 text-[13px] text-[oklch(0.45 0.1 30)]">
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
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Form — fixed min-height prevents layout jump when switching */}
            <form onSubmit={handleSubmit} className="min-h-[300px] space-y-5">
              <AuthInput
                id="email"
                type={isLogin ? "text" : "email"}
                label={isLogin ? t("auth.identityLabel") : t("auth.email")}
                value={email}
                onChange={setEmail}
                placeholder={isLogin ? t("auth.accountPlaceholder") : t("auth.emailPlaceholder")}
                required
                autoComplete={isLogin ? "username" : "email"}
                icon={isLogin ? <UserIcon /> : <MailIcon />}
                connectedText={t("auth.identityConnected")}
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
                  connectedText={t("auth.identityConnected")}
                />
              )}

              <AuthInput
                id="password"
                type="password"
                label={isLogin ? t("auth.sealLabel") : t("auth.password")}
                value={password}
                onChange={setPassword}
                placeholder={t("auth.passwordPlaceholder")}
                required
                minLength={6}
                autoComplete={isLogin ? "current-password" : "new-password"}
                icon={<LockIcon />}
                showToggle
                connectedText={t("auth.identityConnected")}
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
                  showToggle
                  connectedText={t("auth.identityConnected")}
                />
              )}

              {/* Forgot password hint (login only) */}
              {isLogin && (
                <div className="-mt-1 text-right">
                  <span className="text-[11px] text-[oklch(0.5 0.03 75)]">
                    {t("auth.forgotPassword")}
                  </span>
                </div>
              )}

              {/* 文明启动按钮 — 金色描边 · 半透明内部 · 微弱光效 */}
              <button
                type="submit"
                disabled={isLoading}
                className="group relative mt-2 h-[54px] w-full overflow-hidden rounded-[6px] border border-[#C9A45C]/70 text-[14px] font-semibold tracking-[0.2em] text-[oklch(0.42 0.09 75)] transition-all duration-300 hover:border-[#C9A45C] hover:text-[oklch(0.3 0.09 70)] hover:shadow-[inset_0_0_0_1px_oklch(0.72_0.12_80_/_0.35),0_0_24px_oklch(0.7_0.12_80_/_0.18)] disabled:cursor-not-allowed disabled:opacity-55"
                style={{
                  background:
                    "linear-gradient(120deg, oklch(0.98 0.02 86 / 0.12) 0%, oklch(0.96 0.03 82 / 0.2) 100%)",
                }}
              >
                {/* hover 金色能量流动 */}
                <span className="civil-flow pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-[#C9A45C]/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                {/* click 短暂启动反馈 — 金色光线扩散 */}
                {activating && (
                  <span className="civil-ray pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 rounded-full border border-[#C9A45C]/80" />
                )}
                <span className="relative flex items-center justify-center gap-2">
                  {isLoading
                    ? isLogin
                      ? t("auth.loggingIn")
                      : t("auth.creatingAccount")
                    : t("auth.beginJourney")}
                </span>
              </button>
            </form>
          </div>

          {/* 底部切换提示 */}
          <p className="mt-6 text-center text-[12px] text-[oklch(0.5 0.03 75)]">
            {isLogin ? t("auth.noAccount") : t("auth.hasAccount")}{" "}
            <button
              onClick={() => switchMode(isLogin ? "register" : "login")}
              className="font-semibold text-[oklch(0.6 0.1 80)] transition-colors hover:text-[oklch(0.45 0.1 75)]"
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
// MAIN AUTH PAGE — two-column (brand + certification terminal)
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
        {/* Soft parchment gradient panel — ensures text contrast on top of the city image */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(100deg, oklch(0.96 0.02 85 / 0.72) 0%, oklch(0.94 0.025 82 / 0.6) 40%, oklch(0.92 0.03 80 / 0.42) 70%, oklch(0.9 0.03 78 / 0.18) 90%, transparent 100%)",
          }}
        />

        {/* Top — Logo + spaced brand */}
        <div>
          <div className="flex items-center gap-4">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-[6px] border border-[oklch(0.6 0.1 80 / 0.5)]"
              style={{
                background: "oklch(0.98 0.02 86 / 0.35)",
                boxShadow: "0 0 24px oklch(0.7 0.12 80 / 0.12)",
              }}
            >
              <CompassLogo />
            </div>
            <div>
              <SpacedLetters
                text="O D Y S S E Y"
                className="font-civ-serif text-[18px] font-semibold tracking-[0.18em] text-[oklch(0.18 0.025 60)]"
              />
              <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.3em] text-[oklch(0.45 0.07 78)]">
                {t("auth.brandTagline")}
              </p>
            </div>
          </div>
        </div>

        {/* Middle — Main headline (文明刻录效果) */}
        <div className="max-w-[520px]">
          <p
            className="civil-engrave mb-3 text-[12px] font-semibold uppercase tracking-[0.32em] text-[oklch(0.55 0.12 82)]"
            style={{ animationDelay: "0.9s" }}
          >
            {t("auth.heroEyebrow")}
          </p>
          <h2
            className="civil-engrave font-civ-serif text-[42px] font-semibold leading-[1.2] tracking-[0.06em] text-[oklch(0.18 0.025 60)]"
            style={{ animationDelay: "1.1s" }}
          >
            {t("auth.heroTitle")}
          </h2>
          <p
            className="mt-5 text-[15px] leading-[1.8] text-[oklch(0.3 0.02 65)]"
            style={{ textShadow: "0 1px 3px oklch(1 0.02 90 / 0.4)" }}
          >
            {t("auth.heroDesc")}
          </p>

          {/* Feature markers — thin-line, translucent (no white pills) */}
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
            {[
              { glyph: "book" as const, text: t("auth.featureJournals") },
              { glyph: "crown" as const, text: t("auth.featureMilestones") },
              { glyph: "compass" as const, text: t("auth.featureMaps") },
            ].map((f) => (
              <div key={f.glyph} className="flex items-center gap-2 text-[oklch(0.4 0.04 72)]">
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[oklch(0.6 0.1 80 / 0.4)] text-[oklch(0.6 0.1 80)]">
                  <FeatureGlyph glyph={f.glyph} />
                </span>
                <span className="font-civ-serif text-[12.5px] italic">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom — civilization motto rotation */}
        <div className="flex items-center gap-4">
          <div className="h-8 w-px" style={{ background: "oklch(0.7 0.05 80)" }} />
          <div className="min-h-[44px]">
            <CivilMotto t={t} />
          </div>
        </div>
      </div>

      {/* RIGHT — 文明认证终端 (~40-45% width) */}
      <div className="relative flex flex-[2] items-center justify-center px-5 py-10 md:px-10 md:py-16">
        {/* Mobile brand — condensed */}
        <div className="mb-6 block text-center md:hidden">
          <SpacedLetters
            text="O D Y S S E Y"
            className="font-civ-serif text-[20px] font-semibold tracking-[0.18em] text-[oklch(0.28 0.03 72)]"
          />
          <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[oklch(0.55 0.04 78)]">
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