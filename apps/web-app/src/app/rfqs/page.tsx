import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { RfqStatusBadge } from "@/components/status";
import { ButtonLink, EmptyState, PageHeader } from "@stroybazaar/ui";
import { api, requireViewer, unwrap } from "@/lib/api";
import { getI18n } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t("rfq.title") };
}

export default async function RfqsPage() {
  await requireViewer("/rfqs");
  const [i18n, rfqs] = await Promise.all([getI18n(), unwrap((await api()).GET("/rfqs"))]);
  const { t, text, date } = i18n;
  const newButton = (
    <ButtonLink href="/rfqs/new">
      <Plus className="h-4 w-4" /> {t("rfq.new")}
    </ButtonLink>
  );

  return (
    <>
      <PageHeader title={t("rfq.title")} subtitle={t("rfq.subtitle")} action={newButton} />
      {rfqs.length === 0 ? (
        <EmptyState action={newButton}>{t("rfq.empty")}</EmptyState>
      ) : (
        <div className="space-y-3">
          {rfqs.map((rfq) => (
            <Link
              key={rfq.id}
              href={`/rfqs/${rfq.id}`}
              className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-stone-200 bg-white px-5 py-4 transition hover:border-brand-500"
            >
              <div className="min-w-48 flex-1">
                <p className="font-medium">
                  {rfq.items.map((item) => text(item.productName)).join(", ")}
                </p>
                <p className="text-sm text-stone-500">
                  {rfq.deliveryLocation} · {t("rfq.neededBy", { date: date(rfq.neededBy) })}
                </p>
              </div>
              <span className="text-sm text-stone-600">{t("rfq.quotes", { count: rfq.quotes.length })}</span>
              <RfqStatusBadge status={rfq.status} i18n={i18n} />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
