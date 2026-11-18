"use client";

import type { Api } from "@stroybazaar/api-client";
import { Alert, buttonClass, Card, Field, inputClass } from "@stroybazaar/ui";
import { Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { saveProduct } from "@/lib/actions";
import { useI18n } from "./i18n-provider";

const LANGS = [
  ["ru", "field.nameRu"],
  ["tj", "field.nameTj"],
  ["en", "field.nameEn"],
] as const;

function Localized({ name, label, value }: { name: string; label: string; value?: Api["LocalizedText"] }) {
  const { t } = useI18n();
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium text-stone-700">{label}</legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {LANGS.map(([lang, langLabel]) => (
          <label key={lang} className="block">
            <span className="text-xs text-stone-500">{t(langLabel)}</span>
            <input name={`${name}.${lang}`} defaultValue={value?.[lang]} required className={inputClass} />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const localized = (form: FormData, prefix: string) => {
  const get = (lang: string) => String(form.get(`${prefix}.${lang}`) ?? "").trim();
  return { en: get("en"), ru: get("ru"), tj: get("tj") };
};

export function ProductForm({ product, categories }: { product?: Api["SupplierProduct"]; categories: Api["Category"][] }) {
  const { t, text } = useI18n();
  const [tiers, setTiers] = useState<Api["WholesaleTier"][]>(product?.wholesaleTiers ?? []);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const submit = (form: FormData) => {
    setError(undefined);
    const image = String(form.get("image") ?? "").trim();
    startTransition(async () => {
      const result = await saveProduct(product?.id, {
        categoryId: String(form.get("categoryId")),
        name: localized(form, "name"),
        unit: localized(form, "unit"),
        attributes: localized(form, "attributes"),
        price: Number(form.get("price")),
        stock: Number(form.get("stock")),
        image: image || null,
        wholesaleTiers: tiers.filter((tier) => tier.minQty > 0 && tier.pricePerUnit > 0),
        ...(product && { active: form.get("active") === "on" }),
      });
      // On success the action redirects, so only errors come back.
      if (result?.error) setError(result.error);
    });
  };

  const setTier = (index: number, patch: Partial<Api["WholesaleTier"]>) =>
    setTiers((current) => current.map((tier, i) => (i === index ? { ...tier, ...patch } : tier)));

  return (
    <form action={submit} className="space-y-6">
      <Card className="space-y-5 p-6">
        <p className="text-sm text-stone-600">{t("products.localizedHint")}</p>
        <Field label={t("field.category")}>
          <select name="categoryId" required defaultValue={product?.categoryId} className={inputClass}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {text(c.name)}
              </option>
            ))}
          </select>
        </Field>
        <Localized name="name" label={t("field.name")} value={product?.name} />
        <Localized name="unit" label={t("field.unit")} value={product?.unit} />
        <Localized name="attributes" label={t("field.attributes")} value={product?.attributes} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t("field.price")}>
            <input name="price" type="number" step="0.01" min="0.01" required defaultValue={product?.price} className={inputClass} />
          </Field>
          <Field label={t("field.stock")}>
            <input name="stock" type="number" min="0" required defaultValue={product?.stock ?? 0} className={inputClass} />
          </Field>
          <Field label={t("field.image")}>
            <input name="image" type="url" defaultValue={product?.image ?? ""} className={inputClass} />
          </Field>
        </div>
        {product && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="active" defaultChecked={product.active} className="h-4 w-4 accent-brand-600" />
            {t("field.active")}
          </label>
        )}
      </Card>

      <Card className="space-y-3 p-6">
        <h2 className="font-semibold">{t("field.tiers")}</h2>
        {tiers.map((tier, index) => (
          <div key={index} className="flex items-end gap-2">
            <Field label={t("field.minQty")}>
              <input
                type="number"
                min="1"
                value={tier.minQty || ""}
                onChange={(e) => setTier(index, { minQty: Number(e.target.value) })}
                className={inputClass}
              />
            </Field>
            <Field label={t("field.tierPrice")}>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={tier.pricePerUnit || ""}
                onChange={(e) => setTier(index, { pricePerUnit: Number(e.target.value) })}
                className={inputClass}
              />
            </Field>
            <button
              type="button"
              onClick={() => setTiers((current) => current.filter((_, i) => i !== index))}
              className={buttonClass("ghost")}
              aria-label="remove"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setTiers((current) => [...current, { minQty: 0, pricePerUnit: 0 }])}
          className={buttonClass("secondary", "sm")}
        >
          <Plus className="h-4 w-4" /> {t("field.addTier")}
        </button>
      </Card>

      {error && <Alert>{error}</Alert>}
      <button disabled={pending} className={buttonClass()}>
        {product ? t("common.save") : t("common.create")}
      </button>
    </form>
  );
}
