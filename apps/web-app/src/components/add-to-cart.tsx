"use client";

import type { Api } from "@stroybazaar/api-client";
import { estimateUnitPrice } from "@stroybazaar/shared";
import { Check, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { useCart } from "./cart";
import { useI18n } from "./i18n-provider";
import { buttonClass, inputClass } from "@stroybazaar/ui";

export function QuantityInput({
  value,
  onChange,
  max,
}: {
  value: number;
  onChange: (value: number) => void;
  max?: number;
}) {
  const clamp = (n: number) => Math.max(1, Math.min(max ?? Infinity, Number.isFinite(n) ? n : 1));
  return (
    <div className="flex items-center">
      <button type="button" className={buttonClass("secondary", "sm")} onClick={() => onChange(clamp(value - 1))} aria-label="−">
        <Minus className="h-4 w-4" />
      </button>
      <input
        type="number"
        min={1}
        max={max}
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value)))}
        className={`${inputClass} mx-1 w-20 text-center`}
      />
      <button type="button" className={buttonClass("secondary", "sm")} onClick={() => onChange(clamp(value + 1))} aria-label="+">
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

export function AddToCart({ product }: { product: Api["Product"] }) {
  const { t, text, money } = useI18n();
  const { add } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const estimate = estimateUnitPrice(product, quantity) * quantity;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-stone-700">
        {t("product.quantity")} ({text(product.unit)})
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <QuantityInput value={quantity} onChange={(q) => { setQuantity(q); setAdded(false); }} max={product.stock} />
        <button
          type="button"
          className={buttonClass()}
          onClick={() => {
            add({
              productId: product.id,
              supplierId: product.supplierId,
              quantity,
              name: product.name,
              unit: product.unit,
              price: product.price,
              wholesaleTiers: product.wholesaleTiers,
              stock: product.stock,
            });
            setAdded(true);
          }}
        >
          {added ? <Check className="h-4 w-4" /> : null}
          {added ? t("product.added") : t("product.addToCart")}
        </button>
      </div>
      <p className="text-sm text-stone-500">{t("product.estimate", { total: money(estimate) })}</p>
    </div>
  );
}
