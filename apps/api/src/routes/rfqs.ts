import { prisma, Prisma, type RfqStatus } from "@stroybazaar/db";
import {
  ApiError,
  conflict,
  forbidden,
  notFound,
  unprocessable,
  z,
  type ApiRouter,
  type AuthUser,
} from "@stroybazaar/server";
import { roundMoney, unitPriceFor } from "../pricing";
import * as S from "../schemas";
import { rfqInclude, serializeQuote, serializeRfq, type RfqWithRelations } from "../serializers";

const OPEN_STATUSES: RfqStatus[] = ["open", "quoted"];

/**
 * Loads an RFQ the user may see, with the quotes they may see:
 * buyers see their own RFQs with every quote, suppliers see open RFQs (or ones they quoted on)
 * with only their own quote, admins see everything. Anything else is reported as not found.
 */
async function visibleRfq(user: AuthUser, rfqId: string) {
  const rfq = await prisma.rfq.findUnique({ where: { id: rfqId }, include: rfqInclude });
  if (!rfq) throw notFound("RFQ");
  if (user.role === "admin") return { rfq, quotes: rfq.quotes };
  if (user.role === "buyer") {
    if (rfq.buyerId !== user.id) throw notFound("RFQ");
    return { rfq, quotes: rfq.quotes };
  }
  const ownQuotes = rfq.quotes.filter((quote) => quote.supplierId === user.supplierId);
  if (!user.supplierId || (!OPEN_STATUSES.includes(rfq.status) && ownQuotes.length === 0)) {
    throw notFound("RFQ");
  }
  return { rfq, quotes: ownQuotes };
}

async function ownRfq(user: AuthUser, rfqId: string): Promise<RfqWithRelations> {
  const rfq = await prisma.rfq.findUnique({ where: { id: rfqId }, include: rfqInclude });
  if (!rfq || rfq.buyerId !== user.id) throw notFound("RFQ");
  return rfq;
}

async function verifiedSupplierId(user: AuthUser) {
  if (!user.supplierId) throw forbidden("Your account is not linked to a supplier.", "NO_SUPPLIER");
  const supplier = await prisma.supplier.findUniqueOrThrow({ where: { id: user.supplierId } });
  if (supplier.status !== "verified") {
    throw forbidden("Only verified suppliers can submit quotes.", "SUPPLIER_NOT_VERIFIED");
  }
  return supplier.id;
}

const todayUtc = () => new Date().toISOString().slice(0, 10);

