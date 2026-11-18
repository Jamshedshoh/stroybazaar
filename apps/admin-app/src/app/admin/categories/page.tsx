import { Card, Field, inputClass, PageHeader, SubmitButton } from "@stroybazaar/ui";
import type { Metadata } from "next";
import { ActionForm } from "@/components/action-form";
import { LocalizedInputs } from "@/components/console-ui";
import { createCategory, updateCategory } from "@/lib/actions";
import { admin, unwrap } from "@/lib/api";
import { getI18n } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t("categories.title") };
}

export default async function CategoriesPage() {
  const [{ t, text }, categories] = await Promise.all([getI18n(), unwrap((await admin()).GET("/categories"))]);

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title={t("categories.title")} />

      <Card className="p-6">
        <h2 className="mb-4 font-semibold">{t("categories.new")}</h2>
        <ActionForm action={createCategory} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t("field.slug")} hint={t("categories.slugHint")}>
              <input name="id" required pattern="[a-z0-9-]+" className={inputClass} />
            </Field>
            <Field label={t("field.icon")}>
              <input name="icon" placeholder="box" className={inputClass} />
            </Field>
            <Field label={t("field.sortOrder")}>
              <input name="sortOrder" type="number" defaultValue={categories.length * 10} className={inputClass} />
            </Field>
          </div>
          <LocalizedInputs name="name" label={t("field.name")} t={t} />
          <SubmitButton>{t("common.create")}</SubmitButton>
        </ActionForm>
      </Card>

      <div className="space-y-3">
        {categories.map((category) => (
          <details key={category.id} className="rounded-xl border border-stone-200 bg-white">
            <summary className="flex cursor-pointer items-center gap-3 px-5 py-3">
              <span className="font-medium">{text(category.name)}</span>
              <code className="text-xs text-stone-500">{category.id}</code>
              <span className="ml-auto text-sm text-stone-500">
                {category.icon} · {category.sortOrder}
              </span>
            </summary>
            <ActionForm action={updateCategory} className="space-y-4 border-t border-stone-200 p-5">
              <input type="hidden" name="categoryId" value={category.id} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("field.icon")}>
                  <input name="icon" required defaultValue={category.icon} className={inputClass} />
                </Field>
                <Field label={t("field.sortOrder")}>
                  <input name="sortOrder" type="number" defaultValue={category.sortOrder} className={inputClass} />
                </Field>
              </div>
              <LocalizedInputs name="name" label={t("field.name")} value={category.name} t={t} />
              <SubmitButton size="sm">{t("common.save")}</SubmitButton>
            </ActionForm>
          </details>
        ))}
      </div>
    </div>
  );
}
