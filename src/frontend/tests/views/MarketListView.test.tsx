import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { StrictMode } from "react";
import userEvent from "@testing-library/user-event";
import { MarketListView } from "../../src/views/MarketListView";
import { PredictionMarketService } from "../../src/services/predictionMarket";
import { Principal } from "@dfinity/principal";

// Mock the prediction market service
vi.mock("../../src/services/predictionMarket", () => ({
  PredictionMarketService: {
    getMarkets: vi.fn(),
    getStatusDisplay: vi.fn().mockReturnValue("Open"),
    formatPrice: vi
      .fn()
      .mockImplementation((price: number) => `${(price * 100).toFixed(1)}%`),
  },
}));

// Mock the AI service
vi.mock("../../src/services/ai", () => ({
  aiService: {
    getMarketInsight: vi.fn(),
  },
}));

// Mock the wallet service
vi.mock("../../src/services/wallet", () => ({
  walletService: {
    isConnected: vi.fn().mockReturnValue(false),
    getBalance: vi.fn().mockReturnValue(0),
    onConnectionChange: vi.fn(),
    onBalanceChange: vi.fn(),
  },
}));

// Mock the admin auth service
vi.mock("../../src/services/adminAuth", () => ({
  adminAuthService: {
    isCurrentUserAdmin: vi.fn().mockResolvedValue(false),
    getCurrentUserPrincipal: vi.fn().mockResolvedValue(null),
  },
}));

// Mock React Router
vi.mock("react-router-dom", () => ({
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

describe("MarketListView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should display loading state initially", () => {
    // Setup
    vi.mocked(PredictionMarketService.getMarkets).mockImplementation(
      () => new Promise(() => {}),
    ); // Never resolves

    render(
      <StrictMode>
        <MarketListView />
      </StrictMode>,
    );

    // Assert
    expect(document.querySelector(".loading-spinner")).toBeInTheDocument();
  });

  it("should display markets when loaded successfully", async () => {
    // Setup
    const mockMarkets = [
      {
        id: 1,
        market: {
          id: 1,
          title: "Will Bitcoin reach $100k by 2025?",
          description: "Prediction about Bitcoin price",
          creator: Principal.fromText("rdmx6-jaaaa-aaaaa-aaadq-cai"),
          yes_pool: 1000,
          no_pool: 800,
          status: { Open: null },
          result: [] as [] | [any],
        },
        total_volume: 1800,
        yes_price: 0.556,
        no_price: 0.444,
      },
      {
        id: 2,
        market: {
          id: 2,
          title: "Will AI replace developers by 2030?",
          description: "Prediction about AI development",
          creator: Principal.fromText("rdmx6-jaaaa-aaaaa-aaadq-cai"),
          yes_pool: 500,
          no_pool: 1200,
          status: { Open: null },
          result: [] as [] | [any],
        },
        total_volume: 1700,
        yes_price: 0.294,
        no_price: 0.706,
      },
    ];

    vi.mocked(PredictionMarketService.getMarkets).mockResolvedValue(
      mockMarkets,
    );

    render(
      <StrictMode>
        <MarketListView />
      </StrictMode>,
    );

    // Execute & Assert
    await waitFor(() => {
      expect(
        screen.getByText("Will Bitcoin reach $100k by 2025?"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Will AI replace developers by 2030?"),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText("Prediction about Bitcoin price"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Prediction about AI development"),
    ).toBeInTheDocument();
  });

  it("should display error message when markets fail to load", async () => {
    // Setup
    vi.mocked(PredictionMarketService.getMarkets).mockRejectedValue(
      new Error("Failed to fetch markets"),
    );

    render(
      <StrictMode>
        <MarketListView />
      </StrictMode>,
    );

    // Execute & Assert
    await waitFor(() => {
      expect(screen.getByText("Error loading markets")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: "Try Again" }),
    ).toBeInTheDocument();
  });

  it("should retry loading markets when try again button is clicked", async () => {
    // Setup - Start with error, then manually change the mock for the retry
    const getMockSpy = vi.mocked(PredictionMarketService.getMarkets);
    getMockSpy.mockReset();
    getMockSpy.mockRejectedValue(new Error("Failed to fetch markets"));

    render(
      <StrictMode>
        <MarketListView />
      </StrictMode>,
    );

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText("Error loading markets")).toBeInTheDocument();
    });

    // Now change the mock to succeed for the retry
    getMockSpy.mockResolvedValue([]);

    // Execute - Click try again button
    const tryAgainButton = screen.getByRole("button", { name: "Try Again" });
    await userEvent.click(tryAgainButton);

    // Assert - Should show success state (empty markets)
    await waitFor(() => {
      expect(screen.getByText("No markets available")).toBeInTheDocument();
    });

    expect(screen.queryByText("Error loading markets")).not.toBeInTheDocument();
  });

  it("should navigate to market detail when market is clicked", async () => {
    // Setup
    const mockMarkets = [
      {
        id: 1,
        market: {
          id: 1,
          title: "Test Market",
          description: "Test Description",
          creator: Principal.fromText("rdmx6-jaaaa-aaaaa-aaadq-cai"),
          yes_pool: 1000,
          no_pool: 800,
          status: { Open: null },
          result: [] as [] | [any],
        },
        total_volume: 1800,
        yes_price: 0.556,
        no_price: 0.444,
      },
    ];

    vi.mocked(PredictionMarketService.getMarkets).mockResolvedValue(
      mockMarkets,
    );

    render(
      <StrictMode>
        <MarketListView />
      </StrictMode>,
    );

    // Wait for markets to load
    await waitFor(() => {
      expect(screen.getByText("Test Market")).toBeInTheDocument();
    });

    // Execute
    const marketCard = screen.getByText("Test Market").closest("a");
    if (marketCard) {
      await userEvent.click(marketCard);
    }

    // Assert - Check that the link points to the correct market detail page
    expect(marketCard).toHaveAttribute("href", "/market/1");
  });

  it("should display admin link for admin users", async () => {
    // Setup
    const { adminAuthService } = await import("../../src/services/adminAuth");
    vi.mocked(adminAuthService.isCurrentUserAdmin).mockResolvedValue(true);

    vi.mocked(PredictionMarketService.getMarkets).mockResolvedValue([]);

    render(
      <StrictMode>
        <MarketListView />
      </StrictMode>,
    );

    // Execute & Assert
    await waitFor(() => {
      expect(screen.getByText("Create Market")).toBeInTheDocument();
    });
  });

  it("should show market navigation arrow on hover", async () => {
    // Setup
    const mockMarkets = [
      {
        id: 1,
        market: {
          id: 1,
          title: "Test Market",
          description: "Test Description",
          creator: Principal.fromText("rdmx6-jaaaa-aaaaa-aaadq-cai"),
          yes_pool: 1000,
          no_pool: 800,
          status: { Open: null },
          result: [] as [] | [any],
        },
        total_volume: 1800,
        yes_price: 0.556,
        no_price: 0.444,
      },
    ];

    vi.mocked(PredictionMarketService.getMarkets).mockResolvedValue(
      mockMarkets,
    );

    render(
      <StrictMode>
        <MarketListView />
      </StrictMode>,
    );

    // Execute & Assert
    await waitFor(() => {
      expect(screen.getByText("Test Market")).toBeInTheDocument();
    });

    // Check that the navigation arrow is present (it appears on hover)
    const arrowIcon = document.querySelector('svg[viewBox="0 0 24 24"]');
    expect(arrowIcon).toBeInTheDocument();
  });
});
