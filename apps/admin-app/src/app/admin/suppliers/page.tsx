import type { Admin } from "@stroybazaar/api-client";
import { ButtonLink, Field, inputClass, PageHeader } from "@stroybazaar/ui";
import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  EmptyRow,
  FilterBar,
  FilterSelect,
  Pagination,
  SUPPLIER_STATUSES,
  SupplierStatusBadge,
  Table,
  Td,
} from "@/components/console-ui";
import { admin, unwrap } from "@/lib/api";
import { getI18n } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t("suppliers.title") };
}

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}) {
  const query = await searchParams;
  const status = SUPPLIER_STATUSES.includes(query.status as Admin["SupplierStatus"])
    ? (query.status as Admin["SupplierStatus"])
    : undefined;
  const page = Math.max(1, Number(query.page) || 1);
  const [{ t, text, date }, result] = await Promise.all([
    getI18n(),
    unwrap(
      (await admin()).GET("/suppliers", {
        params: { query: { status, search: query.search || undefined, page, pageSize: 20 } },
      }),
    ),
  ]);

  return (
    <>
      <PageHeader
        title={t("suppliers.title")}
        action={
          <ButtonLink href="/admin/suppliers/new">
            <Plus className="h-4 w-4" /> {t("suppliers.new")}
          </ButtonLink>
        }
      />
      <FilterBar t={t}>
        <Field label={t("common.search")}>
          <input name="search" defaultValue={query.search} placeholder={t("suppliers.searchPlaceholder")} className={inputClass} />
        </Field>
        <FilterSelect
          label={t("field.status")}
          name="status"
          value={status}
          allLabel={t("common.all")}
          options={SUPPLIER_STATUSES.map((s) => ({ value: s, label: t(`supplierStatus.${s}`) }))}
        />
      </FilterBar>
      <Table head={[t("field.name"), t("field.status"), t("field.location"), t("field.products"), t("field.rating"), t("common.created")]}>
        {result.items.length === 0 && <EmptyRow colSpan={6} t={t} />}
        {result.items.map((supplier) => (
          <tr key={supplier.id} className="hover:bg-stone-50">
            <Td>
              <Link href={`/admin/suppliers/${supplier.id}`} className="font-medium hover:text-brand-700">
                {supplier.name}
              </Link>
              <p className="text-xs text-stone-500">{supplier.phones.join(", ")}</p>
            </Td>
            <Td>
              <SupplierStatusBadge status={supplier.status} t={t} />
            </Td>
            <Td>{text(supplier.location)}</Td>
            <Td>{supplier.productCount}</Td>
            <Td>{supplier.reviewCount > 0 ? `${supplier.rating.toFixed(1)} (${supplier.reviewCount})` : "—"}</Td>
            <Td className="whitespace-nowrap text-stone-500">{date(supplier.createdAt)}</Td>
          </tr>
        ))}
      </Table>
      <Pagination
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        path="/admin/suppliers"
        query={{ status, search: query.search }}
        t={t}
      />
    </>
  );
}
