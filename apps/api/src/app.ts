import {
  ApiRouter,
  authenticate,
  errorHandler,
  notFoundHandler,
  openApiDocs,
} from "@stroybazaar/server";
import cors from "cors";
import express from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { registerAuthRoutes } from "./routes/auth";
import { registerCatalogRoutes } from "./routes/catalog";
import { registerOrderRoutes } from "./routes/orders";
import { registerReviewRoutes } from "./routes/reviews";
import { registerRfqRoutes } from "./routes/rfqs";
import { registerSupplierRoutes } from "./routes/suppliers";
import { consoleSmsSender, type SmsSender } from "./sms";

export interface AppOptions {
  sms?: SmsSender;
  /** Enables `POST /rfqs/{rfqId}/quotes/simulate`. */
  demoEndpoints?: boolean;
  /** Commission accrued on receipt confirmation, as a fraction of the order total. */
  commissionRate?: number;
  /** Max OTP requests per IP per 15 minutes. */
  otpRateLimit?: number;
  /** Public base URL, used as the server in the OpenAPI document. */
  publicUrl?: string;
}

export function defaultOptions(): Required<AppOptions> {
  return {
    sms: consoleSmsSender,
    demoEndpoints: process.env.DEMO_ENDPOINTS
      ? process.env.DEMO_ENDPOINTS === "true"
      : process.env.NODE_ENV !== "production",
    commissionRate: Number(process.env.COMMISSION_RATE ?? 0.02),
    otpRateLimit: Number(process.env.OTP_RATE_LIMIT ?? 10),
    publicUrl: process.env.PUBLIC_URL ?? `http://localhost:${process.env.PORT ?? 4000}`,
  };
}

export function buildApi(options: Required<AppOptions>) {
  const api = new ApiRouter();
  registerAuthRoutes(api, options.sms);
  registerCatalogRoutes(api);
  registerSupplierRoutes(api);
  registerRfqRoutes(api, options);
  registerOrderRoutes(api, options);
  registerReviewRoutes(api);
  return api;
}

export function buildDocument(api: ApiRouter, options: Required<AppOptions>) {
  const publicUrl = options.publicUrl;
  return api.document({
    info: {
      title: "StroyBazaar Marketplace API",
      version: "0.2.0",
      description: [
        "Backend contract for the StroyBazaar construction-materials marketplace (Khujand), used by the mobile app and the supplier dashboard. Generated from the server's route definitions.",
        "",
        "Conventions:",
        "- All request/response bodies are `application/json`.",
        "- Timestamps are ISO 8601 (`date-time`); dates are `YYYY-MM-DD`.",
        "- Money amounts are in TJS (Somoni). The client formats them for display.",
        "- `LocalizedText` objects carry `en`, `ru`, `tj`. Supplier-written listing text is stored as-is; only categories, units and attributes are translated by the platform (business model section 7).",
        "- Client-supplied prices are never trusted for orders: the server recomputes unit prices from the current catalog and wholesale tiers.",
        "- Errors use the `Error` schema: `{ code, message, details }`.",
      ].join("\n"),
    },
    servers: [{ url: `${publicUrl}/v1`, description: "This server" }],
    tags: [
      { name: "Auth", description: "Phone/SMS OTP login (business model section 11)" },
      { name: "Catalog" },
      { name: "Suppliers" },
      { name: "RFQ", description: "Wholesale request-for-quote flow" },
      { name: "Orders" },
      { name: "Reviews" },
      ...(options.demoEndpoints
        ? [{ name: "Demo", description: "Helpers for the mock client; disabled in production" }]
        : []),
    ],
  });
}

export function createApp(overrides: AppOptions = {}) {
  const config = { ...defaultOptions(), ...overrides };
  const api = buildApi(config);

  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "100kb" }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "api" });
  });
  app.use(openApiDocs(() => buildDocument(api, config)));

  app.use(
    "/v1/auth/otp",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: config.otpRateLimit,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      handler: (_req, res) => {
        res.status(429).json({ code: "TOO_MANY_REQUESTS", message: "Too many login attempts. Try again later." });
      },
    }),
  );
  app.use("/v1", authenticate, api.router);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
