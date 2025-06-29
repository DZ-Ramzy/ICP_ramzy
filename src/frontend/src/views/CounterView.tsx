import { useState, useEffect } from "react";
import { Button, Card } from "../components";
import { backendService } from "../services/backendService";

interface CounterViewProps {
  onError: (error: string) => void;
  setLoading: (loading: boolean) => void;
}

/**
 * CounterView component - DISABLED: Counter functionality is not available in current backend
 */
export function CounterView({ onError, setLoading }: CounterViewProps) {
  const [count] = useState<bigint>(BigInt(0));

  const fetchCount = async () => {
    try {
      setLoading(true);
      // This function is not available in the current backend
      await backendService.getCount();
    } catch (err) {
      console.error(err);
      onError("Counter functionality is not available in the current backend");
    } finally {
      setLoading(false);
    }
  };

  const incrementCounter = async () => {
    try {
      setLoading(true);
      // This function is not available in the current backend
      await backendService.incrementCounter();
    } catch (err) {
      console.error(err);
      onError("Counter functionality is not available in the current backend");
    } finally {
      setLoading(false);
    }
  };

  // Don't fetch on mount since the function is not available
  useEffect(() => {
    // fetchCount(); // Disabled
  }, []);

  return (
    <Card title={`Counter: ${count.toString()} (DISABLED)`}>
      <div className="mb-4 rounded border border-yellow-200 bg-yellow-50 p-3 text-yellow-600">
        ⚠️ Counter functionality is not available in the current backend
      </div>
      <Button onClick={incrementCounter} disabled>
        Increment (Disabled)
      </Button>
      <Button onClick={fetchCount} disabled>
        Refresh Count (Disabled)
      </Button>
    </Card>
  );
}
