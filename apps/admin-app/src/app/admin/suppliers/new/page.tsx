import { Card, PageHeader, SubmitButton } from "@stroybazaar/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { SupplierFields } from "@/components/supplier-fields";
import { createSupplier } from "@/lib/actions";
import { getI18n } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t("suppliers.new") };
}

export default async function NewSupplierPage() {
  const i18n = await getI18n();
  const { t } = i18n;
  return (
    <div className="max-w-3xl">
      <Link href="/admin/suppliers" className="text-sm text-stone-600 hover:underline">
        ← {t("suppliers.title")}
      </Link>
      <PageHeader title={t("suppliers.new")} />
      <Card className="p-6">
        <ActionForm action={createSupplier} className="space-y-5" successMessage={false}>
          <SupplierFields i18n={i18n} />
          <SubmitButton>{t("common.create")}</SubmitButton>
        </ActionForm>
      </Card>
    </div>
  );
}
