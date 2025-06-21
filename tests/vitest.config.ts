import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    root: ".",
    globalSetup: resolve(__dirname, "backend-test-setup.ts"),
    testTimeout: 60_000,
    hookTimeout: 60_000,
    include: ["tests/src/**/*.test.ts"],
  },
});
