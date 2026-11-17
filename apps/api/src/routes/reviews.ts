import { prisma, Prisma } from "@stroybazaar/db";
import { conflict, unprocessable, type ApiRouter } from "@stroybazaar/server";
import * as S from "../schemas";
import { reviewInclude, serializeReview } from "../serializers";

const duplicateReview = () => conflict("REVIEW_ALREADY_EXISTS", "This order already has a review.");

export function registerReviewRoutes(api: ApiRouter) {
  api.route({
    method: "post",
    path: "/reviews",
    tags: ["Reviews"],
    summary: "Submit a supplier review",
    description:
      "Typically called right after receipt confirmation. With `orderId`, the order must be yours, from this supplier and receipt-confirmed, and can have only one review. Updates the supplier's rating.",
    access: ["buyer"],
    body: S.SubmitReviewRequest,
    response: { status: 201, description: "Created.", schema: S.Review },
    errors: [409],
    handler: async ({ user, body }) => {
      const supplier = await prisma.supplier.findFirst({
        where: { id: body.supplierId, status: { not: "suspended" } },
      });
      if (!supplier) throw unprocessable("UNKNOWN_SUPPLIER", "Supplier does not exist.");

      if (body.orderId) {
        const order = await prisma.order.findUnique({ where: { id: body.orderId }, include: { review: true } });
        if (!order || order.buyerId !== user.id) {
          throw unprocessable("UNKNOWN_ORDER", "Order does not exist.");
        }
        if (order.supplierId !== body.supplierId) {
          throw unprocessable("ORDER_SUPPLIER_MISMATCH", "The order is not from this supplier.");
        }
        if (order.status !== "confirmed_receipt") {
          throw conflict("ORDER_NOT_CONFIRMED", "Confirm receipt before reviewing the order.");
        }
        if (order.review) throw duplicateReview();
      }

      try {
        const review = await prisma.$transaction(async (tx) => {
          const created = await tx.review.create({
            data: {
              supplierId: body.supplierId,
              authorId: user.id,
              orderId: body.orderId ?? null,
              rating: body.rating,
              comment: body.comment,
            },
            include: reviewInclude,
          });
          const stats = await tx.review.aggregate({
            where: { supplierId: body.supplierId },
            _avg: { rating: true },
            _count: true,
          });
          await tx.supplier.update({
            where: { id: body.supplierId },
            data: { rating: stats._avg.rating ?? 0, reviewCount: stats._count },
          });
          return created;
        });
        return serializeReview(review);
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          throw duplicateReview();
        }
        throw error;
      }
    },
  });
}
