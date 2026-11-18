import "server-only";

/** apps/api base URL, used only on the server. */
export const API_URL = process.env.API_URL ?? "http://localhost:4000/v1";

/** Show the demo "simulate quotes" button (the API only enables that endpoint outside production). */
export const DEMO_ENABLED = process.env.NODE_ENV !== "production";
