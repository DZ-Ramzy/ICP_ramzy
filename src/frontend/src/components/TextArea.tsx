import { ChangeEvent } from "react";

interface TextAreaProps {
  value: string;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  rows?: number;
  disabled?: boolean;
  className?: string;
}

/**
 * Reusable text area component with built-in styling
 */
export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 4,
  disabled = false,
  className = "",
}: TextAreaProps) {
  return (
    <textarea
      rows={rows}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`font-inherit mb-4 w-full resize-y rounded-lg border border-gray-500 bg-gray-800 px-5 py-3 text-base text-white transition-colors duration-200 focus:border-blue-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${className} `.trim()}
    />
  );
}
