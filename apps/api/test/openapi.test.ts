import SwaggerParser from "@apidevtools/swagger-parser";
import type { OpenAPI } from "openapi-types";
import { describe, expect, it } from "vitest";
import { http } from "./helpers";

describe("OpenAPI document", () => {
  it("is served at /openapi.json and is a valid OpenAPI 3.0 document", async () => {
    const res = await http().get("/openapi.json").expect(200);
    expect(res.body.openapi).toBe("3.0.3");
    await expect(SwaggerParser.validate(structuredClone(res.body) as OpenAPI.Document)).resolves.toBeTruthy();
  });

  it("documents every endpoint the mobile contract requires", async () => {
    const { body } = await http().get("/openapi.json").expect(200);
    const operations = Object.entries(body.paths as Record<string, object>).flatMap(([path, ops]) =>
      Object.keys(ops).map((method) => `${method.toUpperCase()} ${path}`),
    );
    expect(operations).toEqual(
      expect.arrayContaining([
        "POST /auth/otp/request",
        "POST /auth/otp/verify",
        "GET /me",
        "GET /categories",
        "GET /products",
        "GET /products/{productId}",
        "GET /suppliers",
        "GET /suppliers/{supplierId}",
        "GET /suppliers/{supplierId}/reviews",
        "GET /rfqs",
        "POST /rfqs",
        "GET /rfqs/{rfqId}",
        "GET /rfqs/{rfqId}/quotes",
        "POST /rfqs/{rfqId}/quotes",
        "POST /rfqs/{rfqId}/award",
        "GET /orders",
        "POST /orders",
        "GET /orders/{orderId}",
        "PATCH /orders/{orderId}",
        "POST /orders/{orderId}/confirm-receipt",
        "POST /reviews",
        "POST /rfqs/{rfqId}/quotes/simulate",
      ]),
    );
  });

  it("marks public endpoints as not needing a token", async () => {
    const { body } = await http().get("/openapi.json").expect(200);
    expect(body.paths["/products"].get.security).toEqual([]);
    expect(body.paths["/orders"].get.security).toEqual([{ bearerAuth: [] }]);
  });

  it("serves YAML and Swagger UI", async () => {
    const yaml = await http().get("/openapi.yaml").expect(200);
    expect(yaml.text).toContain("openapi: 3.0.3");
    const docs = await http().get("/docs/").expect(200);
    expect(docs.text).toContain("swagger-ui");
  });
});
