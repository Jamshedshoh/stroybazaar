import { Field, inputClass, PageHeader } from "@stroybazaar/ui";
import type { Metadata } from "next";
import { EmptyRow, FilterBar, FilterSelect, Stat, Table, Td } from "@/components/console-ui";
import { admin, unwrap } from "@/lib/api";
import { shortId } from "@/lib/format";
import { getI18n } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t("commissions.title") };
}

/** Defaults to the current month, the usual invoicing period. */
function monthStart() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)).toISOString().slice(0, 10);
}

export default async function CommissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ supplierId?: string; from?: string; to?: string }>;
}) {
  const query = await searchParams;
  const filters = {
    supplierId: query.supplierId || undefined,
    from: query.from ?? monthStart(),
    to: query.to || undefined,
  };
  const client = await admin();
  const [{ t, money, number, dateTime }, report, suppliers] = await Promise.all([
    getI18n(),
    unwrap(client.GET("/commissions", { params: { query: { ...filters, from: filters.from || undefined } } })),
    unwrap(client.GET("/suppliers", { params: { query: { pageSize: 100 } } })),
  ]);

  return (
    <>
      <PageHeader title={t("commissions.title")} subtitle={t("commissions.subtitle")} />
      <FilterBar t={t}>
        <FilterSelect
          label={t("field.supplier")}
          name="supplierId"
          value={filters.supplierId}
          allLabel={t("common.all")}
          options={suppliers.items.map((s) => ({ value: s.id, label: s.name }))}
        />
        <Field label={t("common.from")}>
          <input type="date" name="from" defaultValue={filters.from} className={inputClass} />
        </Field>
        <Field label={t("common.to")}>
          <input type="date" name="to" defaultValue={filters.to} className={inputClass} />
        </Field>
      </FilterBar>
      <div className="mb-4 max-w-xs">
        <Stat label={t("commissions.total")} value={money(report.totalAmount)} hint={t("commissions.count", { count: report.count })} />
      </div>
      <Table head={[t("common.created"), t("field.order"), t("field.supplier"), t("field.total"), t("field.rate"), t("field.amount")]}>
        {report.items.length === 0 && <EmptyRow colSpan={6} t={t} />}
        {report.items.map((entry) => (
          <tr key={entry.id}>
            <Td className="whitespace-nowrap text-stone-500">{dateTime(entry.createdAt)}</Td>
            <Td className="font-mono text-xs">#{shortId(entry.orderId)}</Td>
            <Td>{entry.supplierName}</Td>
            <Td className="whitespace-nowrap">{money(entry.orderTotal)}</Td>
            <Td>{number(entry.rate * 100)}%</Td>
            <Td className="font-medium whitespace-nowrap">{money(entry.amount)}</Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
