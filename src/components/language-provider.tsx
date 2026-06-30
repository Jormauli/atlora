"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { uiCopy, type UiLanguage } from "@/lib/language";

type LanguageContextValue = {
  language: UiLanguage;
  setLanguage: (language: UiLanguage) => void;
  copy: typeof uiCopy[UiLanguage];
};

type LanguageProviderProps = {
  children: React.ReactNode;
  initialLanguage?: UiLanguage;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);
const storageKey = "atlora-ui-language";

export function LanguageProvider({ children, initialLanguage }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<UiLanguage>(() => initialLanguage ?? "zh");

  useEffect(() => {
    if (initialLanguage !== undefined) {
      setLanguageState(initialLanguage);
      return;
    }

    const stored = window.localStorage.getItem(storageKey);
    if (stored === "zh" || stored === "en") setLanguageState(stored);
  }, [initialLanguage]);

  const setLanguage = useCallback((nextLanguage: UiLanguage) => {
    setLanguageState(nextLanguage);
    document.documentElement.lang = nextLanguage === "en" ? "en" : "zh-CN";
    window.localStorage.setItem(storageKey, nextLanguage);
    document.cookie = `${storageKey}=${nextLanguage}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }, []);

  const value = useMemo(
    () => ({ language, setLanguage, copy: uiCopy[language] }),
    [language, setLanguage]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  return (
    <div className="inline-flex items-center rounded-md border border-[#3a3a3a] bg-[#111111] p-0.5 text-xs text-[#b4b4b1]">
      {(["zh", "en"] as const).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => setLanguage(item)}
          className={`inline-flex h-7 min-w-[2.5rem] items-center justify-center rounded px-2 leading-none ${
            language === item ? "bg-[#e7e7e3] text-[#111111]" : "text-[#b4b4b1] hover:bg-white/[0.06] hover:text-white"
          }`}
        >
          {item === "zh" ? "中文" : "EN"}
        </button>
      ))}
    </div>
  );
}

export function LocaleLanguageToggle({ locale }: { locale: UiLanguage }) {
  const { setLanguage } = useLanguage();

  return (
    <div className="inline-flex items-center rounded-md border border-[#3a3a3a] bg-[#111111] p-0.5 text-xs text-[#b4b4b1]">
      <Link
        href="/zh"
        aria-current={locale === "zh" ? "page" : undefined}
        onClick={() => setLanguage("zh")}
        className={`inline-flex h-7 min-w-[2.5rem] items-center justify-center rounded px-2 leading-none ${
          locale === "zh" ? "bg-[#e7e7e3] text-[#111111]" : "text-[#b4b4b1] hover:bg-white/[0.06] hover:text-white"
        }`}
      >
        中文
      </Link>
      <Link
        href="/en"
        aria-current={locale === "en" ? "page" : undefined}
        onClick={() => setLanguage("en")}
        className={`inline-flex h-7 min-w-[2.5rem] items-center justify-center rounded px-2 leading-none ${
          locale === "en" ? "bg-[#e7e7e3] text-[#111111]" : "text-[#b4b4b1] hover:bg-white/[0.06] hover:text-white"
        }`}
      >
        EN
      </Link>
    </div>
  );
}
