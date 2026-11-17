import { prisma } from "@stroybazaar/db";
import type { ApiRouter } from "@stroybazaar/server";
import * as S from "../schemas";

const ratio = (part: number, whole: number) => (whole === 0 ? null : part / whole);

export function registerStatsRoutes(api: ApiRouter) {
  api.route({
    method: "get",
    path: "/stats",
    tags: ["Stats"],
    summary: "Marketplace metrics",
    access: ["admin"],
    response: { status: 200, description: "OK.", schema: S.Stats },
    handler: async () => {
      const [activeSuppliers, pendingSuppliers, rfqsPosted, ordersCompleted, deliveredOrLater, buyers, commission, response] =
        await Promise.all([
          prisma.supplier.count({ where: { status: "verified" } }),
          prisma.supplier.count({ where: { status: "pending" } }),
          prisma.rfq.count(),
          prisma.order.count({ where: { status: "confirmed_receipt" } }),
          prisma.order.count({ where: { status: { in: ["delivered", "confirmed_receipt"] } } }),
          prisma.order.groupBy({ by: ["buyerId"], _count: true }),
          prisma.commission.aggregate({ _sum: { amount: true } }),
          prisma.$queryRaw<{ hours: number | null }[]>`
            SELECT AVG(EXTRACT(EPOCH FROM (q."createdAt" - r."createdAt")) / 3600)::float AS hours
            FROM "Quote" q JOIN "Rfq" r ON r.id = q."rfqId"`,
        ]);

      return {
        activeSuppliers,
        pendingSuppliers,
        rfqsPosted,
        averageQuoteResponseHours: response[0]?.hours ?? null,
        ordersCompleted,
        confirmedInAppShare: ratio(ordersCompleted, deliveredOrLater),
        repeatBuyerRate: ratio(buyers.filter((b) => b._count > 1).length, buyers.length),
        commissionTotal: Number(commission._sum.amount ?? 0),
      };
    },
  });
}
