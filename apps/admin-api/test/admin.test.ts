import SwaggerParser from "@apidevtools/swagger-parser";
import { prisma } from "@stroybazaar/db";
import { signAccessToken } from "@stroybazaar/server";
import type { OpenAPI } from "openapi-types";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app";

const app = createApp();
const http = () => request(app);
const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
const t = (en: string) => ({ en, ru: en, tj: en });

let adminToken: string;
let buyerToken: string;
let adminId: string;

beforeEach(async () => {
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = current_schema() AND tablename <> '_prisma_migrations'`;
  await prisma.$executeRawUnsafe(`TRUNCATE ${tables.map((x) => `"${x.tablename}"`).join(", ")} CASCADE`);

  const admin = await prisma.user.create({ data: { phone: "+992900000009", role: "admin" } });
  const buyer = await prisma.user.create({ data: { phone: "+992925550101" } });
  adminId = admin.id;
  adminToken = (await signAccessToken(admin.id)).token;
  buyerToken = (await signAccessToken(buyer.id)).token;
});

describe("admin-api", () => {
  it("serves a valid OpenAPI document", async () => {
    const res = await http().get("/openapi.json").expect(200);
    await expect(SwaggerParser.validate(structuredClone(res.body) as OpenAPI.Document)).resolves.toBeTruthy();
    expect(Object.keys(res.body.paths)).toEqual(
      expect.arrayContaining(["/stats", "/suppliers", "/suppliers/{supplierId}/status", "/users/{userId}", "/commissions"]),
    );
  });

  it("is admin-only", async () => {
    await http().get("/v1/suppliers").expect(401);
    const res = await http().get("/v1/suppliers").set(bearer(buyerToken)).expect(403);
    expect(res.body.code).toBe("FORBIDDEN");
  });

  it("onboards, verifies and staffs a supplier", async () => {
    const created = await http()
      .post("/v1/suppliers")
      .set(bearer(adminToken))
      .send({ name: "Cement Yard", location: t("Khujand"), phones: ["+992 92 555 0101"], languages: ["ru"] })
      .expect(201);
    expect(created.body).toMatchObject({ status: "pending", productCount: 0 });

    const verified = await http()
      .patch(`/v1/suppliers/${created.body.id}/status`)
      .set(bearer(adminToken))
      .send({ status: "verified" })
      .expect(200);
    expect(verified.body.status).toBe("verified");

    const list = await http().get("/v1/suppliers?status=verified").set(bearer(adminToken)).expect(200);
    expect(list.body).toMatchObject({ total: 1, page: 1, pageSize: 20 });

    const buyer = await prisma.user.findUniqueOrThrow({ where: { phone: "+992925550101" } });
    const missing = await http()
      .patch(`/v1/users/${buyer.id}`)
      .set(bearer(adminToken))
      .send({ role: "supplier" })
      .expect(422);
    expect(missing.body.code).toBe("SUPPLIER_REQUIRED");

    const staffed = await http()
      .patch(`/v1/users/${buyer.id}`)
      .set(bearer(adminToken))
      .send({ role: "supplier", supplierId: created.body.id })
      .expect(200);
    expect(staffed.body).toMatchObject({ role: "supplier", supplierId: created.body.id });

    // Switching back to buyer clears the supplier link.
    const back = await http().patch(`/v1/users/${buyer.id}`).set(bearer(adminToken)).send({ role: "buyer" }).expect(200);
    expect(back.body.supplierId).toBeNull();
  });

  it("does not let an admin demote themselves", async () => {
    const res = await http().patch(`/v1/users/${adminId}`).set(bearer(adminToken)).send({ role: "buyer" }).expect(403);
    expect(res.body.code).toBe("SELF_DEMOTION");
  });

  it("manages categories", async () => {
    const body = { id: "insulation", name: t("Insulation"), icon: "thermometer" };
    await http().post("/v1/categories").set(bearer(adminToken)).send(body).expect(201);
    const dup = await http().post("/v1/categories").set(bearer(adminToken)).send(body).expect(409);
    expect(dup.body.code).toBe("CATEGORY_EXISTS");
    const updated = await http()
      .patch("/v1/categories/insulation")
      .set(bearer(adminToken))
      .send({ sortOrder: 5 })
      .expect(200);
    expect(updated.body).toMatchObject({ id: "insulation", sortOrder: 5 });
  });

  it("reports commissions and marketplace stats", async () => {
    const supplier = await prisma.supplier.create({
      data: { name: "S", status: "verified", location: t("K"), phones: [], languages: ["ru"] },
    });
    const buyer = await prisma.user.findUniqueOrThrow({ where: { phone: "+992925550101" } });
    for (const [status, total] of [["confirmed_receipt", 1000], ["delivered", 500], ["placed", 200]] as const) {
      const order = await prisma.order.create({
        data: { buyerId: buyer.id, supplierId: supplier.id, total, paymentMethod: "cod", status, deliveryAddress: "X" },
      });
      if (status === "confirmed_receipt") {
        await prisma.commission.create({ data: { orderId: order.id, rate: 0.02, amount: 20 } });
      }
    }

    const commissions = await http().get("/v1/commissions").set(bearer(adminToken)).expect(200);
    expect(commissions.body).toMatchObject({ count: 1, totalAmount: 20 });
    expect(commissions.body.items[0]).toMatchObject({ supplierName: "S", orderTotal: 1000, rate: 0.02 });

    const stats = await http().get("/v1/stats").set(bearer(adminToken)).expect(200);
    expect(stats.body).toEqual({
      activeSuppliers: 1,
      pendingSuppliers: 0,
      rfqsPosted: 0,
      averageQuoteResponseHours: null,
      ordersCompleted: 1,
      confirmedInAppShare: 0.5,
      repeatBuyerRate: 1,
      commissionTotal: 20,
    });

    const orders = await http().get("/v1/orders?status=placed").set(bearer(adminToken)).expect(200);
    expect(orders.body.items).toHaveLength(1);
    expect(orders.body.items[0]).toMatchObject({ buyerPhone: "+992925550101", supplierName: "S", commission: null });
  });
});
