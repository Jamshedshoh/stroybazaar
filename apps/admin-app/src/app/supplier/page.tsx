import { Alert, PageHeader } from "@stroybazaar/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { Stat } from "@/components/console-ui";
import { api, unwrap } from "@/lib/api";
import { getI18n } from "@/lib/i18n";
import { getSupplierContext } from "@/lib/supplier";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t("supplier.overviewTitle") };
}

export default async function SupplierOverview() {
  const [{ t, number }, { supplier }] = await Promise.all([getI18n(), getSupplierContext()]);
  if (!supplier) return <Alert>{t("supplier.noSupplier")}</Alert>;

  const client = await api();
  const [products, rfqs, orders] = await Promise.all([
    unwrap(client.GET("/me/products")),
    unwrap(client.GET("/rfqs")),
    unwrap(client.GET("/orders")),
  ]);
  const openRfqs = rfqs.filter((r) => r.status !== "awarded" && r.quotes.length === 0).length;
  const activeOrders = orders.filter((o) => o.status === "placed" || o.status === "confirmed" || o.status === "out_for_delivery").length;

  return (
    <div className="space-y-6">
      <PageHeader title={supplier.name} subtitle={t("supplier.overviewTitle")} />
      {!supplier.verified && <Alert tone="warning">{t("supplier.unverifiedBanner")}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/supplier/rfqs">
          <Stat label={t("supplier.openRfqs")} value={number(openRfqs)} />
        </Link>
        <Link href="/supplier/orders">
          <Stat label={t("supplier.ordersToHandle")} value={number(activeOrders)} />
        </Link>
        <Link href="/supplier/products">
          <Stat label={t("supplier.products")} value={number(products.filter((p) => p.active).length)} />
        </Link>
        <Stat
          label={t("supplier.rating")}
          value={supplier.reviewCount > 0 ? `${supplier.rating.toFixed(1)} ★` : "—"}
          hint={supplier.reviewCount > 0 ? `${supplier.reviewCount}` : undefined}
        />
      </div>
    </div>
  );
}
