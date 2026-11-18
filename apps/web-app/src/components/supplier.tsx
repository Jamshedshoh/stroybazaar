import type { Api } from "@stroybazaar/api-client";
import type { Translator } from "@stroybazaar/shared";
import { ShieldCheck, Star } from "lucide-react";
import type { WebDictionary } from "@/lib/dictionaries";
import { Badge } from "@stroybazaar/ui";

export function SupplierBadge({ supplier, i18n }: { supplier: Api["Supplier"]; i18n: Translator<WebDictionary> }) {
  const { t } = i18n;
  return (
    <span className="inline-flex flex-wrap items-center gap-2 text-sm text-stone-600">
      {supplier.verified ? (
        <Badge tone="success">
          <ShieldCheck className="h-3.5 w-3.5" /> {t("supplier.verified")}
        </Badge>
      ) : (
        <Badge>{t("supplier.unverified")}</Badge>
      )}
      {supplier.reviewCount > 0 ? (
        <span className="inline-flex items-center gap-1">
          <Star className="h-4 w-4 fill-brand-500 text-brand-500" />
          {supplier.rating.toFixed(1)} · {t("supplier.reviews", { count: supplier.reviewCount })}
        </span>
      ) : (
        <span>{t("supplier.noReviews")}</span>
      )}
    </span>
  );
}

export function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex" aria-label={`${rating}/5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`h-4 w-4 ${n <= rating ? "fill-brand-500 text-brand-500" : "text-stone-300"}`} />
      ))}
    </span>
  );
}
