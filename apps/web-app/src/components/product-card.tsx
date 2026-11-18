import type { Api } from "@stroybazaar/api-client";
import type { Translator } from "@stroybazaar/shared";
import Link from "next/link";
import type { WebDictionary } from "@/lib/dictionaries";
import { CategoryIcon } from "./category-icon";
import { Badge } from "@stroybazaar/ui";

export function ProductImage({ product, icon, className }: { product: Api["Product"]; icon?: string; className?: string }) {
  return (
    <div className={`grid place-items-center overflow-hidden bg-stone-100 text-stone-400 ${className ?? ""}`}>
      {product.image ? (
        // Supplier-hosted images can come from any domain, so next/image is not used.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={product.image} alt="" className="h-full w-full object-cover" />
      ) : (
        <CategoryIcon name={icon ?? ""} className="h-12 w-12" />
      )}
    </div>
  );
}

export function ProductCard({
  product,
  supplierName,
  categoryIcon,
  i18n,
}: {
  product: Api["Product"];
  supplierName?: string;
  categoryIcon?: string;
  i18n: Translator<WebDictionary>;
}) {
  const { t, text, money } = i18n;
  const bestTier = product.wholesaleTiers.at(-1);
  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white transition hover:border-brand-500 hover:shadow-sm"
    >
      <ProductImage product={product} icon={categoryIcon} className="aspect-[4/3]" />
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-medium leading-snug group-hover:text-brand-700">{text(product.name)}</h3>
        {supplierName && <p className="text-sm text-stone-500">{supplierName}</p>}
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <p>
            <span className="text-lg font-semibold">{money(product.price)}</span>{" "}
            <span className="text-sm text-stone-500">{t("product.perUnit", { unit: text(product.unit) })}</span>
          </p>
          {bestTier && (
            <Badge tone="info">−{Math.round((1 - bestTier.pricePerUnit / product.price) * 100)}%</Badge>
          )}
        </div>
      </div>
    </Link>
  );
}
