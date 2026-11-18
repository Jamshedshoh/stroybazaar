import { LOCALES } from "@stroybazaar/shared";
import { cx } from "@stroybazaar/ui";
import { setLocale } from "@/lib/actions";
import { getI18n } from "@/lib/i18n";

const LABELS = { tj: "Тоҷ", ru: "Рус", en: "Eng" } as const;

export async function LanguageSwitcher() {
  const { locale } = await getI18n();
  return (
    <form action={setLocale} className="flex rounded-lg border border-stone-200 bg-white p-0.5">
      {LOCALES.map((code) => (
        <button
          key={code}
          name="locale"
          value={code}
          aria-pressed={code === locale}
          className={cx(
            "rounded-md px-2 py-1 text-xs font-medium",
            code === locale ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100",
          )}
        >
          {LABELS[code]}
        </button>
      ))}
    </form>
  );
}
