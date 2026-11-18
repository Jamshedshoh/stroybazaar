"use client";

import { useActionState } from "react";
import { awardQuote, simulateQuotes, type ActionState } from "@/lib/actions";
import { useI18n } from "./i18n-provider";
import { SubmitButton } from "@stroybazaar/ui";
import { Alert } from "@stroybazaar/ui";

export function AwardButton({ rfqId, quoteId }: { rfqId: string; quoteId: string }) {
  const { t } = useI18n();
  const [state, action] = useActionState(awardQuote, {} as ActionState);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="rfqId" value={rfqId} />
      <input type="hidden" name="quoteId" value={quoteId} />
      <SubmitButton size="sm">{t("rfq.detail.award")}</SubmitButton>
      {state.error && <Alert>{state.error}</Alert>}
    </form>
  );
}

export function SimulateQuotesButton({ rfqId }: { rfqId: string }) {
  const { t } = useI18n();
  const [state, action] = useActionState(simulateQuotes, {} as ActionState);
  return (
    <form action={action} className="space-y-2 pt-2">
      <input type="hidden" name="rfqId" value={rfqId} />
      <SubmitButton variant="secondary" size="sm">
        {t("rfq.detail.simulate")}
      </SubmitButton>
      {state.error && <Alert>{state.error}</Alert>}
    </form>
  );
}
