"use client";

import type { Api } from "@stroybazaar/api-client";
import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { createRfq } from "@/lib/actions";
import { QuantityInput } from "./add-to-cart";
import { useI18n } from "./i18n-provider";
import { Alert, buttonClass, Card, Field, inputClass } from "@stroybazaar/ui";

interface Line {
  productId: string;
  quantity: number;
}

const tomorrow = () => new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

export function RfqBuilder({
  products,
  categories,
  supplierNames,
  initialProductId,
}: {
  products: Api["Product"][];
  categories: Api["Category"][];
  supplierNames: Record<string, string>;
  initialProductId?: string;
}) {
  const { t, text } = useI18n();
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const [lines, setLines] = useState<Line[]>(
    initialProductId && byId.has(initialProductId) ? [{ productId: initialProductId, quantity: 100 }] : [],
  );
  const [picked, setPicked] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const available = products.filter((p) => !lines.some((l) => l.productId === p.id));

  const addLine = () => {
    if (!picked) return;
    setLines((current) => [...current, { productId: picked, quantity: 100 }]);
    setPicked("");
  };

  const submit = (form: FormData) => {
    if (lines.length === 0) {
      setError(t("rfq.form.noItems"));
      return;
    }
    setError(undefined);
    startTransition(async () => {
      const result = await createRfq({
        items: lines,
        deliveryLocation: String(form.get("deliveryLocation") ?? ""),
        neededBy: String(form.get("neededBy") ?? ""),
      });
      // On success the action redirects, so only errors come back.
      if (result?.error) setError(result.error);
    });
  };

  return (
    <form action={submit} className="space-y-6">
      <Card className="space-y-4 p-5">
        <h2 className="font-semibold">{t("rfq.form.addProduct")}</h2>
        <div className="flex gap-2">
          <select value={picked} onChange={(e) => setPicked(e.target.value)} className={inputClass}>
            <option value="">{t("rfq.form.pick")}</option>
            {categories.map((category) => {
              const options = available.filter((p) => p.categoryId === category.id);
              if (options.length === 0) return null;
              return (
                <optgroup key={category.id} label={text(category.name)}>
                  {options.map((p) => (
                    <option key={p.id} value={p.id}>
                      {text(p.name)} · {supplierNames[p.supplierId]}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
          <button type="button" onClick={addLine} disabled={!picked} className={buttonClass("secondary")}>
            <Plus className="h-4 w-4" /> {t("rfq.form.add")}
          </button>
        </div>

        {lines.length > 0 && (
          <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200">
            {lines.map((line) => {
              const product = byId.get(line.productId);
              if (!product) return null;
              return (
                <li key={line.productId} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="min-w-48 flex-1">
                    <p className="font-medium">{text(product.name)}</p>
                    <p className="text-sm text-stone-500">{text(product.unit)}</p>
                  </div>
                  <QuantityInput
                    value={line.quantity}
                    onChange={(quantity) =>
                      setLines((current) => current.map((l) => (l.productId === line.productId ? { ...l, quantity } : l)))
                    }
                  />
                  <button
                    type="button"
                    className={buttonClass("ghost", "sm")}
                    onClick={() => setLines((current) => current.filter((l) => l.productId !== line.productId))}
                    aria-label={t("cart.remove")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card className="grid gap-4 p-5 sm:grid-cols-2">
        <Field label={t("rfq.form.location")}>
          <input name="deliveryLocation" required placeholder={t("rfq.form.locationPlaceholder")} className={inputClass} />
        </Field>
        <Field label={t("rfq.form.neededBy")}>
          <input name="neededBy" type="date" required min={tomorrow()} defaultValue={tomorrow()} className={inputClass} />
        </Field>
      </Card>

      {error && <Alert>{error}</Alert>}
      <button disabled={pending} className={buttonClass()}>
        {pending ? t("common.loading") : t("rfq.form.submit")}
      </button>
    </form>
  );
}
