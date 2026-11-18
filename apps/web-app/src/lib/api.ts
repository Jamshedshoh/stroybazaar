import "server-only";
import { createApiClient, unwrap, type Api } from "@stroybazaar/api-client";
import { redirect } from "next/navigation";
import { cache } from "react";
import { API_URL } from "./config";
import { getToken } from "./session";

/**
 * API client authenticated as the current visitor (anonymous when not signed in).
 * An expired or revoked session cookie falls back to anonymous, since the API rejects
 * a bad bearer token even on public endpoints.
 */
export async function api() {
  return createApiClient(API_URL, (await getViewer()) ? await getToken() : undefined);
}

/** The signed-in user, or null. Cached for the duration of one request. */
export const getViewer = cache(async (): Promise<Api["User"] | null> => {
  const token = await getToken();
  if (!token) return null;
  const { data } = await createApiClient(API_URL, token).GET("/me");
  return data ?? null;
});

/** The signed-in user; redirects to the login page otherwise. */
export async function requireViewer(next: string) {
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(next)}`);
  return viewer;
}

/** Supplier id -> name, for labelling quotes and orders. */
export const getSupplierNames = cache(async () => {
  const suppliers = await unwrap((await api()).GET("/suppliers"));
  return new Map(suppliers.map((s) => [s.id, s.name]));
});

export { unwrap };
