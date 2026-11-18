import "server-only";

/** Server-side only: the browser never calls the APIs directly. */
export const API_URL = process.env.API_URL ?? "http://localhost:4000/v1";
export const ADMIN_API_URL = process.env.ADMIN_API_URL ?? "http://localhost:4001/v1";
