import { estimateUnitPrice } from "@stroybazaar/shared";
import { Alert, Card, Field, inputClass, SubmitButton } from "@stroybazaar/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { RfqStatusBadge } from "@/components/console-ui";
import { submitQuote } from "@/lib/actions";
import { api, unwrap } from "@/lib/api";
import { getI18n } from "@/lib/i18n";
import { getSupplierContext } from "@/lib/supplier";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t("rfqs.title") };
}

export default async function SupplierRfqPage({ params }: { params: Promise<{ rfqId: string }> }) {
  const { rfqId } = await params;
  const client = await api();
  const { data: rfq } = await client.GET("/rfqs/{rfqId}", { params: { path: { rfqId } } });
  if (!rfq) notFound();
  const [{ t, text, money, number, date }, { supplier }, products] = await Promise.all([
    getI18n(),
    getSupplierContext(),
    unwrap(client.GET("/me/products")),
  ]);

  const mine = rfq.quotes[0];
  const byId = new Map(products.map((p) => [p.id, p]));
  // A starting point for the quote, from this supplier's own catalog prices where they list the item.
  const estimate = rfq.items.reduce((sum, item) => {
    const product = byId.get(item.productId);
    return product ? sum + estimateUnitPrice(product, item.quantity) * item.quantity : sum;
  }, 0);

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/supplier/rfqs" className="text-sm text-stone-600 hover:underline">
        ← {t("rfqs.title")}
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{rfq.deliveryLocation}</h1>
        <RfqStatusBadge status={rfq.status} t={t} />
      </div>
      <p className="text-stone-600">
        {t("field.neededBy")}: {date(rfq.neededBy)}
      </p>

      <Card className="overflow-hidden">
        <ul className="divide-y divide-stone-100">
          {rfq.items.map((item) => (
            <li key={item.productId} className="flex justify-between gap-3 px-5 py-3 text-sm">
              <span>{text(item.productName)}</span>
              <span className="font-medium whitespace-nowrap">
                {number(item.quantity)} {text(item.unit)}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {mine ? (
        <Card className="space-y-2 p-6">
          <h2 className="font-semibold">{t("rfqs.yourQuote")}</h2>
          <p className="text-xl font-semibold">{money(mine.total)}</p>
          <p className="text-sm text-stone-600">
            {t("rfqs.deliveryDays")}: {mine.deliveryDays}
          </p>
          {text(mine.note) && <p className="text-sm text-stone-600">{text(mine.note)}</p>}
          {rfq.status === "awarded" &&
            (rfq.awardedQuoteId === mine.id ? (
              <Alert tone="success">{t("rfqs.awardedToYou")}</Alert>
            ) : (
              <Alert tone="warning">{t("rfqs.awardedOther")}</Alert>
            ))}
        </Card>
      ) : !supplier?.verified ? (
        <Alert tone="warning">{t("rfqs.notVerified")}</Alert>
      ) : (
        <Card className="p-6">
          <h2 className="mb-1 font-semibold">{t("rfqs.quoteTitle")}</h2>
          {estimate > 0 && <p className="mb-4 text-sm text-stone-500">{t("rfqs.catalogEstimate", { total: money(estimate) })}</p>}
          <ActionForm action={submitQuote} className="space-y-4" successMessage={false}>
            <input type="hidden" name="rfqId" value={rfq.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("rfqs.total")}>
                <input
                  name="total"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  defaultValue={estimate > 0 ? Math.round(estimate) : undefined}
                  className={inputClass}
                />
              </Field>
              <Field label={t("rfqs.deliveryDays")}>
                <input name="deliveryDays" type="number" min="0" required defaultValue={1} className={inputClass} />
              </Field>
            </div>
            <Field label={t("rfqs.note")}>
              <textarea name="note" rows={2} className={inputClass} />
            </Field>
            <SubmitButton>{t("rfqs.submit")}</SubmitButton>
          </ActionForm>
        </Card>
      )}
    </div>
  );
}
