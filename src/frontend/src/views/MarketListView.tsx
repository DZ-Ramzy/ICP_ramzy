import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  PredictionMarketService,
  type MarketSummary,
} from "../services/predictionMarket";

export function MarketListView() {
  const [markets, setMarkets] = useState<MarketSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMarkets();
  }, []);

  const loadMarkets = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any existing error state
      const marketData = await PredictionMarketService.getMarkets();
      setMarkets(marketData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load markets");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-hover rounded-2xl border border-red-400/20 bg-red-50/10 p-8 backdrop-blur-xl">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
            <svg
              className="h-8 w-8 text-red-400"
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
          <h3 className="mb-2 text-xl font-bold text-white">
            Error loading markets
          </h3>
          <p className="mb-6 text-white/70">{error}</p>
          <button
            onClick={loadMarkets}
            className="gradient-icp-warm rounded-xl px-6 py-3 font-medium text-white shadow-xl transition-all duration-300 hover:scale-105"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="text-center">
        <h1 className="text-gradient mb-2 text-3xl font-bold">
          🎬 AMM Prediction Markets (Demo)
        </h1>
        <p className="mx-auto max-w-2xl text-sm text-white/70">
          Trade on the future with automated market maker prediction markets
          powered by the Internet Computer. Prices adjust automatically based on
          supply and demand.
        </p>
      </div>

      {/* Demo Banner */}
      <div className="glass-hover rounded-2xl border border-yellow-400/20 bg-yellow-50/10 p-4 backdrop-blur-xl">
        <div className="flex items-center justify-center space-x-3">
          <span className="text-2xl">🚀</span>
          <div className="text-center">
            <p className="font-semibold text-yellow-300">
              Hackathon Demo Mode Active
            </p>
            <p className="text-sm text-yellow-200/80">
              Perfect for presentations! Easy admin access & instant market
              creation
            </p>
          </div>
          <span className="text-2xl">🎯</span>
        </div>
      </div>

      {markets.length === 0 ? (
        <div className="py-16 text-center">
          <div className="glass-hover mx-auto max-w-md rounded-2xl p-8">
            <div className="gradient-icp-card mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl">
              <svg
                className="h-8 w-8 text-white/60"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-bold text-white">
              No markets available
            </h3>
            <p className="mb-4 text-sm text-white/70">
              Create your first prediction market to get started.
            </p>
            <Link
              to="/admin"
              className="gradient-icp-primary inline-flex items-center space-x-2 rounded-lg px-6 py-2 font-medium text-white shadow-lg transition-all duration-300 hover:scale-105"
            >
              <span>Create Market</span>
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {markets.map((marketSummary) => (
            <MarketCard
              key={marketSummary.market.id}
              marketSummary={marketSummary}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MarketCard({ marketSummary }: { marketSummary: MarketSummary }) {
  const { market, yes_price, no_price, total_volume } = marketSummary;
  const isOpen =
    PredictionMarketService.getStatusDisplay(market.status) === "Open";

  return (
    <Link
      to={`/market/${market.id}`}
      className="glass-hover card-hover group relative block overflow-hidden rounded-xl p-4"
    >
      {/* Background gradient overlay */}
      <div className="gradient-icp-card absolute inset-0 rounded-xl opacity-50"></div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <h3 className="group-hover:text-gradient mr-2 line-clamp-2 flex-1 text-lg font-bold text-white transition-all duration-300">
            {market.title}
          </h3>
          <span
            className={`flex-shrink-0 rounded-full px-2 py-1 text-xs font-bold backdrop-blur-sm ${
              isOpen
                ? "border border-green-400/30 bg-green-500/20 text-green-300"
                : "border border-gray-400/30 bg-gray-500/20 text-gray-300"
            }`}
          >
            {PredictionMarketService.getStatusDisplay(market.status)}
          </span>
        </div>

        <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-white/70">
          {market.description}
        </p>

        {/* Price display - more compact */}
        <div className="mb-3 grid grid-cols-2 gap-3">
          <div className="glass rounded-lg p-3 text-center">
            <div className="mb-1 text-xs font-bold text-green-300">YES</div>
            <div className="text-base font-bold text-white">
              {PredictionMarketService.formatPrice(yes_price)}
            </div>
          </div>
          <div className="glass rounded-lg p-3 text-center">
            <div className="mb-1 text-xs font-bold text-red-300">NO</div>
            <div className="text-base font-bold text-white">
              {PredictionMarketService.formatPrice(no_price)}
            </div>
          </div>
        </div>

        {/* Volume and AMM info - more compact */}
        <div className="mb-2 grid grid-cols-2 gap-2 text-xs text-white/60">
          <div className="flex justify-between">
            <span>Volume</span>
            <span className="font-bold text-white">
              {Number(total_volume) > 1000
                ? `${(Number(total_volume) / 1000).toFixed(1)}k`
                : Number(total_volume)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Liquidity</span>
            <span className="font-bold text-white">
              {Number(market.icp_liquidity_pool) > 1000
                ? `${(Number(market.icp_liquidity_pool) / 1000).toFixed(1)}k`
                : market.icp_liquidity_pool}{" "}
              ICP
            </span>
          </div>
        </div>

        {/* AMM indicator */}
        <div className="mb-2 flex items-center justify-center">
          <span className="inline-flex items-center rounded-full border border-purple-400/30 bg-purple-500/20 px-2 py-1 text-xs font-bold text-purple-300">
            <svg
              className="mr-1 h-3 w-3"
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
            AMM Powered
          </span>
        </div>

        {/* Result display for closed markets */}
        {!isOpen && market.winning_outcome && (
          <div className="text-center">
            <span className="inline-flex items-center rounded-full border border-blue-400/30 bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-300">
              <svg
                className="mr-1 h-3 w-3"
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
              {market.winning_outcome.length > 0
                ? market.winning_outcome[0] &&
                  "Yes" in market.winning_outcome[0]
                  ? "YES"
                  : "NO"
                : ""}
            </span>
          </div>
        )}

        {/* Action indicator */}
        <div className="absolute right-3 bottom-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="gradient-icp-primary flex h-6 w-6 items-center justify-center rounded-full">
            <svg
              className="h-3 w-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
