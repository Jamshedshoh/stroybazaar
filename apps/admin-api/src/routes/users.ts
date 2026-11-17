import { prisma, type Prisma } from "@stroybazaar/db";
import { forbidden, notFound, unprocessable, z, type ApiRouter } from "@stroybazaar/server";
import * as S from "../schemas";

function serialize(user: Prisma.UserGetPayload<object>): z.input<typeof S.AdminUser> {
  return {
    id: user.id,
    phone: user.phone,
    name: user.name,
    role: user.role,
    language: user.language,
    supplierId: user.supplierId,
    createdAt: user.createdAt.toISOString(),
  };
}

export function registerUserRoutes(api: ApiRouter) {
  api.route({
    method: "get",
    path: "/users",
    tags: ["Users"],
    summary: "List users",
    access: ["admin"],
    query: S.Page.extend({
      role: S.UserRole.optional(),
      phone: z.string().trim().min(1).optional().openapi({ description: "Phone number prefix or fragment." }),
    }),
    response: { status: 200, description: "OK, newest first.", schema: S.UserPage },
    handler: async ({ query }) => {
      const where: Prisma.UserWhereInput = {
        role: query.role,
        ...(query.phone && { phone: { contains: query.phone } }),
      };
      const [items, total] = await Promise.all([
        prisma.user.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
        }),
        prisma.user.count({ where }),
      ]);
      return { items: items.map(serialize), total, page: query.page, pageSize: query.pageSize };
    },
  });

  api.route({
    method: "patch",
    path: "/users/{userId}",
    tags: ["Users"],
    summary: "Change a user's role or supplier link",
    description:
      "Make a user supplier staff with `{ role: \"supplier\", supplierId }`. Users sign up through `POST /auth/otp/verify` on the public API.",
    access: ["admin"],
    params: S.UserParams,
    body: S.UpdateUserRequest,
    response: { status: 200, description: "Updated.", schema: S.AdminUser },
    errors: [404],
    handler: async ({ user: admin, params, body }) => {
      const user = await prisma.user.findUnique({ where: { id: params.userId } });
      if (!user) throw notFound("User");
      if (user.id === admin.id && body.role && body.role !== "admin") {
        throw forbidden("You cannot remove your own admin role.", "SELF_DEMOTION");
      }

      const role = body.role ?? user.role;
      const supplierId = role === "supplier" ? (body.supplierId ?? user.supplierId) : null;
      if (role === "supplier") {
        if (!supplierId) throw unprocessable("SUPPLIER_REQUIRED", "Supplier staff must be linked to a supplier.");
        const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
        if (!supplier) throw unprocessable("UNKNOWN_SUPPLIER", "Supplier does not exist.");
      }

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { name: body.name, role, supplierId },
      });
      return serialize(updated);
    },
  });
}
