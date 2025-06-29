import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CounterView } from "../../src/views/CounterView";
import { act } from "react";

describe("CounterView", () => {
  const mockOnError = vi.fn();
  const mockSetLoading = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should display disabled counter interface", async () => {
    // Setup & Execute
    await act(async () => {
      render(<CounterView onError={mockOnError} setLoading={mockSetLoading} />);
    });

    // Assert
    expect(screen.getByText("Counter: 0 (DISABLED)")).toBeInTheDocument();
    expect(
      screen.getByText(
        "⚠️ Counter functionality is not available in the current backend",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Increment (Disabled)")).toBeInTheDocument();
    expect(screen.getByText("Refresh Count (Disabled)")).toBeInTheDocument();
  });

  it("should have disabled buttons", async () => {
    // Setup & Execute
    await act(async () => {
      render(<CounterView onError={mockOnError} setLoading={mockSetLoading} />);
    });

    // Assert
    const incrementButton = screen.getByText("Increment (Disabled)");
    const refreshButton = screen.getByText("Refresh Count (Disabled)");

    expect(incrementButton).toBeDisabled();
    expect(refreshButton).toBeDisabled();
  });

  it("should not call backend services when disabled", async () => {
    // Setup & Execute
    await act(async () => {
      render(<CounterView onError={mockOnError} setLoading={mockSetLoading} />);
    });

    // Assert - should not have called any backend methods since feature is disabled
    expect(mockOnError).not.toHaveBeenCalled();
  });
});
