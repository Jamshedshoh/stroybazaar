import { prisma, Prisma, type OrderStatus } from "@stroybazaar/db";
import {
  conflict,
  forbidden,
  notFound,
  unprocessable,
  z,
  type ApiRouter,
  type AuthUser,
} from "@stroybazaar/server";
import { roundMoney, unitPriceFor } from "../pricing";
import * as S from "../schemas";
import { orderInclude, serializeOrder } from "../serializers";

/** Supplier/admin-driven transitions. `confirmed_receipt` is only reachable via confirm-receipt. */
const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  placed: "confirmed",
  confirmed: "out_for_delivery",
  out_for_delivery: "delivered",
};

/** States from which the buyer may confirm receipt (the supplier has accepted the order). */
const CONFIRMABLE: OrderStatus[] = ["confirmed", "out_for_delivery", "delivered"];

async function visibleOrder(user: AuthUser, orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: orderInclude });
  const visible =
    order &&
    (user.role === "admin" ||
      (user.role === "buyer" && order.buyerId === user.id) ||
      (user.role === "supplier" && order.supplierId === user.supplierId));
  if (!visible) throw notFound("Order");
  return order;
}

export function registerOrderRoutes(api: ApiRouter, options: { commissionRate: number }) {
  api.route({
    method: "get",
    path: "/orders",
    tags: ["Orders"],
    summary: "List orders",
    description: "Buyers get their own orders, suppliers get orders placed with them, admins get all orders.",
    access: "authenticated",
    query: z.object({ status: S.OrderStatus.optional() }),
    response: { status: 200, description: "OK, newest first.", schema: z.array(S.Order) },
    handler: async ({ user, query }) => {
      const scope: Prisma.OrderWhereInput =
        user.role === "buyer"
          ? { buyerId: user.id }
          : user.role === "supplier"
            ? { supplierId: user.supplierId ?? "__none__" }
            : {};
      const orders = await prisma.order.findMany({
        where: { ...scope, status: query.status },
        include: orderInclude,
        orderBy: { createdAt: "desc" },
      });
      return orders.map(serializeOrder);
    },
  });

  api.route({
    method: "post",
    path: "/orders",
    tags: ["Orders"],
    summary: "Place a retail order",
    description:
      "Cash on delivery or bank transfer at launch (business model section 5). Unit prices and the total are recomputed from the current catalog and wholesale tiers. All lines must come from one supplier. A new order starts at `placed`; commission accrues only on receipt confirmation.",
    access: ["buyer"],
    body: S.CreateOrderRequest,
    response: { status: 201, description: "Created.", schema: S.Order },
    errors: [409],
    handler: async ({ user, body }) => {
      // Merge repeated products into one line.
      const quantities = new Map<string, number>();
      for (const line of body.lines) {
        quantities.set(line.productId, (quantities.get(line.productId) ?? 0) + line.quantity);
      }

      const products = await prisma.product.findMany({
        where: { id: { in: [...quantities.keys()] }, active: true, supplier: { status: { not: "suspended" } } },
        include: { wholesaleTiers: true },
      });
      const missing = [...quantities.keys()].filter((id) => !products.some((p) => p.id === id));
      if (missing.length) {
        throw unprocessable("UNKNOWN_PRODUCT", "Some products are not available.", { productIds: missing });
      }

      const supplierIds = new Set(products.map((p) => p.supplierId));
      if (supplierIds.size > 1) {
        throw unprocessable("MULTIPLE_SUPPLIERS", "Place one order per supplier.", {
          supplierIds: [...supplierIds],
        });
      }

      const short = products.filter((p) => quantities.get(p.id)! > p.stock);
      if (short.length) {
        throw conflict("INSUFFICIENT_STOCK", "Not enough stock for some products.", {
          products: short.map((p) => ({ productId: p.id, available: p.stock })),
        });
      }

      const lines = products.map((product) => {
        const quantity = quantities.get(product.id)!;
        return { productId: product.id, quantity, unitPrice: unitPriceFor(product, quantity) };
      });
      const total = roundMoney(
        lines.reduce((sum, line) => sum.plus(line.unitPrice.times(line.quantity)), new Prisma.Decimal(0)),
      );

      const order = await prisma.order.create({
        data: {
          buyerId: user.id,
          supplierId: products[0]!.supplierId,
          paymentMethod: body.paymentMethod,
          deliveryAddress: body.deliveryAddress,
          total,
          lines: { create: lines },
        },
        include: orderInclude,
      });
      return serializeOrder(order);
    },
  });

  api.route({
    method: "get",
    path: "/orders/{orderId}",
    tags: ["Orders"],
    summary: "Get one order",
    access: "authenticated",
    params: S.OrderParams,
    response: { status: 200, description: "OK.", schema: S.Order },
    errors: [404],
    handler: async ({ user, params }) => serializeOrder(await visibleOrder(user, params.orderId)),
  });

  api.route({
    method: "patch",
    path: "/orders/{orderId}",
    tags: ["Orders"],
    summary: "Update order status (supplier/admin only)",
    description:
      "Moves the order one step: placed -> confirmed -> out_for_delivery -> delivered. Buyers use `/orders/{orderId}/confirm-receipt` instead.",
    access: ["supplier", "admin"],
    params: S.OrderParams,
    body: S.UpdateOrderStatusRequest,
    response: { status: 200, description: "Updated order.", schema: S.Order },
    errors: [404, 409],
    handler: async ({ user, params, body }) => {
      const order = await visibleOrder(user, params.orderId);
      if (body.status === "confirmed_receipt") {
        throw forbidden("Only the buyer can confirm receipt.", "BUYER_CONFIRMATION_REQUIRED");
      }
      if (NEXT_STATUS[order.status] !== body.status) {
        throw conflict("INVALID_STATUS_TRANSITION", `Cannot move an order from ${order.status} to ${body.status}.`, {
          from: order.status,
          to: body.status,
          allowed: NEXT_STATUS[order.status] ?? null,
        });
      }

      const updated = await prisma.order.updateMany({
        where: { id: order.id, status: order.status },
        data: { status: body.status },
      });
      if (updated.count === 0) throw conflict("ORDER_CHANGED", "The order was changed by someone else. Reload it.");

      return serializeOrder(await visibleOrder(user, order.id));
    },
  });

  api.route({
    method: "post",
    path: "/orders/{orderId}/confirm-receipt",
    tags: ["Orders"],
    summary: "Buyer confirms receipt",
    description:
      "The core commission-leakage control (business model section 4). Sets status to `confirmed_receipt`, records the commission, and makes the order reviewable. Allowed once the supplier has accepted the order. Idempotent: confirming again returns the order unchanged.",
    access: ["buyer"],
    params: S.OrderParams,
    response: { status: 200, description: "Confirmed order.", schema: S.Order },
    errors: [404, 409],
    handler: async ({ user, params }) => {
      const order = await visibleOrder(user, params.orderId);
      if (order.status === "confirmed_receipt") return serializeOrder(order);
      if (!CONFIRMABLE.includes(order.status)) {
        throw conflict("ORDER_NOT_ACCEPTED", "The supplier has not accepted this order yet.");
      }

      const rate = new Prisma.Decimal(options.commissionRate);
      await prisma.$transaction(async (tx) => {
        const updated = await tx.order.updateMany({
          where: { id: order.id, status: { in: CONFIRMABLE } },
          data: { status: "confirmed_receipt", receiptConfirmedAt: new Date() },
        });
        // A concurrent request already confirmed it; nothing more to record.
        if (updated.count === 0) return;
        await tx.commission.create({
          data: { orderId: order.id, rate, amount: roundMoney(order.total.times(rate)) },
        });
      });

      return serializeOrder(await visibleOrder(user, order.id));
    },
  });
}
