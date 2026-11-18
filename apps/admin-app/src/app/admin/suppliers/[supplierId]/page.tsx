import type { Admin } from "@stroybazaar/api-client";
import { Card, PageHeader, SubmitButton } from "@stroybazaar/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { SupplierStatusBadge } from "@/components/console-ui";
import { SupplierFields } from "@/components/supplier-fields";
import { setSupplierStatus, updateSupplier } from "@/lib/actions";
import { admin } from "@/lib/api";
import { getI18n } from "@/lib/i18n";

async function loadSupplier(supplierId: string) {
  const { data } = await (await admin()).GET("/suppliers/{supplierId}", { params: { path: { supplierId } } });
  return data;
}

export async function generateMetadata({ params }: { params: Promise<{ supplierId: string }> }): Promise<Metadata> {
  return { title: (await loadSupplier((await params).supplierId))?.name };
}

export default async function SupplierPage({ params }: { params: Promise<{ supplierId: string }> }) {
  const supplier = await loadSupplier((await params).supplierId);
  if (!supplier) notFound();
  const i18n = await getI18n();
  const { t, date } = i18n;

  const transitions: { status: Admin["SupplierStatus"]; label: string; variant: "primary" | "danger" | "secondary" }[] =
    supplier.status === "pending"
      ? [
          { status: "verified", label: t("suppliers.verify"), variant: "primary" },
          { status: "suspended", label: t("suppliers.suspend"), variant: "danger" },
        ]
      : supplier.status === "verified"
        ? [{ status: "suspended", label: t("suppliers.suspend"), variant: "danger" }]
        : [{ status: "verified", label: t("suppliers.reinstate"), variant: "secondary" }];

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/admin/suppliers" className="text-sm text-stone-600 hover:underline">
        ← {t("suppliers.title")}
      </Link>
      <PageHeader
        title={supplier.name}
        subtitle={`${t("common.created")}: ${date(supplier.createdAt)} · ${t("field.products")}: ${supplier.productCount}`}
        action={<SupplierStatusBadge status={supplier.status} t={t} />}
      />

      <Card className="space-y-3 p-6">
        <h2 className="font-semibold">{t("field.status")}</h2>
        <p className="text-sm text-stone-600">{t("suppliers.statusHint")}</p>
        <div className="flex flex-wrap gap-2">
          {transitions.map((transition) => (
            <ActionForm key={transition.status} action={setSupplierStatus} className="space-y-2" successMessage={false}>
              <input type="hidden" name="supplierId" value={supplier.id} />
              <input type="hidden" name="status" value={transition.status} />
              <SubmitButton variant={transition.variant}>{transition.label}</SubmitButton>
            </ActionForm>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 font-semibold">{t("suppliers.details")}</h2>
        <ActionForm action={updateSupplier} className="space-y-5">
          <input type="hidden" name="supplierId" value={supplier.id} />
          <SupplierFields supplier={supplier} i18n={i18n} />
          <SubmitButton>{t("common.save")}</SubmitButton>
        </ActionForm>
      </Card>
    </div>
  );
}
