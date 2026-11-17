import { z } from "@stroybazaar/server";

// Component names match the original hand-written contract so existing mobile clients keep working.

const DateTime = z.string().openapi({ format: "date-time", example: "2026-11-17T09:30:00.000Z" });
const DateOnly = z.string().openapi({ format: "date", example: "2026-11-25" });
const Money = z.number().openapi({ format: "float", description: "Amount in TJS (Somoni)." });
const Id = (example: string) => z.string().min(1).openapi({ example });

export const Phone = z
  .string()
  .regex(/^\+[1-9]\d{7,14}$/, "Phone must be in E.164 format, e.g. +992925550101")
  .openapi({ example: "+992925550101", description: "E.164 format." });

export const Language = z.enum(["en", "ru", "tj"]).openapi("Language");

export const LocalizedText = z
  .object({ en: z.string(), ru: z.string(), tj: z.string() })
  .openapi("LocalizedText");

export const Category = z
  .object({
    id: z.string().openapi({ example: "cement" }),
    name: LocalizedText,
    icon: z.string().openapi({ example: "layers" }),
  })
  .openapi("Category");

export const Supplier = z
  .object({
    id: Id("sup-1"),
    name: z.string().openapi({ example: "Ghafurov Cement Yard" }),
    verified: z.boolean().openapi({ example: true }),
    rating: z.number().min(0).max(5).openapi({ format: "float", example: 4.8 }),
    reviewCount: z.number().int().openapi({ example: 126 }),
    location: LocalizedText,
    phones: z.array(z.string()).openapi({ example: ["+992 92 555 0101"] }),
    languages: z.array(Language),
    joinedAt: DateOnly,
  })
  .openapi("Supplier");

export const WholesaleTier = z
  .object({
    minQty: z.number().int().min(1).openapi({ example: 100, description: "Minimum quantity to unlock this tier." }),
    pricePerUnit: Money.positive().openapi({ example: 72 }),
  })
  .openapi("WholesaleTier");

export const Product = z
  .object({
    id: Id("p-1"),
    name: LocalizedText,
    categoryId: z.string().openapi({ example: "cement" }),
    supplierId: Id("sup-1"),
    price: Money.openapi({ example: 78, description: "Retail price per unit." }),
    unit: LocalizedText,
    image: z
      .string()
      .nullable()
      .openapi({ format: "uri", description: "May be null in the MVP (placeholder icon is rendered client-side)." }),
    stock: z.number().int().openapi({ example: 2400 }),
    attributes: LocalizedText,
    wholesaleTiers: z.array(WholesaleTier),
  })
  .openapi("Product");

export const ProductInput = z
  .object({
    categoryId: z.string().min(1).openapi({ example: "cement" }),
    name: LocalizedText,
    unit: LocalizedText,
    attributes: LocalizedText,
    price: Money.positive().openapi({ example: 78 }),
    stock: z.number().int().min(0).openapi({ example: 2400 }),
    image: z.url().nullable().optional(),
    wholesaleTiers: z
      .array(WholesaleTier)
      .default([])
      .refine((tiers) => new Set(tiers.map((t) => t.minQty)).size === tiers.length, "Duplicate minQty in wholesaleTiers"),
  })
  .openapi("CreateProductRequest");

export const UpdateProductInput = ProductInput.partial()
  .extend({ active: z.boolean().optional().openapi({ description: "Hide the product from the catalog." }) })
  .openapi("UpdateProductRequest");

export const RFQItem = z
  .object({
    productId: Id("p-1"),
    productName: LocalizedText,
    unit: LocalizedText,
    quantity: z.number().openapi({ format: "float", example: 500 }),
  })
  .openapi("RFQItem");

export const Quote = z
  .object({
    id: Id("q-1"),
    supplierId: Id("sup-1"),
    total: Money.openapi({ example: 34000 }),
    deliveryDays: z.number().int().openapi({ example: 2 }),
    note: LocalizedText,
    createdAt: DateTime,
  })
  .openapi("Quote");

export const RFQStatus = z.enum(["open", "quoted", "awarded"]).openapi("RFQStatus");

export const RFQ = z
  .object({
    id: Id("rfq-1"),
    items: z.array(RFQItem),
    deliveryLocation: z.string().openapi({ example: "Site X, Ghafurov district" }),
    neededBy: DateOnly,
    status: RFQStatus,
    quotes: z.array(Quote),
    createdAt: DateTime,
    awardedQuoteId: z.string().nullable(),
  })
  .openapi("RFQ");

export const CreateRFQRequest = z
  .object({
    items: z
      .array(
        z.object({
          productId: Id("p-1"),
          quantity: z.number().min(1).openapi({ format: "float", example: 500 }),
        }),
      )
      .min(1),
    deliveryLocation: z.string().trim().min(1).openapi({ example: "Site X, Ghafurov district" }),
    neededBy: z.iso.date().openapi({ example: "2026-11-25" }),
  })
  .openapi("CreateRFQRequest");

