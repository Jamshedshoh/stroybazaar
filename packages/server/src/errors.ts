import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { z } from "./zod";

export const ErrorSchema = z
  .object({
    code: z.string().openapi({ example: "ORDER_ALREADY_CONFIRMED" }),
    message: z.string().openapi({ example: "This order has already been confirmed." }),
    details: z.record(z.string(), z.unknown()).optional(),
  })
  .openapi("Error");

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export const unauthorized = (message = "Missing or invalid token.") =>
  new ApiError(401, "UNAUTHORIZED", message);

export const forbidden = (message = "You are not allowed to do this.", code = "FORBIDDEN") =>
  new ApiError(403, code, message);

export const notFound = (resource: string) =>
  new ApiError(404, "NOT_FOUND", `${resource} not found.`);

export const conflict = (code: string, message: string, details?: Record<string, unknown>) =>
  new ApiError(409, code, message, details);

export const unprocessable = (code: string, message: string, details?: Record<string, unknown>) =>
  new ApiError(422, code, message, details);

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ code: "ROUTE_NOT_FOUND", message: `No route for ${req.method} ${req.path}.` });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    res.status(err.status).json({ code: err.code, message: err.message, details: err.details });
    return;
  }
  if (err instanceof ZodError) {
    res.status(422).json({
      code: "VALIDATION_ERROR",
      message: "Request validation failed.",
      details: { issues: err.issues },
    });
    return;
  }
  // body-parser errors (malformed JSON, payload too large, ...)
  if (typeof err?.status === "number" && err.status >= 400 && err.status < 500) {
    res.status(err.status).json({ code: "BAD_REQUEST", message: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ code: "INTERNAL_ERROR", message: "Unexpected server error." });
};
