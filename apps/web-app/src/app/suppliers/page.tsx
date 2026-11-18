import { MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SupplierBadge } from "@/components/supplier";
import { PageHeader } from "@stroybazaar/ui";
import { api, unwrap } from "@/lib/api";
import { getI18n } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t("suppliers.title") };
}

export default async function SuppliersPage() {
  const [i18n, suppliers] = await Promise.all([getI18n(), unwrap((await api()).GET("/suppliers"))]);
  const { t, text } = i18n;

  return (
    <>
      <PageHeader title={t("suppliers.title")} subtitle={t("suppliers.subtitle")} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {suppliers.map((supplier) => (
          <Link
            key={supplier.id}
            href={`/suppliers/${supplier.id}`}
            className="space-y-2 rounded-xl border border-stone-200 bg-white p-5 transition hover:border-brand-500"
          >
            <h2 className="font-semibold">{supplier.name}</h2>
            <SupplierBadge supplier={supplier} i18n={i18n} />
            <p className="flex items-center gap-1 text-sm text-stone-500">
              <MapPin className="h-4 w-4" /> {text(supplier.location)}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
