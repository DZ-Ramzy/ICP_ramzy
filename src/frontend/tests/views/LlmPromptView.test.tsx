import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LlmPromptView } from "../../src/views/LlmPromptView";
import { act } from "react";

describe("LlmPromptView", () => {
  const mockOnError = vi.fn();
  const mockSetLoading = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should display disabled LLM interface", async () => {
    // Setup & Execute
    await act(async () => {
      render(<LlmPromptView onError={mockOnError} setLoading={mockSetLoading} />);
    });

    // Assert
    expect(screen.getByText("LLM Prompt (DISABLED)")).toBeInTheDocument();
    expect(
      screen.getByText("⚠️ LLM functionality is not available in the current backend")
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("LLM functionality is disabled...")).toBeInTheDocument();
    expect(screen.getByText("Send Prompt")).toBeInTheDocument();
  });

  it("should have disabled textarea", async () => {
    // Setup & Execute
    await act(async () => {
      render(<LlmPromptView onError={mockOnError} setLoading={mockSetLoading} />);
    });

    // Assert
    const textarea = screen.getByPlaceholderText("LLM functionality is disabled...");
    expect(textarea).toBeDisabled();
  });

  it("should not call LLM service when disabled", async () => {
    // Setup & Execute
    await act(async () => {
      render(<LlmPromptView onError={mockOnError} setLoading={mockSetLoading} />);
    });

    // Assert - should not have called any LLM methods since feature is disabled
    expect(mockOnError).not.toHaveBeenCalled();
  });
});
