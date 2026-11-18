import { PageHeader } from "@stroybazaar/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/product-form";
import { api, unwrap } from "@/lib/api";
import { getI18n } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t("products.edit") };
}

export default async function EditProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const client = await api();
  // /me/products includes hidden products, which GET /products/{id} would not return.
  const [{ t, text }, products, categories] = await Promise.all([
    getI18n(),
    unwrap(client.GET("/me/products")),
    unwrap(client.GET("/categories")),
  ]);
  const product = products.find((p) => p.id === productId);
  if (!product) notFound();

  return (
    <div className="max-w-3xl">
      <Link href="/supplier/products" className="text-sm text-stone-600 hover:underline">
        ← {t("products.title")}
      </Link>
      <PageHeader title={text(product.name)} subtitle={t("products.edit")} />
      <ProductForm product={product} categories={categories} />
    </div>
  );
}
