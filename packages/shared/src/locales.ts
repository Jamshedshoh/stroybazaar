// Matches the API's `Language` enum (GET /openapi.json on apps/api).
export const LOCALES = ["tj", "ru", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ru";
