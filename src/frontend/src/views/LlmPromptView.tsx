import { ChangeEvent, useState } from "react";
import { Button, Card, TextArea } from "../components";
import { backendService } from "../services/backendService";

interface LlmPromptViewProps {
  onError: (error: string) => void;
  setLoading: (loading: boolean) => void;
}

/**
 * LlmPromptView component for handling interactions with the LLM
 */
export function LlmPromptView({ onError, setLoading }: LlmPromptViewProps) {
  const [prompt, setPrompt] = useState<string>("");
  const [llmResponse, setLlmResponse] = useState<string>("");
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
      setLoading(true); // Use the setLoading prop to indicate loading state at App level
      const res = await backendService.sendLlmPrompt(prompt);
      setLlmResponse(res);
    } catch (err) {
      console.error(err);
      onError(String(err));
    } finally {
      setLlmLoading(false);
      setLoading(false); // Reset loading state
    }
  };

  return (
    <Card title="LLM Prompt">
      <TextArea
        value={prompt}
        onChange={handleChangePrompt}
        placeholder="Ask the LLM something..."
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
