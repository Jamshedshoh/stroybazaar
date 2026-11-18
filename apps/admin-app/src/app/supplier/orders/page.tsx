import type { Api } from "@stroybazaar/api-client";
import { Card, EmptyState, PageHeader, SubmitButton } from "@stroybazaar/ui";
import type { Metadata } from "next";
import { ActionForm } from "@/components/action-form";
import { OrderStatusBadge } from "@/components/console-ui";
import { advanceOrder } from "@/lib/actions";
import { api, unwrap } from "@/lib/api";
import { shortId } from "@/lib/format";
import { getI18n } from "@/lib/i18n";

/** Mirrors the api's allowed supplier transitions. */
const NEXT_STATUS: Partial<Record<Api["OrderStatus"], "confirmed" | "out_for_delivery" | "delivered">> = {
  placed: "confirmed",
  confirmed: "out_for_delivery",
  out_for_delivery: "delivered",
};

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t("supplierOrders.title") };
}

export default async function SupplierOrdersPage() {
  const [{ t, text, money, number, dateTime }, orders] = await Promise.all([getI18n(), unwrap((await api()).GET("/orders"))]);

  return (
    <>
      <PageHeader title={t("supplierOrders.title")} />
      {orders.length === 0 ? (
        <EmptyState>{t("common.empty")}</EmptyState>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const next = NEXT_STATUS[order.status];
            return (
              <Card key={order.id} className="space-y-3 p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-sm font-medium">#{shortId(order.id)}</span>
                  <OrderStatusBadge status={order.status} t={t} />
                  <span className="text-sm text-stone-500">{dateTime(order.createdAt)}</span>
                  <span className="ml-auto text-lg font-semibold">{money(order.total)}</span>
                </div>
                <ul className="text-sm text-stone-700">
                  {order.lines.map((line) => (
                    <li key={line.productId}>
                      {text(line.productName)} · {number(line.quantity)} {text(line.unit)} × {money(line.unitPrice)}
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-stone-600">
                  {t("field.address")}: {order.deliveryAddress} · {t(`payment.${order.paymentMethod}`)}
                </p>
                {next ? (
                  <ActionForm action={advanceOrder} className="space-y-2" successMessage={false}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="status" value={next} />
                    <SubmitButton size="sm">{t(`supplierOrders.advance.${next}`)}</SubmitButton>
                  </ActionForm>
                ) : (
                  order.status === "delivered" && <p className="text-sm text-stone-500">{t("supplierOrders.waitingBuyer")}</p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
