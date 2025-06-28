import { useState, useEffect } from "react";
import { aiService, MarketInsight } from "../services/enhancedAI";

interface AIInsightModalProps {
  isOpen: boolean;
  onClose: () => void;
  marketTitle: string;
  marketDescription: string;
}

export function AIInsightModal({
  isOpen,
  onClose,
  marketTitle,
  marketDescription,
}: AIInsightModalProps) {
  const [insight, setInsight] = useState<MarketInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !insight) {
      loadInsight();
    }
  }, [isOpen, marketTitle, marketDescription]);

  const loadInsight = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await aiService.getMarketInsight(
        marketTitle,
        marketDescription,
      );
      setInsight(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load AI insight",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setInsight(null);
    loadInsight();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="glass relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-white/10 p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-blue-500">
              <svg
                className="h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Analyse IA du marché
              </h2>
              <p className="text-sm text-white/60">
                Insights et prédictions en temps réel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/60 transition-all hover:bg-white/20 hover:text-white"
          >
            <svg
              className="h-4 w-4"
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

        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-purple-500"></div>
            <p className="text-white/60">
              Analyse des données du marché en cours...
            </p>
            <p className="mt-2 text-sm text-white/40">
              Collecte d'informations depuis plusieurs sources
            </p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
              <svg
                className="h-6 w-6 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <p className="mb-4 text-red-400">{error}</p>
            <button
              onClick={handleRetry}
              className="rounded-lg bg-purple-500 px-4 py-2 text-white transition-colors hover:bg-purple-600"
            >
              Réessayer
            </button>
          </div>
        )}

        {insight && (
          <div className="space-y-6">
            {/* Market Question */}
            <div className="glass-card rounded-xl border border-purple-400/20 p-4">
              <h3 className="mb-2 text-sm font-semibold tracking-wide text-purple-200 uppercase">
                Question du marché
              </h3>
              <p className="leading-relaxed font-medium text-white/90">
                {marketTitle}
              </p>
            </div>

            {/* AI Summary */}
            <div className="glass-card rounded-xl border border-blue-400/20 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500">
                  <svg
                    className="h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white">Résumé IA</h3>
                <span className="rounded-full border border-purple-400/30 bg-gradient-to-r from-purple-500/20 to-blue-500/20 px-3 py-1 text-xs text-purple-200">
                  {insight.confidence}% de fiabilité
                </span>
              </div>
              <p className="mb-4 text-lg leading-relaxed font-medium text-white/95">
                {insight.summary}
              </p>
            </div>

            {/* Enhanced AI Metrics */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Sentiment Score */}
              <div className="glass-card rounded-xl border border-cyan-400/20 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <svg
                    className="h-4 w-4 text-cyan-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-cyan-200">
                    Sentiment
                  </span>
                </div>
                <div className="mb-2 flex items-end gap-2">
                  <span className="text-2xl font-bold text-white">
                    {insight.sentimentScore > 0 ? "+" : ""}
                    {(insight.sentimentScore * 100).toFixed(0)}%
                  </span>
                  <span
                    className={`text-xs ${insight.sentimentScore > 0 ? "text-green-400" : insight.sentimentScore < 0 ? "text-red-400" : "text-gray-400"}`}
                  >
                    {insight.sentimentScore > 0.3
                      ? "Positif"
                      : insight.sentimentScore < -0.3
                        ? "Négatif"
                        : "Neutre"}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-700">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      insight.sentimentScore > 0
                        ? "bg-gradient-to-r from-green-500 to-emerald-400"
                        : insight.sentimentScore < 0
                          ? "bg-gradient-to-r from-red-500 to-orange-400"
                          : "bg-gray-500"
                    }`}
                    style={{
                      width: `${Math.abs(insight.sentimentScore) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Risk Level */}
              <div className="glass-card rounded-xl border border-orange-400/20 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <svg
                    className="h-4 w-4 text-orange-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-orange-200">
                    Niveau de Risque
                  </span>
                </div>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ${
                    insight.riskLevel === "Low"
                      ? "bg-green-500/20 text-green-300"
                      : insight.riskLevel === "Medium"
                        ? "bg-yellow-500/20 text-yellow-300"
                        : "bg-red-500/20 text-red-300"
                  }`}
                >
                  {insight.riskLevel === "Low"
                    ? "Faible"
                    : insight.riskLevel === "Medium"
                      ? "Moyen"
                      : "Élevé"}
                </span>
              </div>

              {/* AI Provider */}
              <div className="glass-card rounded-xl border border-purple-400/20 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <svg
                    className="h-4 w-4 text-purple-400"
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
                  <span className="text-sm font-medium text-purple-200">
                    IA Provider
                  </span>
                </div>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ${
                    insight.aiProvider === "ICP-Native"
                      ? "bg-blue-500/20 text-blue-300"
                      : "bg-gray-500/20 text-gray-300"
                  }`}
                >
                  {insight.aiProvider === "ICP-Native"
                    ? "ICP Native"
                    : "Simulation Avancée"}
                </span>
              </div>
            </div>

            {/* Detailed Analysis */}
            <div className="glass-card rounded-xl border border-emerald-400/20 p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-emerald-200">
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Analyse détaillée
              </h3>
              <p className="leading-relaxed text-white/90">
                {insight.analysis}
              </p>
            </div>

            {/* Probability Assessment */}
            <div className="glass-card rounded-xl border border-yellow-400/20 p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-yellow-200">
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Évaluation probabiliste
              </h3>
              <p className="leading-relaxed text-white/90">
                {insight.probabilityAssessment}
              </p>
            </div>

            {/* Historical Comparisons */}
            {insight.historicalComparisons &&
              insight.historicalComparisons.length > 0 && (
                <div className="glass-card rounded-xl border border-indigo-400/20 p-6">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-indigo-200">
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
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Comparaisons historiques
                  </h3>
                  <div className="space-y-3">
                    {insight.historicalComparisons.map((comparison, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 rounded-lg bg-white/5 p-3"
                      >
                        <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20">
                          <span className="text-xs font-bold text-indigo-300">
                            {index + 1}
                          </span>
                        </div>
                        <p className="flex-1 text-sm leading-relaxed text-white/80">
                          {comparison}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Key Influencing Factors */}
            <div className="glass-card rounded-xl border border-orange-400/20 p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-orange-200">
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
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
                Facteurs d'influence clés
              </h3>
              <p className="leading-relaxed text-white/90">
                {insight.keyInfluencingFactors}
              </p>
            </div>

            {/* Recent Developments */}
            <div className="glass-card rounded-xl border border-red-400/20 p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-red-200">
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Développements récents
              </h3>
              <p className="leading-relaxed text-white/90">
                {insight.recentDevelopments}
              </p>
            </div>

            {/* Sources */}
            <div className="glass-card rounded-xl border border-gray-400/20 p-4">
              <h3 className="mb-3 text-sm font-semibold tracking-wide text-gray-200 uppercase">
                Sources d'information
              </h3>
              <div className="flex flex-wrap gap-2">
                {insight.sources.map((source: string, index: number) => (
                  <span
                    key={index}
                    className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/70"
                  >
                    {source}
                  </span>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-white/10 pt-4 text-xs text-white/40">
              <span>
                Dernière mise à jour :{" "}
                {new Date(insight.lastUpdated).toLocaleString("fr-FR")}
              </span>
              <span className="flex items-center gap-1">
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Analyse alimentée par IA
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
