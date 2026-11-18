import { ClipboardList, ShieldCheck, Truck } from "lucide-react";
import Link from "next/link";
import { CategoryIcon } from "@/components/category-icon";
import { ProductCard } from "@/components/product-card";
import { ButtonLink, Card } from "@stroybazaar/ui";
import { api, getSupplierNames, unwrap } from "@/lib/api";
import { getI18n } from "@/lib/i18n";

export default async function HomePage() {
  const client = await api();
  const [i18n, categories, products, supplierNames] = await Promise.all([
    getI18n(),
    unwrap(client.GET("/categories")),
    unwrap(client.GET("/products")),
    getSupplierNames(),
  ]);
  const { t, text } = i18n;
  const icons = new Map(categories.map((c) => [c.id, c.icon]));

  return (
    <div className="space-y-12">
      <section className="overflow-hidden rounded-2xl bg-stone-900 px-6 py-12 text-white sm:px-10">
        <div className="max-w-2xl space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("home.title")}</h1>
          <p className="text-stone-300">{t("home.subtitle")}</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <ButtonLink href="/catalog">{t("home.browse")}</ButtonLink>
            <ButtonLink href="/rfqs/new" variant="secondary">
              {t("home.requestQuote")}
            </ButtonLink>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">{t("home.categories")}</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/catalog?category=${category.id}`}
              className="flex flex-col items-center gap-2 rounded-xl border border-stone-200 bg-white p-3 text-center text-sm transition hover:border-brand-500"
            >
              <CategoryIcon name={category.icon} className="h-6 w-6 text-brand-600" />
              {text(category.name)}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("home.latest")}</h2>
          <Link href="/catalog" className="text-sm font-medium text-brand-700 hover:underline">
            {t("nav.catalog")} →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {products.slice(0, 8).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              supplierName={supplierNames.get(product.supplierId)}
              categoryIcon={icons.get(product.categoryId)}
              i18n={i18n}
            />
          ))}
        </div>
      </section>

      <Card className="p-6 sm:p-8">
        <h2 className="mb-6 text-lg font-semibold">{t("home.how.title")}</h2>
        <ol className="grid gap-6 sm:grid-cols-3">
          {[
            { icon: ClipboardList, text: t("home.how.step1") },
            { icon: ShieldCheck, text: t("home.how.step2") },
            { icon: Truck, text: t("home.how.step3") },
          ].map((step, index) => (
            <li key={index} className="flex gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700">
                <step.icon className="h-5 w-5" />
              </span>
              <span className="pt-2 text-stone-700">{step.text}</span>
            </li>
          ))}
        </ol>
        <ButtonLink href="/rfqs/new" className="mt-6">
          {t("home.requestQuote")}
        </ButtonLink>
      </Card>
    </div>
  );
}
