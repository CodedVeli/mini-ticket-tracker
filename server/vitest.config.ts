import { defineConfig } from "vitest/config";

// Set before workers spawn so tests can never touch the dev database.
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgres://postgres:postgres@localhost:5435/tickets_test";

export default defineConfig({
  test: {
    globalSetup: ["./tests/global-setup.ts"],
    fileParallelism: false,
  },
});
