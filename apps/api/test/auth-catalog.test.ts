import { prisma } from "@stroybazaar/db";
import { beforeEach, describe, expect, it } from "vitest";
import { bearer, http, lastCodeFor, login, resetDatabase, seedMarketplace } from "./helpers";

let world: Awaited<ReturnType<typeof seedMarketplace>>;

beforeEach(async () => {
  await resetDatabase();
  world = await seedMarketplace();
});

describe("auth", () => {
  const phone = "+992925559999";

  it("logs in with an SMS code and creates a buyer", async () => {
    const token = await login(phone);
    const me = await http().get("/v1/me").set(bearer(token)).expect(200);
    expect(me.body).toMatchObject({ phone, role: "buyer", language: "ru", name: null });
  });

  it("rejects a wrong code, then a reused code", async () => {
    await http().post("/v1/auth/otp/request").send({ phone }).expect(200);
    const code = lastCodeFor(phone);
    const wrong = await http()
      .post("/v1/auth/otp/verify")
      .send({ phone, code: code === "111111" ? "222222" : "111111" })
      .expect(401);
    expect(wrong.body.code).toBe("OTP_INVALID");

    await http().post("/v1/auth/otp/verify").send({ phone, code }).expect(200);
    const reused = await http().post("/v1/auth/otp/verify").send({ phone, code }).expect(401);
    expect(reused.body).toMatchObject({ code: "OTP_INVALID" });
  });

  it("locks a code after too many wrong attempts", async () => {
    await http().post("/v1/auth/otp/request").send({ phone }).expect(200);
    const code = lastCodeFor(phone);
    const wrong = code === "111111" ? "222222" : "111111";
    for (let i = 0; i < 5; i++) await http().post("/v1/auth/otp/verify").send({ phone, code: wrong }).expect(401);
    await http().post("/v1/auth/otp/verify").send({ phone, code }).expect(401);
  });

  it("throttles SMS per phone without revealing it", async () => {
    for (let i = 0; i < 5; i++) {
      const res = await http().post("/v1/auth/otp/request").send({ phone }).expect(200);
      expect(res.body).toEqual({ sent: true, expiresIn: 300 });
    }
    expect(await prisma.otpCode.count({ where: { phone } })).toBe(3);
  });

  it("validates the phone format", async () => {
    const res = await http().post("/v1/auth/otp/request").send({ phone: "12345" }).expect(422);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  it("requires a valid token", async () => {
    await http().get("/v1/me").expect(401);
    const res = await http().get("/v1/me").set(bearer("not-a-jwt")).expect(401);
    expect(res.body).toEqual({ code: "UNAUTHORIZED", message: "Missing or invalid token." });
  });

  it("updates the profile", async () => {
    const res = await http()
      .patch("/v1/me")
      .set(bearer(world.tokens.buyer))
      .send({ name: "A. Rahimov", language: "tj" })
      .expect(200);
    expect(res.body).toMatchObject({ name: "A. Rahimov", language: "tj" });
  });
});

describe("catalog", () => {
  it("lists categories in order", async () => {
    const res = await http().get("/v1/categories").expect(200);
    expect(res.body.map((c: { id: string }) => c.id)).toEqual(["cement", "rebar"]);
    expect(res.body[0]).toEqual({ id: "cement", name: expect.objectContaining({ en: "Cement" }), icon: "layers" });
  });

  it("filters and searches products across languages, case-insensitively", async () => {
    const byCategory = await http().get("/v1/products?categoryId=rebar").expect(200);
    expect(byCategory.body).toHaveLength(1);

    const cyrillic = await http().get(`/v1/products?search=${encodeURIComponent("портланд")}`).expect(200);
    expect(cyrillic.body.map((p: { id: string }) => p.id)).toEqual([world.cement.id]);

    const product = cyrillic.body[0];
    expect(product.wholesaleTiers).toEqual([
      { minQty: 100, pricePerUnit: 72 },
      { minQty: 500, pricePerUnit: 68 },
    ]);
    expect(product).toMatchObject({ price: 78, stock: 1000, image: null });
  });

  it("hides products of suspended suppliers", async () => {
    await prisma.supplier.update({ where: { id: world.supplierA.id }, data: { status: "suspended" } });
    const list = await http().get("/v1/products").expect(200);
    expect(list.body.map((p: { id: string }) => p.id)).toEqual([world.rebar.id]);
    await http().get(`/v1/products/${world.cement.id}`).expect(404);
  });

  it("lists suppliers verified first", async () => {
    const res = await http().get("/v1/suppliers").expect(200);
    expect(res.body.map((s: { verified: boolean }) => s.verified)).toEqual([true, true, false]);
    expect(res.body[0].joinedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("lets suppliers manage only their own products", async () => {
    const created = await http()
      .post("/v1/products")
      .set(bearer(world.tokens.supplierB))
      .send({
        categoryId: "rebar",
        name: { en: "Rebar 10 mm", ru: "Арматура 10 мм", tj: "Арматура 10 мм" },
        unit: { en: "ton", ru: "тонна", tj: "тонна" },
        attributes: { en: "10 mm", ru: "10 мм", tj: "10 мм" },
        price: 9900,
        stock: 12,
        wholesaleTiers: [{ minQty: 5, pricePerUnit: 9600 }],
      })
      .expect(201);
    expect(created.body).toMatchObject({ supplierId: world.supplierB.id, price: 9900 });

    await http()
      .patch(`/v1/products/${created.body.id}`)
      .set(bearer(world.tokens.supplierA))
      .send({ price: 1 })
      .expect(403);
    await http().post("/v1/products").set(bearer(world.tokens.buyer)).send({}).expect(403);

    const updated = await http()
      .patch(`/v1/products/${created.body.id}`)
      .set(bearer(world.tokens.supplierB))
      .send({ stock: 3, wholesaleTiers: [] })
      .expect(200);
    expect(updated.body).toMatchObject({ stock: 3, wholesaleTiers: [] });
  });

  it("rejects unknown categories", async () => {
    const res = await http()
      .patch(`/v1/products/${world.cement.id}`)
      .set(bearer(world.tokens.supplierA))
      .send({ categoryId: "nope" })
      .expect(422);
    expect(res.body.code).toBe("UNKNOWN_CATEGORY");
  });
});
