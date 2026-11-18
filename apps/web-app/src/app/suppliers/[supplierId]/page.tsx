import { MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { Stars, SupplierBadge } from "@/components/supplier";
import { Card, EmptyState } from "@stroybazaar/ui";
import { api, unwrap } from "@/lib/api";
import { getI18n } from "@/lib/i18n";

const LANGUAGE_NAMES = { tj: "Тоҷикӣ", ru: "Русский", en: "English" } as const;

async function loadSupplier(supplierId: string) {
  const { data } = await (await api()).GET("/suppliers/{supplierId}", { params: { path: { supplierId } } });
  return data;
}

export async function generateMetadata({ params }: { params: Promise<{ supplierId: string }> }): Promise<Metadata> {
  return { title: (await loadSupplier((await params).supplierId))?.name };
}

export default async function SupplierPage({ params }: { params: Promise<{ supplierId: string }> }) {
  const { supplierId } = await params;
  const supplier = await loadSupplier(supplierId);
  if (!supplier) notFound();

  const client = await api();
  const [i18n, products, reviews, categories] = await Promise.all([
    getI18n(),
    unwrap(client.GET("/products", { params: { query: { supplierId } } })),
    unwrap(client.GET("/suppliers/{supplierId}/reviews", { params: { path: { supplierId } } })),
    unwrap(client.GET("/categories")),
  ]);
  const { t, text, date } = i18n;
  const icons = new Map(categories.map((c) => [c.id, c.icon]));

  return (
    <div className="space-y-10">
      <Card className="grid gap-6 p-6 md:grid-cols-[1fr_auto]">
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold tracking-tight">{supplier.name}</h1>
          <SupplierBadge supplier={supplier} i18n={i18n} />
          <p className="flex items-center gap-1 text-stone-600">
            <MapPin className="h-4 w-4" /> {text(supplier.location)}
          </p>
          <p className="text-sm text-stone-500">{t("supplier.since", { date: date(supplier.joinedAt) })}</p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-medium">{t("supplier.contact")}</p>
          {supplier.phones.map((phone) => (
            <a key={phone} href={`tel:${phone.replace(/\s/g, "")}`} className="flex items-center gap-1 text-brand-700 hover:underline">
              <Phone className="h-4 w-4" /> {phone}
            </a>
          ))}
          <p className="text-stone-500">
            {t("supplier.languages")}: {supplier.languages.map((l) => LANGUAGE_NAMES[l]).join(", ")}
          </p>
        </div>
      </Card>

      <section>
        <h2 className="mb-4 text-lg font-semibold">{t("supplier.products")}</h2>
        {products.length === 0 ? (
          <EmptyState>{t("catalog.empty")}</EmptyState>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} categoryIcon={icons.get(product.categoryId)} i18n={i18n} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">{t("supplier.reviews", { count: reviews.length })}</h2>
        {reviews.length === 0 ? (
          <p className="text-stone-500">{t("supplier.noReviews")}</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <Card key={review.id} className="space-y-1 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Stars rating={review.rating} />
                  <span className="text-sm font-medium">{review.author}</span>
                  <span className="text-sm text-stone-500">{date(review.createdAt)}</span>
                </div>
                <p className="text-stone-700">{review.comment}</p>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
