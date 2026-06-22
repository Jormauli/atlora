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
    <div className="flex rounded-md border border-[#354039] bg-[#101412] p-0.5 text-xs">
      {(["zh", "en"] as const).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => setLanguage(item)}
          className={`h-7 rounded px-2 ${language === item ? "bg-[#d9e7c6] text-[#172018]" : "text-[#b9b1a3] hover:bg-white/[0.06]"}`}
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
    <div className="flex rounded-md border border-[#354039] bg-[#101412] p-0.5 text-xs">
      <Link
        href="/zh"
        aria-current={locale === "zh" ? "page" : undefined}
        onClick={() => setLanguage("zh")}
        className={`h-7 rounded px-2 ${locale === "zh" ? "bg-[#d9e7c6] text-[#172018]" : "text-[#b9b1a3] hover:bg-white/[0.06]"}`}
      >
        中文
      </Link>
      <Link
        href="/en"
        aria-current={locale === "en" ? "page" : undefined}
        onClick={() => setLanguage("en")}
        className={`h-7 rounded px-2 ${locale === "en" ? "bg-[#d9e7c6] text-[#172018]" : "text-[#b9b1a3] hover:bg-white/[0.06]"}`}
      >
        EN
      </Link>
    </div>
  );
}
