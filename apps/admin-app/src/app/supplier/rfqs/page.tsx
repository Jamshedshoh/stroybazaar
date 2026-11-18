import { EmptyState, PageHeader } from "@stroybazaar/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { RfqStatusBadge } from "@/components/console-ui";
import { api, unwrap } from "@/lib/api";
import { getI18n } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t("rfqs.title") };
}

export default async function SupplierRfqsPage() {
  const [{ t, text, date, money }, rfqs] = await Promise.all([getI18n(), unwrap((await api()).GET("/rfqs"))]);

  return (
    <>
      <PageHeader title={t("rfqs.title")} subtitle={t("rfqs.subtitle")} />
      {rfqs.length === 0 ? (
        <EmptyState>{t("common.empty")}</EmptyState>
      ) : (
        <div className="space-y-3">
          {rfqs.map((rfq) => {
            // Suppliers only ever see their own quote on an RFQ.
            const mine = rfq.quotes[0];
            return (
              <Link
                key={rfq.id}
                href={`/supplier/rfqs/${rfq.id}`}
                className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-stone-200 bg-white px-5 py-4 transition hover:border-brand-500"
              >
                <div className="min-w-48 flex-1">
                  <p className="font-medium">{rfq.items.map((item) => text(item.productName)).join(", ")}</p>
                  <p className="text-sm text-stone-500">
                    {rfq.deliveryLocation} · {t("field.neededBy")}: {date(rfq.neededBy)}
                  </p>
                </div>
                <span className="text-sm text-stone-600">
                  {mine ? `${t("rfqs.yourQuote")}: ${money(mine.total)}` : t("rfqs.noQuoteYet")}
                </span>
                <RfqStatusBadge status={rfq.status} t={t} />
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
