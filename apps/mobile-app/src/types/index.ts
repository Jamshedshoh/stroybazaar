export type Language = 'en' | 'ru' | 'tj';

export type LocalizedText = Record<Language, string>;

export type CategoryId =
  | 'cement'
  | 'rebar'
  | 'bricks'
  | 'tiles'
  | 'paint'
  | 'plumbing'
  | 'electrical'
  | 'timber'
  | 'tools';

export interface Category {
  id: CategoryId;
  name: LocalizedText;
  icon: string;
}

export interface Supplier {
  id: string;
  name: string;
  verified: boolean;
  rating: number;
  reviewCount: number;
  location: LocalizedText;
  phones: string[];
  languages: Language[];
  joinedAt: string;
}

export interface WholesaleTier {
  minQty: number;
  pricePerUnit: number;
}

export interface Product {
  id: string;
  name: LocalizedText;
  categoryId: CategoryId;
  supplierId: string;
  price: number;
  unit: LocalizedText;
  image: string;
  stock: number;
  attributes: LocalizedText;
  wholesaleTiers: WholesaleTier[];
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export type PaymentMethod = 'cod' | 'bank_transfer';
export type OrderStatus = 'placed' | 'confirmed' | 'out_for_delivery' | 'delivered' | 'confirmed_receipt';

export interface OrderLine {
  productId: string;
  productName: LocalizedText;
  unit: LocalizedText;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  supplierId: string;
  lines: OrderLine[];
  total: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  deliveryAddress: string;
  createdAt: string;
  hasReview: boolean;
}

export interface RFQItem {
  productId: string;
  productName: LocalizedText;
  unit: LocalizedText;
  quantity: number;
}

export type RFQStatus = 'open' | 'quoted' | 'awarded';

export interface Quote {
  id: string;
  supplierId: string;
  total: number;
  deliveryDays: number;
  note: LocalizedText;
  createdAt: string;
}

export interface RFQ {
  id: string;
  items: RFQItem[];
  deliveryLocation: string;
  neededBy: string;
  status: RFQStatus;
  quotes: Quote[];
  createdAt: string;
  awardedQuoteId?: string;
}

export interface Review {
  id: string;
  supplierId: string;
  author: string;
  rating: number;
  comment: string;
  createdAt: string;
}