export function registerRfqRoutes(api: ApiRouter, options: { demoEndpoints: boolean }) {
  api.route({
    method: "get",
    path: "/rfqs",
    tags: ["RFQ"],
    summary: "List RFQs",
    description:
      "Buyers get their own RFQs with all quotes. Suppliers get RFQs they can quote on (`open` and `quoted` by default) with only their own quote. Admins get all RFQs.",
    access: "authenticated",
    query: z.object({ status: S.RFQStatus.optional() }),
    response: { status: 200, description: "OK, newest first.", schema: z.array(S.RFQ) },
    handler: async ({ user, query }) => {
      const statusFilter = query.status ? { status: query.status } : undefined;
      let where: Prisma.RfqWhereInput;
      if (user.role === "buyer") {
        where = { buyerId: user.id, ...statusFilter };
      } else if (user.role === "supplier") {
        if (!user.supplierId) return [];
        where =
          query.status === "awarded"
            ? { status: "awarded", quotes: { some: { supplierId: user.supplierId } } }
            : { status: query.status ?? { in: OPEN_STATUSES } };
      } else {
        where = { ...statusFilter };
      }

      const rfqs = await prisma.rfq.findMany({ where, include: rfqInclude, orderBy: { createdAt: "desc" } });
      return rfqs.map((rfq) =>
        serializeRfq(
          rfq,
          user.role === "supplier" ? rfq.quotes.filter((q) => q.supplierId === user.supplierId) : rfq.quotes,
        ),
      );
    },
  });

  api.route({
    method: "post",
    path: "/rfqs",
    tags: ["RFQ"],
    summary: "Post a wholesale materials request",
    description:
      "The contractor posts a materials list and suppliers reply with quotes. This is the key differentiator in business model section 2.",
    access: ["buyer"],
    body: S.CreateRFQRequest,
    response: { status: 201, description: "Created, status `open`.", schema: S.RFQ },
    handler: async ({ user, body }) => {
      if (body.neededBy < todayUtc()) {
        throw unprocessable("NEEDED_BY_IN_PAST", "neededBy must be today or later.");
      }
      const productIds = [...new Set(body.items.map((item) => item.productId))];
      const found = await prisma.product.findMany({
        where: { id: { in: productIds }, active: true },
        select: { id: true },
      });
      const missing = productIds.filter((id) => !found.some((product) => product.id === id));
      if (missing.length) {
        throw unprocessable("UNKNOWN_PRODUCT", "Some products do not exist.", { productIds: missing });
      }

      const rfq = await prisma.rfq.create({
        data: {
          buyerId: user.id,
          deliveryLocation: body.deliveryLocation,
          neededBy: new Date(body.neededBy),
          items: { create: body.items },
        },
        include: rfqInclude,
      });
      return serializeRfq(rfq);
    },
  });

  api.route({
    method: "get",
    path: "/rfqs/{rfqId}",
    tags: ["RFQ"],
    summary: "Get an RFQ with its quotes",
    description: "Buyers see every quote on their RFQ; suppliers see only their own quote.",
    access: "authenticated",
    params: S.RfqParams,
    response: { status: 200, description: "OK.", schema: S.RFQ },
    errors: [404],
    handler: async ({ user, params }) => {
      const { rfq, quotes } = await visibleRfq(user, params.rfqId);
      return serializeRfq(rfq, quotes);
    },
  });

  api.route({
    method: "get",
    path: "/rfqs/{rfqId}/quotes",
    tags: ["RFQ"],
    summary: "List quotes for an RFQ",
    access: "authenticated",
    params: S.RfqParams,
    response: { status: 200, description: "OK, cheapest first.", schema: z.array(S.Quote) },
    errors: [404],
    handler: async ({ user, params }) => {
      const { quotes } = await visibleRfq(user, params.rfqId);
      return quotes.map(serializeQuote);
    },
  });

  api.route({
    method: "post",
    path: "/rfqs/{rfqId}/quotes",
    tags: ["RFQ"],
    summary: "Submit a quote (supplier role)",
    description:
      "Called by the supplier dashboard, not by the buyer app. Only verified suppliers can quote, once per RFQ. The RFQ status becomes `quoted`.",
    access: ["supplier"],
    params: S.RfqParams,
    body: S.CreateQuoteRequest,
    response: { status: 201, description: "Quote created.", schema: S.Quote },
    errors: [404, 409],
    handler: async ({ user, params, body }) => {
      const supplierId = await verifiedSupplierId(user);
      const rfq = await prisma.rfq.findUnique({ where: { id: params.rfqId } });
      if (!rfq) throw notFound("RFQ");
      if (rfq.status === "awarded") throw conflict("RFQ_CLOSED", "This RFQ has already been awarded.");

      try {
        const [quote] = await prisma.$transaction([
          prisma.quote.create({ data: { ...body, rfqId: rfq.id, supplierId } }),
          prisma.rfq.updateMany({ where: { id: rfq.id, status: "open" }, data: { status: "quoted" } }),
        ]);
        return serializeQuote(quote);
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          throw conflict("QUOTE_ALREADY_SUBMITTED", "You have already quoted on this RFQ.");
        }
        throw error;
      }
    },
  });

  api.route({
    method: "post",
    path: "/rfqs/{rfqId}/award",
    tags: ["RFQ"],
    summary: "Accept a quote",
    description: "Buyer-only. Sets status to `awarded` and records `awardedQuoteId`.",
    access: ["buyer"],
    params: S.RfqParams,
    body: S.AwardQuoteRequest,
    response: { status: 200, description: "Awarded RFQ.", schema: S.RFQ },
    errors: [404, 409],
    handler: async ({ user, params, body }) => {
      const rfq = await ownRfq(user, params.rfqId);
      if (rfq.status === "awarded") throw conflict("RFQ_ALREADY_AWARDED", "This RFQ has already been awarded.");
      if (!rfq.quotes.some((quote) => quote.id === body.quoteId)) throw notFound("Quote");

      const updated = await prisma.rfq.updateMany({
        where: { id: rfq.id, status: { not: "awarded" } },
        data: { status: "awarded", awardedQuoteId: body.quoteId },
      });
      if (updated.count === 0) throw conflict("RFQ_ALREADY_AWARDED", "This RFQ has already been awarded.");

      return serializeRfq(await ownRfq(user, rfq.id));
    },
  });

  if (!options.demoEndpoints) return;

  api.route({
    method: "post",
    path: "/rfqs/{rfqId}/quotes/simulate",
    tags: ["Demo"],
    summary: "Generate demo supplier quotes",
    deprecated: true,
    description:
      "DEMO ONLY, mirrors `simulateSupplierQuotes` in the mobile mock client. Disabled when `NODE_ENV=production` or `DEMO_ENDPOINTS=false`. Real quotes arrive via `POST /rfqs/{rfqId}/quotes`.",
    access: ["buyer"],
    params: S.RfqParams,
    response: { status: 200, description: "RFQ with generated quotes.", schema: S.RFQ },
    errors: [404, 409],
    handler: async ({ user, params }) => {
      const rfq = await ownRfq(user, params.rfqId);
      if (rfq.status === "awarded") throw conflict("RFQ_CLOSED", "This RFQ has already been awarded.");

      const suppliers = await prisma.supplier.findMany({
        where: { status: "verified", quotes: { none: { rfqId: rfq.id } } },
        take: 3,
      });
      if (suppliers.length === 0) {
        throw new ApiError(409, "NO_SUPPLIERS_AVAILABLE", "No verified suppliers left to quote.");
      }

      const products = await prisma.product.findMany({
        where: { id: { in: rfq.items.map((item) => item.productId) } },
        include: { wholesaleTiers: true },
      });
      const catalogTotal = rfq.items.reduce((sum, item) => {
        const product = products.find((p) => p.id === item.productId);
        return product ? sum.plus(unitPriceFor(product, Number(item.quantity)).times(item.quantity)) : sum;
      }, new Prisma.Decimal(0));

      await prisma.$transaction([
        ...suppliers.map((supplier, index) =>
          prisma.quote.create({
            data: {
              rfqId: rfq.id,
              supplierId: supplier.id,
              total: roundMoney(catalogTotal.times(0.92 + index * 0.05)),
              deliveryDays: 1 + index,
              note: {
                en: "Demo quote, price includes delivery.",
                ru: "Демо-предложение, цена с доставкой.",
                tj: "Пешниҳоди намоишӣ, нарх бо интиқол.",
              },
            },
          }),
        ),
        prisma.rfq.update({ where: { id: rfq.id }, data: { status: "quoted" } }),
      ]);

      return serializeRfq(await ownRfq(user, rfq.id));
    },
  });
}
