import { useState, useEffect } from "react";
import { PredictionMarketService } from "../services/predictionMarket";
import { AIConfigurationPanel } from "../components/AIConfigurationPanel";
import type { Principal } from "@dfinity/principal";

interface MarketSummary {
  market: {
    id: number;
    title: string;
    description: string;
    status: any;
    result?: any;
    yes_pool: number;
    no_pool: number;
  };
  yes_price: number;
  no_price: number;
  total_volume: number;
}

export function AdminView() {
  const [markets, setMarkets] = useState<MarketSummary[]>([]);
  const [admin, setAdmin] = useState<Principal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [newMarketTitle, setNewMarketTitle] = useState("");
  const [newMarketDescription, setNewMarketDescription] = useState("");
  const [creatingMarket, setCreatingMarket] = useState(false);

  // Admin form
  const [adminInput, setAdminInput] = useState("");
  const [settingAdmin, setSettingAdmin] = useState(false);

  // AI Configuration
  const [showAIConfig, setShowAIConfig] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [marketData, adminData] = await Promise.all([
        PredictionMarketService.getMarkets(),
        PredictionMarketService.getAdmin(),
      ]);
      setMarkets(marketData);
      setAdmin(adminData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMarket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMarketTitle.trim() || !newMarketDescription.trim()) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setCreatingMarket(true);
      await PredictionMarketService.createMarket(
        newMarketTitle.trim(),
        newMarketDescription.trim(),
      );
      setNewMarketTitle("");
      setNewMarketDescription("");
      await loadData(); // Reload markets
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create market");
    } finally {
      setCreatingMarket(false);
    }
  };

  /**
   * Nouvelle fonction pour fermer un marché avec distribution automatique
   */
  const handleCloseMarketWithDistribution = async (
    marketId: number,
    result: "Yes" | "No",
  ) => {
    try {
      setError(null);

      // La distribution se fait automatiquement dans le backend maintenant
      console.log(`🔒 Closing market ${marketId} with result: ${result}`);
      const closeResult = await PredictionMarketService.closeMarket(
        marketId,
        result,
      );

      console.log("✅ Market closed with automatic distribution:", closeResult);

      // Afficher un message de succès détaillé
      alert(`
🎉 Marché fermé avec succès !

${closeResult}

📊 Les gains ont été automatiquement distribués :
- Les gagnants ont reçu leurs tokens + bénéfices
- L'admin a reçu 10% du pool total en commission
- Tous les transferts ont été effectués automatiquement
      `);

      await loadData(); // Reload markets
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to close market");
      console.error("❌ Error closing market:", err);
    }
  };

  const handleSetAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminInput.trim()) {
      setError("Please enter a principal ID");
      return;
    }

    try {
      setSettingAdmin(true);
      // Note: In a real app, you'd need to convert the string to a Principal
      // For now, we'll just show an error message about implementation
      setError(
        "Setting admin requires principal conversion - this would be implemented with proper Principal parsing",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set admin");
    } finally {
      setSettingAdmin(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section - more compact */}
      <div className="relative text-center">
        <div className="gradient-icp-accent absolute inset-0 rounded-full opacity-10 blur-3xl"></div>
        <div className="relative z-10">
          <h1 className="text-gradient mb-3 flex items-center justify-center space-x-4 text-3xl font-bold">
            <div className="gradient-icp-warm pulse-glow flex h-10 w-10 items-center justify-center rounded-2xl">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <span>Admin Panel</span>
          </h1>
          <p className="text-base text-white/80">
            Manage prediction markets and system administration
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="glass-hover rounded-2xl border border-red-400/20 bg-red-50/10 p-6 backdrop-blur-xl">
          <div className="flex items-start space-x-4">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-500/20">
              <svg
                className="h-4 w-4 text-red-400"
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
            <div className="flex-1">
              <h3 className="mb-1 font-bold text-red-300">Error</h3>
              <p className="mb-3 text-red-200">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-sm font-medium text-red-300 transition-colors duration-200 hover:text-red-200"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Status */}
      <div className="glass-hover relative overflow-hidden rounded-3xl p-8">
        <div className="gradient-icp-card absolute inset-0 rounded-3xl opacity-30"></div>

        <div className="relative z-10">
          <h2 className="text-gradient mb-6 flex items-center space-x-3 text-2xl font-bold">
            <div className="gradient-icp-secondary flex h-8 w-8 items-center justify-center rounded-lg">
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
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <span>Admin Status</span>
          </h2>

          {admin ? (
            <div className="glass mb-6 rounded-2xl border border-green-400/30 bg-green-500/10 p-6">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20">
                  <svg
                    className="h-5 w-5 text-green-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-green-300">Current Admin</div>
                  <div className="font-mono text-sm text-green-200">
                    {admin.toString()}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass mb-6 rounded-2xl border border-yellow-400/30 bg-yellow-500/10 p-6">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/20">
                  <svg
                    className="h-5 w-5 text-yellow-300"
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
                <div>
                  <div className="font-bold text-yellow-300">No Admin Set</div>
                  <div className="text-sm text-yellow-200">
                    System administration is not configured
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Set Admin Form */}
          <form onSubmit={handleSetAdmin} className="space-y-4">
            <div>
              <label className="mb-3 block text-sm font-bold text-white/80">
                Set New Admin Principal
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={adminInput}
                  onChange={(e) => setAdminInput(e.target.value)}
                  className="glass w-full rounded-xl border border-white/20 px-4 py-4 text-white placeholder-white/50 transition-all duration-300 focus:border-white/40 focus:outline-none"
                  placeholder="Enter principal ID"
                />
                <div className="absolute top-1/2 right-4 -translate-y-1/2 transform text-white/60">
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
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={settingAdmin}
              className="gradient-icp-secondary flex items-center space-x-2 rounded-xl px-6 py-3 font-bold text-white shadow-xl transition-all duration-300 hover:scale-105 disabled:transform-none disabled:opacity-50"
            >
              {settingAdmin ? (
                <>
                  <div className="loading-spinner h-4 w-4"></div>
                  <span>Setting Admin...</span>
                </>
              ) : (
                <>
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
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                  <span>Set Admin</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* AI Configuration Section */}
      <div className="glass-hover relative overflow-hidden rounded-3xl p-8">
        <div className="gradient-icp-card absolute inset-0 rounded-3xl opacity-30"></div>

        <div className="relative z-10">
          <h2 className="text-gradient mb-6 flex items-center space-x-3 text-2xl font-bold">
            <div className="gradient-icp-accent flex h-8 w-8 items-center justify-center rounded-lg">
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
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <span>AI Configuration</span>
          </h2>

          <p className="mb-6 text-white/80">
            Configure AI analysis settings and choose between ICP Native AI or
            enhanced simulation.
          </p>

          <button
            onClick={() => setShowAIConfig(true)}
            className="gradient-icp-primary flex items-center space-x-3 rounded-xl px-6 py-3 font-bold text-white shadow-xl transition-all duration-300 hover:scale-105"
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
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>Configure AI Settings</span>
          </button>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-blue-400/20 bg-blue-500/10 p-4">
              <div className="mb-2 flex items-center gap-2">
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span className="text-sm font-medium text-blue-200">
                  Enhanced Analysis
                </span>
              </div>
              <p className="text-xs text-blue-200/80">
                Sentiment analysis & risk assessment
              </p>
            </div>

            <div className="rounded-lg border border-purple-400/20 bg-purple-500/10 p-4">
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm font-medium text-purple-200">
                  Historical Data
                </span>
              </div>
              <p className="text-xs text-purple-200/80">
                Pattern recognition & comparisons
              </p>
            </div>

            <div className="rounded-lg border border-green-400/20 bg-green-500/10 p-4">
              <div className="mb-2 flex items-center gap-2">
                <svg
                  className="h-4 w-4 text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm font-medium text-green-200">
                  ICP Native
                </span>
              </div>
              <p className="text-xs text-green-200/80">
                Decentralized AI infrastructure
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create New Market */}
      <div className="glass-hover relative overflow-hidden rounded-2xl p-6">
        <div className="gradient-icp-card absolute inset-0 rounded-2xl opacity-30"></div>

        <div className="relative z-10">
          <h2 className="text-gradient mb-4 flex items-center space-x-3 text-xl font-bold">
            <div className="gradient-icp-primary flex h-7 w-7 items-center justify-center rounded-lg">
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <span>Create New Market</span>
          </h2>

          <form onSubmit={handleCreateMarket} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-bold text-white/80">
                Market Title
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={newMarketTitle}
                  onChange={(e) => setNewMarketTitle(e.target.value)}
                  className="glass w-full rounded-xl border border-white/20 px-4 py-3 text-white placeholder-white/50 transition-all duration-300 focus:border-white/40 focus:outline-none"
                  placeholder="e.g., Will it rain tomorrow?"
                  required
                />
                <div className="absolute top-1/2 right-4 -translate-y-1/2 transform text-white/60">
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
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-white/80">
                Market Description
              </label>
              <div className="relative">
                <textarea
                  value={newMarketDescription}
                  onChange={(e) => setNewMarketDescription(e.target.value)}
                  className="glass w-full resize-none rounded-xl border border-white/20 px-4 py-4 text-white placeholder-white/50 transition-all duration-300 focus:border-white/40 focus:outline-none"
                  placeholder="Provide detailed description and resolution criteria..."
                  rows={4}
                  required
                />
                <div className="absolute top-4 right-4 text-white/60">
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={creatingMarket}
              className="gradient-icp-primary flex w-full items-center justify-center space-x-3 rounded-xl px-6 py-4 text-lg font-bold text-white shadow-xl transition-all duration-300 hover:scale-105 disabled:transform-none disabled:opacity-50"
            >
              {creatingMarket ? (
                <>
                  <div className="loading-spinner h-5 w-5"></div>
                  <span>Creating Market...</span>
                </>
              ) : (
                <>
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span>Create Market</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Existing Markets Management */}
      <div className="glass-hover relative overflow-hidden rounded-2xl p-6">
        <div className="gradient-icp-card absolute inset-0 rounded-2xl opacity-30"></div>

        <div className="relative z-10">
          <h2 className="text-gradient mb-4 flex items-center space-x-3 text-xl font-bold">
            <div className="gradient-icp-accent flex h-7 w-7 items-center justify-center rounded-lg">
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
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <span>Manage Markets</span>
          </h2>

          {markets.length === 0 ? (
            <div className="py-8 text-center">
              <div className="gradient-icp-card mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl opacity-20">
                <svg
                  className="h-6 w-6 text-white/60"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <p className="text-sm text-white/60 italic">
                No markets to manage
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {markets.map((marketSummary) => (
                <MarketManagementCard
                  key={marketSummary.market.id}
                  marketSummary={marketSummary}
                  onCloseMarket={handleCloseMarketWithDistribution}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Configuration Modal */}
      <AIConfigurationPanel
        isOpen={showAIConfig}
        onClose={() => setShowAIConfig(false)}
      />
    </div>
  );
}

function MarketManagementCard({
  marketSummary,
  onCloseMarket,
}: {
  marketSummary: MarketSummary;
  onCloseMarket: (marketId: number, result: "Yes" | "No") => void;
}) {
  const { market, yes_price, no_price, total_volume } = marketSummary;
  const isOpen =
    PredictionMarketService.getStatusDisplay(market.status) === "Open";

  // Debug inspection for closed markets
  if (!isOpen) {
    PredictionMarketService.inspectMarket(market);
  }

  return (
    <div className="glass card-hover relative overflow-hidden rounded-xl p-4">
      <div className="gradient-icp-card absolute inset-0 rounded-xl opacity-30"></div>

      <div className="relative z-10">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex-1">
            <h3 className="mb-1 text-base font-bold text-white">
              {market.title}
            </h3>
            <p className="line-clamp-2 text-xs leading-relaxed text-white/70">
              {market.description}
            </p>
          </div>
          <span
            className={`ml-4 flex-shrink-0 rounded-full px-3 py-1 text-xs font-bold backdrop-blur-sm ${
              isOpen
                ? "border border-green-400/30 bg-green-500/20 text-green-300"
                : "border border-gray-400/30 bg-gray-500/20 text-gray-300"
            }`}
          >
            {PredictionMarketService.getStatusDisplay(market.status)}
          </span>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="glass rounded-lg p-3 text-center">
            <div className="mb-1 text-xs font-bold text-green-300">
              YES Price
            </div>
            <div className="text-lg font-bold text-white">
              {PredictionMarketService.formatPrice(yes_price)}
            </div>
            <div className="mt-2 h-1 w-full rounded-full bg-green-900/30">
              <div
                className="h-1 rounded-full bg-gradient-to-r from-green-400 to-green-300 transition-all duration-500"
                style={{ width: `${yes_price * 100}%` }}
              ></div>
            </div>
          </div>
          <div className="glass rounded-lg p-3 text-center">
            <div className="mb-1 text-xs font-bold text-red-300">NO Price</div>
            <div className="text-lg font-bold text-white">
              {PredictionMarketService.formatPrice(no_price)}
            </div>
            <div className="mt-2 h-1 w-full rounded-full bg-red-900/30">
              <div
                className="h-1 rounded-full bg-gradient-to-r from-red-400 to-red-300 transition-all duration-500"
                style={{ width: `${no_price * 100}%` }}
              ></div>
            </div>
          </div>
          <div className="glass rounded-lg p-3 text-center">
            <div className="mb-1 text-xs font-bold text-white/60">Volume</div>
            <div className="text-lg font-bold text-white">
              {total_volume.toLocaleString()}
            </div>
            <div className="mt-1 text-xs text-white/60">tokens</div>
          </div>
        </div>

        {isOpen && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onCloseMarket(market.id, "Yes")}
              className="flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-green-500 to-green-400 px-4 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:scale-105"
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Close as YES</span>
            </button>
            <button
              onClick={() => onCloseMarket(market.id, "No")}
              className="flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-red-500 to-red-400 px-4 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:scale-105"
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
              <span>Close as NO</span>
            </button>
          </div>
        )}

        {!isOpen && (
          <div className="text-center">
            {market.result ? (
              <span className="inline-flex items-center rounded-full border border-blue-400/30 bg-blue-500/20 px-4 py-2 text-sm font-bold text-blue-300">
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4"
                  />
                </svg>
                Final Result:{" "}
                {PredictionMarketService.getSideDisplay(market.result)}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-orange-400/30 bg-orange-500/20 px-4 py-2 text-sm font-bold text-orange-300">
                <svg
                  className="mr-2 h-4 w-4"
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
                Final Result: Pending
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
