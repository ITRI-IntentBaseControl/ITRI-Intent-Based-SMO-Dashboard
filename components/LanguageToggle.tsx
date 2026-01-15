"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/LocaleProvider";

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useLocale();

  const toggle = () => setLocale(locale === "zh" ? "en" : "zh");

  return (
    <div className={`flex items-center ${className}`}>
      <Button size="sm" variant="ghost" onClick={toggle} aria-label="切換語言">
        {locale === "zh" ? "中" : "EN"}
      </Button>
    </div>
  );
}
