import { prisma } from "@stroybazaar/db";
import { createRfqSchema } from "@stroybazaar/shared";
import { Router, type Request } from "express";

export const rfqRouter = Router();

// TODO: replace with the authenticated user once SMS OTP login exists.
function currentUserId(req: Request) {
  return req.header("x-user-id");
}

rfqRouter.post("/", async (req, res) => {
  const buyerId = currentUserId(req);
  if (!buyerId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { items, ...rfq } = createRfqSchema.parse(req.body);
  const created = await prisma.rfq.create({
    data: { ...rfq, buyerId, items: { create: items } },
    include: { items: true },
  });
  res.status(201).json(created);
});

rfqRouter.get("/:id", async (req, res) => {
  const rfq = await prisma.rfq.findUnique({
    where: { id: req.params.id },
    include: { items: true, quotes: { include: { supplier: { select: { id: true, name: true } } } } },
  });
  if (!rfq) {
    res.status(404).json({ error: "NotFound" });
    return;
  }
  res.json(rfq);
});
