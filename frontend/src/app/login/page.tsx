"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";

export default function LoginPage() {
  const { login, isLoading, error, clearError } = useAuth();
  const { t } = useLocale();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await login({ email, password });
      router.push("/dashboard");
    } catch {
      // Error is handled by AuthContext
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-card">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">{t("auth.login")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("auth.loginSubtitle")}
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
            <button
              className="ml-2 underline hover:no-underline"
              onClick={clearError}
            >
              {t("common.close")}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium"
            >
              {t("auth.email")}
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium"
            >
              {t("auth.password")}
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? t("auth.loggingIn") : t("auth.loginButton")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("auth.noAccount")}{" "}
          <Link
            href="/register"
            className="font-medium text-primary hover:underline"
          >
            {t("auth.register")}
          </Link>
        </p>
      </div>
    </div>
  );
}
