import { ChangeEvent } from "react";

interface InputFieldProps {
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  disabled?: boolean;
  className?: string;
  type?: string;
}

/**
 * Reusable input field component with built-in styling
 */
export function InputField({
  value,
  onChange,
  placeholder,
  disabled = false,
  className = "",
  type = "text",
}: InputFieldProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`font-inherit mr-2 rounded-lg border border-gray-500 bg-gray-800 px-5 py-3 text-base text-white transition-colors duration-200 focus:border-blue-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${className} `.trim()}
    />
  );
}
