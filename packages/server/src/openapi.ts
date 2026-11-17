import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  type RouteConfig,
} from "@asteasolutions/zod-to-openapi";
import type { UserRole } from "@stroybazaar/db";
import express, { type Request, type Response } from "express";
import swaggerUi from "swagger-ui-express";
import { stringify } from "yaml";
import type { z as zod } from "zod";
import type { AuthUser } from "./auth";
import { ErrorSchema, forbidden, unauthorized } from "./errors";

type OpenAPIObjectConfig = Parameters<OpenApiGeneratorV3["generateDocument"]>[0];
type ZodObject = zod.ZodObject<zod.ZodRawShape>;
type ZodType = zod.ZodType;
type Infer<T> = T extends ZodType ? zod.output<T> : undefined;

/** `public` needs no token; `authenticated` needs any user; a role list restricts further. */
export type Access = "public" | "authenticated" | readonly UserRole[];

type ErrorStatus = 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500;

const ERROR_RESPONSES: Record<ErrorStatus, [name: string, description: string]> = {
  400: ["BadRequest", "Malformed request."],
  401: ["Unauthorized", "Missing or invalid token."],
  403: ["Forbidden", "Authenticated but not allowed (wrong role or not the owner)."],
  404: ["NotFound", "Resource not found."],
  409: ["Conflict", "Invalid state transition or duplicate resource."],
  422: ["ValidationError", "Request or business validation failed."],
  429: ["TooManyRequests", "Rate limited."],
  500: ["ServerError", "Unexpected error."],
};

export interface HandlerContext<P, Q, H, B> {
  req: Request;
  res: Response;
  params: Infer<P>;
  query: Infer<Q>;
  headers: Infer<H>;
  body: Infer<B>;
  /** The authenticated user. Only present when `access` is not `public`. */
  user: AuthUser;
}

export interface RouteDefinition<
  P extends ZodObject | undefined,
  Q extends ZodObject | undefined,
  H extends ZodObject | undefined,
  B extends ZodType | undefined,
  R extends ZodType | undefined,
> {
  method: "get" | "post" | "put" | "patch" | "delete";
  /** OpenAPI-style path relative to the router, e.g. `/rfqs/{rfqId}`. */
  path: string;
  tags: string[];
  summary: string;
  description?: string;
  deprecated?: boolean;
  access: Access;
  params?: P;
  query?: Q;
  headers?: H;
  body?: B;
  response: { status: 200 | 201 | 204; description: string; schema?: R };
  /** Extra documented error responses. 401/403/422/500 are added automatically where they apply. */
  errors?: ErrorStatus[];
  handler: (
    ctx: HandlerContext<P, Q, H, B>,
  ) => Promise<R extends ZodType ? zod.input<R> : void> | (R extends ZodType ? zod.input<R> : void);
}

/**
 * An Express router whose routes are documented as they are declared, so the generated
 * OpenAPI document always matches what the server validates and returns.
 */
export class ApiRouter {
  readonly registry = new OpenAPIRegistry();
  readonly router = express.Router();

  constructor() {
    this.registry.register("Error", ErrorSchema);
    this.registry.registerComponent("securitySchemes", "bearerAuth", {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    });
    for (const [name, description] of Object.values(ERROR_RESPONSES)) {
      this.registry.registerComponent("responses", name, {
        description,
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      });
    }
  }

  route<
    P extends ZodObject | undefined = undefined,
    Q extends ZodObject | undefined = undefined,
    H extends ZodObject | undefined = undefined,
    B extends ZodType | undefined = undefined,
    R extends ZodType | undefined = undefined,
  >(def: RouteDefinition<P, Q, H, B, R>) {
    this.registry.registerPath(toRouteConfig(def));

    const expressPath = def.path.replace(/\{(\w+)\}/g, ":$1");
    this.router[def.method](expressPath, async (req, res) => {
      checkAccess(req, def.access);

      const ctx = {
        req,
        res,
        params: def.params ? def.params.parse(req.params) : undefined,
        query: def.query ? def.query.parse(req.query) : undefined,
        headers: def.headers ? def.headers.parse(req.headers) : undefined,
        body: def.body ? def.body.parse(req.body) : undefined,
        user: req.user,
      } as HandlerContext<P, Q, H, B>;

      const result = await def.handler(ctx);
      if (def.response.status === 204 || !def.response.schema) {
        res.status(def.response.status).end();
        return;
      }
      // Parsing the output keeps responses to exactly the documented shape.
      res.status(def.response.status).json(def.response.schema.parse(result));
    });
    return this;
  }

  document(config: Omit<OpenAPIObjectConfig, "openapi" | "security">) {
    return new OpenApiGeneratorV3(this.registry.definitions).generateDocument({
      openapi: "3.0.3",
      security: [{ bearerAuth: [] }],
      ...config,
    });
  }
}

function checkAccess(req: Request, access: Access) {
  if (access === "public") return;
  if (!req.user) throw unauthorized();
  if (access !== "authenticated" && !access.includes(req.user.role)) {
    throw forbidden(`This action requires one of these roles: ${access.join(", ")}.`);
  }
}

function toRouteConfig(def: RouteDefinition<any, any, any, any, any>): RouteConfig {
  const errors = new Set<ErrorStatus>(def.errors);
  if (def.access !== "public") errors.add(401);
  if (Array.isArray(def.access)) errors.add(403);
  if (def.body) errors.add(400);
  if (def.body || def.query || def.params) errors.add(422);
  errors.add(500);

  const responses: RouteConfig["responses"] = {
    [def.response.status]: {
      description: def.response.description,
      ...(def.response.schema && { content: { "application/json": { schema: def.response.schema } } }),
    },
  };
  for (const status of [...errors].sort()) {
    responses[status] = { $ref: `#/components/responses/${ERROR_RESPONSES[status][0]}` };
  }

  const roles = Array.isArray(def.access) ? `\n\n**Roles:** ${def.access.join(", ")}` : "";
  return {
    method: def.method,
    path: def.path,
    tags: def.tags,
    summary: def.summary,
    description: def.description || roles ? `${def.description ?? ""}${roles}`.trim() : undefined,
    deprecated: def.deprecated,
    security: def.access === "public" ? [] : [{ bearerAuth: [] }],
    request: {
      params: def.params,
      query: def.query,
      headers: def.headers,
      body: def.body && { required: true, content: { "application/json": { schema: def.body } } },
    },
    responses,
  };
}

/** Serves `/openapi.json`, `/openapi.yaml` and Swagger UI at `/docs`. */
export function openApiDocs(getDocument: () => object) {
  let cached: object | undefined;
  const document = () => (cached ??= getDocument());

  const router = express.Router();
  router.get("/openapi.json", (_req, res) => {
    res.json(document());
  });
  router.get("/openapi.yaml", (_req, res) => {
    res.type("application/yaml").send(stringify(document()));
  });
  router.use(
    "/docs",
    swaggerUi.serveFiles(undefined, { swaggerUrl: "/openapi.json" }),
    swaggerUi.setup(undefined, { swaggerUrl: "/openapi.json" }),
  );
  return router;
}
