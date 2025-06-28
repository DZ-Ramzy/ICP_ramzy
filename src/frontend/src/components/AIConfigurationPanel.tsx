import { useState, useEffect } from "react";
import { aiService, AIConfiguration } from "../services/enhancedAI";

interface AIConfigurationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIConfigurationPanel({
  isOpen,
  onClose,
}: AIConfigurationPanelProps) {
  const [config, setConfig] = useState<AIConfiguration>({
    useICPNative: false,
    fallbackToSimulation: true,
    enableSentimentAnalysis: true,
    enableHistoricalComparison: true,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfig(aiService.getConfigurationStatus());
    }
  }, [isOpen]);

  const handleConfigChange = (key: keyof AIConfiguration, value: boolean) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    aiService.setConfiguration({ [key]: value });
  };

  const handleEnableICPNative = async () => {
    setIsLoading(true);
    try {
      await aiService.enableICPNativeMode();
      setConfig(aiService.getConfigurationStatus());
    } catch (error) {
      console.error("Failed to enable ICP Native AI:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCache = () => {
    aiService.clearCache();
    // Optionnel: afficher un toast de confirmation
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-2xl">
        <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-gray-900/95 p-8 shadow-2xl backdrop-blur-xl">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-cyan-500/10"></div>

          <div className="relative z-10">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-purple-500 to-blue-500">
                  <svg
                    className="h-6 w-6 text-white"
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
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    AI Configuration
                  </h2>
                  <p className="text-sm text-white/70">
                    Configure AI analysis settings and providers
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/60 transition-all duration-200 hover:bg-white/20 hover:text-white"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Configuration Options */}
            <div className="space-y-6">
              {/* ICP Native AI */}
              <div className="rounded-xl border border-white/20 bg-white/5 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      ICP Native AI
                    </h3>
                    <p className="text-sm text-white/70">
                      Use Internet Computer's native AI infrastructure
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-sm font-medium ${config.useICPNative ? "text-green-300" : "text-gray-400"}`}
                    >
                      {config.useICPNative ? "Enabled" : "Disabled"}
                    </span>
                    <button
                      onClick={handleEnableICPNative}
                      disabled={isLoading}
                      className="gradient-icp-primary rounded-lg px-4 py-2 text-sm font-medium text-white transition-all duration-300 hover:scale-105 disabled:opacity-50"
                    >
                      {isLoading ? "Checking..." : "Enable ICP AI"}
                    </button>
                  </div>
                </div>
                <div className="text-xs text-white/50">
                  ⚠️ Currently in development. Falls back to enhanced
                  simulation.
                </div>
              </div>

              {/* Configuration Toggles */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-white/20 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-white">Fallback Mode</h4>
                      <p className="text-xs text-white/60">
                        Use simulation if ICP AI fails
                      </p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={config.fallbackToSimulation}
                        onChange={(e) =>
                          handleConfigChange(
                            "fallbackToSimulation",
                            e.target.checked,
                          )
                        }
                        className="peer sr-only"
                      />
                      <div className="peer h-6 w-11 rounded-full bg-gray-600 peer-checked:bg-blue-500 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                    </label>
                  </div>
                </div>

                <div className="rounded-xl border border-white/20 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-white">
                        Sentiment Analysis
                      </h4>
                      <p className="text-xs text-white/60">
                        Analyze market sentiment
                      </p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={config.enableSentimentAnalysis}
                        onChange={(e) =>
                          handleConfigChange(
                            "enableSentimentAnalysis",
                            e.target.checked,
                          )
                        }
                        className="peer sr-only"
                      />
                      <div className="peer h-6 w-11 rounded-full bg-gray-600 peer-checked:bg-blue-500 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                    </label>
                  </div>
                </div>

                <div className="rounded-xl border border-white/20 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-white">
                        Historical Comparison
                      </h4>
                      <p className="text-xs text-white/60">
                        Include historical data analysis
                      </p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={config.enableHistoricalComparison}
                        onChange={(e) =>
                          handleConfigChange(
                            "enableHistoricalComparison",
                            e.target.checked,
                          )
                        }
                        className="peer sr-only"
                      />
                      <div className="peer h-6 w-11 rounded-full bg-gray-600 peer-checked:bg-blue-500 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                    </label>
                  </div>
                </div>

                <div className="rounded-xl border border-white/20 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-white">Clear Cache</h4>
                      <p className="text-xs text-white/60">
                        Reset AI analysis cache
                      </p>
                    </div>
                    <button
                      onClick={handleClearCache}
                      className="rounded-lg bg-red-500/20 px-3 py-1 text-sm font-medium text-red-300 transition-all duration-300 hover:bg-red-500/30"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Info */}
              <div className="rounded-xl border border-blue-400/30 bg-blue-500/10 p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20">
                    <svg
                      className="h-4 w-4 text-blue-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="mb-1 text-sm font-bold text-blue-300">
                      Current AI Provider
                    </h4>
                    <p className="text-sm text-blue-200/80">
                      {config.useICPNative
                        ? "ICP Native AI"
                        : "Enhanced Simulation"}
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-blue-200/60">
                      <li>• Real-time sentiment analysis</li>
                      <li>• Historical pattern recognition</li>
                      <li>• Risk assessment algorithms</li>
                      <li>• Market-specific analysis</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
