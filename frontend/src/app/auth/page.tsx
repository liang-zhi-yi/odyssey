"use client";

import { useState, useEffect, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";

// ═══════════════════════════════════════════════════════
// ICONS — 东方水墨文明 · 暖金印记
// ═══════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════
// 文明坐标网格 + 扫描 — 未来文明档案坐标感
// ═══════════════════════════════════════════════════════
function CoordGrid() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
      aria-hidden="true"
    >
      <defs>
        <pattern id="coordGrid" width="6.25" height="6.25" patternUnits="userSpaceOnUse">
          <path d="M6.25 0 H0 V6.25" fill="none" stroke="oklch(0.7 0.12 80)" strokeWidth="0.05" />
        </pattern>
      </defs>
      <rect width="100" height="100" fill="url(#coordGrid)" />
      <circle cx="12" cy="18" r="0.28" fill="oklch(0.8 0.12 80)" />
      <circle cx="88" cy="82" r="0.28" fill="oklch(0.8 0.12 80)" />
      <circle cx="74" cy="26" r="0.22" fill="oklch(0.8 0.12 80)" />
      <circle cx="24" cy="74" r="0.22" fill="oklch(0.8 0.12 80)" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════
// 背景 — 东方水墨文明 · 缓慢流动 + 坐标扫描
// ═══════════════════════════════════════════════════════
function AuthBackground() {
  return (
    <div aria-hidden="true" className="fixed inset-0 overflow-hidden">
      {/* Layer 1: 水墨背景 — 缓慢流动 */}
      <div
        className="ink-drift absolute -inset-8"
        style={{
          backgroundImage: "url('/bg/ink-auth-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Layer 2: 暖金水墨调色覆盖 — 统一画面与 UI 色调 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(150deg, oklch(0.72 0.05 78 / 0.16) 0%, oklch(0.5 0.03 70 / 0.10) 50%, oklch(0.4 0.03 62 / 0.18) 100%)",
        }}
      />

      {/* Layer 3: 中央柔和光晕 — 文明苏醒的光 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 62% 48% at 62% 34%, oklch(0.85 0.07 82 / 0.18) 0%, transparent 62%), radial-gradient(ellipse 70% 90% at 18% 82%, oklch(0.5 0.04 68 / 0.16) 0%, transparent 65%)",
        }}
      />

      {/* Layer 4: 文明坐标网格 — 缓慢漂移 */}
      <div className="coord-grid absolute inset-0" style={{ backgroundImage: "radial-gradient(oklch(0.7 0.1 80 / 0.5) 1px, transparent 1.5px)", backgroundSize: "60px 60px" }} />
      <CoordGrid />

      {/* Layer 5: 文明坐标扫描线 — 自上而下缓慢移动 */}
      <div
        className="coord-scan pointer-events-none absolute inset-x-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, oklch(0.75 0.12 82 / 0.6), transparent)",
        }}
      />

      {/* Layer 6: 边缘暗角 — 聚焦中心内容 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 42%, oklch(0.16 0.015 55 / 0.42) 100%)",
        }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// SPACED ODYSSEY — "O D Y S S E Y" 字符逐个唤醒
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
// 文明宣言标题 — 逐字浮现
// ═══════════════════════════════════════════════════════
function ManifestTitle({ text }: { text: string }) {
  return (
    <h2 className="font-civ-serif text-[40px] font-semibold leading-[1.28] tracking-[0.05em] text-[oklch(0.2 0.02 55)] md:text-[44px]">
      {text.split("").map((ch, i) => (
        <span
          key={i}
          className={`manifest-char inline-block ${ch === " " ? "w-[0.32em]" : ""}`}
          style={{ animationDelay: `${0.4 + i * 0.12}s` }}
        >
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
    </h2>
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
      className="civil-motto max-w-[480px] font-civ-serif text-[14px] italic leading-relaxed text-[oklch(0.32 0.03 58)]"
      style={{ textShadow: "0 1px 2px oklch(1 0.02 90 / 0.4)" }}
    >
      {mottos[idx]}
    </p>
  );
}

// ═══════════════════════════════════════════════════════
// AUTH INPUT — 文明刻线 · 极细金色线条 · 无填充背景
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
          className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[oklch(0.45 0.05 65)]"
        >
          {label}
        </label>
        {value.length > 0 && (
          <span className="flex items-center gap-1.5 text-[10px] normal-case tracking-normal text-[oklch(0.58 0.1 78)]">
            <span className="inline-block h-1 w-1 rounded-full bg-[oklch(0.64 0.12 80)]" />
            {connectedText}
          </span>
        )}
      </div>

      <div className="group relative">
        {/* 符号辅助 */}
        <div className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-[oklch(0.55 0.05 68)] transition-colors duration-300 group-focus-within:text-[oklch(0.68 0.1 80)]">
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
          className="h-[44px] w-full border-0 border-b bg-transparent pl-7 pr-9 text-[14px] text-[oklch(0.22 0.02 60)] outline-none transition-colors duration-300 placeholder:text-[oklch(0.55 0.02 70)]"
          style={{ borderBottomColor: "transparent" }}
        />

        {/* 基底刻线 */}
        <span className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-[oklch(0.6 0.04 75 / 0.4)]" />
        {/* 激活金线 */}
        <span
          className={`pointer-events-none absolute bottom-0 left-0 h-px bg-[#C9A45C] transition-all duration-500 ${
            focused ? "w-full" : "w-0"
          }`}
        />
        {/* 微弱金光流动 */}
        <span
          className={`civil-flow pointer-events-none absolute bottom-0 left-0 h-px w-1/3 bg-gradient-to-r from-transparent via-[oklch(0.95 0.05 88)] to-transparent transition-opacity duration-300 ${
            focused ? "opacity-70" : "opacity-0"
          }`}
        />

        {showToggle && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-[oklch(0.55 0.05 72)] hover:text-[oklch(0.35 0.08 80)] transition-colors"
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
// AUTH ENTRY — 文明档案入口 · 水墨玻璃 · 四角金线绘制
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
    // 短暂启动反馈：金色光圈扩散
    setActivating(true);
    setTimeout(() => setActivating(false), 850);
    try {
      const redirectTo = isLogin
        ? await login({ email, password })
        : await register({ email, username, password });
      // 文明光芒扩散后再进入开场视频 / 首页
      await new Promise((r) => setTimeout(r, 700));
      router.push(redirectTo);
    } catch {
      // Error handled in AuthContext
    }
  }

  const displayError = localError || error;

  return (
    <div className="w-full max-w-[420px] civil-terminal-in">
      {/* 文明档案入口 — 水墨玻璃 · 无明显矩形边界 · 四角金线 */}
      <div className="ink-glass relative px-9 py-9 md:px-10 md:py-10">
        {/* 四角金线绘制出现 */}
        <div className="pointer-events-none absolute inset-0">
          <span className="entry-corner tl" />
          <span className="entry-corner tr" />
          <span className="entry-corner bl" />
          <span className="entry-corner br" />
        </div>
        {/* 顶部淡金呼吸光晕 */}
        <span
          className="ink-glow pointer-events-none absolute inset-x-10 top-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, oklch(0.72 0.12 80 / 0.55), transparent)" }}
        />
        {/* 顶部坐标标签 */}
        <div className="pointer-events-none absolute left-10 top-5 text-[9px] uppercase tracking-[0.3em] text-[oklch(0.5 0.06 72)]">
          {t("auth.manifestCoord")}
        </div>

        <div className="relative px-1 pt-6">
          {/* 档案翻页内容：标题 + 表单 */}
          <div key={mode} className={switching ? "civil-page-out" : "civil-page-in"}>
            {/* Title */}
            <div className="mb-6 text-center">
              <div className="flex items-center justify-center gap-3 text-[oklch(0.6 0.1 80)]">
                <span className="h-px w-8 bg-[oklch(0.6 0.08 78 / 0.45)]" />
                <CompassNode size={18} />
                <span className="h-px w-8 bg-[oklch(0.6 0.08 78 / 0.45)]" />
              </div>
              <h1 className="mt-3 font-civ-serif text-[22px] font-semibold tracking-[0.14em] text-[oklch(0.26 0.02 62)]">
                {isLogin ? t("auth.explorerTitle") : t("auth.establishTitle")}
              </h1>
              <p className="mt-1.5 text-[12px] tracking-wide text-[oklch(0.5 0.03 70)]">
                {isLogin ? t("auth.loginSub") : t("auth.registerSub")}
              </p>
            </div>

            {/* Error banner */}
            {displayError && (
              <div className="mb-5 border border-[oklch(0.6 0.1 25 / 0.25)] bg-[oklch(0.6 0.1 25 / 0.06)] px-4 py-3 text-[13px] text-[oklch(0.45 0.1 30)]">
                <div className="flex items-center justify-between gap-3">
                  <span>{displayError}</span>
                  <button
                    onClick={() => {
                      setLocalError(null);
                      clearError();
                    }}
                    className="text-[oklch(0.52 0.02 74)] hover:text-[oklch(0.4 0.02 72)]"
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
                  <span className="text-[11px] text-[oklch(0.5 0.03 70)]">
                    {t("auth.forgotPassword")}
                  </span>
                </div>
              )}

              {/* 文明启动按钮 — 金色描边 · 透明背景 · 点击文明光圈扩散 */}
              <button
                type="submit"
                disabled={isLoading}
                className="group relative mt-2 h-[54px] w-full overflow-hidden border border-[#C9A45C]/70 bg-transparent text-[14px] font-semibold tracking-[0.22em] text-[oklch(0.42 0.09 72)] transition-all duration-300 hover:border-[#C9A45C] hover:text-[oklch(0.3 0.09 68)] hover:shadow-[inset_0_0_0_1px_oklch(0.72_0.12_80_/_0.35),0_0_24px_oklch(0.7_0.12_80_/_0.18)] disabled:cursor-not-allowed disabled:opacity-55"
              >
                {/* hover 金色能量流动 */}
                <span className="civil-flow pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-[#C9A45C]/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                {/* click 文明光圈扩散 */}
                {activating && (
                  <span className="civil-aperture pointer-events-none absolute left-1/2 top-1/2 h-28 w-28 rounded-full border border-[#C9A45C]/80" />
                )}
                <span className="relative flex items-center justify-center gap-2">
                  {isLoading
                    ? isLogin
                      ? t("auth.loggingIn")
                      : t("auth.creatingAccount")
                    : isLogin
                      ? t("auth.continueExplore")
                      : t("auth.beginEra")}
                </span>
              </button>
            </form>
          </div>

          {/* 底部切换提示 */}
          <p className="mt-6 text-center text-[12px] text-[oklch(0.5 0.03 70)]">
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
// MAIN AUTH PAGE — 文明宣言 (左) + 文明档案入口 (右)
// ═══════════════════════════════════════════════════════
export default function AuthPage() {
  const { login, register, isLoading, error, clearError } = useAuth();
  const { t } = useLocale();
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <div className="relative flex min-h-[calc(100vh-56px)] w-full overflow-hidden">
      <AuthBackground />

      {/* LEFT — 文明宣言 / Manifesto */}
      <div className="relative hidden flex-[3] flex-col justify-between px-12 py-12 md:flex lg:px-16 xl:px-24">
        {/* 柔和米白宣纸光晕 — 保证文字在墨色背景上可读，无明显矩形 */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 90% 70% at 30% 40%, oklch(0.96 0.02 86 / 0.30) 0%, oklch(0.93 0.03 82 / 0.16) 45%, transparent 72%)",
          }}
        />

        {/* Top — Logo + spaced brand */}
        <div className="relative">
          <div className="flex items-center gap-4">
            <div
              className="flex h-11 w-11 items-center justify-center border border-[oklch(0.62 0.1 80 / 0.55)]"
              style={{
                background: "oklch(0.97 0.02 86 / 0.22)",
                boxShadow: "0 0 24px oklch(0.7 0.12 80 / 0.1)",
              }}
            >
              <img
                src="/Odyssey_logo.png"
                alt="Odyssey"
                width={34}
                height={34}
                draggable={false}
                className="select-none object-contain"
              />
            </div>
            <div>
              <SpacedLetters
                text="O D Y S S E Y"
                className="font-civ-serif text-[18px] font-semibold tracking-[0.18em] text-[oklch(0.2 0.02 58)]"
              />
              <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.3em] text-[oklch(0.5 0.07 76)]">
                {t("auth.brandTagline")}
              </p>
            </div>
          </div>
        </div>

        {/* Middle — 文明宣言 */}
        <div className="relative max-w-[540px]">
          <p
            className="mb-4 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.3em] text-[oklch(0.58 0.12 80)]"
            style={{ animationDelay: "0.9s" }}
          >
            <span className="inline-block h-px w-7 bg-[oklch(0.6 0.1 80 / 0.6)]" />
            {t("auth.manifestCoord")}
          </p>
          <ManifestTitle text={t("auth.manifestTitle")} />
          <div className="engrave-line mt-5 h-px w-24 bg-gradient-to-r from-[#C9A45C] to-transparent" />
          <p
            className="mt-5 max-w-[420px] text-[15px] leading-[1.9] text-[oklch(0.3 0.02 58)]"
            style={{ textShadow: "0 1px 3px oklch(1 0.02 88 / 0.45)" }}
          >
            {t("auth.manifestSub")}
          </p>
        </div>

        {/* Bottom — civilization motto rotation */}
        <div className="relative flex items-center gap-4">
          <div className="h-8 w-px" style={{ background: "oklch(0.7 0.05 78 / 0.7)" }} />
          <div className="min-h-[44px]">
            <CivilMotto t={t} />
          </div>
        </div>
      </div>

      {/* RIGHT — 文明档案入口 */}
      <div className="relative flex flex-[2] items-center justify-center px-5 py-10 md:px-10 md:py-16">
        {/* Mobile brand — condensed */}
        <div className="mb-6 block text-center md:hidden">
          <SpacedLetters
            text="O D Y S S E Y"
            className="font-civ-serif text-[20px] font-semibold tracking-[0.18em] text-[oklch(0.24 0.02 60)]"
          />
          <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[oklch(0.5 0.04 74)]">
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
