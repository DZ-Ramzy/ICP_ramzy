import { useState, useEffect } from "react";
import { Button, Card } from "../components";
import { backendService } from "../services/backendService";

interface CounterViewProps {
  onError: (error: string) => void;
  setLoading: (loading: boolean) => void;
}

/**
 * CounterView component for handling the counter functionality
 */
export function CounterView({ onError, setLoading }: CounterViewProps) {
  const [count, setCount] = useState<bigint>(BigInt(0));

  const fetchCount = async () => {
    try {
      setLoading(true);
      const res = await backendService.getCount();
      setCount(res);
    } catch (err) {
      console.error(err);
      onError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const incrementCounter = async () => {
    try {
      setLoading(true);
      const res = await backendService.incrementCounter();
      setCount(res);
    } catch (err) {
      console.error(err);
      onError(String(err));
    } finally {
      setLoading(false);
    }
  };

  // Fetch the initial count when component mounts
  useEffect(() => {
    fetchCount();
  }, []);

  return (
    <Card title={`Counter: ${count.toString()}`}>
      <Button onClick={incrementCounter}>Increment</Button>
      <Button onClick={fetchCount}>Refresh Count</Button>
    </Card>
  );
}
