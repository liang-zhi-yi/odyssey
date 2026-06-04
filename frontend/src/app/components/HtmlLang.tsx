"use client";

import { useEffect } from "react";
import { useLocale } from "@/hooks/useLocale";

export function HtmlLang() {
  const { locale } = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  }, [locale]);
  return null;
}
