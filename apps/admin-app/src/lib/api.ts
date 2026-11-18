import "server-only";
import { createAdminClient, createApiClient, unwrap, type Api } from "@stroybazaar/api-client";
import { redirect } from "next/navigation";
import { cache } from "react";
import { ADMIN_API_URL, API_URL } from "./config";
import { getToken } from "./session";

/** apps/api client as the signed-in user (supplier dashboard). */
export async function api() {
  return createApiClient(API_URL, await getToken());
}

/** apps/admin-api client as the signed-in user (admin console). */
export async function admin() {
  return createAdminClient(ADMIN_API_URL, await getToken());
}

export const getViewer = cache(async (): Promise<Api["User"] | null> => {
  const token = await getToken();
  if (!token) return null;
  const { data } = await createApiClient(API_URL, token).GET("/me");
  return data ?? null;
});

/** The signed-in user with one of `roles`; redirects to login or the no-access page otherwise. */
export async function requireRole(roles: Api["User"]["role"][], next = "/") {
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (!roles.includes(viewer.role)) redirect("/no-access");
  return viewer;
}

/** The page to land on after login, by role. */
export const homeFor = (role: Api["User"]["role"]) =>
  role === "admin" ? "/admin" : role === "supplier" ? "/supplier" : "/no-access";

export { unwrap };
