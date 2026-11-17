import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { prisma } from "@stroybazaar/db";
import { ApiError, signAccessToken, type ApiRouter } from "@stroybazaar/server";
import * as S from "../schemas";
import { serializeUser } from "../serializers";
import type { SmsSender } from "../sms";

const OTP_TTL_SECONDS = 300;
const OTP_MAX_ATTEMPTS = 5;
// Codes sent to one phone per window; extra requests get the same response but no SMS.
const OTP_PER_PHONE_LIMIT = 3;
const OTP_PER_PHONE_WINDOW_MS = 10 * 60 * 1000;

const hashCode = (phone: string, code: string) =>
  createHash("sha256").update(`${phone}:${code}`).digest("hex");

const invalidCode = () => new ApiError(401, "OTP_INVALID", "The code is invalid or has expired.");

export function registerAuthRoutes(api: ApiRouter, sms: SmsSender) {
  api.route({
    method: "post",
    path: "/auth/otp/request",
    tags: ["Auth"],
    summary: "Request an SMS OTP code",
    description:
      "Always returns the same response, whether or not a code was sent, so phone numbers cannot be enumerated. Rate limited per IP and per phone.",
    access: "public",
    body: S.OtpRequest,
    response: { status: 200, description: "Code sent (or throttled).", schema: S.OtpRequestResult },
    errors: [429],
    handler: async ({ body, req }) => {
      const recent = await prisma.otpCode.count({
        where: { phone: body.phone, createdAt: { gt: new Date(Date.now() - OTP_PER_PHONE_WINDOW_MS) } },
      });

      if (recent < OTP_PER_PHONE_LIMIT) {
        const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
        await prisma.otpCode.create({
          data: {
            phone: body.phone,
            codeHash: hashCode(body.phone, code),
            expiresAt: new Date(Date.now() + OTP_TTL_SECONDS * 1000),
          },
        });
        await sms.send(body.phone, `StroyBazaar code: ${code}`);
        console.info(`[auth] otp requested phone=${body.phone} ip=${req.ip}`);
      } else {
        console.warn(`[auth] otp throttled phone=${body.phone} ip=${req.ip}`);
      }

      return { sent: true, expiresIn: OTP_TTL_SECONDS };
    },
  });

  api.route({
    method: "post",
    path: "/auth/otp/verify",
    tags: ["Auth"],
    summary: "Verify OTP and receive a JWT",
    description: "Creates a buyer account on first login.",
    access: "public",
    body: S.OtpVerify,
    response: { status: 200, description: "Authenticated.", schema: S.AuthToken },
    errors: [401, 429],
    handler: async ({ body, req }) => {
      const otp = await prisma.otpCode.findFirst({
        where: { phone: body.phone, consumedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
      });

      if (!otp || otp.attempts >= OTP_MAX_ATTEMPTS) {
        console.warn(`[auth] otp verify failed (no active code) phone=${body.phone} ip=${req.ip}`);
        throw invalidCode();
      }

      const matches = timingSafeEqual(
        Buffer.from(otp.codeHash, "hex"),
        Buffer.from(hashCode(body.phone, body.code), "hex"),
      );
      if (!matches) {
        await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
        console.warn(`[auth] otp verify failed (wrong code) phone=${body.phone} ip=${req.ip}`);
        throw invalidCode();
      }

      // Consume atomically so a code can only be used once, even under concurrent requests.
      const consumed = await prisma.otpCode.updateMany({
        where: { id: otp.id, consumedAt: null },
        data: { consumedAt: new Date() },
      });
      if (consumed.count === 0) throw invalidCode();

      const user = await prisma.user.upsert({
        where: { phone: body.phone },
        update: {},
        create: { phone: body.phone },
      });
      const { token, expiresAt } = await signAccessToken(user.id);
      console.info(`[auth] login phone=${body.phone} user=${user.id} ip=${req.ip}`);

      return { token, tokenType: "Bearer" as const, expiresAt: expiresAt.toISOString(), user: serializeUser(user) };
    },
  });

  api.route({
    method: "get",
    path: "/me",
    tags: ["Auth"],
    summary: "Current user profile",
    access: "authenticated",
    response: { status: 200, description: "OK.", schema: S.User },
    handler: ({ user }) => serializeUser(user),
  });

  api.route({
    method: "patch",
    path: "/me",
    tags: ["Auth"],
    summary: "Update the current user's name or language",
    access: "authenticated",
    body: S.UpdateMeRequest,
    response: { status: 200, description: "Updated profile.", schema: S.User },
    handler: async ({ user, body }) => {
      const updated = await prisma.user.update({ where: { id: user.id }, data: body });
      return serializeUser(updated);
    },
  });
}
