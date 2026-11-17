import { prisma } from "@stroybazaar/db";
import { notFound, z, type ApiRouter } from "@stroybazaar/server";
import * as S from "../schemas";
import { reviewInclude, serializeReview, serializeSupplier } from "../serializers";

async function listedSupplier(supplierId: string) {
  const supplier = await prisma.supplier.findFirst({ where: { id: supplierId, status: { not: "suspended" } } });
  if (!supplier) throw notFound("Supplier");
  return supplier;
}

export function registerSupplierRoutes(api: ApiRouter) {
  api.route({
    method: "get",
    path: "/suppliers",
    tags: ["Suppliers"],
    summary: "List suppliers (verified first)",
    access: "public",
    response: { status: 200, description: "OK. Verified first, then by rating.", schema: z.array(S.Supplier) },
    handler: async () => {
      const suppliers = await prisma.supplier.findMany({
        where: { status: { not: "suspended" } },
        orderBy: [{ rating: "desc" }, { name: "asc" }],
      });
      const verified = suppliers.filter((s) => s.status === "verified");
      const others = suppliers.filter((s) => s.status !== "verified");
      return [...verified, ...others].map(serializeSupplier);
    },
  });

  api.route({
    method: "get",
    path: "/suppliers/{supplierId}",
    tags: ["Suppliers"],
    summary: "Get a supplier profile",
    access: "public",
    params: S.SupplierParams,
    response: { status: 200, description: "OK.", schema: S.Supplier },
    errors: [404],
    handler: async ({ params }) => serializeSupplier(await listedSupplier(params.supplierId)),
  });

  api.route({
    method: "get",
    path: "/suppliers/{supplierId}/reviews",
    tags: ["Suppliers"],
    summary: "List reviews for a supplier",
    access: "public",
    params: S.SupplierParams,
    response: { status: 200, description: "OK, newest first.", schema: z.array(S.Review) },
    errors: [404],
    handler: async ({ params }) => {
      await listedSupplier(params.supplierId);
      const reviews = await prisma.review.findMany({
        where: { supplierId: params.supplierId },
        include: reviewInclude,
        orderBy: { createdAt: "desc" },
      });
      return reviews.map(serializeReview);
    },
  });
}
