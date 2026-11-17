import { prisma, type Prisma } from "@stroybazaar/db";
import { notFound, z, type ApiRouter } from "@stroybazaar/server";
import * as S from "../schemas";

const include = { _count: { select: { products: true } } } satisfies Prisma.SupplierInclude;

function serialize(supplier: Prisma.SupplierGetPayload<{ include: typeof include }>): z.input<typeof S.AdminSupplier> {
  return {
    id: supplier.id,
    name: supplier.name,
    status: supplier.status,
    rating: supplier.rating,
    reviewCount: supplier.reviewCount,
    location: supplier.location as z.input<typeof S.LocalizedText>,
    phones: supplier.phones,
    languages: supplier.languages,
    productCount: supplier._count.products,
    createdAt: supplier.createdAt.toISOString(),
  };
}

async function findSupplier(supplierId: string) {
  const supplier = await prisma.supplier.findUnique({ where: { id: supplierId }, include });
  if (!supplier) throw notFound("Supplier");
  return supplier;
}

export function registerSupplierRoutes(api: ApiRouter) {
  api.route({
    method: "get",
    path: "/suppliers",
    tags: ["Suppliers"],
    summary: "List suppliers",
    access: ["admin"],
    query: S.Page.extend({
      status: S.SupplierStatus.optional(),
      search: z.string().trim().min(1).optional().openapi({ description: "Matches name or phone." }),
    }),
    response: { status: 200, description: "OK, newest first.", schema: S.SupplierPage },
    handler: async ({ query }) => {
      const where: Prisma.SupplierWhereInput = {
        status: query.status,
        ...(query.search && {
          OR: [{ name: { contains: query.search, mode: "insensitive" } }, { phones: { has: query.search } }],
        }),
      };
      const [items, total] = await Promise.all([
        prisma.supplier.findMany({
          where,
          include,
          orderBy: { createdAt: "desc" },
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
        }),
        prisma.supplier.count({ where }),
      ]);
      return { items: items.map(serialize), total, page: query.page, pageSize: query.pageSize };
    },
  });

  api.route({
    method: "post",
    path: "/suppliers",
    tags: ["Suppliers"],
    summary: "Onboard a supplier",
    description: "New suppliers start as `pending` until verified.",
    access: ["admin"],
    body: S.CreateSupplierRequest,
    response: { status: 201, description: "Created.", schema: S.AdminSupplier },
    handler: async ({ body }) => serialize(await prisma.supplier.create({ data: body, include })),
  });

  api.route({
    method: "get",
    path: "/suppliers/{supplierId}",
    tags: ["Suppliers"],
    summary: "Get a supplier",
    access: ["admin"],
    params: S.SupplierParams,
    response: { status: 200, description: "OK.", schema: S.AdminSupplier },
    errors: [404],
    handler: async ({ params }) => serialize(await findSupplier(params.supplierId)),
  });

  api.route({
    method: "patch",
    path: "/suppliers/{supplierId}",
    tags: ["Suppliers"],
    summary: "Update supplier details",
    access: ["admin"],
    params: S.SupplierParams,
    body: S.UpdateSupplierRequest,
    response: { status: 200, description: "Updated.", schema: S.AdminSupplier },
    errors: [404],
    handler: async ({ params, body }) => {
      await findSupplier(params.supplierId);
      return serialize(await prisma.supplier.update({ where: { id: params.supplierId }, data: body, include }));
    },
  });

  api.route({
    method: "patch",
    path: "/suppliers/{supplierId}/status",
    tags: ["Suppliers"],
    summary: "Verify, suspend or reinstate a supplier",
    description: "Suspended suppliers and their products disappear from the public catalog.",
    access: ["admin"],
    params: S.SupplierParams,
    body: S.UpdateSupplierStatusRequest,
    response: { status: 200, description: "Updated.", schema: S.AdminSupplier },
    errors: [404],
    handler: async ({ params, body }) => {
      await findSupplier(params.supplierId);
      return serialize(
        await prisma.supplier.update({ where: { id: params.supplierId }, data: { status: body.status }, include }),
      );
    },
  });
}
