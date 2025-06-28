import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { StrictMode } from "react";
import userEvent from "@testing-library/user-event";
import { Principal } from "@dfinity/principal";
import { AdminView } from "../../src/views/AdminView";

// Mock the prediction market service
vi.mock("../../src/services/predictionMarket", () => ({
  PredictionMarketService: {
    getMarkets: vi.fn(),
    getAdmin: vi.fn(),
    createMarket: vi.fn(),
    closeMarket: vi.fn(),
    setAdmin: vi.fn(),
  },
}));

// Mock the wallet service
vi.mock("../../src/services/wallet", () => ({
  walletService: {
    isConnected: vi.fn().mockReturnValue(true),
    getCurrentPrincipal: vi.fn().mockReturnValue("test-principal"),
  },
}));

// Mock the admin auth service
vi.mock("../../src/services/adminAuth", () => ({
  adminAuthService: {
    isCurrentUserAdmin: vi.fn().mockResolvedValue(true),
  },
}));

const { PredictionMarketService } = await import(
  "../../src/services/predictionMarket"
);

describe("AdminView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should display admin interface when user is admin", async () => {
    // Setup
    vi.mocked(PredictionMarketService.getMarkets).mockResolvedValue([]);
    vi.mocked(PredictionMarketService.getAdmin).mockResolvedValue(null);

    render(
      <StrictMode>
        <AdminView />
      </StrictMode>,
    );

    // Execute & Assert
    await waitFor(() => {
      expect(screen.getByText("Admin Panel")).toBeInTheDocument();
    });

    expect(screen.getByText("Create New Market")).toBeInTheDocument();
    expect(screen.getByText("Manage Markets")).toBeInTheDocument();
  });

  it("should show create market form with required fields", async () => {
    // Setup
    vi.mocked(PredictionMarketService.getMarkets).mockResolvedValue([]);
    vi.mocked(PredictionMarketService.getAdmin).mockResolvedValue(null);

    render(
      <StrictMode>
        <AdminView />
      </StrictMode>,
    );

    // Execute & Assert
    await waitFor(() => {
      expect(screen.getByLabelText(/Market Title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Market Description/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Create Market/i }),
      ).toBeInTheDocument();
    });
  });

  it("should validate form fields before submission", async () => {
    // Setup
    vi.mocked(PredictionMarketService.getMarkets).mockResolvedValue([]);
    vi.mocked(PredictionMarketService.getAdmin).mockResolvedValue(null);

    render(
      <StrictMode>
        <AdminView />
      </StrictMode>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Create Market/i }),
      ).toBeInTheDocument();
    });

    // Execute
    const createButton = screen.getByRole("button", { name: /Create Market/i });
    await userEvent.click(createButton);

    // Assert - Should not call createMarket with empty fields
    expect(PredictionMarketService.createMarket).not.toHaveBeenCalled();
  });

  it("should create market when form is valid", async () => {
    // Setup
    vi.mocked(PredictionMarketService.getMarkets).mockResolvedValue([]);
    vi.mocked(PredictionMarketService.getAdmin).mockResolvedValue(null);
    vi.mocked(PredictionMarketService.createMarket).mockResolvedValue(1);

    render(
      <StrictMode>
        <AdminView />
      </StrictMode>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Market Title/i)).toBeInTheDocument();
    });

    // Execute
    const titleInput = screen.getByLabelText(/Market Title/i);
    const descriptionInput = screen.getByLabelText(/Market Description/i);
    const createButton = screen.getByRole("button", { name: /Create Market/i });

    await userEvent.type(titleInput, "Test Market");
    await userEvent.type(descriptionInput, "Test Description");
    await userEvent.click(createButton);

    // Assert
    await waitFor(() => {
      expect(PredictionMarketService.createMarket).toHaveBeenCalledWith(
        "Test Market",
        "Test Description",
      );
    });
  });

  it("should display existing markets in management section", async () => {
    // Setup
    const mockMarkets = [
      {
        id: 1,
        market: {
          id: 1,
          title: "Test Market 1",
          description: "Test Description 1",
          status: { Open: null },
          result: [] as [],
          yes_pool: 1000,
          no_pool: 800,
          creator: Principal.fromText("rdmx6-jaaaa-aaaaa-aaadq-cai"),
        },
        total_volume: 1800,
        yes_price: 0.556,
        no_price: 0.444,
      },
      {
        id: 2,
        market: {
          id: 2,
          title: "Test Market 2",
          description: "Test Description 2",
          status: { Closed: null },
          result: [{ Yes: null }] as [any],
          yes_pool: 500,
          no_pool: 1200,
          creator: Principal.fromText("rdmx6-jaaaa-aaaaa-aaadq-cai"),
        },
        total_volume: 1700,
        yes_price: 0.294,
        no_price: 0.706,
      },
    ];

    vi.mocked(PredictionMarketService.getMarkets).mockResolvedValue(
      mockMarkets as any,
    );
    vi.mocked(PredictionMarketService.getAdmin).mockResolvedValue(null);

    render(
      <StrictMode>
        <AdminView />
      </StrictMode>,
    );

    // Execute & Assert
    await waitFor(() => {
      expect(screen.getByText("Test Market 1")).toBeInTheDocument();
      expect(screen.getByText("Test Market 2")).toBeInTheDocument();
    });
  });

  it("should show AI configuration panel", async () => {
    // Setup
    vi.mocked(PredictionMarketService.getMarkets).mockResolvedValue([]);
    vi.mocked(PredictionMarketService.getAdmin).mockResolvedValue(null);

    render(
      <StrictMode>
        <AdminView />
      </StrictMode>,
    );

    // Execute & Assert
    await waitFor(() => {
      expect(screen.getByText("AI Configuration")).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/Use ICP-Native AI/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Enable Sentiment Analysis/i),
    ).toBeInTheDocument();
  });

  it("should handle market closure", async () => {
    // Setup
    const mockMarkets = [
      {
        id: 1,
        market: {
          id: 1,
          title: "Active Market",
          description: "Test Description",
          status: { Open: null },
          result: [] as [],
          yes_pool: 1000,
          no_pool: 800,
          creator: Principal.fromText("rdmx6-jaaaa-aaaaa-aaadq-cai"),
        },
        total_volume: 1800,
        yes_price: 0.556,
        no_price: 0.444,
      },
    ];

    vi.mocked(PredictionMarketService.getMarkets).mockResolvedValue(
      mockMarkets as any,
    );
    vi.mocked(PredictionMarketService.getAdmin).mockResolvedValue(null);
    vi.mocked(PredictionMarketService.closeMarket).mockResolvedValue(
      "Market closed successfully",
    );

    render(
      <StrictMode>
        <AdminView />
      </StrictMode>,
    );

    await waitFor(() => {
      expect(screen.getByText("Active Market")).toBeInTheDocument();
    });

    // Execute
    const closeButton = screen.getByRole("button", { name: /Close Market/i });
    await userEvent.click(closeButton);

    // Assert
    await waitFor(() => {
      expect(PredictionMarketService.closeMarket).toHaveBeenCalledWith(
        1,
        expect.any(Object),
      );
    });
  });

  it("should display loading state initially", () => {
    // Setup
    vi.mocked(PredictionMarketService.getMarkets).mockImplementation(
      () => new Promise(() => {}),
    );
    vi.mocked(PredictionMarketService.getAdmin).mockImplementation(
      () => new Promise(() => {}),
    );

    render(
      <StrictMode>
        <AdminView />
      </StrictMode>,
    );

    // Assert
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("should handle errors gracefully", async () => {
    // Setup
    vi.mocked(PredictionMarketService.getMarkets).mockRejectedValue(
      new Error("Network error"),
    );
    vi.mocked(PredictionMarketService.getAdmin).mockRejectedValue(
      new Error("Network error"),
    );

    render(
      <StrictMode>
        <AdminView />
      </StrictMode>,
    );

    // Execute & Assert
    await waitFor(() => {
      expect(screen.getByText(/Error loading data/i)).toBeInTheDocument();
    });
  });
});
