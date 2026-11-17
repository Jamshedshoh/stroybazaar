import { prisma, Prisma } from "@stroybazaar/db";
import { z, type ApiRouter } from "@stroybazaar/server";
import * as S from "../schemas";

const orderInclude = {
  buyer: { select: { phone: true } },
  supplier: { select: { name: true } },
  commission: { select: { amount: true } },
  _count: { select: { lines: true } },
} satisfies Prisma.OrderInclude;

function serializeOrder(order: Prisma.OrderGetPayload<{ include: typeof orderInclude }>): z.input<typeof S.AdminOrder> {
  return {
    id: order.id,
    buyerId: order.buyerId,
    buyerPhone: order.buyer.phone,
    supplierId: order.supplierId,
    supplierName: order.supplier.name,
    total: Number(order.total),
    paymentMethod: order.paymentMethod,
    status: order.status,
    deliveryAddress: order.deliveryAddress,
    lineCount: order._count.lines,
    commission: order.commission ? Number(order.commission.amount) : null,
    createdAt: order.createdAt.toISOString(),
    receiptConfirmedAt: order.receiptConfirmedAt?.toISOString() ?? null,
  };
}

const DateRange = z.object({
  supplierId: z.string().optional(),
  from: z.iso.date().optional().openapi({ description: "Inclusive, YYYY-MM-DD." }),
  to: z.iso.date().optional().openapi({ description: "Inclusive, YYYY-MM-DD." }),
});

function createdBetween(from?: string, to?: string): Prisma.DateTimeFilter | undefined {
  if (!from && !to) return undefined;
  return {
    ...(from && { gte: new Date(`${from}T00:00:00.000Z`) }),
    ...(to && { lte: new Date(`${to}T23:59:59.999Z`) }),
  };
}

export function registerOrderRoutes(api: ApiRouter) {
  api.route({
    method: "get",
    path: "/orders",
    tags: ["Orders"],
    summary: "List orders across all suppliers",
    access: ["admin"],
    query: S.Page.extend(DateRange.shape).extend({ status: S.OrderStatus.optional() }),
    response: { status: 200, description: "OK, newest first.", schema: S.OrderPage },
    handler: async ({ query }) => {
      const where: Prisma.OrderWhereInput = {
        status: query.status,
        supplierId: query.supplierId,
        createdAt: createdBetween(query.from, query.to),
      };
      const [items, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: orderInclude,
          orderBy: { createdAt: "desc" },
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
        }),
        prisma.order.count({ where }),
      ]);
      return { items: items.map(serializeOrder), total, page: query.page, pageSize: query.pageSize };
    },
  });

  api.route({
    method: "get",
    path: "/commissions",
    tags: ["Commissions"],
    summary: "Commission ledger",
    description:
      "Entries are created when a buyer confirms receipt. Use the totals to invoice suppliers weekly or monthly (business model section 4).",
    access: ["admin"],
    query: DateRange,
    response: { status: 200, description: "OK, newest first.", schema: S.CommissionReport },
    handler: async ({ query }) => {
      const commissions = await prisma.commission.findMany({
        where: {
          createdAt: createdBetween(query.from, query.to),
          order: { supplierId: query.supplierId },
        },
        include: { order: { select: { supplierId: true, total: true, supplier: { select: { name: true } } } } },
        orderBy: { createdAt: "desc" },
      });
      const totalAmount = commissions.reduce((sum, c) => sum.plus(c.amount), new Prisma.Decimal(0));
      return {
        items: commissions.map((c) => ({
          id: c.id,
          orderId: c.orderId,
          supplierId: c.order.supplierId,
          supplierName: c.order.supplier.name,
          orderTotal: Number(c.order.total),
          rate: Number(c.rate),
          amount: Number(c.amount),
          createdAt: c.createdAt.toISOString(),
        })),
        totalAmount: Number(totalAmount),
        count: commissions.length,
      };
    },
  });
}
