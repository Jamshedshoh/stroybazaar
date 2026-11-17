import { prisma, Prisma } from "@stroybazaar/db";
import { conflict, notFound, z, type ApiRouter } from "@stroybazaar/server";
import * as S from "../schemas";

function serialize(category: Prisma.CategoryGetPayload<object>): z.input<typeof S.Category> {
  return {
    id: category.id,
    name: category.name as z.input<typeof S.LocalizedText>,
    icon: category.icon,
    sortOrder: category.sortOrder,
  };
}

export function registerCatalogRoutes(api: ApiRouter) {
  api.route({
    method: "get",
    path: "/categories",
    tags: ["Catalog"],
    summary: "List categories",
    access: ["admin"],
    response: { status: 200, description: "OK.", schema: z.array(S.Category) },
    handler: async () => {
      const categories = await prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
      return categories.map(serialize);
    },
  });

  api.route({
    method: "post",
    path: "/categories",
    tags: ["Catalog"],
    summary: "Create a category",
    description: "Categories are platform-owned and translated in all three languages (business model section 7).",
    access: ["admin"],
    body: S.CreateCategoryRequest,
    response: { status: 201, description: "Created.", schema: S.Category },
    errors: [409],
    handler: async ({ body }) => {
      try {
        return serialize(await prisma.category.create({ data: body }));
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          throw conflict("CATEGORY_EXISTS", `Category "${body.id}" already exists.`);
        }
        throw error;
      }
    },
  });

  api.route({
    method: "patch",
    path: "/categories/{categoryId}",
    tags: ["Catalog"],
    summary: "Update a category",
    access: ["admin"],
    params: S.CategoryParams,
    body: S.UpdateCategoryRequest,
    response: { status: 200, description: "Updated.", schema: S.Category },
    errors: [404],
    handler: async ({ params, body }) => {
      const existing = await prisma.category.findUnique({ where: { id: params.categoryId } });
      if (!existing) throw notFound("Category");
      return serialize(await prisma.category.update({ where: { id: params.categoryId }, data: body }));
    },
  });
}
