import { DEFAULT_LOCALE, LOCALES, type Locale } from "./locales";

export type LocalizedText = Record<Locale, string>;
export type Dictionary = Record<string, string>;

// BCP 47 tags for Intl. The API uses "tj" for Tajik; Intl knows it as "tg".
const INTL_TAGS: Record<Locale, string> = { tj: "tg-TJ", ru: "ru-RU", en: "en-US" };

export const isLocale = (value: unknown): value is Locale => LOCALES.includes(value as Locale);

/** The text in `locale`, falling back to Russian, then any non-empty value. */
export function pickText(text: LocalizedText | null | undefined, locale: Locale) {
  if (!text) return "";
  return text[locale] || text[DEFAULT_LOCALE] || Object.values(text).find(Boolean) || "";
}

export function createTranslator<D extends Dictionary>(dictionary: D, locale: Locale) {
  const tag = INTL_TAGS[locale];
  const money = new Intl.NumberFormat(tag, { style: "currency", currency: "TJS", maximumFractionDigits: 2 });
  const number = new Intl.NumberFormat(tag, { maximumFractionDigits: 3 });
  const date = new Intl.DateTimeFormat(tag, { dateStyle: "medium" });
  const dateTime = new Intl.DateTimeFormat(tag, { dateStyle: "medium", timeStyle: "short" });

  return {
    locale,
    /** `t("key", { name: "x" })` replaces `{name}` in the string. */
    t: (key: keyof D & string, vars?: Record<string, string | number>) => {
      const template = dictionary[key] ?? key;
      return vars ? template.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? `{${name}}`)) : template;
    },
    text: (value: LocalizedText | null | undefined) => pickText(value, locale),
    money: (amount: number) => money.format(amount),
    number: (value: number) => number.format(value),
    date: (value: string | Date) => date.format(new Date(value)),
    dateTime: (value: string | Date) => dateTime.format(new Date(value)),
  };
}

export type Translator<D extends Dictionary> = ReturnType<typeof createTranslator<D>>;
