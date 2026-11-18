import { Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CategoryIcon } from "@/components/category-icon";
import { ProductCard } from "@/components/product-card";
import { buttonClass, cx, EmptyState, inputClass, PageHeader } from "@stroybazaar/ui";
import { api, getSupplierNames, unwrap } from "@/lib/api";
import { getI18n } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t("catalog.title") };
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;
  const search = q?.trim() || undefined;
  const client = await api();
  const [i18n, categories, products, supplierNames] = await Promise.all([
    getI18n(),
    unwrap(client.GET("/categories")),
    unwrap(client.GET("/products", { params: { query: { categoryId: category, search } } })),
    getSupplierNames(),
  ]);
  const { t, text } = i18n;
  const icons = new Map(categories.map((c) => [c.id, c.icon]));
  const href = (categoryId?: string) => {
    const params = new URLSearchParams();
    if (categoryId) params.set("category", categoryId);
    if (search) params.set("q", search);
    const query = params.toString();
    return query ? `/catalog?${query}` : "/catalog";
  };

  return (
    <>
      <PageHeader title={t("catalog.title")} subtitle={t("catalog.results", { count: products.length })} />
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside>
          <nav className="flex gap-1 overflow-x-auto lg:flex-col">
            {[{ id: undefined, icon: "", label: t("catalog.all") }, ...categories.map((c) => ({ id: c.id, icon: c.icon, label: text(c.name) }))].map(
              (item) => (
                <Link
                  key={item.id ?? "all"}
                  href={href(item.id)}
                  className={cx(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm whitespace-nowrap",
                    item.id === category ? "bg-stone-900 text-white" : "text-stone-700 hover:bg-stone-100",
                  )}
                >
                  {item.icon && <CategoryIcon name={item.icon} className="h-4 w-4" />}
                  {item.label}
                </Link>
              ),
            )}
          </nav>
        </aside>

        <div className="space-y-6">
          <form className="flex gap-2" action="/catalog">
            {category && <input type="hidden" name="category" value={category} />}
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input name="q" defaultValue={search} placeholder={t("catalog.search")} className={`${inputClass} pl-9`} />
            </div>
            <button className={buttonClass("secondary")}>{t("catalog.searchButton")}</button>
          </form>

          {products.length === 0 ? (
            <EmptyState>{t("catalog.empty")}</EmptyState>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  supplierName={supplierNames.get(product.supplierId)}
                  categoryIcon={icons.get(product.categoryId)}
                  i18n={i18n}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
