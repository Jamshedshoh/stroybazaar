import type { Api } from "@stroybazaar/api-client";
import { Field, inputClass, PageHeader } from "@stroybazaar/ui";
import type { Metadata } from "next";
import {
  EmptyRow,
  FilterBar,
  FilterSelect,
  ORDER_STATUSES,
  OrderStatusBadge,
  Pagination,
  Table,
  Td,
} from "@/components/console-ui";
import { admin, unwrap } from "@/lib/api";
import { shortId } from "@/lib/format";
import { getI18n } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t("orders.title") };
}

type Query = { status?: string; supplierId?: string; from?: string; to?: string; page?: string };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Query> }) {
  const query = await searchParams;
  const status = ORDER_STATUSES.includes(query.status as Api["OrderStatus"]) ? (query.status as Api["OrderStatus"]) : undefined;
  const page = Math.max(1, Number(query.page) || 1);
  const filters = { status, supplierId: query.supplierId || undefined, from: query.from || undefined, to: query.to || undefined };
  const client = await admin();
  const [{ t, money, dateTime }, orders, suppliers] = await Promise.all([
    getI18n(),
    unwrap(client.GET("/orders", { params: { query: { ...filters, page, pageSize: 25 } } })),
    unwrap(client.GET("/suppliers", { params: { query: { pageSize: 100 } } })),
  ]);

  return (
    <>
      <PageHeader title={t("orders.title")} />
      <FilterBar t={t}>
        <FilterSelect
          label={t("field.status")}
          name="status"
          value={status}
          allLabel={t("common.all")}
          options={ORDER_STATUSES.map((s) => ({ value: s, label: t(`orderStatus.${s}`) }))}
        />
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
      <Table
        head={[t("field.order"), t("common.created"), t("field.buyer"), t("field.supplier"), t("field.total"), t("field.payment"), t("field.status"), t("field.commission")]}
      >
        {orders.items.length === 0 && <EmptyRow colSpan={8} t={t} />}
        {orders.items.map((order) => (
          <tr key={order.id}>
            <Td className="font-mono text-xs">#{shortId(order.id)}</Td>
            <Td className="whitespace-nowrap text-stone-500">{dateTime(order.createdAt)}</Td>
            <Td className="whitespace-nowrap">{order.buyerPhone}</Td>
            <Td>{order.supplierName}</Td>
            <Td className="font-medium whitespace-nowrap">{money(order.total)}</Td>
            <Td>{t(`payment.${order.paymentMethod}`)}</Td>
            <Td>
              <OrderStatusBadge status={order.status} t={t} />
            </Td>
            <Td className="whitespace-nowrap">{order.commission === null ? "—" : money(order.commission)}</Td>
          </tr>
        ))}
      </Table>
      <Pagination page={orders.page} pageSize={orders.pageSize} total={orders.total} path="/admin/orders" query={filters} t={t} />
    </>
  );
}
