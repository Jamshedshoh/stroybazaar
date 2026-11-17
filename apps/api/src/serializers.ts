import type { Prisma } from "@stroybazaar/db";
import type { z } from "@stroybazaar/server";
import type * as S from "./schemas";

type Out<T extends z.ZodType> = z.input<T>;
type Localized = z.input<typeof S.LocalizedText>;

const text = (value: Prisma.JsonValue) => value as Localized;
const num = (value: Prisma.Decimal | number) => Number(value);
const dateOnly = (value: Date) => value.toISOString().slice(0, 10);

export const productInclude = {
  wholesaleTiers: { orderBy: { minQty: "asc" } },
} satisfies Prisma.ProductInclude;

export function serializeProduct(
  product: Prisma.ProductGetPayload<{ include: typeof productInclude }>,
): Out<typeof S.Product> {
  return {
    id: product.id,
    name: text(product.name),
    categoryId: product.categoryId,
    supplierId: product.supplierId,
    price: num(product.price),
    unit: text(product.unit),
    image: product.imageUrl,
    stock: product.stock,
    attributes: text(product.attributes),
    wholesaleTiers: product.wholesaleTiers.map((tier) => ({
      minQty: tier.minQty,
      pricePerUnit: num(tier.pricePerUnit),
    })),
  };
}

export function serializeCategory(category: Prisma.CategoryGetPayload<object>): Out<typeof S.Category> {
  return { id: category.id, name: text(category.name), icon: category.icon };
}

export function serializeSupplier(supplier: Prisma.SupplierGetPayload<object>): Out<typeof S.Supplier> {
  return {
    id: supplier.id,
    name: supplier.name,
    verified: supplier.status === "verified",
    rating: Math.round(supplier.rating * 10) / 10,
    reviewCount: supplier.reviewCount,
    location: text(supplier.location),
    phones: supplier.phones,
    languages: supplier.languages,
    joinedAt: dateOnly(supplier.createdAt),
  };
}

export function serializeQuote(quote: Prisma.QuoteGetPayload<object>): Out<typeof S.Quote> {
  return {
    id: quote.id,
    supplierId: quote.supplierId,
    total: num(quote.total),
    deliveryDays: quote.deliveryDays,
    note: text(quote.note),
    createdAt: quote.createdAt.toISOString(),
  };
}

export const rfqInclude = {
  items: { include: { product: true } },
  quotes: { orderBy: { total: "asc" } },
} satisfies Prisma.RfqInclude;

export type RfqWithRelations = Prisma.RfqGetPayload<{ include: typeof rfqInclude }>;

export function serializeRfq(rfq: RfqWithRelations, quotes = rfq.quotes): Out<typeof S.RFQ> {
  return {
    id: rfq.id,
    items: rfq.items.map((item) => ({
      productId: item.productId,
      productName: text(item.product.name),
      unit: text(item.product.unit),
      quantity: num(item.quantity),
    })),
    deliveryLocation: rfq.deliveryLocation,
    neededBy: dateOnly(rfq.neededBy),
    status: rfq.status,
    quotes: quotes.map(serializeQuote),
    createdAt: rfq.createdAt.toISOString(),
    awardedQuoteId: rfq.awardedQuoteId,
  };
}

export const orderInclude = {
  lines: { include: { product: true } },
  review: { select: { id: true } },
} satisfies Prisma.OrderInclude;

export function serializeOrder(
  order: Prisma.OrderGetPayload<{ include: typeof orderInclude }>,
): Out<typeof S.Order> {
  return {
    id: order.id,
    supplierId: order.supplierId,
    lines: order.lines.map((line) => ({
      productId: line.productId,
      productName: text(line.product.name),
      unit: text(line.product.unit),
      quantity: num(line.quantity),
      unitPrice: num(line.unitPrice),
    })),
    total: num(order.total),
    paymentMethod: order.paymentMethod,
    status: order.status,
    deliveryAddress: order.deliveryAddress,
    createdAt: order.createdAt.toISOString(),
    hasReview: order.review !== null,
  };
}

export const reviewInclude = {
  author: { select: { name: true, phone: true } },
} satisfies Prisma.ReviewInclude;

export function serializeReview(
  review: Prisma.ReviewGetPayload<{ include: typeof reviewInclude }>,
): Out<typeof S.Review> {
  return {
    id: review.id,
    supplierId: review.supplierId,
    author: review.author.name ?? maskPhone(review.author.phone),
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
  };
}

export function serializeUser(user: {
  id: string;
  phone: string;
  name: string | null;
  role: "buyer" | "supplier" | "admin";
  language: "en" | "ru" | "tj";
  supplierId: string | null;
}): Out<typeof S.User> {
  return {
    id: user.id,
    phone: user.phone,
    role: user.role,
    name: user.name,
    language: user.language,
    supplierId: user.supplierId,
  };
}

/** "+992925550101" -> "+992 ••• 0101" so reviews never expose a buyer's number. */
function maskPhone(phone: string) {
  return `${phone.slice(0, 4)} ••• ${phone.slice(-4)}`;
}