export const CreateQuoteRequest = z
  .object({
    total: Money.positive().openapi({ example: 34000 }),
    deliveryDays: z.number().int().min(0).openapi({ example: 2 }),
    note: LocalizedText,
  })
  .openapi("CreateQuoteRequest");

export const AwardQuoteRequest = z.object({ quoteId: Id("q-1") }).openapi("AwardQuoteRequest");

export const OrderLine = z
  .object({
    productId: z.string(),
    productName: LocalizedText,
    unit: LocalizedText,
    quantity: z.number().openapi({ format: "float" }),
    unitPrice: Money.openapi({ description: "Server-calculated at order creation." }),
  })
  .openapi("OrderLine");

export const PaymentMethod = z.enum(["cod", "bank_transfer"]).openapi("PaymentMethod");

export const OrderStatus = z
  .enum(["placed", "confirmed", "out_for_delivery", "delivered", "confirmed_receipt"])
  .openapi("OrderStatus", {
    description:
      "Lifecycle: placed -> confirmed -> out_for_delivery -> delivered -> confirmed_receipt. Only the last transition is buyer-initiated.",
  });

export const Order = z
  .object({
    id: Id("A7X2"),
    supplierId: Id("sup-3"),
    lines: z.array(OrderLine),
    total: Money.openapi({ example: 750 }),
    paymentMethod: PaymentMethod,
    status: OrderStatus,
    deliveryAddress: z.string().openapi({ example: "12 Lenin Street, Khujand" }),
    createdAt: DateTime,
    hasReview: z.boolean().openapi({ example: false }),
  })
  .openapi("Order");

export const CreateOrderRequest = z
  .object({
    lines: z
      .array(
        z.object({
          productId: Id("p-7"),
          quantity: z.number().min(1).openapi({ format: "float", example: 60 }),
        }),
      )
      .min(1),
    paymentMethod: PaymentMethod,
    deliveryAddress: z.string().trim().min(1).openapi({ example: "12 Lenin Street, Khujand" }),
  })
  .openapi("CreateOrderRequest");

export const UpdateOrderStatusRequest = z
  .object({ status: OrderStatus })
  .openapi("UpdateOrderStatusRequest");

export const Review = z
  .object({
    id: Id("rev-1"),
    supplierId: Id("sup-1"),
    author: z.string().openapi({ example: "A. Rahimov" }),
    rating: z.number().int().min(1).max(5).openapi({ example: 5 }),
    comment: z.string().openapi({ example: "Delivered on time, good price." }),
    createdAt: DateTime,
  })
  .openapi("Review");

export const SubmitReviewRequest = z
  .object({
    supplierId: z.string().min(1),
    orderId: z.string().nullable().optional().openapi({
      description: "If provided, links the review to an order and enforces one review per order.",
    }),
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().min(1),
  })
  .openapi("SubmitReviewRequest");

export const User = z
  .object({
    id: z.string(),
    phone: Phone,
    role: z.enum(["buyer", "supplier", "admin"]),
    name: z.string().nullable(),
    language: Language,
    supplierId: z.string().nullable().openapi({ description: "Set for supplier staff accounts." }),
  })
  .openapi("User");

export const UpdateMeRequest = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    language: Language.optional(),
  })
  .openapi("UpdateMeRequest");

export const AuthToken = z
  .object({
    token: z.string().openapi({ description: "JWT" }),
    tokenType: z.literal("Bearer"),
    expiresAt: DateTime,
    user: User,
  })
  .openapi("AuthToken");

export const OtpRequest = z.object({ phone: Phone }).openapi("OtpRequest");

export const OtpRequestResult = z
  .object({
    sent: z.boolean().openapi({ example: true }),
    expiresIn: z.number().int().openapi({ example: 300, description: "Seconds" }),
  })
  .openapi("OtpRequestResult");

export const OtpVerify = z
  .object({
    phone: Phone,
    code: z.string().regex(/^\d{6}$/).openapi({ example: "123456" }),
  })
  .openapi("OtpVerifyRequest");

// Path and query parameters

export const ProductParams = z.object({ productId: Id("p-1") });
export const SupplierParams = z.object({ supplierId: Id("sup-1") });
export const RfqParams = z.object({ rfqId: Id("rfq-1") });
export const OrderParams = z.object({ orderId: Id("A7X2") });

export const LanguageHeader = z.object({
  "accept-language": z
    .string()
    .optional()
    .openapi({ description: "Preferred language for platform-provided strings (en, ru, tj).", example: "ru" }),
});

export type LocalizedTextValue = z.infer<typeof LocalizedText>;
