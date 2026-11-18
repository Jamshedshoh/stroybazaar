"use client";

import { Star } from "lucide-react";
import { useActionState, useState } from "react";
import { confirmReceipt, submitReview, type ActionState } from "@/lib/actions";
import { useI18n } from "./i18n-provider";
import { SubmitButton } from "@stroybazaar/ui";
import { Alert, Card, Field, inputClass } from "@stroybazaar/ui";

export function ConfirmReceiptForm({ orderId }: { orderId: string }) {
  const { t } = useI18n();
  const [state, action] = useActionState(confirmReceipt, {} as ActionState);
  return (
    <Card className="space-y-3 border-brand-500 p-5">
      <p className="text-sm text-stone-600">{t("orders.confirmHint")}</p>
      <form action={action}>
        <input type="hidden" name="orderId" value={orderId} />
        <SubmitButton className="w-full">{t("orders.confirmReceipt")}</SubmitButton>
      </form>
      {state.error && <Alert>{state.error}</Alert>}
    </Card>
  );
}

export function ReviewForm({ orderId, supplierId, supplierName }: { orderId: string; supplierId: string; supplierName: string }) {
  const { t } = useI18n();
  const [state, action] = useActionState(submitReview, {} as ActionState);
  const [rating, setRating] = useState(5);

  if (state.ok) return <Alert tone="success">{t("orders.review.done")}</Alert>;

  return (
    <Card className="p-5">
      <form action={action} className="space-y-4">
        <h2 className="font-semibold">{t("orders.review.title", { supplier: supplierName })}</h2>
        <input type="hidden" name="orderId" value={orderId} />
        <input type="hidden" name="supplierId" value={supplierId} />
        <input type="hidden" name="rating" value={rating} />
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-stone-700">{t("orders.review.rating")}</legend>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n}/5`} aria-pressed={n === rating}>
                <Star className={`h-7 w-7 ${n <= rating ? "fill-brand-500 text-brand-500" : "text-stone-300"}`} />
              </button>
            ))}
          </div>
        </fieldset>
        <Field label={t("orders.review.comment")}>
          <textarea name="comment" required rows={3} className={inputClass} />
        </Field>
        {state.error && <Alert>{state.error}</Alert>}
        <SubmitButton className="w-full">{t("orders.review.submit")}</SubmitButton>
      </form>
    </Card>
  );
}
