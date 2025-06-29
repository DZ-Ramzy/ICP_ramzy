import { describe, it, expect, vi, beforeEach } from "vitest";
import { backendService } from "../../src/services/backendService";
import { backend } from "../../../declarations/backend";

// Mock the backend canister
vi.mock("../../../declarations/backend", () => ({
  backend: {
    greet: vi
      .fn()
      .mockImplementation((name: string) => Promise.resolve(`Hello, ${name}!`)),
    is_admin: vi.fn().mockResolvedValue(false),
    get_markets: vi.fn().mockResolvedValue([]),
    get_balance: vi.fn().mockResolvedValue(BigInt(0)),
    set_message: vi.fn().mockResolvedValue("Message set"),
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

  describe("greet", () => {
    it("should call backend.greet", async () => {
      // Execute
      const result = await backendService.greet("test");

      // Assert
      expect(backend.greet).toHaveBeenCalledWith("test");
      expect(result).toBe("Hello, test!");
    });
  });

  describe("isAdmin", () => {
    it("should throw an error for disabled isAdmin functionality", async () => {
      // Execute & Assert
      await expect(backendService.isAdmin()).rejects.toThrow(
        "isAdmin is not available in the current backend API",
      );
    });
  });

  describe("sendLlmPrompt", () => {
    it("should throw an error for disabled LLM functionality", async () => {
      // Execute & Assert
      await expect(backendService.sendLlmPrompt("Test prompt")).rejects.toThrow(
        "sendLlmPrompt function is not available in the current backend",
      );
    });
  });
});
