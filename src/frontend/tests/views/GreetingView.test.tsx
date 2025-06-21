import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import { GreetingView } from "../../src/views/GreetingView";
import { backendService } from "../../src/services/backendService";
import userEvent from "@testing-library/user-event";

// Mock the backendService
vi.mock("../../src/services/backendService", () => ({
  backendService: {
    greet: vi.fn().mockResolvedValue("Hello, Test User!"),
  },
}));

describe("GreetingView", () => {
  const mockSetLoading = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  it("should render the greeting input and button", () => {
    // Setup
    render(
      <StrictMode>
        <GreetingView onError={mockOnError} setLoading={mockSetLoading} />
      </StrictMode>,
    );

    // Assert
    expect(screen.getByPlaceholderText("Enter your name")).toBeInTheDocument();
    expect(screen.getByText("Get Greeting")).toBeInTheDocument();
  });

  it("should call the greet service and display the response when button is clicked", async () => {
    // Setup
    render(
      <StrictMode>
        <GreetingView onError={mockOnError} setLoading={mockSetLoading} />
      </StrictMode>,
    );

    // Execute
    const input = screen.getByPlaceholderText("Enter your name");
    await userEvent.type(input, "Test User");
    await userEvent.click(screen.getByText("Get Greeting"));

    // Assert
    expect(mockSetLoading).toHaveBeenCalledWith(true);
    expect(backendService.greet).toHaveBeenCalledWith("Test User");
    expect(await screen.findByText("Hello, Test User!")).toBeInTheDocument();
    expect(mockSetLoading).toHaveBeenLastCalledWith(false);
  });

  it("should handle error when service call fails", async () => {
    // Setup - override mock to throw an error
    const errorMessage = "Failed to fetch greeting";
    vi.mocked(backendService.greet).mockRejectedValueOnce(
      new Error(errorMessage),
    );

    render(
      <StrictMode>
        <GreetingView onError={mockOnError} setLoading={mockSetLoading} />
      </StrictMode>,
    );

    // Execute
    await userEvent.click(screen.getByText("Get Greeting"));

    // Assert
    expect(mockOnError).toHaveBeenCalledWith(
      expect.stringContaining(errorMessage),
    );
    expect(mockSetLoading).toHaveBeenLastCalledWith(false);
  });
});
