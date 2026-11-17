import { prisma } from "@stroybazaar/db";
import { paginationSchema } from "@stroybazaar/shared";
import { Router } from "express";

export const catalogRouter = Router();

catalogRouter.get("/categories", async (_req, res) => {
  const categories = await prisma.category.findMany({ orderBy: { slug: "asc" } });
  res.json(categories);
});

catalogRouter.get("/products", async (req, res) => {
  const { page, pageSize } = paginationSchema.parse(req.query);
  const categoryId = typeof req.query.categoryId === "string" ? req.query.categoryId : undefined;
  const where = {
    inStock: true,
    categoryId,
    supplier: { status: "VERIFIED" as const },
  };
  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { supplier: { select: { id: true, name: true } } },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.count({ where }),
  ]);
  res.json({ items, total, page, pageSize });
});

catalogRouter.get("/products/:id", async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { supplier: { select: { id: true, name: true } }, category: true },
  });
  if (!product) {
    res.status(404).json({ error: "NotFound" });
    return;
  }
  res.json(product);
});
