import cors from "cors";
import express from "express";
import helmet from "helmet";
import { errorHandler } from "./middleware";
import { catalogRouter } from "./routes/catalog";
import { rfqRouter } from "./routes/rfqs";

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "api" });
  });

  app.use("/v1", catalogRouter);
  app.use("/v1/rfqs", rfqRouter);

  app.use(errorHandler);
  return app;
}
