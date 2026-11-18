import { Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmReceiptForm, ReviewForm } from "@/components/order-actions";
import { ORDER_STEPS, OrderStatusBadge } from "@/components/status";
import { Card, cx } from "@stroybazaar/ui";
import { api, getSupplierNames, requireViewer } from "@/lib/api";
import { getI18n } from "@/lib/i18n";
import { shortId } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ orderId: string }> }): Promise<Metadata> {
  return { title: (await getI18n()).t("orders.order", { id: shortId((await params).orderId) }) };
}

const CONFIRMABLE = ["confirmed", "out_for_delivery", "delivered"];

export default async function OrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  await requireViewer(`/orders/${orderId}`);
  const { data: order } = await (await api()).GET("/orders/{orderId}", { params: { path: { orderId } } });
  if (!order) notFound();

  const [i18n, supplierNames] = await Promise.all([getI18n(), getSupplierNames()]);
  const { t, text, money, number, dateTime } = i18n;
  const supplierName = supplierNames.get(order.supplierId) ?? "";
  const currentStep = ORDER_STEPS.indexOf(order.status);

  return (
    <div className="space-y-6">
      <Link href="/orders" className="text-sm text-stone-600 hover:underline">
        ← {t("orders.title")}
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{t("orders.order", { id: shortId(order.id) })}</h1>
        <OrderStatusBadge status={order.status} i18n={i18n} />
      </div>
      <p className="text-stone-600">
        <Link href={`/suppliers/${order.supplierId}`} className="font-medium text-stone-900 hover:text-brand-700">
          {supplierName}
        </Link>{" "}
        · {t("orders.placedOn", { date: dateTime(order.createdAt) })}
      </p>

      <ol className="grid gap-2 sm:grid-cols-5">
        {ORDER_STEPS.map((step, index) => (
          <li
            key={step}
            className={cx(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
              index <= currentStep ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-stone-200 bg-white text-stone-500",
            )}
          >
            {index <= currentStep && <Check className="h-4 w-4 shrink-0" />}
            {t(`status.${step}`)}
          </li>
        ))}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="overflow-hidden">
          <h2 className="border-b border-stone-200 px-5 py-3 font-semibold">{t("orders.items")}</h2>
          <ul className="divide-y divide-stone-100">
            {order.lines.map((line) => (
              <li key={line.productId} className="flex flex-wrap justify-between gap-2 px-5 py-3">
                <div>
                  <Link href={`/products/${line.productId}`} className="font-medium hover:text-brand-700">
                    {text(line.productName)}
                  </Link>
                  <p className="text-sm text-stone-500">
                    {number(line.quantity)} {text(line.unit)} × {money(line.unitPrice)}
                  </p>
                </div>
                <p className="font-medium">{money(line.quantity * line.unitPrice)}</p>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t border-stone-200 px-5 py-3 text-lg">
            <span>{t("orders.total")}</span>
            <span className="font-semibold">{money(order.total)}</span>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="space-y-3 p-5 text-sm">
            <div>
              <p className="text-stone-500">{t("orders.address")}</p>
              <p className="font-medium">{order.deliveryAddress}</p>
            </div>
            <div>
              <p className="text-stone-500">{t("orders.payment")}</p>
              <p className="font-medium">{t(`cart.payment.${order.paymentMethod}`)}</p>
            </div>
          </Card>

          {CONFIRMABLE.includes(order.status) && <ConfirmReceiptForm orderId={order.id} />}
          {order.status === "confirmed_receipt" && !order.hasReview && (
            <ReviewForm orderId={order.id} supplierId={order.supplierId} supplierName={supplierName} />
          )}
        </div>
      </div>
    </div>
  );
}
