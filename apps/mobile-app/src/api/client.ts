import {
  categories,
  products,
  reviews as seedReviews,
  seedOrders,
  seedRFQs,
  suppliers,
} from '@/data/mockData';
import type {
  Category,
  Order,
  OrderLine,
  PaymentMethod,
  Product,
  RFQ,
  RFQItem,
  Review,
  Supplier,
} from '@/types';

// `rfqs as unusedRfqs` above keeps imports tolerant if the seed file changes;
// the working copies live here so mutations survive navigation.
let rfqs: RFQ[] = [...seedRFQs];
let orders: Order[] = [...seedOrders];
let reviewList: Review[] = [...seedReviews];

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

const todayPlus = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

export async function fetchCategories(): Promise<Category[]> {
  await delay(100);
  return categories;
}

export async function fetchProducts(categoryId?: string): Promise<Product[]> {
  await delay();
  return categoryId ? products.filter((p) => p.categoryId === categoryId) : products;
}

export async function fetchProduct(id: string): Promise<Product | undefined> {
  await delay(150);
  return products.find((p) => p.id === id);
}

export async function fetchSuppliers(): Promise<Supplier[]> {
  await delay();
  return suppliers;
}

export async function fetchSupplier(id: string): Promise<Supplier | undefined> {
  await delay(150);
  return suppliers.find((s) => s.id === id);
}

export async function fetchReviews(supplierId: string): Promise<Review[]> {
  await delay(150);
  return reviewList.filter((r) => r.supplierId === supplierId);
}

export async function fetchRFQs(): Promise<RFQ[]> {
  await delay();
  return [...rfqs];
}

export async function fetchRFQ(id: string): Promise<RFQ | undefined> {
  await delay(150);
  return rfqs.find((r) => r.id === id);
}

export interface CreateRFQInput {
  items: RFQItem[];
  deliveryLocation: string;
  neededBy: string;
}

export async function createRFQ(input: CreateRFQInput): Promise<RFQ> {
  await delay(400);
  const rfq: RFQ = {
    id: `rfq-${Date.now().toString(36)}`,
    items: input.items,
    deliveryLocation: input.deliveryLocation,
    neededBy: input.neededBy,
    status: 'open',
    quotes: [],
    createdAt: new Date().toISOString(),
  };
  rfqs = [rfq, ...rfqs];
  return rfq;
}

/** Demo helper: simulates quotes arriving from suppliers. Replace with real pushes later. */
export async function simulateSupplierQuotes(rfqId: string): Promise<RFQ | undefined> {
  await delay(600);
  const rfq = rfqs.find((r) => r.id === rfqId);
  if (!rfq || rfq.quotes.length > 0) return rfq;

  const bidders = suppliers.filter((s) => s.verified).slice(0, 2);
  rfq.quotes = bidders.map((supplier, index) => {
    const total = rfq.items.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId);
      const tier = [...(product?.wholesaleTiers ?? [])]
        .sort((a, b) => b.minQty - a.minQty)
        .find((t) => item.quantity >= t.minQty);
      return sum + (tier?.pricePerUnit ?? product?.price ?? 0) * item.quantity;
    }, 0);
    return {
      id: `q-${Date.now()}-${index}`,
      supplierId: supplier.id,
      total: Math.round(total * (index === 0 ? 1 : 1.04)),
      deliveryDays: index === 0 ? 3 : 2,
      note: {
        en: 'All items in stock. Price includes delivery to site.',
        ru: 'Все позиции в наличии. Цена включает доставку на объект.',
        tj: 'Ҳама номгӯйҳо мавҷуданд. Нарх расониданро дар бар мегирад.',
      },
      createdAt: new Date().toISOString(),
    };
  });
  rfq.status = 'quoted';
  return rfq;
}

export async function awardQuote(rfqId: string, quoteId: string): Promise<RFQ | undefined> {
  await delay(300);
  const rfq = rfqs.find((r) => r.id === rfqId);
  if (!rfq) return undefined;
  rfq.status = 'awarded';
  rfq.awardedQuoteId = quoteId;
  return rfq;
}

export async function fetchOrders(): Promise<Order[]> {
  await delay();
  return [...orders];
}

export interface CreateOrderInput {
  lines: OrderLine[];
  total: number;
  paymentMethod: PaymentMethod;
  deliveryAddress: string;
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  await delay(400);
  const product = products.find((p) => p.id === input.lines[0]?.productId);
  const order: Order = {
    id: Math.random().toString(36).slice(2, 6).toUpperCase(),
    supplierId: product?.supplierId ?? 'sup-1',
    lines: input.lines,
    total: input.total,
    paymentMethod: input.paymentMethod,
    status: 'placed',
    deliveryAddress: input.deliveryAddress,
    createdAt: new Date().toISOString(),
    hasReview: false,
  };
  orders = [order, ...orders];
  return order;
}

export async function advanceOrderStatus(orderId: string): Promise<Order | undefined> {
  await delay(300);
  const order = orders.find((o) => o.id === orderId);
  if (!order) return undefined;
  const flow: Order['status'][] = ['placed', 'confirmed', 'out_for_delivery', 'delivered'];
  const idx = flow.indexOf(order.status);
  if (idx >= 0 && idx < flow.length - 1) order.status = flow[idx + 1];
  return order;
}

export async function confirmReceipt(orderId: string): Promise<Order | undefined> {
  await delay(300);
  const order = orders.find((o) => o.id === orderId);
  if (!order) return undefined;
  order.status = 'confirmed_receipt';
  return order;
}

export interface SubmitReviewInput {
  supplierId: string;
  rating: number;
  comment: string;
  orderId?: string;
}

export async function submitReview(input: SubmitReviewInput): Promise<Review> {
  await delay(350);
  const review: Review = {
    id: `rev-${Date.now().toString(36)}`,
    supplierId: input.supplierId,
    author: 'You',
    rating: input.rating,
    comment: input.comment,
    createdAt: new Date().toISOString(),
  };
  reviewList = [review, ...reviewList];
  if (input.orderId) {
    const order = orders.find((o) => o.id === input.orderId);
    if (order) order.hasReview = true;
  }
  return review;
}

export const demoHelpers = { daysAgo, todayPlus };
