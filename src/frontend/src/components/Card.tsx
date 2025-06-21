import { ReactNode } from "react";

interface CardProps {
  title: string;
  children: ReactNode;
  className?: string;
}

/**
 * Reusable card component that serves as a container
 */
export function Card({ title, children, className = "" }: CardProps) {
  return (
    <div
      className={`my-4 rounded-lg border border-gray-300 p-8 transition-opacity duration-200 ease-out ${className}`}
    >
      <h3>{title}</h3>
      {children}
    </div>
  );
}
