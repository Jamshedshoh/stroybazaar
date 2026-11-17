import { defineConfig } from "vitest/config";
import { testDatabaseUrl } from "./test/database-url.ts";

export default defineConfig({
  test: {
    env: { DATABASE_URL: testDatabaseUrl(), NODE_ENV: "test" },
    globalSetup: ["./test/global-setup.ts"],
    // Test files share one database schema.
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 60_000,
  },
});
