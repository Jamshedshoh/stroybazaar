import { existsSync } from "node:fs";
import { resolve } from "node:path";

/** The dev DATABASE_URL pointed at a separate `test` schema, so tests never touch dev data. */
export function testDatabaseUrl() {
  const envFile = resolve(import.meta.dirname, "../../../.env");
  if (!process.env.DATABASE_URL && existsSync(envFile)) process.loadEnvFile(envFile);
  const base = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!base) throw new Error("Set DATABASE_URL (or TEST_DATABASE_URL) to run the tests");
  if (process.env.TEST_DATABASE_URL) return base;
  const url = new URL(base);
  url.searchParams.set("schema", "test");
  return url.toString();
}
