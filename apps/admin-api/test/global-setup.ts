import { execSync } from "node:child_process";
import { resolve } from "node:path";
import { testDatabaseUrl } from "./database-url";

export default function setup() {
  execSync("pnpm exec prisma migrate deploy", {
    cwd: resolve(import.meta.dirname, "../../../packages/db"),
    env: { ...process.env, DATABASE_URL: testDatabaseUrl() },
    stdio: "pipe",
  });
}
