"use client";

import { estimateUnitPrice } from "@stroybazaar/shared";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { placeOrder } from "@/lib/actions";
import { QuantityInput } from "./add-to-cart";
import { useCart, type CartItem } from "./cart";
import { useI18n } from "./i18n-provider";
import { Alert, ButtonLink, buttonClass, Card, EmptyState, Field, inputClass } from "@stroybazaar/ui";

export function CartView({ signedIn, supplierNames }: { signedIn: boolean; supplierNames: Record<string, string> }) {
  const { t } = useI18n();
  const { items, ready } = useCart();

  if (!ready) return <p className="text-stone-500">{t("common.loading")}</p>;
  if (items.length === 0) {
    return <EmptyState action={<ButtonLink href="/catalog">{t("cart.continue")}</ButtonLink>}>{t("cart.empty")}</EmptyState>;
  }

  const groups = Object.entries(
    items.reduce<Record<string, CartItem[]>>((acc, item) => {
      (acc[item.supplierId] ??= []).push(item);
      return acc;
    }, {}),
  );

  return (
    <div className="space-y-6">
      {groups.length > 1 && <p className="text-sm text-stone-600">{t("cart.oneOrderPerSupplier")}</p>}
      {groups.map(([supplierId, groupItems]) => (
        <SupplierOrder
          key={supplierId}
          supplierName={supplierNames[supplierId] ?? supplierId}
          items={groupItems}
          signedIn={signedIn}
        />
      ))}
      <p className="text-xs text-stone-500">{t("cart.priceNote")}</p>
    </div>
  );
}

function SupplierOrder({ supplierName, items, signedIn }: { supplierName: string; items: CartItem[]; signedIn: boolean }) {
  const { t, text, money } = useI18n();
  const { setQuantity, remove } = useCart();
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const subtotal = items.reduce((sum, item) => sum + estimateUnitPrice(item, item.quantity) * item.quantity, 0);

  const submit = (form: FormData) => {
    setError(undefined);
    startTransition(async () => {
      const result = await placeOrder({
        lines: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        paymentMethod: form.get("paymentMethod") === "bank_transfer" ? "bank_transfer" : "cod",
        deliveryAddress: String(form.get("deliveryAddress") ?? ""),
      });
      if (result.error || !result.orderId) {
        setError(result.error ?? t("common.error"));
        return;
      }
      remove(items.map((item) => item.productId));
      router.push(`/orders/${result.orderId}`);
    });
  };

  return (
    <Card className="overflow-hidden">
      <h2 className="border-b border-stone-200 bg-stone-50 px-5 py-3 font-semibold">
        {t("cart.orderFrom", { supplier: supplierName })}
      </h2>
      <ul className="divide-y divide-stone-100">
        {items.map((item) => {
          const unitPrice = estimateUnitPrice(item, item.quantity);
          return (
            <li key={item.productId} className="flex flex-wrap items-center gap-4 px-5 py-4">
              <div className="min-w-48 flex-1">
                <p className="font-medium">{text(item.name)}</p>
                <p className="text-sm text-stone-500">
                  {money(unitPrice)} {t("product.perUnit", { unit: text(item.unit) })}
                </p>
              </div>
              <QuantityInput value={item.quantity} onChange={(q) => setQuantity(item.productId, q)} max={item.stock} />
              <p className="w-28 text-right font-medium">{money(unitPrice * item.quantity)}</p>
              <button
                type="button"
                onClick={() => remove([item.productId])}
                className={buttonClass("ghost", "sm")}
                aria-label={t("cart.remove")}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          );
        })}
      </ul>
      <div className="space-y-4 border-t border-stone-200 px-5 py-4">
        <div className="flex justify-between text-lg">
          <span>{t("cart.subtotal")}</span>
          <span className="font-semibold">{money(subtotal)}</span>
        </div>
        {signedIn ? (
          <form action={submit} className="grid gap-4 sm:grid-cols-2">
            <Field label={t("cart.address")}>
              <input name="deliveryAddress" required placeholder={t("cart.addressPlaceholder")} className={inputClass} />
            </Field>
            <Field label={t("cart.payment")}>
              <select name="paymentMethod" className={inputClass} defaultValue="cod">
                <option value="cod">{t("cart.payment.cod")}</option>
                <option value="bank_transfer">{t("cart.payment.bank_transfer")}</option>
              </select>
            </Field>
            {error && (
              <div className="sm:col-span-2">
                <Alert>{error}</Alert>
              </div>
            )}
            <button disabled={pending} className={`${buttonClass()} sm:col-span-2 sm:justify-self-end`}>
              {pending ? t("common.loading") : t("cart.placeOrder")}
            </button>
          </form>
        ) : (
          <ButtonLink href="/login?next=/cart" className="w-full">
            {t("cart.loginToOrder")}
          </ButtonLink>
        )}
      </div>
    </Card>
  );
}
