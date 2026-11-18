import { prisma, type Prisma } from "@stroybazaar/db";
import { forbidden, notFound, unprocessable, z, type ApiRouter, type AuthUser } from "@stroybazaar/server";
import * as S from "../schemas";
import { productInclude, serializeCategory, serializeProduct } from "../serializers";

/** Products from suspended suppliers and hidden products never reach the public catalog. */
const listedProduct = {
  active: true,
  supplier: { status: { not: "suspended" } },
} satisfies Prisma.ProductWhereInput;

const ProductsQuery = z.object({
  categoryId: z.string().optional().openapi({ example: "cement" }),
  supplierId: z.string().optional().openapi({ example: "sup-1" }),
  search: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .openapi({ description: "Case-insensitive search across all localized names and attributes." }),
});

async function searchProductIds(search: string) {
  const pattern = `%${search.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "Product"
    WHERE name->>'en' ILIKE ${pattern} OR name->>'ru' ILIKE ${pattern} OR name->>'tj' ILIKE ${pattern}
       OR attributes->>'en' ILIKE ${pattern} OR attributes->>'ru' ILIKE ${pattern} OR attributes->>'tj' ILIKE ${pattern}`;
  return rows.map((row) => row.id);
}

async function assertCategory(categoryId: string) {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) throw unprocessable("UNKNOWN_CATEGORY", `Category "${categoryId}" does not exist.`);
}

async function ownedProduct(user: AuthUser, productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw notFound("Product");
  if (user.role !== "admin" && product.supplierId !== user.supplierId) {
    throw forbidden("You can only change your own products.");
  }
  return product;
}

export function registerCatalogRoutes(api: ApiRouter) {
  api.route({
    method: "get",
    path: "/categories",
    tags: ["Catalog"],
    summary: "List translated product categories",
    access: "public",
    response: { status: 200, description: "OK.", schema: z.array(S.Category) },
    handler: async () => {
      const categories = await prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
      return categories.map(serializeCategory);
    },
  });

  api.route({
    method: "get",
    path: "/products",
    tags: ["Catalog"],
    summary: "List products, optionally filtered by category",
    access: "public",
    query: ProductsQuery,
    headers: S.LanguageHeader,
    response: { status: 200, description: "OK, newest first.", schema: z.array(S.Product) },
    handler: async ({ query }) => {
      const ids = query.search ? await searchProductIds(query.search) : undefined;
      const products = await prisma.product.findMany({
        where: { ...listedProduct, categoryId: query.categoryId, supplierId: query.supplierId, id: ids && { in: ids } },
        include: productInclude,
        orderBy: { createdAt: "desc" },
      });
      return products.map(serializeProduct);
    },
  });

  api.route({
    method: "get",
    path: "/products/{productId}",
    tags: ["Catalog"],
    summary: "Get one product",
    access: "public",
    params: S.ProductParams,
    response: { status: 200, description: "OK.", schema: S.Product },
    errors: [404],
    handler: async ({ params }) => {
      const product = await prisma.product.findFirst({
        where: { ...listedProduct, id: params.productId },
        include: productInclude,
      });
      if (!product) throw notFound("Product");
      return serializeProduct(product);
    },
  });

  api.route({
    method: "get",
    path: "/me/products",
    tags: ["Catalog"],
    summary: "List the current supplier's products (supplier dashboard)",
    description: "Includes hidden products, unlike `GET /products`.",
    access: ["supplier"],
    response: { status: 200, description: "OK, newest first.", schema: z.array(S.SupplierProduct) },
    handler: async ({ user }) => {
      if (!user.supplierId) return [];
      const products = await prisma.product.findMany({
        where: { supplierId: user.supplierId },
        include: productInclude,
        orderBy: { createdAt: "desc" },
      });
      return products.map((product) => ({ ...serializeProduct(product), active: product.active }));
    },
  });

  api.route({
    method: "post",
    path: "/products",
    tags: ["Catalog"],
    summary: "Create a product listing (supplier dashboard)",
    description: "Suppliers list and price their own products (business model section 1).",
    access: ["supplier"],
    body: S.ProductInput,
    response: { status: 201, description: "Created.", schema: S.Product },
    handler: async ({ user, body }) => {
      if (!user.supplierId) throw forbidden("Your account is not linked to a supplier.", "NO_SUPPLIER");
      await assertCategory(body.categoryId);
      const { wholesaleTiers, image, ...data } = body;
      const product = await prisma.product.create({
        data: {
          ...data,
          imageUrl: image ?? null,
          supplierId: user.supplierId,
          wholesaleTiers: { create: wholesaleTiers },
        },
        include: productInclude,
      });
      return serializeProduct(product);
    },
  });

  api.route({
    method: "patch",
    path: "/products/{productId}",
    tags: ["Catalog"],
    summary: "Update a product listing (supplier dashboard)",
    description: "Only the owning supplier or an admin. `wholesaleTiers`, when sent, replaces all tiers.",
    access: ["supplier", "admin"],
    params: S.ProductParams,
    body: S.UpdateProductInput,
    response: { status: 200, description: "Updated.", schema: S.Product },
    errors: [404],
    handler: async ({ user, params, body }) => {
      await ownedProduct(user, params.productId);
      if (body.categoryId) await assertCategory(body.categoryId);
      const { wholesaleTiers, image, ...data } = body;
      const product = await prisma.product.update({
        where: { id: params.productId },
        data: {
          ...data,
          ...(image !== undefined && { imageUrl: image }),
          ...(wholesaleTiers && { wholesaleTiers: { deleteMany: {}, create: wholesaleTiers } }),
        },
        include: productInclude,
      });
      return serializeProduct(product);
    },
  });
}
