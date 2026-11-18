import type { Metadata } from "next";
import { RfqBuilder } from "@/components/rfq-builder";
import { PageHeader } from "@stroybazaar/ui";
import { api, getSupplierNames, requireViewer, unwrap } from "@/lib/api";
import { getI18n } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t("rfq.form.title") };
}

export default async function NewRfqPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const { product } = await searchParams;
  await requireViewer("/rfqs/new");
  const client = await api();
  const [{ t }, products, categories, supplierNames] = await Promise.all([
    getI18n(),
    unwrap(client.GET("/products")),
    unwrap(client.GET("/categories")),
    getSupplierNames(),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t("rfq.form.title")} subtitle={t("rfq.subtitle")} />
      <RfqBuilder
        products={products}
        categories={categories}
        supplierNames={Object.fromEntries(supplierNames)}
        initialProductId={product}
      />
    </div>
  );
}
