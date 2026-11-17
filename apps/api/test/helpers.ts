import { prisma } from "@stroybazaar/db";
import { signAccessToken } from "@stroybazaar/server";
import request from "supertest";
import { createApp } from "../src/app";
import type { SmsSender } from "../src/sms";

export const sent: { phone: string; message: string }[] = [];
const captureSms: SmsSender = {
  async send(phone, message) {
    sent.push({ phone, message });
  },
};

export const app = createApp({ sms: captureSms, otpRateLimit: 1000, demoEndpoints: true, commissionRate: 0.02 });
export const http = () => request(app);

export async function resetDatabase() {
  sent.length = 0;
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = current_schema() AND tablename <> '_prisma_migrations'`;
  await prisma.$executeRawUnsafe(
    `TRUNCATE ${tables.map((t) => `"${t.tablename}"`).join(", ")} RESTART IDENTITY CASCADE`,
  );
}

const t = (en: string) => ({ en, ru: `${en} (ru)`, tj: `${en} (tj)` });

/** Two verified suppliers with staff accounts, one pending supplier, and a buyer. */
export async function seedMarketplace() {
  await prisma.category.createMany({
    data: [
      { id: "cement", name: t("Cement"), icon: "layers", sortOrder: 1 },
      { id: "rebar", name: t("Rebar"), icon: "grid", sortOrder: 2 },
    ],
  });

  const supplierA = await prisma.supplier.create({
    data: { name: "Cement Yard", status: "verified", location: t("Khujand"), phones: ["+992 1"], languages: ["ru"] },
  });
  const supplierB = await prisma.supplier.create({
    data: { name: "Metal Base", status: "verified", location: t("Khujand"), phones: ["+992 2"], languages: ["tj"] },
  });
  const pending = await prisma.supplier.create({
    data: { name: "New Shop", status: "pending", location: t("Khujand"), phones: ["+992 3"], languages: ["ru"] },
  });

  const cement = await prisma.product.create({
    data: {
      supplierId: supplierA.id,
      categoryId: "cement",
      name: { en: "Portland cement M400", ru: "Портландцемент М400", tj: "Семент М400" },
      unit: t("bag"),
      attributes: t("M400"),
      price: 78,
      stock: 1000,
      wholesaleTiers: { create: [{ minQty: 100, pricePerUnit: 72 }, { minQty: 500, pricePerUnit: 68 }] },
    },
  });
  const rebar = await prisma.product.create({
    data: {
      supplierId: supplierB.id,
      categoryId: "rebar",
      name: t("Rebar 12 mm"),
      unit: t("ton"),
      attributes: t("12 mm"),
      price: 9800,
      stock: 5,
    },
  });

  const staffA = await prisma.user.create({ data: { phone: "+992900000001", role: "supplier", supplierId: supplierA.id } });
  const staffB = await prisma.user.create({ data: { phone: "+992900000002", role: "supplier", supplierId: supplierB.id } });
  const staffPending = await prisma.user.create({
    data: { phone: "+992900000003", role: "supplier", supplierId: pending.id },
  });
  const admin = await prisma.user.create({ data: { phone: "+992900000009", role: "admin" } });

  return {
    supplierA,
    supplierB,
    pending,
    cement,
    rebar,
    tokens: {
      supplierA: await tokenFor(staffA.id),
      supplierB: await tokenFor(staffB.id),
      pending: await tokenFor(staffPending.id),
      admin: await tokenFor(admin.id),
      buyer: await login("+992925550101"),
      otherBuyer: await login("+992925550102"),
    },
  };
}

export async function tokenFor(userId: string) {
  return (await signAccessToken(userId)).token;
}

/** Full OTP login through the API, reading the code from the captured SMS. */
export async function login(phone: string) {
  await http().post("/v1/auth/otp/request").send({ phone }).expect(200);
  const code = lastCodeFor(phone);
  const res = await http().post("/v1/auth/otp/verify").send({ phone, code }).expect(200);
  return res.body.token as string;
}

export function lastCodeFor(phone: string) {
  const message = sent.filter((m) => m.phone === phone).at(-1)?.message;
  const code = message?.match(/\d{6}/)?.[0];
  if (!code) throw new Error(`No OTP sent to ${phone}`);
  return code;
}

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

export const nextWeek = () => new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
