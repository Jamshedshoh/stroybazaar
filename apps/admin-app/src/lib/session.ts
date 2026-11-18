import "server-only";
import { cookies } from "next/headers";

// Separate name from web-app: cookies on localhost are shared across ports.
const SESSION_COOKIE = "sb_console_session";

export async function getToken() {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

export async function setToken(token: string, expiresAt: string) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function clearToken() {
  (await cookies()).delete(SESSION_COOKIE);
}
