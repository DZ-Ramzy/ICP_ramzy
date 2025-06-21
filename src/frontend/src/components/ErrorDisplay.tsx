/**
 * Component for displaying error messages
 */
interface ErrorDisplayProps {
  message: string;
}

export function ErrorDisplay({ message }: ErrorDisplayProps) {
  return <pre className="text-left text-red-500">{message}</pre>;
}
