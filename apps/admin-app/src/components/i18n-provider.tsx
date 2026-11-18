"use client";

import { createTranslator, type Locale } from "@stroybazaar/shared";
import { createContext, useContext, useMemo } from "react";
import type { AdminDictionary } from "@/lib/dictionaries";

const I18nContext = createContext<{ locale: Locale; dictionary: AdminDictionary } | null>(null);

export function I18nProvider({
  locale,
  dictionary,
  children,
}: {
  locale: Locale;
  dictionary: AdminDictionary;
  children: React.ReactNode;
}) {
  const value = useMemo(() => ({ locale, dictionary }), [locale, dictionary]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside <I18nProvider>");
  return useMemo(() => createTranslator(context.dictionary, context.locale), [context]);
}
