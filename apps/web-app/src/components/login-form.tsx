"use client";

import { useActionState, useState } from "react";
import { requestOtp, verifyOtp, type LoginState } from "@/lib/actions";
import { useI18n } from "./i18n-provider";
import { SubmitButton } from "@stroybazaar/ui";
import { Alert, Field, inputClass } from "@stroybazaar/ui";

export function LoginForm({ next, devHint }: { next: string; devHint: boolean }) {
  const { t } = useI18n();
  const [requestState, request] = useActionState(requestOtp, { step: "phone" } as LoginState);
  const [verifyState, verify] = useActionState(verifyOtp, { step: "code" } as LoginState);
  const [changing, setChanging] = useState(false);

  const codeStep = requestState.step === "code" && !changing;

  if (!codeStep) {
    return (
      <form action={(form) => { setChanging(false); request(form); }} className="space-y-4">
        <Field label={t("login.phone")}>
          <input
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            defaultValue={requestState.phone ?? "+992 "}
            className={inputClass}
          />
        </Field>
        {requestState.error && <Alert>{requestState.error}</Alert>}
        <SubmitButton className="w-full">{t("login.sendCode")}</SubmitButton>
      </form>
    );
  }

  return (
    <form action={verify} className="space-y-4">
      <p className="text-sm text-stone-600">{t("login.codeSent", { phone: requestState.phone ?? "" })}</p>
      <input type="hidden" name="phone" value={requestState.phone} />
      <input type="hidden" name="next" value={next} />
      <Field label={t("login.code")} hint={devHint ? t("login.devHint") : undefined}>
        <input
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          required
          autoFocus
          className={`${inputClass} text-center text-lg tracking-[0.5em]`}
        />
      </Field>
      {verifyState.error && <Alert>{verifyState.error}</Alert>}
      <SubmitButton className="w-full">{t("login.verify")}</SubmitButton>
      <button type="button" onClick={() => setChanging(true)} className="w-full text-sm text-stone-600 hover:underline">
        {t("login.changePhone")}
      </button>
    </form>
  );
}
