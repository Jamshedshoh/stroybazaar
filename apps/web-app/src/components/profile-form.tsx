"use client";

import type { Locale } from "@stroybazaar/shared";
import { useActionState } from "react";
import { updateProfile, type ActionState } from "@/lib/actions";
import { useI18n } from "./i18n-provider";
import { SubmitButton } from "@stroybazaar/ui";
import { Alert, Field, inputClass } from "@stroybazaar/ui";

const LANGUAGE_NAMES: Record<Locale, string> = { tj: "Тоҷикӣ", ru: "Русский", en: "English" };

export function ProfileForm({ name, language }: { name: string; language: Locale }) {
  const { t } = useI18n();
  const [state, action] = useActionState(updateProfile, {} as ActionState);
  return (
    <form action={action} className="space-y-4">
      <Field label={t("account.name")}>
        <input name="name" defaultValue={name} placeholder={t("account.namePlaceholder")} className={inputClass} />
      </Field>
      <Field label={t("account.language")}>
        <select name="language" defaultValue={language} className={inputClass}>
          {(Object.keys(LANGUAGE_NAMES) as Locale[]).map((code) => (
            <option key={code} value={code}>
              {LANGUAGE_NAMES[code]}
            </option>
          ))}
        </select>
      </Field>
      {state.error && <Alert>{state.error}</Alert>}
      {state.ok && <Alert tone="success">{t("account.saved")}</Alert>}
      <SubmitButton>{t("account.save")}</SubmitButton>
    </form>
  );
}
