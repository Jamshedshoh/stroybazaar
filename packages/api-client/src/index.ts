import createClient from "openapi-fetch";
import type { components as AdminComponents, paths as AdminPaths } from "./generated/admin";
import type { components as ApiComponents, paths as ApiPaths } from "./generated/api";

export type Api = ApiComponents["schemas"];
export type Admin = AdminComponents["schemas"];
export type ApiClient = ReturnType<typeof createApiClient>;
export type AdminClient = ReturnType<typeof createAdminClient>;

const authHeaders = (token?: string): Record<string, string> =>
  token ? { Authorization: `Bearer ${token}` } : {};

/** Client for apps/api (mobile app, web app, supplier dashboard). `baseUrl` includes `/v1`. */
export function createApiClient(baseUrl: string, token?: string) {
  return createClient<ApiPaths>({ baseUrl, headers: authHeaders(token) });
}

/** Client for apps/admin-api. `baseUrl` includes `/v1`. */
export function createAdminClient(baseUrl: string, token?: string) {
  return createClient<AdminPaths>({ baseUrl, headers: authHeaders(token) });
}

/** An error response from either API, carrying the standard `{ code, message, details }` body. */
export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

/** Returns `data` or throws an `ApiRequestError` for error responses. */
export async function unwrap<T>(
  request: Promise<{ data?: T; error?: unknown; response: Response }>,
): Promise<T> {
  const { data, error, response } = await request;
  if (error !== undefined || !response.ok) {
    const body = (error ?? {}) as { code?: string; message?: string; details?: Record<string, unknown> };
    throw new ApiRequestError(
      response.status,
      body.code ?? "HTTP_ERROR",
      body.message ?? response.statusText,
      body.details,
    );
  }
  return data as T;
}
