"use client";

import { useLocale } from "@/hooks/useLocale";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();

  return (
    <button
      onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
      className="rounded-md border border-border px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
      title={locale === "zh" ? t("common.switchToEn") : t("common.switchToZh")}
      aria-label={locale === "zh" ? t("common.switchToEn") : t("common.switchToZh")}
    >
      {locale === "zh" ? t("common.langEn") : t("common.langZh")}
    </button>
  );
}
