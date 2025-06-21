import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { LlmPromptView } from "../../src/views/LlmPromptView";
import { act } from "@testing-library/react";

// Mock the backendService
vi.mock("../../src/services/backendService", () => ({
  backendService: {
    sendLlmPrompt: vi.fn().mockResolvedValue("This is a mock LLM response"),
  },
}));

describe("LlmPromptView", () => {
  const mockOnError = vi.fn();
  const mockSetLoading = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the LLM prompt interface", async () => {
    // Setup
    await act(async () => {
      render(
        <LlmPromptView onError={mockOnError} setLoading={mockSetLoading} />,
      );
    });

    // Assert
    expect(screen.getByText("LLM Prompt")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Ask the LLM something..."),
    ).toBeInTheDocument();
    expect(screen.getByText("Send Prompt")).toBeInTheDocument();
  });

  it("should update prompt value when user types in the textarea", async () => {
    // Setup
    await act(async () => {
      render(
        <LlmPromptView onError={mockOnError} setLoading={mockSetLoading} />,
      );
    });

    // Execute
    const textArea = screen.getByPlaceholderText("Ask the LLM something...");
    await act(async () => {
      fireEvent.change(textArea, {
        target: { value: "What is the Internet Computer?" },
      });
    });

    // Assert - Since state is private, we can't assert directly, but we can check if the component behaves correctly later
    expect(textArea).toHaveValue("What is the Internet Computer?");
  });

  it("should send prompt and display response when Send Prompt button is clicked", async () => {
    // Setup
    await act(async () => {
      render(
        <LlmPromptView onError={mockOnError} setLoading={mockSetLoading} />,
      );
    });

    const textArea = screen.getByPlaceholderText("Ask the LLM something...");
    const sendButton = screen.getByText("Send Prompt");

    // Execute
    await act(async () => {
      fireEvent.change(textArea, {
        target: { value: "What is the Internet Computer?" },
      });
    });

    await act(async () => {
      fireEvent.click(sendButton);
    });

    // Assert
    const { backendService } = await import(
      "../../src/services/backendService"
    );
    expect(backendService.sendLlmPrompt).toHaveBeenCalledWith(
      "What is the Internet Computer?",
    );
    expect(await screen.findByText("Response:")).toBeInTheDocument();
    expect(
      await screen.findByText("This is a mock LLM response"),
    ).toBeInTheDocument();
    expect(mockSetLoading).toHaveBeenCalledWith(true);
    expect(mockSetLoading).toHaveBeenCalledWith(false);
  });

  it("should not send empty prompts", async () => {
    // Setup
    await act(async () => {
      render(
        <LlmPromptView onError={mockOnError} setLoading={mockSetLoading} />,
      );
    });

    const textArea = screen.getByPlaceholderText("Ask the LLM something...");
    const sendButton = screen.getByText("Send Prompt");

    // Execute - Set empty text and click send
    await act(async () => {
      fireEvent.change(textArea, { target: { value: "" } });
    });

    await act(async () => {
      fireEvent.click(sendButton);
    });

    // Assert
    const { backendService } = await import(
      "../../src/services/backendService"
    );
    expect(backendService.sendLlmPrompt).not.toHaveBeenCalled();
    expect(screen.queryByText("Response:")).not.toBeInTheDocument();
  });

  it("should handle errors when sending LLM prompt fails", async () => {
    // Setup
    const { backendService } = await import(
      "../../src/services/backendService"
    );
    const errorMessage = "Failed to send LLM prompt";
    vi.mocked(backendService.sendLlmPrompt).mockRejectedValueOnce(
      new Error(errorMessage),
    );

    await act(async () => {
      render(
        <LlmPromptView onError={mockOnError} setLoading={mockSetLoading} />,
      );
    });

    // Execute
    const textArea = screen.getByPlaceholderText("Ask the LLM something...");
    const sendButton = screen.getByText("Send Prompt");

    await act(async () => {
      fireEvent.change(textArea, { target: { value: "Generate an error" } });
    });

    await act(async () => {
      fireEvent.click(sendButton);
    });

    // Assert
    expect(mockOnError).toHaveBeenCalledWith(
      expect.stringContaining(errorMessage),
    );
    expect(mockSetLoading).toHaveBeenCalledWith(false);
  });

  it("should show loading state while waiting for response", async () => {
    // Setup
    const { backendService } = await import(
      "../../src/services/backendService"
    );
    // Create a promise we can control to simulate delay
    let resolvePromise: (value: string) => void;
    const delayPromise = new Promise<string>((resolve) => {
      resolvePromise = resolve;
    });

    vi.mocked(backendService.sendLlmPrompt).mockReturnValueOnce(delayPromise);

    await act(async () => {
      render(
        <LlmPromptView onError={mockOnError} setLoading={mockSetLoading} />,
      );
    });

    // Execute
    const textArea = screen.getByPlaceholderText("Ask the LLM something...");
    await act(async () => {
      fireEvent.change(textArea, { target: { value: "Test loading state" } });
    });

    // Click the button and trigger the async action
    await act(async () => {
      fireEvent.click(screen.getByText("Send Prompt"));
    });

    // Assert loading state
    expect(screen.getByText("Thinking...")).toBeInTheDocument();
    expect(mockSetLoading).toHaveBeenCalledWith(true);

    // Resolve the promise
    await act(async () => {
      resolvePromise!("Response after loading");
    });

    // Assert final state
    expect(screen.getByText("Send Prompt")).toBeInTheDocument();
    expect(mockSetLoading).toHaveBeenCalledWith(false);
    expect(
      await screen.findByText("Response after loading"),
    ).toBeInTheDocument();
  });
});
