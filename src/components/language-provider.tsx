"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { uiCopy, type UiLanguage } from "@/lib/language";

type LanguageContextValue = {
  language: UiLanguage;
  setLanguage: (language: UiLanguage) => void;
  copy: typeof uiCopy[UiLanguage];
};

const LanguageContext = createContext<LanguageContextValue | null>(null);
const storageKey = "atlora-ui-language";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<UiLanguage>("zh");

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored === "zh" || stored === "en") setLanguageState(stored);
  }, []);

  function setLanguage(nextLanguage: UiLanguage) {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(storageKey, nextLanguage);
  }

  const value = useMemo(
    () => ({ language, setLanguage, copy: uiCopy[language] }),
    [language]
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
