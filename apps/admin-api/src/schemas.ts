import { z } from "@stroybazaar/server";

const DateTime = z.string().openapi({ format: "date-time" });
const Money = z.number().openapi({ format: "float", description: "Amount in TJS (Somoni)." });

export const Language = z.enum(["en", "ru", "tj"]).openapi("Language");
export const LocalizedText = z
  .object({ en: z.string(), ru: z.string(), tj: z.string() })
  .openapi("LocalizedText");

export const SupplierStatus = z.enum(["pending", "verified", "suspended"]).openapi("SupplierStatus");
export const UserRole = z.enum(["buyer", "supplier", "admin"]).openapi("UserRole");
export const OrderStatus = z
  .enum(["placed", "confirmed", "out_for_delivery", "delivered", "confirmed_receipt"])
  .openapi("OrderStatus");

export const Page = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const paginated = <T extends z.ZodType>(item: T, name: string) =>
  z
    .object({
      items: z.array(item),
      total: z.number().int(),
      page: z.number().int(),
      pageSize: z.number().int(),
    })
    .openapi(name);

export const AdminSupplier = z
  .object({
    id: z.string(),
    name: z.string(),
    status: SupplierStatus,
    rating: z.number(),
    reviewCount: z.number().int(),
    location: LocalizedText,
    phones: z.array(z.string()),
    languages: z.array(Language),
    productCount: z.number().int(),
    createdAt: DateTime,
  })
  .openapi("AdminSupplier");
export const SupplierPage = paginated(AdminSupplier, "SupplierPage");

export const CreateSupplierRequest = z
  .object({
    name: z.string().trim().min(1),
    location: LocalizedText,
    phones: z.array(z.string().min(5)).min(1),
    languages: z.array(Language).min(1),
  })
  .openapi("CreateSupplierRequest");

export const UpdateSupplierRequest = CreateSupplierRequest.partial().openapi("UpdateSupplierRequest");

export const UpdateSupplierStatusRequest = z
  .object({
    status: SupplierStatus,
  })
  .openapi("UpdateSupplierStatusRequest", {
    description: "`verified` after license check, shop visit and sample orders (business model section 8).",
  });

export const Category = z
  .object({
    id: z.string().openapi({ example: "cement" }),
    name: LocalizedText,
    icon: z.string().openapi({ example: "layers" }),
    sortOrder: z.number().int(),
  })
  .openapi("AdminCategory");

export const CreateCategoryRequest = z
  .object({
    id: z
      .string()
      .regex(/^[a-z0-9-]+$/, "Use lowercase letters, digits and dashes")
      .openapi({ example: "insulation" }),
    name: LocalizedText,
    icon: z.string().min(1),
    sortOrder: z.number().int().default(0),
  })
  .openapi("CreateCategoryRequest");

export const UpdateCategoryRequest = CreateCategoryRequest.omit({ id: true })
  .partial()
  .openapi("UpdateCategoryRequest");

export const AdminUser = z
  .object({
    id: z.string(),
    phone: z.string(),
    name: z.string().nullable(),
    role: UserRole,
    language: Language,
    supplierId: z.string().nullable(),
    createdAt: DateTime,
  })
  .openapi("AdminUser");
export const UserPage = paginated(AdminUser, "UserPage");

export const UpdateUserRequest = z
  .object({
    name: z.string().trim().min(1).nullable(),
    role: UserRole,
    supplierId: z.string().nullable().openapi({ description: "Required when role is `supplier`." }),
  })
  .partial()
  .openapi("UpdateUserRequest");

export const AdminOrder = z
  .object({
    id: z.string(),
    buyerId: z.string(),
    buyerPhone: z.string(),
    supplierId: z.string(),
    supplierName: z.string(),
    total: Money,
    paymentMethod: z.enum(["cod", "bank_transfer"]),
    status: OrderStatus,
    deliveryAddress: z.string(),
    lineCount: z.number().int(),
    commission: Money.nullable(),
    createdAt: DateTime,
    receiptConfirmedAt: DateTime.nullable(),
  })
  .openapi("AdminOrder");
export const OrderPage = paginated(AdminOrder, "OrderPage");

export const Commission = z
  .object({
    id: z.string(),
    orderId: z.string(),
    supplierId: z.string(),
    supplierName: z.string(),
    orderTotal: Money,
    rate: z.number(),
    amount: Money,
    createdAt: DateTime,
  })
  .openapi("Commission");

export const CommissionReport = z
  .object({
    items: z.array(Commission),
    totalAmount: Money,
    count: z.number().int(),
  })
  .openapi("CommissionReport");

export const Stats = z
  .object({
    activeSuppliers: z.number().int().openapi({ description: "Verified suppliers." }),
    pendingSuppliers: z.number().int(),
    rfqsPosted: z.number().int(),
    averageQuoteResponseHours: z
      .number()
      .nullable()
      .openapi({ description: "Mean time from RFQ creation to each quote." }),
    ordersCompleted: z.number().int().openapi({ description: "Orders with receipt confirmed in the app." }),
    confirmedInAppShare: z
      .number()
      .nullable()
      .openapi({ description: "Share of delivered-or-later orders that the buyer confirmed in the app (0-1)." }),
    repeatBuyerRate: z
      .number()
      .nullable()
      .openapi({ description: "Share of buyers with more than one order (0-1)." }),
    commissionTotal: Money,
  })
  .openapi("Stats", { description: "Metrics from business model section 10." });

export const SupplierParams = z.object({ supplierId: z.string().min(1) });
export const CategoryParams = z.object({ categoryId: z.string().min(1) });
export const UserParams = z.object({ userId: z.string().min(1) });
