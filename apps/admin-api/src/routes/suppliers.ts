import { prisma, SupplierStatus } from "@stroybazaar/db";
import { createSupplierSchema, paginationSchema } from "@stroybazaar/shared";
import { Router } from "express";
import { z } from "zod";

export const supplierRouter = Router();

supplierRouter.get("/", async (req, res) => {
  const { page, pageSize } = paginationSchema.parse(req.query);
  const [items, total] = await Promise.all([
    prisma.supplier.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.supplier.count(),
  ]);
  res.json({ items, total, page, pageSize });
});

supplierRouter.post("/", async (req, res) => {
  const data = createSupplierSchema.parse(req.body);
  const supplier = await prisma.supplier.create({ data });
  res.status(201).json(supplier);
});

const statusSchema = z.object({ status: z.enum(SupplierStatus) });

supplierRouter.patch("/:id/status", async (req, res) => {
  const { status } = statusSchema.parse(req.body);
  const supplier = await prisma.supplier.update({
    where: { id: req.params.id },
    data: { status },
  });
  res.json(supplier);
});
