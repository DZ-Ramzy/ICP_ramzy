import { ReactNode } from "react";

interface ButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Reusable button component with built-in styling
 */
export function Button({
  onClick,
  disabled = false,
  className = "",
  children,
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`font-inherit focus:outline-auto bg-gray mx-2 cursor-pointer rounded-lg border border-gray-500 px-5 py-3 text-base font-medium text-white transition-colors duration-200 hover:border-blue-400 focus:outline-4 focus:outline-blue-400 disabled:cursor-not-allowed disabled:opacity-50 ${className} `.trim()}
    >
      {children}
    </button>
  );
}
