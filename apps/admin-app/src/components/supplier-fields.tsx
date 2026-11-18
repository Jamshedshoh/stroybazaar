import type { Admin } from "@stroybazaar/api-client";
import { LOCALES, type Translator } from "@stroybazaar/shared";
import { Field, inputClass } from "@stroybazaar/ui";
import type { AdminDictionary } from "@/lib/dictionaries";
import { LocalizedInputs } from "./console-ui";

const LANGUAGE_NAMES = { tj: "Тоҷикӣ", ru: "Русский", en: "English" } as const;

/** Inputs for creating or editing a supplier; submitted with the surrounding form. */
export function SupplierFields({ supplier, i18n }: { supplier?: Admin["AdminSupplier"]; i18n: Translator<AdminDictionary> }) {
  const { t } = i18n;
  return (
    <div className="space-y-5">
      <Field label={t("field.name")}>
        <input name="name" required defaultValue={supplier?.name} className={inputClass} />
      </Field>
      <LocalizedInputs name="location" label={t("field.location")} value={supplier?.location} t={t} />
      <Field label={t("field.phones")} hint={t("field.phonesHint")}>
        <textarea name="phones" required rows={2} defaultValue={supplier?.phones.join("\n")} className={inputClass} />
      </Field>
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-stone-700">{t("field.languages")}</legend>
        <div className="flex gap-4">
          {LOCALES.map((code) => (
            <label key={code} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="languages"
                value={code}
                defaultChecked={supplier ? supplier.languages.includes(code) : code === "ru"}
                className="h-4 w-4 accent-brand-600"
              />
              {LANGUAGE_NAMES[code]}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
