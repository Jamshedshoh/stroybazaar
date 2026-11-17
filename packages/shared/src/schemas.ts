import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type Pagination = z.infer<typeof paginationSchema>;

export const rfqItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
});

export const createRfqSchema = z.object({
  deliveryAddress: z.string().min(1),
  neededBy: z.coerce.date().optional(),
  notes: z.string().optional(),
  items: z.array(rfqItemSchema).min(1),
});
export type CreateRfqInput = z.infer<typeof createRfqSchema>;

export const createSupplierSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(5),
  address: z.string().optional(),
});
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
