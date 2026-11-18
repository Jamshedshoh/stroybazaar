import type { Metadata } from "next";
import Link from "next/link";
import { OrderStatusBadge } from "@/components/status";
import { ButtonLink, EmptyState, PageHeader } from "@stroybazaar/ui";
import { api, getSupplierNames, requireViewer, unwrap } from "@/lib/api";
import { shortId } from "@/lib/format";
import { getI18n } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t("orders.title") };
}


export default async function OrdersPage() {
  await requireViewer("/orders");
  const [i18n, orders, supplierNames] = await Promise.all([
    getI18n(),
    unwrap((await api()).GET("/orders")),
    getSupplierNames(),
  ]);
  const { t, money, date } = i18n;

  return (
    <>
      <PageHeader title={t("orders.title")} />
      {orders.length === 0 ? (
        <EmptyState action={<ButtonLink href="/catalog">{t("home.browse")}</ButtonLink>}>{t("orders.empty")}</EmptyState>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-stone-200 bg-white px-5 py-4 transition hover:border-brand-500"
            >
              <div className="min-w-40 flex-1">
                <p className="font-medium">{t("orders.order", { id: shortId(order.id) })}</p>
                <p className="text-sm text-stone-500">
                  {supplierNames.get(order.supplierId)} · {t("orders.placedOn", { date: date(order.createdAt) })}
                </p>
              </div>
              <OrderStatusBadge status={order.status} i18n={i18n} />
              <p className="w-32 text-right font-semibold">{money(order.total)}</p>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
