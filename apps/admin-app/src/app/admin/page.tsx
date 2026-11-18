import { PageHeader } from "@stroybazaar/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { Stat } from "@/components/console-ui";
import { admin, unwrap } from "@/lib/api";
import { getI18n } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t("nav.dashboard") };
}

export default async function AdminDashboard() {
  const [{ t, money, number }, stats] = await Promise.all([getI18n(), unwrap((await admin()).GET("/stats"))]);
  const percent = (value: number | null) => (value === null ? "—" : `${Math.round(value * 100)}%`);

  return (
    <>
      <PageHeader title={t("stats.title")} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/suppliers?status=verified">
          <Stat label={t("stats.activeSuppliers")} value={number(stats.activeSuppliers)} />
        </Link>
        <Link href="/admin/suppliers?status=pending">
          <Stat label={t("stats.pendingSuppliers")} value={number(stats.pendingSuppliers)} />
        </Link>
        <Stat label={t("stats.rfqsPosted")} value={number(stats.rfqsPosted)} />
        <Stat
          label={t("stats.responseTime")}
          value={stats.averageQuoteResponseHours === null ? "—" : t("stats.hours", { hours: number(Math.round(stats.averageQuoteResponseHours * 10) / 10) })}
        />
        <Link href="/admin/orders?status=confirmed_receipt">
          <Stat label={t("stats.ordersCompleted")} value={number(stats.ordersCompleted)} />
        </Link>
        <Stat label={t("stats.confirmedShare")} value={percent(stats.confirmedInAppShare)} />
        <Stat label={t("stats.repeatBuyers")} value={percent(stats.repeatBuyerRate)} />
        <Link href="/admin/commissions">
          <Stat label={t("stats.commissionTotal")} value={money(stats.commissionTotal)} />
        </Link>
      </div>
    </>
  );
}
