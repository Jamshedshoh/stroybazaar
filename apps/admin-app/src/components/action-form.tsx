"use client";

import { Alert } from "@stroybazaar/ui";
import { useActionState } from "react";
import type { ActionState } from "@/lib/actions";
import { useI18n } from "./i18n-provider";

/**
 * A form bound to a server action, showing its error or a "Saved" message.
 * `children` is rendered inside the <form> so inputs and buttons submit with it.
 */
export function ActionForm({
  action,
  children,
  className,
  successMessage = true,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  className?: string;
  successMessage?: boolean;
}) {
  const { t } = useI18n();
  const [state, formAction] = useActionState(action, {});
  return (
    <form action={formAction} className={className}>
      {children}
      {state.error && <Alert>{state.error}</Alert>}
      {state.ok && successMessage && <Alert tone="success">{t("common.saved")}</Alert>}
    </form>
  );
}
