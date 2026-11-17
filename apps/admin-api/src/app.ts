import {
  ApiRouter,
  authenticate,
  errorHandler,
  notFoundHandler,
  openApiDocs,
} from "@stroybazaar/server";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { registerCatalogRoutes } from "./routes/catalog";
import { registerOrderRoutes } from "./routes/orders";
import { registerStatsRoutes } from "./routes/stats";
import { registerSupplierRoutes } from "./routes/suppliers";
import { registerUserRoutes } from "./routes/users";

export function buildApi() {
  const api = new ApiRouter();
  registerStatsRoutes(api);
  registerSupplierRoutes(api);
  registerCatalogRoutes(api);
  registerUserRoutes(api);
  registerOrderRoutes(api);
  return api;
}

export function buildDocument(api: ApiRouter, publicUrl: string) {
  return api.document({
    info: {
      title: "StroyBazaar Admin API",
      version: "0.2.0",
      description:
        "Platform management for StroyBazaar staff. Every endpoint requires a JWT for a user with the `admin` role. Tokens come from `POST /v1/auth/otp/verify` on the public API.",
    },
    servers: [{ url: `${publicUrl}/v1`, description: "This server" }],
    tags: [
      { name: "Stats", description: "Metrics to track (business model section 10)" },
      { name: "Suppliers", description: "Onboarding and verification (business model sections 6 and 8)" },
      { name: "Catalog", description: "Platform-owned, translated categories" },
      { name: "Users" },
      { name: "Orders" },
      { name: "Commissions" },
    ],
  });
}

export function createApp() {
  const api = buildApi();
  const publicUrl = process.env.PUBLIC_URL ?? `http://localhost:${process.env.PORT ?? 4001}`;

  const app = express();
  app.use(helmet());
  app.use(cors({ origin: process.env.ADMIN_APP_ORIGIN ?? "http://localhost:3001" }));
  app.use(express.json({ limit: "100kb" }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "admin-api" });
  });
  app.use(openApiDocs(() => buildDocument(api, publicUrl)));
  app.use("/v1", authenticate, api.router);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
