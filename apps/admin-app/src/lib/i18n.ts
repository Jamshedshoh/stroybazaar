import "server-only";
import { createTranslator, DEFAULT_LOCALE, isLocale, type Locale } from "@stroybazaar/shared";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { dictionaries } from "./dictionaries";

export const LOCALE_COOKIE = "sb_locale";

export const getLocale = cache(async (): Promise<Locale> => {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;
  const accepted = (await headers()).get("accept-language")?.toLowerCase() ?? "";
  if (accepted.startsWith("tg") || accepted.startsWith("tj")) return "tj";
  if (accepted.startsWith("en")) return "en";
  return DEFAULT_LOCALE;
});

export const getI18n = cache(async () => {
  const locale = await getLocale();
  return createTranslator(dictionaries[locale], locale);
});
