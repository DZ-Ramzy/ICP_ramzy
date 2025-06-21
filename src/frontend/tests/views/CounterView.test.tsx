import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { CounterView } from "../../src/views/CounterView";
import { act } from "@testing-library/react";

// Mock the backendService
vi.mock("../../src/services/backendService", () => ({
  backendService: {
    getCount: vi.fn().mockResolvedValue(BigInt(5)),
    incrementCounter: vi.fn().mockResolvedValue(BigInt(6)),
  },
}));

describe("CounterView", () => {
  const mockOnError = vi.fn();
  const mockSetLoading = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch and display the initial counter value on mount", async () => {
    // Setup
    await act(async () => {
      render(<CounterView onError={mockOnError} setLoading={mockSetLoading} />);
    });

    // Assert
    const { backendService } = await import(
      "../../src/services/backendService"
    );
    expect(backendService.getCount).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Counter: 5")).toBeInTheDocument();
  });

  it("should increment the counter when Increment button is clicked", async () => {
    // Setup
    await act(async () => {
      render(<CounterView onError={mockOnError} setLoading={mockSetLoading} />);
    });

    // Execute
    const incrementButton = screen.getByText("Increment");
    await act(async () => {
      fireEvent.click(incrementButton);
    });

    // Assert
    const { backendService } = await import(
      "../../src/services/backendService"
    );
    expect(backendService.incrementCounter).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Counter: 6")).toBeInTheDocument();
    expect(mockSetLoading).toHaveBeenCalledWith(true);
    expect(mockSetLoading).toHaveBeenCalledWith(false);
  });

  it("should refresh the counter when Refresh Count button is clicked", async () => {
    // Setup
    const { backendService } = await import(
      "../../src/services/backendService"
    );
    vi.mocked(backendService.getCount).mockResolvedValueOnce(BigInt(10));

    await act(async () => {
      render(<CounterView onError={mockOnError} setLoading={mockSetLoading} />);
    });

    // Clear initial call to getCount from useEffect
    vi.clearAllMocks();

    // Mock a different value for the refresh
    vi.mocked(backendService.getCount).mockResolvedValueOnce(BigInt(10));

    // Execute
    const refreshButton = screen.getByText("Refresh Count");
    await act(async () => {
      fireEvent.click(refreshButton);
    });

    // Assert
    expect(backendService.getCount).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Counter: 10")).toBeInTheDocument();
    expect(mockSetLoading).toHaveBeenCalledWith(true);
    expect(mockSetLoading).toHaveBeenCalledWith(false);
  });

  it("should handle errors when fetching counter fails", async () => {
    // Setup
    const { backendService } = await import(
      "../../src/services/backendService"
    );
    const errorMessage = "Failed to get count";
    vi.mocked(backendService.getCount).mockRejectedValueOnce(
      new Error(errorMessage),
    );

    await act(async () => {
      render(<CounterView onError={mockOnError} setLoading={mockSetLoading} />);
    });

    // Assert
    expect(mockOnError).toHaveBeenCalledWith(
      expect.stringContaining(errorMessage),
    );
    expect(mockSetLoading).toHaveBeenCalledWith(false);
  });

  it("should handle errors when incrementing counter fails", async () => {
    // Setup
    const { backendService } = await import(
      "../../src/services/backendService"
    );
    const errorMessage = "Failed to increment counter";
    vi.mocked(backendService.incrementCounter).mockRejectedValueOnce(
      new Error(errorMessage),
    );

    await act(async () => {
      render(<CounterView onError={mockOnError} setLoading={mockSetLoading} />);
    });

    // Execute
    const incrementButton = screen.getByText("Increment");
    await act(async () => {
      fireEvent.click(incrementButton);
    });

    // Assert
    expect(mockOnError).toHaveBeenCalledWith(
      expect.stringContaining(errorMessage),
    );
    expect(mockSetLoading).toHaveBeenCalledWith(false);
  });
});
