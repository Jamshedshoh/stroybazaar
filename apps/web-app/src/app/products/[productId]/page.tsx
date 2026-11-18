import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/add-to-cart";
import { ProductImage } from "@/components/product-card";
import { SupplierBadge } from "@/components/supplier";
import { ButtonLink, Card } from "@stroybazaar/ui";
import { api } from "@/lib/api";
import { getI18n } from "@/lib/i18n";

async function loadProduct(productId: string) {
  const { data } = await (await api()).GET("/products/{productId}", { params: { path: { productId } } });
  return data;
}

export async function generateMetadata({ params }: { params: Promise<{ productId: string }> }): Promise<Metadata> {
  const [product, { text }] = await Promise.all([loadProduct((await params).productId), getI18n()]);
  return { title: product ? text(product.name) : undefined };
}

export default async function ProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const product = await loadProduct(productId);
  if (!product) notFound();

  const client = await api();
  const [i18n, supplier, categories] = await Promise.all([
    getI18n(),
    client.GET("/suppliers/{supplierId}", { params: { path: { supplierId: product.supplierId } } }),
    client.GET("/categories"),
  ]);
  const { t, text, money, number } = i18n;
  const category = categories.data?.find((c) => c.id === product.categoryId);
  const unit = text(product.unit);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <ProductImage product={product} icon={category?.icon} className="aspect-square rounded-2xl" />

      <div className="space-y-6">
        <div className="space-y-2">
          {category && (
            <Link href={`/catalog?category=${category.id}`} className="text-sm text-brand-700 hover:underline">
              {text(category.name)}
            </Link>
          )}
          <h1 className="text-2xl font-semibold tracking-tight">{text(product.name)}</h1>
          <p className="text-stone-600">{text(product.attributes)}</p>
        </div>

        <div>
          <p>
            <span className="text-3xl font-semibold">{money(product.price)}</span>{" "}
            <span className="text-stone-500">{t("product.perUnit", { unit })}</span>
          </p>
          <p className={`mt-1 text-sm ${product.stock > 0 ? "text-emerald-700" : "text-red-700"}`}>
            {product.stock > 0
              ? t("product.inStock", { count: `${number(product.stock)} ${unit}` })
              : t("product.outOfStock")}
          </p>
        </div>

        {product.wholesaleTiers.length > 0 && (
          <Card className="p-4">
            <h2 className="mb-2 text-sm font-semibold">{t("product.wholesale")}</h2>
            <ul className="divide-y divide-stone-100 text-sm">
              {product.wholesaleTiers.map((tier) => (
                <li key={tier.minQty} className="flex justify-between py-1.5">
                  <span>{t("product.fromQty", { qty: number(tier.minQty), unit })}</span>
                  <span className="font-medium">{money(tier.pricePerUnit)}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {product.stock > 0 && <AddToCart product={product} />}
        <ButtonLink href={`/rfqs/new?product=${product.id}`} variant="secondary">
          {t("home.requestQuote")}
        </ButtonLink>

        {supplier.data && (
          <Card className="p-4">
            <p className="mb-1 text-xs tracking-wide text-stone-500 uppercase">{t("product.soldBy")}</p>
            <Link href={`/suppliers/${supplier.data.id}`} className="font-medium hover:text-brand-700">
              {supplier.data.name}
            </Link>
            <div className="mt-1">
              <SupplierBadge supplier={supplier.data} i18n={i18n} />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
