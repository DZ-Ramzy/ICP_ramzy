import { useState } from "react";

interface AIInsightButtonProps {
  onClick: () => void;
  loading?: boolean;
  className?: string;
}

export function AIInsightButton({
  onClick,
  loading = false,
  className = "",
}: AIInsightButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      disabled={loading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative flex items-center gap-2 rounded-xl px-4 py-2 transition-all duration-300 ${
        loading
          ? "cursor-not-allowed bg-purple-500/30"
          : "border border-purple-400/30 bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:border-purple-400/50 hover:from-purple-500/30 hover:to-blue-500/30"
      } ${className}`}
      title="Get AI insights about this market"
    >
      {/* AI Icon */}
      <div
        className={`relative transition-transform duration-300 ${isHovered ? "scale-110" : "scale-100"}`}
      >
        {loading ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-300/30 border-t-purple-400"></div>
        ) : (
          <svg
            className="h-5 w-5 text-purple-300 transition-colors group-hover:text-purple-200"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        )}

        {/* Glow effect */}
        {!loading && (
          <div
            className={`absolute inset-0 rounded-full bg-purple-400/20 blur-md transition-opacity duration-300 ${
              isHovered ? "opacity-60" : "opacity-0"
            }`}
          ></div>
        )}
      </div>

      {/* Text */}
      <span className="text-sm font-medium text-purple-200 transition-colors group-hover:text-white">
        {loading ? "Analyzing..." : "AI Insights"}
      </span>

      {/* Pulse animation when not loading */}
      {!loading && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
      )}
    </button>
  );
}
