import type { Api } from "@stroybazaar/api-client";

/** Reads `<prefix>.en`, `<prefix>.ru`, `<prefix>.tj` inputs into a LocalizedText. */
export function localized(form: FormData, prefix: string): Api["LocalizedText"] {
  const value = (lang: string) => String(form.get(`${prefix}.${lang}`) ?? "").trim();
  return { en: value("en"), ru: value("ru"), tj: value("tj") };
}

export const text = (form: FormData, name: string) => String(form.get(name) ?? "").trim();

export const lines = (form: FormData, name: string) =>
  text(form, name)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
