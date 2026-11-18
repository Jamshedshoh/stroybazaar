import { Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AwardButton, SimulateQuotesButton } from "@/components/rfq-actions";
import { RfqStatusBadge } from "@/components/status";
import { Badge, Card, cx } from "@stroybazaar/ui";
import { api, requireViewer, unwrap } from "@/lib/api";
import { DEMO_ENABLED } from "@/lib/config";
import { getI18n } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t("rfq.title") };
}

export default async function RfqPage({ params }: { params: Promise<{ rfqId: string }> }) {
  const { rfqId } = await params;
  await requireViewer(`/rfqs/${rfqId}`);
  const client = await api();
  const { data: rfq } = await client.GET("/rfqs/{rfqId}", { params: { path: { rfqId } } });
  if (!rfq) notFound();

  const [i18n, suppliers] = await Promise.all([getI18n(), unwrap(client.GET("/suppliers"))]);
  const { t, text, money, number, date } = i18n;
  const supplierById = new Map(suppliers.map((s) => [s.id, s]));
  const best = rfq.quotes.reduce<number | undefined>((min, q) => (min === undefined || q.total < min ? q.total : min), undefined);
  const awarded = rfq.quotes.find((q) => q.id === rfq.awardedQuoteId);
  const awardedSupplier = awarded && supplierById.get(awarded.supplierId);

  return (
    <div className="space-y-6">
      <Link href="/rfqs" className="text-sm text-stone-600 hover:underline">
        ← {t("rfq.title")}
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{rfq.deliveryLocation}</h1>
        <RfqStatusBadge status={rfq.status} i18n={i18n} />
      </div>
      <p className="text-stone-600">{t("rfq.neededBy", { date: date(rfq.neededBy) })}</p>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="h-fit overflow-hidden">
          <h2 className="border-b border-stone-200 px-5 py-3 font-semibold">{t("rfq.detail.materials")}</h2>
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

        <section className="space-y-3">
          <h2 className="font-semibold">{t("rfq.detail.quotes")}</h2>

          {awarded && awardedSupplier && (
            <Card className="space-y-2 border-emerald-300 bg-emerald-50 p-5">
              <p className="font-medium text-emerald-900">
                {t("rfq.detail.awarded")}: {awardedSupplier.name} · {money(awarded.total)}
              </p>
              <p className="text-sm text-emerald-800">{t("rfq.detail.awardedHint")}</p>
              {awardedSupplier.phones.map((phone) => (
                <a key={phone} href={`tel:${phone.replace(/\s/g, "")}`} className="flex items-center gap-1 text-sm font-medium text-emerald-900 hover:underline">
                  <Phone className="h-4 w-4" /> {phone}
                </a>
              ))}
            </Card>
          )}

          {rfq.quotes.length === 0 ? (
            <Card className="p-5 text-stone-600">{t("rfq.detail.noQuotes")}</Card>
          ) : (
            rfq.quotes.map((quote) => {
              const supplier = supplierById.get(quote.supplierId);
              const isAwarded = quote.id === rfq.awardedQuoteId;
              return (
                <Card key={quote.id} className={cx("flex flex-wrap items-center gap-4 p-5", isAwarded && "border-emerald-400")}>
                  <div className="min-w-48 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/suppliers/${quote.supplierId}`} className="font-medium hover:text-brand-700">
                        {supplier?.name ?? quote.supplierId}
                      </Link>
                      {quote.total === best && rfq.quotes.length > 1 && <Badge tone="success">{t("rfq.detail.best")}</Badge>}
                    </div>
                    <p className="text-sm text-stone-600">{text(quote.note)}</p>
                    <p className="text-sm text-stone-500">{t("rfq.detail.delivery", { days: quote.deliveryDays })}</p>
                  </div>
                  <p className="text-xl font-semibold">{money(quote.total)}</p>
                  {rfq.status !== "awarded" && <AwardButton rfqId={rfq.id} quoteId={quote.id} />}
                  {isAwarded && <Badge tone="success">{t("rfq.detail.awarded")}</Badge>}
                </Card>
              );
            })
          )}

          {DEMO_ENABLED && rfq.status !== "awarded" && <SimulateQuotesButton rfqId={rfq.id} />}
        </section>
      </div>
    </div>
  );
}
