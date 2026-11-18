import { PageHeader } from "@stroybazaar/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { ProductForm } from "@/components/product-form";
import { api, unwrap } from "@/lib/api";
import { getI18n } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t("products.new") };
}

export default async function NewProductPage() {
  const [{ t }, categories] = await Promise.all([getI18n(), unwrap((await api()).GET("/categories"))]);
  return (
    <div className="max-w-3xl">
      <Link href="/supplier/products" className="text-sm text-stone-600 hover:underline">
        ← {t("products.title")}
      </Link>
      <PageHeader title={t("products.new")} />
      <ProductForm categories={categories} />
    </div>
  );
}
