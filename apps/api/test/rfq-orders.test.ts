import { prisma } from "@stroybazaar/db";
import { beforeEach, describe, expect, it } from "vitest";
import { bearer, http, nextWeek, resetDatabase, seedMarketplace } from "./helpers";

let world: Awaited<ReturnType<typeof seedMarketplace>>;

beforeEach(async () => {
  await resetDatabase();
  world = await seedMarketplace();
});

const note = { en: "Delivery included", ru: "С доставкой", tj: "Бо интиқол" };

async function postRfq(token = world.tokens.buyer) {
  const res = await http()
    .post("/v1/rfqs")
    .set(bearer(token))
    .send({
      items: [{ productId: world.cement.id, quantity: 200 }],
      deliveryLocation: "Site X",
      neededBy: nextWeek(),
    })
    .expect(201);
  return res.body;
}

describe("RFQ flow", () => {
  it("runs from posting to award", async () => {
    const rfq = await postRfq();
    expect(rfq).toMatchObject({ status: "open", quotes: [], awardedQuoteId: null });
    expect(rfq.items[0]).toMatchObject({ productId: world.cement.id, quantity: 200, productName: { en: "Portland cement M400" } });

    const open = await http().get("/v1/rfqs").set(bearer(world.tokens.supplierB)).expect(200);
    expect(open.body.map((r: { id: string }) => r.id)).toEqual([rfq.id]);

    const quoteA = await http()
      .post(`/v1/rfqs/${rfq.id}/quotes`)
      .set(bearer(world.tokens.supplierA))
      .send({ total: 14000, deliveryDays: 2, note })
      .expect(201);
    await http()
      .post(`/v1/rfqs/${rfq.id}/quotes`)
      .set(bearer(world.tokens.supplierB))
      .send({ total: 15000, deliveryDays: 1, note })
      .expect(201);

    // Suppliers only ever see their own quote.
    const asB = await http().get(`/v1/rfqs/${rfq.id}/quotes`).set(bearer(world.tokens.supplierB)).expect(200);
    expect(asB.body.map((q: { total: number }) => q.total)).toEqual([15000]);

    const asBuyer = await http().get(`/v1/rfqs/${rfq.id}`).set(bearer(world.tokens.buyer)).expect(200);
    expect(asBuyer.body.status).toBe("quoted");
    expect(asBuyer.body.quotes.map((q: { total: number }) => q.total)).toEqual([14000, 15000]);

    const awarded = await http()
      .post(`/v1/rfqs/${rfq.id}/award`)
      .set(bearer(world.tokens.buyer))
      .send({ quoteId: quoteA.body.id })
      .expect(200);
    expect(awarded.body).toMatchObject({ status: "awarded", awardedQuoteId: quoteA.body.id });

    const again = await http()
      .post(`/v1/rfqs/${rfq.id}/award`)
      .set(bearer(world.tokens.buyer))
      .send({ quoteId: quoteA.body.id })
      .expect(409);
    expect(again.body.code).toBe("RFQ_ALREADY_AWARDED");

    await http()
      .post(`/v1/rfqs/${rfq.id}/quotes`)
      .set(bearer(world.tokens.supplierB))
      .send({ total: 1, deliveryDays: 1, note })
      .expect(409);
  });

  it("allows one quote per supplier and only from verified suppliers", async () => {
    const rfq = await postRfq();
    const body = { total: 14000, deliveryDays: 2, note };
    await http().post(`/v1/rfqs/${rfq.id}/quotes`).set(bearer(world.tokens.supplierA)).send(body).expect(201);
    const dup = await http().post(`/v1/rfqs/${rfq.id}/quotes`).set(bearer(world.tokens.supplierA)).send(body).expect(409);
    expect(dup.body.code).toBe("QUOTE_ALREADY_SUBMITTED");

    const unverified = await http().post(`/v1/rfqs/${rfq.id}/quotes`).set(bearer(world.tokens.pending)).send(body).expect(403);
    expect(unverified.body.code).toBe("SUPPLIER_NOT_VERIFIED");
    await http().post(`/v1/rfqs/${rfq.id}/quotes`).set(bearer(world.tokens.buyer)).send(body).expect(403);
  });

  it("keeps RFQs private between buyers", async () => {
    const rfq = await postRfq();
    await http().get(`/v1/rfqs/${rfq.id}`).set(bearer(world.tokens.otherBuyer)).expect(404);
    const list = await http().get("/v1/rfqs").set(bearer(world.tokens.otherBuyer)).expect(200);
    expect(list.body).toEqual([]);
  });

  it("validates products and dates", async () => {
    const res = await http()
      .post("/v1/rfqs")
      .set(bearer(world.tokens.buyer))
      .send({ items: [{ productId: "missing", quantity: 1 }], deliveryLocation: "X", neededBy: nextWeek() })
      .expect(422);
    expect(res.body).toMatchObject({ code: "UNKNOWN_PRODUCT", details: { productIds: ["missing"] } });

    const past = await http()
      .post("/v1/rfqs")
      .set(bearer(world.tokens.buyer))
      .send({ items: [{ productId: world.cement.id, quantity: 1 }], deliveryLocation: "X", neededBy: "2020-01-01" })
      .expect(422);
    expect(past.body.code).toBe("NEEDED_BY_IN_PAST");
  });

  it("simulates quotes from verified suppliers in demo mode", async () => {
    const rfq = await postRfq();
    const res = await http().post(`/v1/rfqs/${rfq.id}/quotes/simulate`).set(bearer(world.tokens.buyer)).expect(200);
    expect(res.body.status).toBe("quoted");
    expect(res.body.quotes).toHaveLength(2);
  });
});

