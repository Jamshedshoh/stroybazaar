import cors from "cors";
import express from "express";
import helmet from "helmet";
import { errorHandler } from "./middleware";
import { supplierRouter } from "./routes/suppliers";

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: process.env.ADMIN_APP_ORIGIN ?? "http://localhost:3001" }));
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "admin-api" });
  });

  // TODO: protect everything below with admin authentication.
  app.use("/v1/suppliers", supplierRouter);

  app.use(errorHandler);
  return app;
}
