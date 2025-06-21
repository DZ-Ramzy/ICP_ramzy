import { ChangeEvent, useState } from "react";
import { Button, Card, InputField } from "../components";
import { backendService } from "../services/backendService";

interface GreetingViewProps {
  onError: (error: string) => void;
  setLoading: (loading: boolean) => void;
}

/**
 * GreetingView component for handling the greeting functionality
 */
export function GreetingView({ onError, setLoading }: GreetingViewProps) {
  const [name, setName] = useState<string>("");
  const [response, setResponse] = useState<string>("");

  const handleChangeText = (event: ChangeEvent<HTMLInputElement>): void => {
    if (!event?.target.value && event?.target.value !== "") {
      return;
    }
    setName(event.target.value);
  };

  const fetchGreeting = async () => {
    try {
      setLoading(true);
      const res = await backendService.greet(name);
      setResponse(res);
    } catch (err) {
      console.error(err);
      onError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Greeting">
      <InputField
        value={name}
        onChange={handleChangeText}
        placeholder="Enter your name"
      />
      <Button onClick={fetchGreeting}>Get Greeting</Button>
      {!!response && (
        <div className={`mt-4 rounded bg-gray-700 p-4 font-bold`}>
          {response}
        </div>
      )}
    </Card>
  );
}
