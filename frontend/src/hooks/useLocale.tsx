"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

type Locale = "zh" | "en";

// Lazy-load locale data
const localeModules: Record<Locale, () => Promise<Record<string, any>>> = {
  zh: () => import("@/locales/zh.json").then((m) => m.default),
  en: () => import("@/locales/en.json").then((m) => m.default),
};

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  messages: Record<string, any>;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function resolveDotPath(
  obj: Record<string, any>,
  path: string
): string | null {
  const keys = path.split(".");
  let current: any = obj;
  for (const key of keys) {
    if (current == null || typeof current !== "object") return null;
    current = current[key];
  }
  return typeof current === "string" ? current : null;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("zh");
  const [messages, setMessages] = useState<Record<string, any>>({});
  const [loaded, setLoaded] = useState(false);

  // Load initial locale from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("odyssey_locale") as Locale | null;
    if (stored === "en" || stored === "zh") {
      setLocaleState(stored);
    }
  }, []);

  // Load messages for current locale
  useEffect(() => {
    let cancelled = false;
    localeModules[locale]().then((data) => {
      if (!cancelled) {
        setMessages(data);
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    localStorage.setItem("odyssey_locale", l);
    setLocaleState(l);
    document.documentElement.lang = l === "zh" ? "zh-CN" : "en";
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      if (!loaded) return key;
      let value = resolveDotPath(messages, key) ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          value = value.replace(`{${k}}`, String(v));
        }
      }
      return value;
    },
    [messages, loaded]
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, messages }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return ctx;
}
