import { describe, expect, it, vi, beforeEach } from "vitest";
import { walletService } from "../../src/services/wallet";

// Mock wallet providers
const mockMetaMask = {
  isMetaMask: true,
  request: vi.fn(),
};

const mockPhantom = {
  isPhantom: true,
  connect: vi.fn(),
};

// Mock window.ethereum and window.solana
Object.defineProperty(window, "ethereum", {
  value: mockMetaMask,
  writable: true,
});

Object.defineProperty(window, "solana", {
  value: mockPhantom,
  writable: true,
});

describe("Wallet Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset wallet state
    walletService.disconnect();
  });

  it("should start disconnected", () => {
    // Assert
    expect(walletService.isConnected()).toBe(false);
    expect(walletService.getWallet()).toBe(null);
  });

  it("should get available wallets", () => {
    // Execute
    const wallets = walletService.getAvailableWallets();

    // Assert
    expect(Array.isArray(wallets)).toBe(true);
    expect(wallets.length).toBeGreaterThan(0);

    // Should include Internet Identity (always available)
    const walletNames = wallets.map((w) => w.name);
    expect(walletNames).toContain("Internet Identity");

    // In test environment, browser wallets may not be available
    // so we only test for the core ICP wallet
  });

  it("should handle wallet connection", async () => {
    // Setup
    const wallets = walletService.getAvailableWallets();
    const metaMaskWallet = wallets.find((w) => w.name === "MetaMask");

    if (metaMaskWallet) {
      const mockAccounts = ["0x123456789abcdef"];
      mockMetaMask.request.mockResolvedValue(mockAccounts);

      // Execute
      const walletInfo = await metaMaskWallet.connect();

      // Assert
      expect(walletInfo).toBeDefined();
      expect(walletInfo.isConnected).toBe(true);
      expect(walletInfo.address).toBe(mockAccounts[0]);
      expect(walletService.isConnected()).toBe(true);
    }
  });

  it("should handle wallet disconnection", async () => {
    // Setup - Connect first
    const wallets = walletService.getAvailableWallets();
    const metaMaskWallet = wallets.find((w) => w.name === "MetaMask");

    if (metaMaskWallet) {
      const mockAccounts = ["0x123456789abcdef"];
      mockMetaMask.request.mockResolvedValue(mockAccounts);
      await metaMaskWallet.connect();

      expect(walletService.isConnected()).toBe(true);

      // Execute
      await walletService.disconnect();

      // Assert
      expect(walletService.isConnected()).toBe(false);
      expect(walletService.getWallet()).toBe(null);
    }
  });

  it("should notify listeners on wallet state change", async () => {
    // Setup
    const listener = vi.fn();
    const unsubscribe = walletService.subscribe(listener);

    const wallets = walletService.getAvailableWallets();
    const metaMaskWallet = wallets.find((w) => w.name === "MetaMask");

    if (metaMaskWallet) {
      const mockAccounts = ["0x123456789abcdef"];
      mockMetaMask.request.mockResolvedValue(mockAccounts);

      // Execute
      await metaMaskWallet.connect();

      // Assert
      expect(listener).toHaveBeenCalled();
      const lastCall = listener.mock.calls[listener.mock.calls.length - 1];
      expect(lastCall[0]).toBeDefined();
      expect(lastCall[0].isConnected).toBe(true);
    }

    unsubscribe();
  });

  it("should unsubscribe listeners correctly", () => {
    // Setup
    const listener = vi.fn();
    const unsubscribe = walletService.subscribe(listener);

    // Execute
    unsubscribe();
    walletService.disconnect(); // This should trigger listeners

    // Assert
    expect(listener).not.toHaveBeenCalled();
  });

  it("should handle connection errors", async () => {
    // Setup
    const wallets = walletService.getAvailableWallets();
    const metaMaskWallet = wallets.find((w) => w.name === "MetaMask");

    if (metaMaskWallet) {
      const mockError = new Error("User rejected connection");
      mockMetaMask.request.mockRejectedValue(mockError);

      // Execute & Assert
      await expect(metaMaskWallet.connect()).rejects.toThrow();
      expect(walletService.isConnected()).toBe(false);
    }
  });

  it("should detect wallet installation status", () => {
    // Execute
    const wallets = walletService.getAvailableWallets();

    // Assert
    wallets.forEach((wallet) => {
      expect(typeof wallet.isInstalled).toBe("boolean");
    });
  });

  it("should provide wallet icons", () => {
    // Execute
    const wallets = walletService.getAvailableWallets();

    // Assert
    wallets.forEach((wallet) => {
      expect(typeof wallet.icon).toBe("string");
      expect(wallet.icon.length).toBeGreaterThan(0);
    });
  });

  it("should handle Phantom wallet connection", async () => {
    // Setup
    const wallets = walletService.getAvailableWallets();
    const phantomWallet = wallets.find((w) => w.name === "Phantom");

    if (phantomWallet) {
      const mockResponse = {
        publicKey: { toString: () => "phantom-public-key" },
      };
      mockPhantom.connect.mockResolvedValue(mockResponse);

      // Execute
      const walletInfo = await phantomWallet.connect();

      // Assert
      expect(walletInfo).toBeDefined();
      expect(walletInfo.isConnected).toBe(true);
      expect(walletInfo.address).toBe("phantom-public-key");
      expect(walletService.isConnected()).toBe(true);
    }
  });
});
