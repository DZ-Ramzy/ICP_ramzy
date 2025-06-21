import { describe, it, expect, vi, beforeEach } from "vitest";
import { backendService } from "../../src/services/backendService";
import { backend } from "../../../declarations/backend";

// Mock the backend canister
vi.mock("../../../declarations/backend", () => ({
  backend: {
    greet: vi.fn().mockResolvedValue("Hello, Test User!"),
    get_count: vi.fn().mockResolvedValue(BigInt(42)),
    increment: vi.fn().mockResolvedValue(BigInt(43)),
    prompt: vi.fn().mockResolvedValue("This is a mock LLM response"),
  },
}));

describe("backendService", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  describe("greet", () => {
    it("should call backend.greet with the provided name", async () => {
      // Execute
      const result = await backendService.greet("Test User");

      // Assert
      expect(backend.greet).toHaveBeenCalledWith("Test User");
      expect(result).toBe("Hello, Test User!");
    });
  });

  describe("getCount", () => {
    it("should call backend.get_count", async () => {
      // Execute
      const result = await backendService.getCount();

      // Assert
      expect(backend.get_count).toHaveBeenCalled();
      expect(result).toBe(BigInt(42));
    });
  });

  describe("incrementCounter", () => {
    it("should call backend.increment", async () => {
      // Execute
      const result = await backendService.incrementCounter();

      // Assert
      expect(backend.increment).toHaveBeenCalled();
      expect(result).toBe(BigInt(43));
    });
  });

  describe("sendLlmPrompt", () => {
    it("should call backend.prompt with the provided prompt", async () => {
      // Execute
      const result = await backendService.sendLlmPrompt("Test prompt");

      // Assert
      expect(backend.prompt).toHaveBeenCalledWith("Test prompt");
      expect(result).toBe("This is a mock LLM response");
    });
  });
});
