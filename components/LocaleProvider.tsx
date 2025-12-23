"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import en from "../locales/en.json";
import zh from "../locales/zh.json";

const translations = { en, zh };

type Locale = "en" | "zh";

const LocaleContext = createContext({
  locale: "zh" as Locale,
  setLocale: (l: Locale) => {},
  t: (key: string) => key,
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("zh");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("locale");
      if (saved === "en" || saved === "zh") setLocale(saved);
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("locale", locale);
    } catch (e) {}
  }, [locale]);

  const t = (key: string) => {
    const parts = key.split(".");
    let obj: any = translations[locale];
    for (const p of parts) {
      if (!obj) return key;
      obj = obj[p];
    }
    return typeof obj === "string" ? obj : key;
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export const useLocale = () => useContext(LocaleContext);
