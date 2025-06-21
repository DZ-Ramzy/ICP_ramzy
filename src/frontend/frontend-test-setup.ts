import "@testing-library/jest-dom/vitest";
import "@testing-library/jest-dom";
import "cross-fetch/polyfill";
import { vi } from "vitest";

// Mock console.error globally to suppress error logs in tests
// This prevents expected errors from cluttering test output
vi.spyOn(console, "error").mockImplementation(() => {});

// Suppress "punnycode" deprecation warning
// while jsdom package doesn't find an alternative
process.removeAllListeners("warning");
process.on("warning", (warning) => {
  // Suppress DEP0040 warnings specifically
  if ((warning as any).code !== "DEP0040") {
    console.warn(warning.stack);
  }
});
