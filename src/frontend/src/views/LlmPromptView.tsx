import { ChangeEvent, useState } from "react";
import { Button, Card, TextArea } from "../components";
import { backendService } from "../services/backendService";

interface LlmPromptViewProps {
  onError: (error: string) => void;
  setLoading: (loading: boolean) => void;
}

/**
 * LlmPromptView component - DISABLED: LLM functionality is not available in current backend
 */
export function LlmPromptView({ onError, setLoading }: LlmPromptViewProps) {
  const [prompt, setPrompt] = useState<string>("");
  const [llmResponse] = useState<string>("");
  const [llmLoading, setLlmLoading] = useState(false);

  const handleChangePrompt = (
    event: ChangeEvent<HTMLTextAreaElement>,
  ): void => {
    if (!event?.target.value && event?.target.value !== "") {
      return;
    }
    setPrompt(event.target.value);
  };

  const sendPrompt = async () => {
    if (!prompt.trim()) return;

    try {
      setLlmLoading(true);
      setLoading(true);
      // This function is not available in the current backend
      await backendService.sendLlmPrompt(prompt);
    } catch (err) {
      console.error(err);
      onError("LLM functionality is not available in the current backend");
    } finally {
      setLlmLoading(false);
      setLoading(false);
    }
  };

  return (
    <Card title="LLM Prompt (DISABLED)">
      <div className="mb-4 rounded border border-yellow-200 bg-yellow-50 p-3 text-yellow-600">
        ⚠️ LLM functionality is not available in the current backend
      </div>
      <TextArea
        value={prompt}
        onChange={handleChangePrompt}
        placeholder="LLM functionality is disabled..."
        disabled
      />
      <Button onClick={sendPrompt} disabled={llmLoading}>
        {llmLoading ? "Thinking..." : "Send Prompt"}
      </Button>
      {!!llmResponse && (
        <div className={`mt-6 rounded bg-gray-800 p-4 text-left`}>
          <h4 className="mt-0 text-blue-400">Response:</h4>
          <p className="mb-0 whitespace-pre-wrap">{llmResponse}</p>
        </div>
      )}
    </Card>
  );
}