describe("orders", () => {
  async function placeOrder(quantity = 150) {
    const res = await http()
      .post("/v1/orders")
      .set(bearer(world.tokens.buyer))
      .send({
        lines: [{ productId: world.cement.id, quantity, unitPrice: 1 }],
        paymentMethod: "cod",
        deliveryAddress: "12 Lenin Street",
      })
      .expect(201);
    return res.body;
  }

  const advance = (orderId: string, status: string, token = world.tokens.supplierA) =>
    http().patch(`/v1/orders/${orderId}`).set(bearer(token)).send({ status });

  it("recomputes prices from wholesale tiers and ignores client prices", async () => {
    const order = await placeOrder(150);
    expect(order).toMatchObject({ status: "placed", total: 10800, hasReview: false, supplierId: world.supplierA.id });
    expect(order.lines[0]).toMatchObject({ quantity: 150, unitPrice: 72 });
  });

  it("rejects mixed suppliers and insufficient stock", async () => {
    const mixed = await http()
      .post("/v1/orders")
      .set(bearer(world.tokens.buyer))
      .send({
        lines: [
          { productId: world.cement.id, quantity: 1 },
          { productId: world.rebar.id, quantity: 1 },
        ],
        paymentMethod: "cod",
        deliveryAddress: "X",
      })
      .expect(422);
    expect(mixed.body.code).toBe("MULTIPLE_SUPPLIERS");

    const short = await http()
      .post("/v1/orders")
      .set(bearer(world.tokens.buyer))
      .send({ lines: [{ productId: world.rebar.id, quantity: 6 }], paymentMethod: "cod", deliveryAddress: "X" })
      .expect(409);
    expect(short.body).toMatchObject({ code: "INSUFFICIENT_STOCK", details: { products: [{ available: 5 }] } });
  });

  it("enforces the status lifecycle and roles", async () => {
    const order = await placeOrder();
    await advance(order.id, "confirmed", world.tokens.buyer).expect(403);
    await advance(order.id, "confirmed", world.tokens.supplierB).expect(404);

    const skip = await advance(order.id, "delivered").expect(409);
    expect(skip.body).toMatchObject({ code: "INVALID_STATUS_TRANSITION", details: { allowed: "confirmed" } });

    await advance(order.id, "confirmed_receipt").expect(403);
    await advance(order.id, "confirmed").expect(200);
    await advance(order.id, "out_for_delivery").expect(200);
    const delivered = await advance(order.id, "delivered").expect(200);
    expect(delivered.body.status).toBe("delivered");

    const supplierView = await http().get("/v1/orders").set(bearer(world.tokens.supplierA)).expect(200);
    expect(supplierView.body).toHaveLength(1);
    await http().get(`/v1/orders/${order.id}`).set(bearer(world.tokens.otherBuyer)).expect(404);
  });

  it("accrues commission once on receipt confirmation", async () => {
    const order = await placeOrder();
    const early = await http().post(`/v1/orders/${order.id}/confirm-receipt`).set(bearer(world.tokens.buyer)).expect(409);
    expect(early.body.code).toBe("ORDER_NOT_ACCEPTED");

    await advance(order.id, "confirmed").expect(200);
    await advance(order.id, "out_for_delivery").expect(200);

    const confirmed = await http().post(`/v1/orders/${order.id}/confirm-receipt`).set(bearer(world.tokens.buyer)).expect(200);
    expect(confirmed.body.status).toBe("confirmed_receipt");
    await http().post(`/v1/orders/${order.id}/confirm-receipt`).set(bearer(world.tokens.buyer)).expect(200);

    const commissions = await prisma.commission.findMany();
    expect(commissions).toHaveLength(1);
    expect(Number(commissions[0]!.amount)).toBe(216); // 2% of 10800
  });

  it("allows one review per confirmed order and updates the rating", async () => {
    const order = await placeOrder();
    const review = { supplierId: world.supplierA.id, orderId: order.id, rating: 4, comment: "Good" };

    const early = await http().post("/v1/reviews").set(bearer(world.tokens.buyer)).send(review).expect(409);
    expect(early.body.code).toBe("ORDER_NOT_CONFIRMED");

    await advance(order.id, "confirmed").expect(200);
    await http().post(`/v1/orders/${order.id}/confirm-receipt`).set(bearer(world.tokens.buyer)).expect(200);

    const created = await http().post("/v1/reviews").set(bearer(world.tokens.buyer)).send(review).expect(201);
    expect(created.body).toMatchObject({ rating: 4, author: "+992 ••• 0101" });

    const dup = await http().post("/v1/reviews").set(bearer(world.tokens.buyer)).send(review).expect(409);
    expect(dup.body.code).toBe("REVIEW_ALREADY_EXISTS");

    await http()
      .post("/v1/reviews")
      .set(bearer(world.tokens.buyer))
      .send({ supplierId: world.supplierA.id, rating: 2, comment: "Slow" })
      .expect(201);

    const supplier = await http().get(`/v1/suppliers/${world.supplierA.id}`).expect(200);
    expect(supplier.body).toMatchObject({ rating: 3, reviewCount: 2 });
    const orderAfter = await http().get(`/v1/orders/${order.id}`).set(bearer(world.tokens.buyer)).expect(200);
    expect(orderAfter.body.hasReview).toBe(true);

    const reviews = await http().get(`/v1/suppliers/${world.supplierA.id}/reviews`).expect(200);
    expect(reviews.body.map((r: { comment: string }) => r.comment)).toEqual(["Slow", "Good"]);
  });
});

describe("errors", () => {
  it("returns the standard error body for malformed JSON and unknown routes", async () => {
    const bad = await http()
      .post("/v1/rfqs")
      .set(bearer(world.tokens.buyer))
      .set("Content-Type", "application/json")
      .send("{not json")
      .expect(400);
    expect(bad.body.code).toBe("BAD_REQUEST");

    const missing = await http().get("/v1/nope").expect(404);
    expect(missing.body.code).toBe("ROUTE_NOT_FOUND");
  });
});
